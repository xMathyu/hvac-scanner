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
        You are an expert HVAC technician with 20+ years of experience reading equipment labels. Analyze this HVAC equipment nameplate/label image very carefully and extract ALL visible text and information.

        READING INSTRUCTIONS:
        1. Read EVERY piece of text visible on the label, including small print, codes, numbers, and symbols
        2. Look at the ENTIRE image, not just the center - check corners, edges, and background areas
        3. Pay special attention to faded, partially obscured, or small text
        4. If text is unclear, make your best educated guess based on context and HVAC industry standards
        5. Look for information in multiple formats (full words, abbreviations, codes)

        SPECIFIC FIELDS TO FIND:
        
        BRAND/MANUFACTURER:
        - Look for: Company logos, brand names (Carrier, Trane, Lennox, York, Goodman, Rheem, Ruud, Bryant, Payne, etc.)
        - Often appears at top of label or as watermark
        
        MODEL NUMBER:
        - Look for: "Model", "Mod", "Model No", "Model #", or standalone alphanumeric codes
        - Often includes letters and numbers (e.g., 24ACC636A003, RTU-50TC, etc.)
        - May be on multiple lines
        
        SERIAL NUMBER:
        - Look for: "Serial", "Ser", "Serial No", "Serial #", "S/N", or standalone number sequences
        - Usually longer numeric sequences, may include letters
        
        CAPACITY/TONNAGE:
        - Look for: "Tons", "Ton", "Capacity", "Cap", "BTU/H", "BTUH", "Cooling Capacity"
        - Numbers like: 2T, 3T, 4T, 5T or 24000, 36000, 48000, 60000 BTU
        - May be written as "024", "036", "048" in model numbers (divide by 12 for tons)
        
        BTU RATING:
        - Look for: "BTU", "BTUH", "BTU/H", "Cooling", "Heating"
        - Numbers typically: 18000, 24000, 36000, 48000, 60000, etc.
        
        ELECTRICAL SPECIFICATIONS:
        - VOLTAGE: Look for "V", "Volt", "Volts", numbers like 115, 208, 220, 230, 240, 460
        - AMPERAGE: Look for "A", "Amp", "Amps", "FLA", "RLA", "MCA", "Max Fuse"
        - PHASE: Look for "1Ø", "3Ø", "Single Phase", "Three Phase"
        - HERTZ: Look for "Hz", "60Hz", "50Hz"
        
        REFRIGERANT:
        - Look for: "Refrigerant", "Ref", "R-22", "R-410A", "R-404A", "R-134a", "R-407C"
        - May be abbreviated as just "R22", "410A", etc.
        
        EFFICIENCY RATINGS:
        - SEER: Look for "SEER", numbers like 13, 14, 15, 16, 17, 18, 19, 20+
        - EER: Look for "EER", numbers like 10, 11, 12, 13, 14+
        - AHRI: Look for "AHRI" followed by certification numbers
        
        DATES:
        - Manufacturing: Look for "Mfg", "Date", "Manufactured", or date formats
        - May be coded in serial number or separate field
        - Common formats: MM/YY, MM/YYYY, YYYY-MM-DD, or week/year codes
        
        EQUIPMENT TYPE:
        - Look for: "Air Conditioner", "Heat Pump", "Furnace", "RTU", "Package Unit", "Split System"
        - Infer from model codes: AC, HP, RTU, PU, SS, etc.
        
        ADDITIONAL INFORMATION:
        - Location/Installation codes
        - Certification marks (UL, ETL, AHRI, etc.)
        - Weight specifications
        - Sound ratings
        - Any other technical specifications
        
        CAPACITY INFERENCE RULES:
        - If model contains "024" = 2 tons (24,000 BTU)
        - If model contains "036" = 3 tons (36,000 BTU)  
        - If model contains "048" = 4 tons (48,000 BTU)
        - If model contains "060" = 5 tons (60,000 BTU)
        - Divide BTU by 12,000 to get tons
        - Look for context clues in surrounding text
        
        OUTPUT FORMAT - Return ONLY valid JSON, no markdown, no code blocks:
        {
          "extractedText": "ALL visible text from the label, line by line",
          "structuredData": {
            "brand": "manufacturer name or null",
            "model": "complete model number or null", 
            "serialNumber": "serial number or null",
            "capacity": "capacity with units (e.g., '3 tons', '36,000 BTU') or null",
            "btu": integer_number_or_null,
            "manufactureDate": "date in YYYY-MM-DD format or null",
            "voltage": "voltage with units (e.g., '208-230V') or null", 
            "amperage": "amperage with units (e.g., '15.2A') or null",
            "refrigerantType": "refrigerant type (e.g., 'R-410A') or null",
            "seerRating": decimal_number_or_null,
            "eerRating": decimal_number_or_null,
            "equipmentType": "air_conditioner|heat_pump|furnace|package_unit|split_system|mini_split|other or null"
          },
          "fieldMetadata": {
            "field_name": {"source": "scanned|ai_inferred", "confidence": 0.0-1.0, "inferenceBasis": "explanation if inferred"}
          },
          "confidence": number_between_0_and_1_overall_confidence
        }
        
        CONFIDENCE GUIDELINES:
        - 0.9-1.0: Text is crystal clear and unambiguous
        - 0.7-0.9: Text is clearly readable with minor uncertainty
        - 0.5-0.7: Text is somewhat readable but may have interpretation
        - 0.3-0.5: Text is partially obscured but educated guess possible
        - 0.0-0.3: Text is very unclear or heavily damaged
        
        Be thorough and extract every piece of information you can see, even if partially obscured.
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
                  detail: "high",
                },
              },
            ],
          },
        ],
        max_tokens: 1500,
        temperature: 0.05,
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

        if (!parsedResponse.structuredData) {
          console.warn(
            "Missing structuredData in response, creating empty structure"
          );
          parsedResponse.structuredData = {};
        }

        if (!parsedResponse.fieldMetadata) {
          console.log("Generating field metadata from structured data");
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

        if (
          parsedResponse.confidence === undefined ||
          parsedResponse.confidence === null
        ) {
          parsedResponse.confidence = 0.6;
        }
      } catch (parseError) {
        console.error("Error parsing JSON:", parseError);
        console.error("Content that caused the error:", cleanedContent);

        const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            parsedResponse = JSON.parse(jsonMatch[0]);
            console.log("JSON extracted successfully with regex");

            if (!parsedResponse.structuredData) {
              parsedResponse.structuredData = {};
            }

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

            if (
              parsedResponse.confidence === undefined ||
              parsedResponse.confidence === null
            ) {
              parsedResponse.confidence = 0.6;
            }
          } catch (secondParseError) {
            console.error("Second parsing attempt failed:", secondParseError);
            throw new Error(
              `Could not parse OpenAI response after multiple attempts. Content: ${cleanedContent.substring(
                0,
                300
              )}...`
            );
          }
        } else {
          throw new Error(
            `OpenAI response does not contain valid JSON: ${cleanedContent.substring(
              0,
              300
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
        const maxSize = 1600;
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

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        ctx.drawImage(img, 0, 0, width, height);

        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
          const factor = 1.2;
          data[i] = Math.min(255, Math.max(0, (data[i] - 128) * factor + 128));
          data[i + 1] = Math.min(
            255,
            Math.max(0, (data[i + 1] - 128) * factor + 128)
          );
          data[i + 2] = Math.min(
            255,
            Math.max(0, (data[i + 2] - 128) * factor + 128)
          );

          const brightness = 10;
          data[i] = Math.min(255, data[i] + brightness);
          data[i + 1] = Math.min(255, data[i + 1] + brightness);
          data[i + 2] = Math.min(255, data[i + 2] + brightness);
        }

        ctx.putImageData(imageData, 0, 0);

        const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
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
