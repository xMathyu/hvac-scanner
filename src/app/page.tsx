"use client";

import { useState } from "react";
import { Camera, FileText, History, Settings } from "lucide-react";
import type {
  ScreenName,
  HVACEquipment,
  HVACEquipmentWithMetadata,
  InspectionReport,
} from "@/types";
import CameraCapture from "@/components/CameraCapture";
import EquipmentForm from "@/components/EquipmentForm";
import InspectionResults from "@/components/InspectionResults";
import HistoryView from "@/components/HistoryView";

export default function Home() {
  const [currentScreen, setCurrentScreen] = useState<ScreenName>("home");
  const [currentEquipment, setCurrentEquipment] =
    useState<HVACEquipmentWithMetadata | null>(null);
  const [currentReport, setCurrentReport] = useState<InspectionReport | null>(
    null
  );

  const handleLabelScanned = (equipment: HVACEquipmentWithMetadata) => {
    console.log("Datos recibidos del escaneo:", equipment);
    setCurrentEquipment(equipment);
    setCurrentScreen("data-form");
  };

  const handleEquipmentSaved = (equipment: HVACEquipment) => {
    setCurrentEquipment(equipment);
    setCurrentScreen("inspect-equipment");
  };

  const handleInspectionComplete = (report: InspectionReport) => {
    setCurrentReport(report);
    setCurrentScreen("results");
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case "scan-label":
        return (
          <CameraCapture
            type="label"
            onCapture={(data) => {
              handleLabelScanned(data as HVACEquipmentWithMetadata);
            }}
            onBack={() => setCurrentScreen("home")}
          />
        );

      case "data-form":
        return (
          <EquipmentForm
            initialData={currentEquipment}
            onSave={(equipment) => {
              handleEquipmentSaved(equipment);
            }}
            onBack={() => setCurrentScreen("home")}
          />
        );

      case "inspect-equipment":
        return (
          <CameraCapture
            type="equipment"
            equipment={currentEquipment as HVACEquipment}
            onCapture={(data) => {
              handleInspectionComplete(data as InspectionReport);
            }}
            onBack={() => setCurrentScreen("data-form")}
          />
        );

      case "results":
        return (
          <InspectionResults
            report={currentReport!}
            onBack={() => setCurrentScreen("home")}
            onNewInspection={() => setCurrentScreen("home")}
          />
        );

      case "history":
        return (
          <HistoryView
            onBack={() => setCurrentScreen("home")}
            onSelectReport={(report) => {
              setCurrentReport(report);
              setCurrentScreen("results");
            }}
          />
        );

      default:
        return <HomeScreen onNavigate={setCurrentScreen} />;
    }
  };

  return <main className="min-h-screen bg-gray-50">{renderScreen()}</main>;
}

interface HomeScreenProps {
  onNavigate: (screen: ScreenName) => void;
}

function HomeScreen({ onNavigate }: HomeScreenProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8 pt-8">
          <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Camera className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            HVAC Scanner
          </h1>
          <p className="text-gray-600">
            Scan and analyze HVAC equipment with AI
          </p>
        </div>

        <div className="space-y-4 mb-8">
          <ActionCard
            icon={<Camera className="w-8 h-8" />}
            title="Scan Label"
            subtitle="Capture equipment information"
            color="blue"
            onClick={() => onNavigate("scan-label")}
          />

          <ActionCard
            icon={<FileText className="w-8 h-8" />}
            title="Manual Inspection"
            subtitle="Create report without scanning"
            color="green"
            onClick={() => onNavigate("data-form")}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <SecondaryCard
            icon={<History className="w-6 h-6" />}
            title="History"
            onClick={() => onNavigate("history")}
          />

          <SecondaryCard
            icon={<Settings className="w-6 h-6" />}
            title="Settings"
            onClick={() => onNavigate("settings")}
          />
        </div>

        <div className="text-center mt-12 text-sm text-gray-500">
          Version 1.0.0 • Powered by OpenAI
        </div>
      </div>
    </div>
  );
}

interface ActionCardProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  color: "blue" | "green";
  onClick: () => void;
}

function ActionCard({
  icon,
  title,
  subtitle,
  color,
  onClick,
}: ActionCardProps) {
  const colorClasses = {
    blue: "from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700",
    green:
      "from-green-500 to-green-600 hover:from-green-600 hover:to-green-700",
  };

  return (
    <button
      onClick={onClick}
      className={`w-full bg-gradient-to-r ${colorClasses[color]} text-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 active:scale-95`}
    >
      <div className="flex items-center space-x-4">
        <div className="flex-shrink-0">{icon}</div>
        <div className="text-left">
          <h3 className="text-xl font-semibold">{title}</h3>
          <p className="text-blue-100 text-sm">{subtitle}</p>
        </div>
      </div>
    </button>
  );
}

interface SecondaryCardProps {
  icon: React.ReactNode;
  title: string;
  onClick: () => void;
}

function SecondaryCard({ icon, title, onClick }: SecondaryCardProps) {
  return (
    <button
      onClick={onClick}
      className="bg-white p-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 border border-gray-200 hover:border-gray-300"
    >
      <div className="flex flex-col items-center space-y-2">
        <div className="text-gray-600">{icon}</div>
        <span className="text-sm font-medium text-gray-700">{title}</span>
      </div>
    </button>
  );
}
