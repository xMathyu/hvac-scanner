import OpenAI from "openai";
import {
  LabelScanResult,
  InspectionResult,
  HVACEquipment,
  HVACEquipmentWithMetadata,
  FieldSource,
  FailureDetection,
  OpenAIVisionResponse,
  OpenAIAnalysisResponse,
  AppError,
} from "@/types";

class OpenAIService {
  private client: OpenAI;

  constructor() {
    const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("NEXT_PUBLIC_OPENAI_API_KEY is required");
    }

    this.client = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true,
    });
  }

  async scanLabel(imageFile: File): Promise<LabelScanResult> {
    try {
      const startTime = Date.now();

      const base64Image = await this.fileToBase64(imageFile);

      const prompt = `
        Analyze this HVAC equipment label image and extract ALL visible information.
        
        Look specifically for:
        - Brand/Manufacturer
        - Model
        - Serial Number
        - Capacity/BTU/Tons
        - Manufacturing Date
        - Voltage
        - Amperage/Amps
        - Refrigerant Type (R-22, R-410A, etc.)
        - SEER/EER Efficiency
        - Equipment Type (AC, Heat Pump, Furnace, etc.)
        
        CAPACITY INFERENCE:
        If the capacity in tons is NOT explicitly written on the label, but you can infer it from the model or BTU:
        1. Use the model to determine capacity (many models include capacity in code)
        2. Or convert BTU to tons (12,000 BTU = 1 ton)
        3. Clearly mark that it was inferred
        
        IMPORTANT: Respond ONLY with valid JSON, no additional text, no markdown code blocks, no \`\`\`json.
        
        Exact required format:
        {
          "extractedText": "all visible text on the label",
          "structuredData": {
            "brand": "found brand or null",
            "model": "found model or null",
            "serialNumber": "serial number or null",
            "capacity": "capacity with units or null",
            "btu": integer_number_or_null,
            "manufactureDate": "date in YYYY-MM-DD format or null",
            "voltage": "voltage with units or null",
            "amperage": "amperage with units or null",
            "refrigerantType": "refrigerant type or null",
            "seerRating": decimal_number_or_null,
            "eerRating": decimal_number_or_null,
            "equipmentType": "air_conditioner|heat_pump|furnace|ductwork|other or null"
          },
          "fieldMetadata": {
            "brand": {"source": "scanned|ai_inferred", "confidence": 0.0-1.0},
            "model": {"source": "scanned|ai_inferred", "confidence": 0.0-1.0},
            "capacity": {"source": "scanned|ai_inferred", "confidence": 0.0-1.0, "inferenceBasis": "explanation if inferred"},
            // ... rest of fields that have data
          },
          "confidence": number_between_0_and_1
        }
        
        In fieldMetadata:
        - "scanned": the data is clearly visible on the label
        - "ai_inferred": the data was inferred by logic (e.g.: capacity from model or BTU)
        - "inferenceBasis": explains how it was inferred (e.g.: "Inferred from model XYZ-24" or "Calculated from 24000 BTU")
        
        If you can't read something clearly, put it as null. Be conservative with confidence.
      `;

      const response = await this.client.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt,
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`,
                  detail: "low",
                },
              },
            ],
          },
        ],
        max_tokens: 800,
        temperature: 0.1,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No response from OpenAI");
      }

      const cleanedContent = this.cleanJsonResponse(content);
      console.log("Clean OpenAI response:", cleanedContent);

      let parsedResponse: OpenAIVisionResponse;
      try {
        parsedResponse = JSON.parse(cleanedContent);

        if (!parsedResponse.fieldMetadata) {
          parsedResponse.fieldMetadata = {};

          Object.keys(parsedResponse.structuredData || {}).forEach((key) => {
            const value = (
              parsedResponse.structuredData as Record<string, unknown>
            )[key];
            if (value !== null && value !== undefined) {
              parsedResponse.fieldMetadata[key] = {
                source: "scanned" as FieldSource,
                confidence: parsedResponse.confidence || 0.8,
              };
            }
          });
        }
      } catch (parseError) {
        console.error("Error parsing JSON:", parseError);
        console.error("Content that caused the error:", cleanedContent);

        const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            parsedResponse = JSON.parse(jsonMatch[0]);
            console.log("JSON extracted successfully with regex");

            if (!parsedResponse.fieldMetadata) {
              parsedResponse.fieldMetadata = {};
              Object.keys(parsedResponse.structuredData || {}).forEach(
                (key) => {
                  const value = (
                    parsedResponse.structuredData as Record<string, unknown>
                  )[key];
                  if (value !== null && value !== undefined) {
                    parsedResponse.fieldMetadata[key] = {
                      source: "scanned" as FieldSource,
                      confidence: parsedResponse.confidence || 0.8,
                    };
                  }
                }
              );
            }
          } catch {
            throw new Error(
              `Could not parse OpenAI response. Content: ${cleanedContent.substring(
                0,
                200
              )}...`
            );
          }
        } else {
          throw new Error(
            `OpenAI response does not contain valid JSON: ${cleanedContent.substring(
              0,
              200
            )}...`
          );
        }
      }

      const processingTime = Date.now() - startTime;

      const extractedData: HVACEquipmentWithMetadata = {
        id: "",
        createdAt: new Date(),
        updatedAt: new Date(),
        ...parsedResponse.structuredData,
        fieldMetadata: parsedResponse.fieldMetadata || {},
      };

      return {
        confidence: parsedResponse.confidence,
        extractedData,
        rawText: parsedResponse.extractedText,
        processingTime,
      };
    } catch (error) {
      throw this.createAppError(
        "PROCESSING_ERROR",
        "Error processing the label",
        error
      );
    }
  }

  async analyzeEquipment(imageFiles: File[]): Promise<InspectionResult> {
    try {
      const startTime = Date.now();

      const base64Images = await Promise.all(
        imageFiles.map((file) => this.fileToBase64(file))
      );

      const prompt = `
        Analyze these HVAC equipment images to detect failures, problems and general condition.
        
        FIRST identify the type of HVAC equipment:
        - RTU (Rooftop Unit): large rooftop equipment with visible fans
        - Split System: outdoor condensing unit with coils and fan
        - Mini Split: small wall-mounted units
        - Heat Pump: similar to split but with visible reversing valve
        - Package Unit: compact all-in-one unit
        - Chiller: large chilled water equipment
        - Furnace: heating equipment
        - Air Handler: indoor air handling units
        
        Then specifically look for:
        - Visible corrosion on metal components
        - Refrigerant leaks (oil stains, crystals, etc.)
        - Coil damage (bent fins, excessive dirt)
        - Dirty or missing filters
        - Airflow blockages
        - Electrical damage (stripped wires, loose connections)
        - Missing or visibly damaged components
        - General wear and deterioration
        - Installation problems
        - General cleanliness and maintenance status
        
        Evaluate maintenance urgency and give specific recommendations.
        
        Respond ONLY with valid JSON in this exact format:
        {
          "equipmentType": "RTU|Split_System|Mini_Split|Heat_Pump|Package_Unit|Chiller|Furnace|Air_Handler|Other",
          "equipmentDescription": "description of the identified equipment type",
          "failures": [
            {
              "type": "corrosion|refrigerant_leak|damaged_coils|dirty_filter|blocked_airflow|electrical_damage|missing_component|wear_and_tear|improper_installation|other",
              "severity": "low|medium|high|critical",
              "description": "detailed description of the problem",
              "location": "specific location of the problem or null",
              "confidence": number_between_0_and_1,
              "recommendations": ["recommendation 1", "recommendation 2"]
            }
          ],
          "condition": "excellent|good|fair|poor|critical",
          "urgency": "immediate|within_week|within_month|routine|none",
          "recommendations": ["general recommendation 1", "general recommendation 2"]
        }
        
        Be specific in descriptions and conservative with confidence.
      `;

      // Create message content with all images
      const imageContent = base64Images.map((base64Image) => ({
        type: "image_url" as const,
        image_url: {
          url: `data:image/jpeg;base64,${base64Image}`,
          detail: "low" as const,
        },
      }));

      const response = await this.client.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt,
              },
              ...imageContent,
            ],
          },
        ],
        max_tokens: 1500,
        temperature: 0.1,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No response from OpenAI");
      }

      const cleanedContent = this.cleanJsonResponse(content);

      const parsedResponse: OpenAIAnalysisResponse = JSON.parse(cleanedContent);

      const processingTime = Date.now() - startTime;

      return {
        equipmentType: parsedResponse.equipmentType,
        equipmentDescription: parsedResponse.equipmentDescription,
        failures: parsedResponse.failures,
        overallCondition: parsedResponse.condition,
        maintenanceUrgency: parsedResponse.urgency,
        generalRecommendations: parsedResponse.recommendations,
        processingTime,
      };
    } catch (error) {
      throw this.createAppError(
        "PROCESSING_ERROR",
        "Error analyzing equipment",
        error
      );
    }
  }

  async generateDetailedRecommendations(
    equipment: Partial<HVACEquipment>,
    failures: FailureDetection[]
  ): Promise<string[]> {
    try {
      const equipmentInfo = `
        Equipment: ${equipment.brand || "Unknown"} ${equipment.model || ""}
        Type: ${equipment.equipmentType || "Unknown"}
        Capacity: ${equipment.capacity || "Unknown"}
        Refrigerant: ${equipment.refrigerantType || "Unknown"}
        Age: ${
          equipment.manufactureDate
            ? new Date().getFullYear() -
              new Date(equipment.manufactureDate).getFullYear() +
              " years"
            : "Unknown"
        }
      `;

      const failuresInfo = failures
        .map((f) => `- ${f.type} (${f.severity}): ${f.description}`)
        .join("\n");

      const prompt = `
        As an HVAC expert, generate detailed repair recommendations for this equipment:
        
        ${equipmentInfo}
        
        Detected problems:
        ${failuresInfo}
        
        Provide specific, realistic recommendations ordered by priority.
        Include:
        - Specific repair steps
        - Required tools and materials
        - Time estimates
        - Safety considerations
        - When to call a professional
        
        Respond with a JSON array of strings, each being a complete recommendation:
        ["detailed recommendation 1", "detailed recommendation 2", ...]
      `;

      const response = await this.client.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 1500,
        temperature: 0.2,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No response from OpenAI");
      }

      return JSON.parse(content);
    } catch (error) {
      throw this.createAppError(
        "PROCESSING_ERROR",
        "Error generating recommendations",
        error
      );
    }
  }

  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = document.createElement("img");

      img.onload = () => {
        const maxSize = 800;
        let { width, height } = img;

        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;

        if (!ctx) {
          URL.revokeObjectURL(img.src);
          reject(new Error("Could not create canvas context"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
        const base64 = dataUrl.split(",")[1];

        URL.revokeObjectURL(img.src);
        resolve(base64);
      };

      img.onerror = () => {
        URL.revokeObjectURL(img.src);
        reject(new Error("Error loading image"));
      };

      const reader = new FileReader();
      reader.onload = () => {
        img.src = reader.result as string;
      };
      reader.onerror = () => reject(new Error("Error reading file"));
      reader.readAsDataURL(file);
    });
  }

  private cleanJsonResponse(content: string): string {
    let cleaned = content.trim();

    if (cleaned.startsWith("```json")) {
      cleaned = cleaned.substring(7);
    } else if (cleaned.startsWith("```")) {
      cleaned = cleaned.substring(3);
    }

    if (cleaned.endsWith("```")) {
      cleaned = cleaned.substring(0, cleaned.length - 3);
    }

    cleaned = cleaned.trim();

    console.log("Original content:", content);
    console.log("Clean content:", cleaned);

    return cleaned;
  }

  private createAppError(
    code: string,
    message: string,
    originalError: unknown
  ): AppError {
    return {
      code,
      message,
      timestamp: new Date(),
      details: { originalError },
    };
  }
}

export const openAIService = new OpenAIService();
export default openAIService;
