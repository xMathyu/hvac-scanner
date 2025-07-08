// Core types for HVAC Scanner App

// Types for field data source tracking
export type FieldSource = "scanned" | "ai_inferred" | "manual";

export interface FieldMetadata {
  source: FieldSource;
  confidence?: number;
  inferenceBasis?: string; // What data was used to infer this value
}

export interface HVACEquipment {
  id: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  capacity?: string;
  btu?: number;
  manufactureDate?: string;
  voltage?: string;
  amperage?: string;
  refrigerantType?: string;
  seerRating?: number;
  eerRating?: number;
  equipmentType?:
    | "air_conditioner"
    | "heat_pump"
    | "furnace"
    | "ductwork"
    | "other";
  location?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Enhanced equipment with field metadata
export interface HVACEquipmentWithMetadata extends HVACEquipment {
  fieldMetadata?: {
    [K in keyof Omit<
      HVACEquipment,
      "id" | "createdAt" | "updatedAt" | "location" | "notes"
    >]?: FieldMetadata;
  };
  processingTime?: number;
  scanConfidence?: number;
}

export interface LabelScanResult {
  confidence: number;
  extractedData: HVACEquipmentWithMetadata;
  rawText: string;
  processingTime: number;
}

export interface FailureDetection {
  id: string;
  type: FailureType;
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  location?: string;
  confidence: number;
  recommendations: string[];
}

export type FailureType =
  | "corrosion"
  | "refrigerant_leak"
  | "damaged_coils"
  | "dirty_filter"
  | "blocked_airflow"
  | "electrical_damage"
  | "missing_component"
  | "wear_and_tear"
  | "improper_installation"
  | "other";

export interface InspectionResult {
  equipmentType?: string;
  equipmentDescription?: string;
  failures: FailureDetection[];
  overallCondition: "excellent" | "good" | "fair" | "poor" | "critical";
  maintenanceUrgency:
    | "immediate"
    | "within_week"
    | "within_month"
    | "routine"
    | "none";
  generalRecommendations: string[];
  processingTime: number;
}

export interface CapturedImage {
  id: string;
  url: string;
  type: "label" | "equipment";
  equipmentId?: string;
  capturedAt: Date;
  fileSize: number;
  dimensions?: {
    width: number;
    height: number;
  };
}

export interface InspectionReport {
  id: string;
  equipmentId: string;
  equipment: HVACEquipment;
  labelImages: CapturedImage[];
  equipmentImages: CapturedImage[];
  labelScanResult?: LabelScanResult;
  inspectionResult?: InspectionResult;
  status: "draft" | "processing" | "completed" | "error";
  createdAt: Date;
  completedAt?: Date;
  notes?: string;
}

export interface CameraCapture {
  file: File;
  preview: string;
  timestamp: Date;
}

export interface ProcessingStatus {
  isProcessing: boolean;
  stage?: "uploading" | "analyzing" | "extracting" | "generating_report";
  progress?: number;
  message?: string;
}

export interface AppSettings {
  cameraQuality: "low" | "medium" | "high";
  autoSave: boolean;
  offlineMode: boolean;
  language: "en" | "es";
  theme: "light" | "dark" | "auto";
}

// API Response types
export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface OpenAIVisionResponse {
  extractedText: string;
  structuredData: Partial<HVACEquipment>;
  fieldMetadata: {
    [key: string]: FieldMetadata;
  };
  confidence: number;
}

export interface OpenAIAnalysisResponse {
  equipmentType?: string;
  equipmentDescription?: string;
  failures: FailureDetection[];
  condition: InspectionResult["overallCondition"];
  urgency: InspectionResult["maintenanceUrgency"];
  recommendations: string[];
}

// Form types
export interface LabelFormData extends Partial<HVACEquipmentWithMetadata> {
  isValidated?: boolean;
}

export interface ValidationErrors {
  [key: string]: string | undefined;
}

// Database types
export interface DatabaseEquipment
  extends Omit<HVACEquipment, "createdAt" | "updatedAt"> {
  createdAt: string; // ISO string for database storage
  updatedAt: string;
}

export interface DatabaseInspectionReport
  extends Omit<InspectionReport, "createdAt" | "completedAt" | "equipment"> {
  createdAt: string;
  completedAt?: string;
}

// Navigation types
export type ScreenName =
  | "home"
  | "scan-label"
  | "data-form"
  | "inspect-equipment"
  | "results"
  | "history"
  | "report-detail"
  | "settings";

export interface NavigationState {
  currentScreen: ScreenName;
  params?: Record<string, string | number | boolean>;
}

// Error types
export interface AppError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: Date;
}

export type ErrorCode =
  | "CAMERA_ACCESS_DENIED"
  | "FILE_TOO_LARGE"
  | "UNSUPPORTED_FORMAT"
  | "NETWORK_ERROR"
  | "API_ERROR"
  | "PROCESSING_ERROR"
  | "STORAGE_ERROR"
  | "UNKNOWN_ERROR";
