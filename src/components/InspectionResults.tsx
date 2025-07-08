import { AlertTriangle, CheckCircle, FileText, Home, Info } from "lucide-react";
import type { InspectionReport } from "@/types";

interface InspectionResultsProps {
  report: InspectionReport;
  onBack: () => void;
  onNewInspection: () => void;
}

export default function InspectionResults({
  report,
  onBack,
  onNewInspection,
}: InspectionResultsProps) {
  const inspectionResult = report.inspectionResult;

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case "excellent":
        return "text-green-600";
      case "good":
        return "text-green-500";
      case "fair":
        return "text-yellow-500";
      case "poor":
        return "text-orange-500";
      case "critical":
        return "text-red-600";
      default:
        return "text-gray-500";
    }
  };

  const getConditionIcon = (condition: string) => {
    switch (condition) {
      case "excellent":
      case "good":
        return <CheckCircle className="w-8 h-8 text-green-500" />;
      case "fair":
        return <Info className="w-8 h-8 text-yellow-500" />;
      case "poor":
      case "critical":
        return <AlertTriangle className="w-8 h-8 text-red-500" />;
      default:
        return <Info className="w-8 h-8 text-gray-500" />;
    }
  };

  const getConditionText = (condition: string) => {
    switch (condition) {
      case "excellent":
        return "Excellent";
      case "good":
        return "Good";
      case "fair":
        return "Fair";
      case "poor":
        return "Poor";
      case "critical":
        return "Critical";
      default:
        return "Unknown";
    }
  };

  const getUrgencyText = (urgency: string) => {
    switch (urgency) {
      case "immediate":
        return "Immediate";
      case "within_week":
        return "Within a week";
      case "within_month":
        return "Within a month";
      case "routine":
        return "Routine maintenance";
      case "none":
        return "Not required";
      default:
        return "Not specified";
    }
  };

  if (!inspectionResult) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No inspection results available</p>
          <button
            onClick={onBack}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "text-red-600 bg-red-50";
      case "high":
        return "text-orange-600 bg-orange-50";
      case "medium":
        return "text-yellow-600 bg-yellow-50";
      case "low":
        return "text-green-600 bg-green-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "critical":
        return "Critical";
      case "high":
        return "High";
      case "medium":
        return "Medium";
      case "low":
        return "Low";
      default:
        return severity;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 p-4 flex items-center">
        <button
          onClick={onBack}
          className="p-2 text-gray-600 hover:text-gray-800"
        >
          <Home className="w-6 h-6" />
        </button>
        <h1 className="ml-4 text-xl font-semibold text-gray-900">
          Inspection Results
        </h1>
      </div>

      <div className="p-4 space-y-6">
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Inspected Equipment
          </h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-700 font-medium">Type:</span>
              <p className="font-semibold text-gray-900">
                {inspectionResult.equipmentType || "N/A"}
              </p>
            </div>
            <div>
              <span className="text-gray-700 font-medium">Brand:</span>
              <p className="font-semibold text-gray-900">
                {report.equipment?.brand || "N/A"}
              </p>
            </div>
            <div>
              <span className="text-gray-700 font-medium">Model:</span>
              <p className="font-semibold text-gray-900">
                {report.equipment?.model || "N/A"}
              </p>
            </div>
            <div>
              <span className="text-gray-700 font-medium">Serial:</span>
              <p className="font-semibold text-gray-900">
                {report.equipment?.serialNumber || "N/A"}
              </p>
            </div>
          </div>
          {inspectionResult.equipmentDescription && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-700 text-sm font-medium">
                Description:
              </span>
              <p className="text-sm mt-1 text-gray-800">
                {inspectionResult.equipmentDescription}
              </p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="flex items-center space-x-3 mb-4">
            {getConditionIcon(inspectionResult.overallCondition)}
            <div>
              <h2 className="text-lg font-medium text-gray-900">
                Overall Condition
              </h2>
              <p
                className={`font-medium ${getConditionColor(
                  inspectionResult.overallCondition
                )}`}
              >
                {getConditionText(inspectionResult.overallCondition)}
              </p>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <p className="text-gray-700">
              <strong className="text-gray-800">Maintenance urgency:</strong>{" "}
              <span
                className={
                  inspectionResult.maintenanceUrgency === "immediate"
                    ? "text-red-600 font-medium"
                    : "text-gray-800 font-medium"
                }
              >
                {getUrgencyText(inspectionResult.maintenanceUrgency)}
              </span>
            </p>
            <p className="text-gray-700">
              <strong className="text-gray-800">Inspection date:</strong>{" "}
              <span className="text-gray-800">
                {new Date().toLocaleDateString()}
              </span>
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <AlertTriangle className="w-5 h-5 text-yellow-500 mr-2" />
            Issues Detected ({inspectionResult.failures?.length || 0})
          </h2>

          <div className="space-y-4">
            {inspectionResult.failures?.map((failure, index) => (
              <div
                key={failure.id || index}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-medium text-gray-900">
                    {failure.description}
                  </h3>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(
                      failure.severity
                    )}`}
                  >
                    {getSeverityBadge(failure.severity)}
                  </span>
                </div>

                <p className="text-sm text-gray-700 mb-2">
                  <strong className="text-gray-800">Location:</strong>{" "}
                  <span className="text-gray-800">{failure.location}</span>
                </p>

                <p className="text-sm text-gray-700 mb-3">
                  <strong className="text-gray-800">Confidence:</strong>{" "}
                  <span className="text-gray-800 font-medium">
                    {Math.round(failure.confidence * 100)}%
                  </span>
                </p>

                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-1">
                    Recommendations:
                  </h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    {failure.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start">
                        <span className="mr-2 text-gray-800">•</span>
                        <span className="text-gray-800">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg p-6">
          <h2 className="text-lg font-medium text-blue-900 mb-4">
            General Recommendations
          </h2>
          <ul className="text-blue-900 space-y-2 text-sm">
            {inspectionResult.generalRecommendations?.map(
              (recommendation, index) => (
                <li key={index} className="flex items-start">
                  <span className="mr-2 text-blue-900">•</span>
                  <span className="text-blue-900">{recommendation}</span>
                </li>
              )
            )}
            {(!inspectionResult.generalRecommendations ||
              inspectionResult.generalRecommendations.length === 0) && (
              <li className="flex items-start">
                <span className="mr-2 text-blue-900">•</span>
                <span className="text-blue-900">
                  Schedule preventive maintenance according to manufacturer
                  specifications
                </span>
              </li>
            )}
          </ul>
        </div>

        <div className="flex space-x-4 pt-4">
          <button
            onClick={onNewInspection}
            className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            New Inspection
          </button>

          <button className="flex-1 bg-gray-200 text-gray-800 py-3 px-4 rounded-lg font-medium hover:bg-gray-300 transition-colors flex items-center justify-center space-x-2">
            <FileText className="w-5 h-5" />
            <span>Generate Report</span>
          </button>
        </div>
      </div>
    </div>
  );
}
