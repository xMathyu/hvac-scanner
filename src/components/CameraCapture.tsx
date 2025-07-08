"use client";

import { useState, useRef, useEffect } from "react";
import {
  Camera,
  FlipHorizontal,
  X,
  Upload,
  Loader2,
  CheckCircle,
  AlertCircle,
  Trash2,
} from "lucide-react";
import type {
  HVACEquipment,
  HVACEquipmentWithMetadata,
  InspectionReport,
  CameraCapture,
} from "@/types";
import { openAIService } from "@/services/openai";
import Image from "next/image";

interface CameraCaptureProps {
  type: "label" | "equipment";
  equipment?: HVACEquipment;
  onCapture: (data: HVACEquipmentWithMetadata | InspectionReport) => void;
  onBack: () => void;
}

export default function CameraCapture({
  type,
  equipment,
  onCapture,
  onBack,
}: CameraCaptureProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [captures, setCaptures] = useState<CameraCapture[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">(
    "environment"
  );

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initCamera = async () => {
    try {
      setCameraError(null);

      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });

      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
    } catch (err) {
      setCameraError("Could not access camera. Use the file upload option.");
      console.error("Camera error:", err);
    }
  };

  useEffect(() => {
    initCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facingMode]);

  const capturePhoto = async () => {
    if (!videoRef.current || !stream) return;

    try {
      const canvas = document.createElement("canvas");
      const video = videoRef.current;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not create canvas context");

      ctx.drawImage(video, 0, 0);

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error("Could not create image"));
          },
          "image/jpeg",
          0.9
        );
      });

      const file = new File([blob], `hvac_${type}_${Date.now()}.jpg`, {
        type: "image/jpeg",
      });

      const newCapture: CameraCapture = {
        file,
        preview: URL.createObjectURL(blob),
        timestamp: new Date(),
      };

      setCaptures((prev) => [...prev, newCapture]);

      if (type === "label") {
        await processLabelImage(file);
      }
    } catch (err) {
      setError("Error capturing photo");
      console.error("Capture error:", err);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const newCapture: CameraCapture = {
      file,
      preview: URL.createObjectURL(file),
      timestamp: new Date(),
    };

    setCaptures((prev) => [...prev, newCapture]);

    if (type === "label") {
      processLabelImage(file);
    }
  };

  const processLabelImage = async (file: File) => {
    setIsProcessing(true);
    setError(null);

    try {
      console.log("Processing image with OpenAI...", file.name);
      const result = await openAIService.scanLabel(file);
      console.log("OpenAI result:", result);

      if (result.confidence > 0.3) {
        console.log("Extracted data:", result.extractedData);

        setTimeout(() => {
          onCapture(result.extractedData);
        }, 1500);
      } else {
        setError(
          `Low confidence (${Math.round(
            result.confidence * 100
          )}%). Try with better lighting or angle.`
        );
      }
    } catch (err) {
      console.error("Error processing image:", err);
      setError(
        `Error processing image: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const processEquipmentImages = async (files: File[]) => {
    setIsProcessing(true);
    setError(null);

    try {
      console.log(
        "Analyzing HVAC equipment with AI...",
        files.length,
        "image(s)"
      );
      const result = await openAIService.analyzeEquipment(files);
      console.log("Analysis result:", result);

      const inspectionReport: InspectionReport = {
        id: Date.now().toString(),
        equipmentId: equipment?.id || "temp-" + Date.now(),
        equipment: equipment || {
          id: "temp-" + Date.now(),
          brand: "Unidentified equipment",
          model: "",
          serialNumber: "",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        labelImages: [],
        equipmentImages: captures.map((capture, index) => ({
          id: `img-${index}`,
          url: capture.preview,
          type: "equipment" as const,
          capturedAt: capture.timestamp,
          fileSize: capture.file.size,
        })),
        inspectionResult: result,
        status: "completed",
        createdAt: new Date(),
        completedAt: new Date(),
      };

      console.log("Inspection report created:", inspectionReport);
      setTimeout(() => {
        onCapture(inspectionReport);
      }, 1500);
    } catch (err) {
      console.error("Error analyzing equipment:", err);
      setError(
        `Error analyzing equipment: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const deleteCapture = (index: number) => {
    setCaptures((prev) => {
      const newCaptures = [...prev];
      URL.revokeObjectURL(newCaptures[index].preview);
      newCaptures.splice(index, 1);
      return newCaptures;
    });
  };

  const switchCamera = () => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  };

  return (
    <div className="min-h-screen bg-black relative">
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/70 to-transparent p-4">
        <div className="flex justify-between items-center">
          <button
            onClick={onBack}
            className="p-2 bg-white/20 rounded-full text-white backdrop-blur-sm"
          >
            <X className="w-6 h-6" />
          </button>
          <h2 className="text-white text-lg font-semibold">
            {type === "label" ? "Scan Label" : "Inspect Equipment"}
          </h2>
          <button
            onClick={switchCamera}
            className="p-2 bg-white/20 rounded-full text-white backdrop-blur-sm"
          >
            <FlipHorizontal className="w-6 h-6" />
          </button>
        </div>

        <div className="mt-4 flex justify-center gap-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 bg-blue-600/80 text-white px-4 py-2 rounded-full backdrop-blur-sm"
          >
            <Upload className="w-4 h-4" />
            Upload File
          </button>

          {type === "label" && (
            <button
              onClick={() => {
                console.log("Test mode activated");
                const mockData: HVACEquipmentWithMetadata = {
                  id: "mock-id",
                  createdAt: new Date(),
                  updatedAt: new Date(),
                  brand: "Carrier",
                  model: "24ACC636A003",
                  serialNumber: "1234567890",
                  capacity: "3 toneladas",
                  btu: 36000,
                  equipmentType: "air_conditioner",
                  voltage: "208-230V",
                  amperage: "15.2A",
                  refrigerantType: "R-410A",
                  seerRating: 16,
                  manufactureDate: "2023-06-15",
                  fieldMetadata: {
                    brand: { source: "scanned", confidence: 0.95 },
                    model: { source: "scanned", confidence: 0.92 },
                    serialNumber: { source: "scanned", confidence: 0.88 },
                    capacity: {
                      source: "ai_inferred",
                      confidence: 0.85,
                      inferenceBasis:
                        "Inferred from model 24ACC636A003 (36=3 tons)",
                    },
                    btu: { source: "scanned", confidence: 0.9 },
                    equipmentType: {
                      source: "ai_inferred",
                      confidence: 0.8,
                      inferenceBasis: "Identified as AC by model",
                    },
                    voltage: { source: "scanned", confidence: 0.93 },
                    amperage: { source: "scanned", confidence: 0.87 },
                    refrigerantType: { source: "scanned", confidence: 0.95 },
                    seerRating: { source: "scanned", confidence: 0.82 },
                    manufactureDate: { source: "scanned", confidence: 0.75 },
                  },
                };
                onCapture(mockData);
              }}
              className="flex items-center gap-2 bg-orange-600/80 text-white px-4 py-2 rounded-full backdrop-blur-sm"
            >
              🧪 Test Mode
            </button>
          )}
        </div>
      </div>

      <div className="h-screen relative">
        {cameraError ? (
          <div className="h-full flex items-center justify-center bg-gray-900">
            <div className="text-center text-white p-8">
              <AlertCircle className="w-16 h-16 mx-auto mb-4 text-yellow-500" />
              <p className="text-lg mb-2">Camera not available</p>
              <p className="text-sm text-gray-300 mb-4">{cameraError}</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-blue-600 text-white px-6 py-3 rounded-full"
              >
                Upload from gallery
              </button>
            </div>
          </div>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        )}

        {isProcessing && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 text-center max-w-sm mx-4">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-lg font-semibold">
                {type === "label"
                  ? "Processing image..."
                  : "Analyzing HVAC equipment..."}
              </p>
              <p className="text-sm text-gray-600 mt-2">
                {type === "label"
                  ? "Extracting data from label with AI"
                  : "Detecting failures and generating recommendations with AI"}
              </p>

              {type === "label" && (
                <button
                  onClick={() => {
                    console.log("Simulating data extraction...");
                    const mockData: HVACEquipmentWithMetadata = {
                      id: "mock-emergency-id",
                      createdAt: new Date(),
                      updatedAt: new Date(),
                      brand: "Carrier",
                      model: "24ACC636A003",
                      serialNumber: "1234567890",
                      capacity: "3 toneladas",
                      btu: 36000,
                      equipmentType: "air_conditioner",
                      voltage: "208-230V",
                      amperage: "15.2A",
                      refrigerantType: "R-410A",
                      seerRating: 16,
                      fieldMetadata: {
                        brand: { source: "scanned", confidence: 0.95 },
                        model: { source: "scanned", confidence: 0.92 },
                        capacity: {
                          source: "ai_inferred",
                          confidence: 0.85,
                          inferenceBasis: "Inferred from model and BTU",
                        },
                        btu: { source: "scanned", confidence: 0.9 },
                      },
                    };
                    setIsProcessing(false);
                    setTimeout(() => onCapture(mockData), 500);
                  }}
                  className="mt-4 bg-orange-600 text-white px-4 py-2 rounded text-sm"
                >
                  🧪 Simulate Extraction (Testing)
                </button>
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="absolute top-20 left-4 right-4 bg-red-600 text-white p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              <p>{error}</p>
            </div>
          </div>
        )}

        {captures.length > 0 && !isProcessing && !error && (
          <div className="absolute top-20 left-4 right-4 bg-green-600 text-white p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              <p>
                {type === "label"
                  ? "✅ Data extracted successfully. Redirecting to form..."
                  : `${captures.length} photo(s) captured`}
              </p>
            </div>

            {type === "equipment" && captures.length > 0 && (
              <button
                onClick={() =>
                  processEquipmentImages(captures.map((c) => c.file))
                }
                className="w-full mt-3 bg-white text-green-600 py-2 px-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                🔍 Analyze Equipment with AI
              </button>
            )}

            {type === "equipment" && (
              <button
                onClick={() => {
                  console.log("Simulating equipment analysis...");
                  const mockReport: InspectionReport = {
                    id: Date.now().toString(),
                    equipmentId: equipment?.id || "temp-" + Date.now(),
                    equipment: equipment || {
                      id: "temp-" + Date.now(),
                      brand: "Carrier",
                      model: "RTU-50TC",
                      serialNumber: "12345ABC",
                      createdAt: new Date(),
                      updatedAt: new Date(),
                    },
                    labelImages: [],
                    equipmentImages: [],
                    inspectionResult: {
                      equipmentType: "RTU (Rooftop Unit)",
                      equipmentDescription:
                        "Commercial rooftop unit for cooling and heating",
                      failures: [
                        {
                          id: "1",
                          type: "dirty_filter",
                          severity: "medium",
                          description:
                            "Air filter obstructed with significant dust accumulation",
                          location: "Front access panel",
                          confidence: 0.85,
                          recommendations: [
                            "Replace filter immediately",
                            "Schedule changes every 3 months",
                          ],
                        },
                        {
                          id: "2",
                          type: "refrigerant_leak",
                          severity: "high",
                          description:
                            "Possible minor refrigerant leak at valve connection",
                          location: "Suction line",
                          confidence: 0.72,
                          recommendations: [
                            "Check connections",
                            "Verify system pressure",
                            "Consider welding if necessary",
                          ],
                        },
                      ],
                      overallCondition: "fair",
                      maintenanceUrgency: "within_week",
                      generalRecommendations: [
                        "Schedule complete preventive maintenance",
                        "Clean coils quarterly",
                        "Check refrigerant levels monthly",
                        "Consider upgrading old components",
                      ],
                      processingTime: 3500,
                    },
                    status: "completed",
                    createdAt: new Date(),
                    completedAt: new Date(),
                  };
                  onCapture(mockReport);
                }}
                className="w-full mt-2 bg-orange-500 text-white py-2 px-4 rounded-lg font-semibold hover:bg-orange-600 transition-colors"
              >
                🧪 Demo: RTU with Issues
              </button>
            )}
          </div>
        )}
      </div>

      {captures.length > 0 && (
        <div className="absolute bottom-24 left-4 right-4">
          <div className="flex gap-2 overflow-x-auto">
            {captures.map((capture, index) => (
              <div key={index} className="relative flex-shrink-0">
                <Image
                  src={capture.preview}
                  alt={`Capture ${index + 1}`}
                  width={64}
                  height={64}
                  className="object-cover rounded-lg border-2 border-white"
                />
                <button
                  onClick={() => deleteCapture(index)}
                  className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {!cameraError && (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <button
            onClick={capturePhoto}
            disabled={isProcessing}
            className="w-20 h-20 bg-white rounded-full border-4 border-gray-300 shadow-lg active:scale-95 transition-transform disabled:opacity-50"
          >
            <div className="w-full h-full bg-gray-200 rounded-full flex items-center justify-center">
              {isProcessing ? (
                <Loader2 className="w-8 h-8 animate-spin text-gray-600" />
              ) : (
                <Camera className="w-8 h-8 text-gray-600" />
              )}
            </div>
          </button>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />
    </div>
  );
}
