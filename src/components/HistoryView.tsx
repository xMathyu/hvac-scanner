import { useState } from "react";
import { ArrowLeft, Calendar, Search, Filter } from "lucide-react";
import type { InspectionReport } from "@/types";

interface HistoryViewProps {
  onBack: () => void;
  onSelectReport: (report: InspectionReport) => void;
}

export default function HistoryView({
  onBack,
  onSelectReport,
}: HistoryViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "completed" | "draft"
  >("all");

  // Mock data for demonstration
  const mockReports: InspectionReport[] = [
    {
      id: "1",
      equipmentId: "1",
      equipment: {
        id: "1",
        brand: "Carrier",
        model: "24ACC636A003",
        serialNumber: "1234567890",
        createdAt: new Date("2024-01-15"),
        updatedAt: new Date("2024-01-15"),
      },
      labelImages: [],
      equipmentImages: [],
      status: "completed",
      createdAt: new Date("2024-01-15"),
      completedAt: new Date("2024-01-15"),
    },
    {
      id: "2",
      equipmentId: "2",
      equipment: {
        id: "2",
        brand: "Trane",
        model: "XR14",
        serialNumber: "0987654321",
        createdAt: new Date("2024-01-10"),
        updatedAt: new Date("2024-01-10"),
      },
      labelImages: [],
      equipmentImages: [],
      status: "completed",
      createdAt: new Date("2024-01-10"),
      completedAt: new Date("2024-01-10"),
    },
    {
      id: "3",
      equipmentId: "3",
      equipment: {
        id: "3",
        brand: "Lennox",
        model: "XC25",
        serialNumber: "1122334455",
        createdAt: new Date("2024-01-05"),
        updatedAt: new Date("2024-01-05"),
      },
      labelImages: [],
      equipmentImages: [],
      status: "draft",
      createdAt: new Date("2024-01-05"),
    },
  ];

  const filteredReports = mockReports.filter((report) => {
    const matchesSearch =
      report.equipment.brand
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      report.equipment.model
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      report.equipment.serialNumber
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesStatus =
      filterStatus === "all" || report.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
            Completed
          </span>
        );
      case "draft":
        return (
          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
            Draft
          </span>
        );
      case "processing":
        return (
          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
            Processing
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center mb-4">
          <button
            onClick={onBack}
            className="p-2 text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="ml-4 text-xl font-semibold text-gray-900">
            Inspection History
          </h1>
        </div>

        {/* Search and Filter */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by brand, model or serial..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) =>
                setFilterStatus(e.target.value as "all" | "completed" | "draft")
              }
              className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All statuses</option>
              <option value="completed">Completed</option>
              <option value="draft">Drafts</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reports List */}
      <div className="p-4">
        {filteredReports.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No inspections found
            </h3>
            <p className="text-gray-500">
              {searchTerm || filterStatus !== "all"
                ? "Try adjusting the search filters"
                : "You haven't performed any inspections yet"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredReports.map((report) => (
              <button
                key={report.id}
                onClick={() => onSelectReport(report)}
                className="w-full bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all text-left"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {report.equipment.brand} {report.equipment.model}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Serial: {report.equipment.serialNumber}
                    </p>
                  </div>
                  {getStatusBadge(report.status)}
                </div>

                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    {report.createdAt.toLocaleDateString()}
                  </span>
                  {report.completedAt && (
                    <span>
                      Completed: {report.completedAt.toLocaleDateString()}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Summary Stats */}
      {filteredReports.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
          <div className="max-w-md mx-auto text-center text-sm text-gray-600">
            {filteredReports.length} of {mockReports.length} inspections
          </div>
        </div>
      )}
    </div>
  );
}
