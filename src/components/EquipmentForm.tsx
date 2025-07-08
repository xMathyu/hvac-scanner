import { useState, useEffect } from "react";
import { Save, X, CheckCircle, Bot, Eye } from "lucide-react";
import type {
  HVACEquipment,
  HVACEquipmentWithMetadata,
  FieldMetadata,
} from "@/types";

interface EquipmentFormProps {
  initialData?: HVACEquipmentWithMetadata | null;
  onSave: (equipment: HVACEquipment) => void;
  onBack: () => void;
}

export default function EquipmentForm({
  initialData,
  onSave,
  onBack,
}: EquipmentFormProps) {
  const [formData, setFormData] = useState<Partial<HVACEquipment>>({
    brand: "",
    model: "",
    serialNumber: "",
    capacity: "",
    btu: undefined,
    voltage: "",
    amperage: "",
    refrigerantType: "",
    location: "",
  });

  const [fieldMetadata, setFieldMetadata] = useState<
    Record<string, FieldMetadata>
  >({});

  const getFieldSourceInfo = (fieldName: string) => {
    const metadata = fieldMetadata[fieldName];
    if (!metadata) return null;

    return {
      source: metadata.source,
      confidence: metadata.confidence,
      inferenceBasis: metadata.inferenceBasis,
      isAiInferred: metadata.source === "ai_inferred",
      isScanned: metadata.source === "scanned",
    };
  };

  const getFieldClasses = (fieldName: string, baseClasses: string) => {
    const sourceInfo = getFieldSourceInfo(fieldName);
    if (!sourceInfo) return baseClasses;

    if (sourceInfo.isAiInferred) {
      return `${baseClasses} border-purple-400 bg-purple-50 ring-purple-300 text-purple-900 font-medium placeholder-purple-600`;
    } else if (sourceInfo.isScanned) {
      return `${baseClasses} border-blue-400 bg-blue-50 ring-blue-300 text-blue-900 font-medium placeholder-blue-600`;
    }

    return baseClasses;
  };

  useEffect(() => {
    if (initialData) {
      console.log("Updating form with data:", initialData);

      setFieldMetadata(initialData.fieldMetadata || {});

      setFormData({
        brand: initialData.brand || "",
        model: initialData.model || "",
        serialNumber: initialData.serialNumber || "",
        capacity: initialData.capacity || "",
        btu: initialData.btu || undefined,
        voltage: initialData.voltage || "",
        amperage: initialData.amperage || "",
        refrigerantType: initialData.refrigerantType || "",
        seerRating: initialData.seerRating || undefined,
        eerRating: initialData.eerRating || undefined,
        manufactureDate: initialData.manufactureDate || "",
        equipmentType: initialData.equipmentType || "air_conditioner",
        location: initialData.location || "",
        ...initialData,
      });
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const equipment: HVACEquipment = {
      id: Date.now().toString(),
      brand: formData.brand || "",
      model: formData.model || "",
      serialNumber: formData.serialNumber || "",
      capacity: formData.capacity,
      btu: formData.btu,
      voltage: formData.voltage,
      amperage: formData.amperage,
      refrigerantType: formData.refrigerantType,
      location: formData.location,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...formData,
    };

    onSave(equipment);
  };

  const handleChange = (field: keyof HVACEquipment, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const isFieldPreFilled = (fieldName: keyof HVACEquipment) => {
    return (
      initialData && initialData[fieldName] && initialData[fieldName] !== ""
    );
  };

  const getFieldSourceBadge = (fieldName: string) => {
    const sourceInfo = getFieldSourceInfo(fieldName);
    if (!sourceInfo || !isFieldPreFilled(fieldName as keyof HVACEquipment))
      return null;

    if (sourceInfo.isAiInferred) {
      return (
        <span className="ml-2 text-xs text-purple-800 font-medium bg-purple-100 px-2 py-0.5 rounded-full flex items-center">
          <Bot className="w-3 h-3 mr-1" />
          AI Found
          {sourceInfo.inferenceBasis && (
            <span
              className="ml-1 text-purple-700"
              title={sourceInfo.inferenceBasis}
            >
              ⓘ
            </span>
          )}
        </span>
      );
    } else if (sourceInfo.isScanned) {
      return (
        <span className="ml-2 text-xs text-blue-800 font-medium bg-blue-100 px-2 py-0.5 rounded-full flex items-center">
          <Eye className="w-3 h-3 mr-1" />
          Scanned
        </span>
      );
    }

    return (
      <span className="ml-2 text-xs text-green-600 font-normal bg-green-100 px-2 py-0.5 rounded-full">
        ✓ Detected
      </span>
    );
  };

  const getInputClasses = (fieldName: keyof HVACEquipment) => {
    const sourceInfo = getFieldSourceInfo(fieldName);
    const baseClasses =
      "w-full border rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200";

    if (!sourceInfo) {
      return `${baseClasses} border-gray-300 focus:ring-blue-500 hover:border-gray-400 text-gray-900`;
    }

    return getFieldClasses(fieldName, baseClasses);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 p-4 flex items-center sticky top-0 z-10 shadow-sm">
        <button
          onClick={onBack}
          className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
        <h1 className="ml-3 text-xl font-semibold text-gray-900">
          Equipment Information
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-6">
        {initialData && Object.keys(initialData).length > 0 && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-green-800 font-semibold text-lg mb-1">
                  ✨ AI Extracted Data
                </h3>
                <p className="text-green-700 text-sm mb-3">
                  Fields automatically detected from the label:
                </p>

                <div className="grid grid-cols-1 gap-2 text-sm">
                  {Object.entries(initialData).map(([key, value]) => {
                    if (
                      value &&
                      value !== "" &&
                      key !== "id" &&
                      key !== "createdAt" &&
                      key !== "updatedAt" &&
                      key !== "fieldMetadata"
                    ) {
                      const fieldLabels: Record<string, string> = {
                        brand: "Brand",
                        model: "Model",
                        serialNumber: "Serial",
                        btu: "BTU",
                        voltage: "Voltage",
                        amperage: "Amperage",
                        refrigerantType: "Refrigerant",
                        seerRating: "SEER",
                        eerRating: "EER",
                        capacity: "Capacity",
                        equipmentType: "Type",
                        manufactureDate: "Mfg. Date",
                        location: "Location",
                      };

                      const sourceInfo = getFieldSourceInfo(key);
                      const isInferred = sourceInfo?.isAiInferred;

                      return (
                        <div
                          key={key}
                          className={`flex items-center justify-between p-2 rounded ${
                            isInferred
                              ? "bg-purple-50 border border-purple-200"
                              : "bg-blue-50 border border-blue-200"
                          }`}
                        >
                          <div className="flex items-center">
                            {isInferred ? (
                              <Bot className="w-4 h-4 text-purple-900 mr-2" />
                            ) : (
                              <Eye className="w-4 h-4 text-blue-900 mr-2" />
                            )}
                            <span className="font-medium text-gray-800">
                              {fieldLabels[key] || key}:
                            </span>
                            <span className="ml-2 truncate text-gray-900 font-medium">
                              {typeof value === "number"
                                ? value
                                : String(value)}
                            </span>
                          </div>
                          <span
                            className={`text-xs px-2 py-1 rounded-full font-medium ${
                              isInferred
                                ? "bg-purple-200 text-purple-900"
                                : "bg-blue-200 text-blue-900"
                            }`}
                          >
                            {isInferred ? "AI Found" : "Scanned"}
                          </span>
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>

                <p className="text-green-800 text-xs mt-3 font-medium flex items-center">
                  <span>💡 You can edit any field if necessary</span>
                  <span className="ml-4 text-purple-900 font-semibold">
                    🤖 = AI Inferred
                  </span>
                  <span className="ml-2 text-blue-900 font-semibold">
                    👁 = Scanned
                  </span>
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
            <span className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
              📋
            </span>
            Basic Information
          </h2>

          <div className="space-y-4">
            <div>
              <label className="flex text-sm font-semibold text-gray-700 mb-2 items-center">
                Brand *{getFieldSourceBadge("brand")}
              </label>
              <input
                type="text"
                value={formData.brand || ""}
                onChange={(e) => handleChange("brand", e.target.value)}
                className={getInputClasses("brand")}
                placeholder="e.g: Carrier, Trane, Lennox"
                required
              />
            </div>

            <div>
              <label className="flex text-sm font-semibold text-gray-700 mb-2 items-center">
                Model *{getFieldSourceBadge("model")}
              </label>
              <input
                type="text"
                value={formData.model || ""}
                onChange={(e) => handleChange("model", e.target.value)}
                className={getInputClasses("model")}
                placeholder="Model number"
                required
              />
            </div>

            <div>
              <label className="flex text-sm font-semibold text-gray-700 mb-2 items-center">
                Serial Number *{getFieldSourceBadge("serialNumber")}
              </label>
              <input
                type="text"
                value={formData.serialNumber || ""}
                onChange={(e) => handleChange("serialNumber", e.target.value)}
                className={getInputClasses("serialNumber")}
                placeholder="Serial number"
                required
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
            <span className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
              ⚙️
            </span>
            Technical Specifications
          </h2>

          <div className="space-y-4">
            <div>
              <label className="flex text-sm font-semibold text-gray-700 mb-2 items-center">
                Capacity
                {getFieldSourceBadge("capacity")}
              </label>
              <input
                type="text"
                value={formData.capacity || ""}
                onChange={(e) => handleChange("capacity", e.target.value)}
                className={getInputClasses("capacity")}
                placeholder="e.g: 3 tons, 36,000 BTU"
              />
            </div>

            <div>
              <label className="flex text-sm font-semibold text-gray-700 mb-2 items-center">
                BTU
                {getFieldSourceBadge("btu")}
              </label>
              <input
                type="number"
                value={formData.btu || ""}
                onChange={(e) =>
                  handleChange("btu", parseInt(e.target.value) || 0)
                }
                className={getInputClasses("btu")}
                placeholder="36000"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="flex text-sm font-semibold text-gray-700 mb-2 items-center">
                  Voltage
                  {getFieldSourceBadge("voltage")}
                </label>
                <input
                  type="text"
                  value={formData.voltage || ""}
                  onChange={(e) => handleChange("voltage", e.target.value)}
                  className={getInputClasses("voltage")}
                  placeholder="220V"
                />
              </div>

              <div>
                <label className="flex text-sm font-semibold text-gray-700 mb-2 items-center">
                  Amperage
                  {getFieldSourceBadge("amperage")}
                </label>
                <input
                  type="text"
                  value={formData.amperage || ""}
                  onChange={(e) => handleChange("amperage", e.target.value)}
                  className={getInputClasses("amperage")}
                  placeholder="15A"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Refrigerant Type
                {isFieldPreFilled("refrigerantType") && (
                  <span className="ml-2 text-xs text-green-600 font-normal bg-green-100 px-2 py-0.5 rounded-full">
                    ✓ Scanned
                  </span>
                )}
              </label>
              <select
                value={formData.refrigerantType || ""}
                onChange={(e) =>
                  handleChange("refrigerantType", e.target.value)
                }
                className={getInputClasses("refrigerantType")}
              >
                <option value="">Select...</option>
                <option value="R-410A">R-410A</option>
                <option value="R-22">R-22</option>
                <option value="R-404A">R-404A</option>
                <option value="R-134a">R-134a</option>
                <option value="R-407C">R-407C</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  SEER Rating
                  {isFieldPreFilled("seerRating") && (
                    <span className="ml-2 text-xs text-green-600 font-normal bg-green-100 px-2 py-0.5 rounded-full">
                      ✓ Scanned
                    </span>
                  )}
                </label>
                <input
                  type="number"
                  value={formData.seerRating || ""}
                  onChange={(e) =>
                    handleChange("seerRating", parseInt(e.target.value) || 0)
                  }
                  className={getInputClasses("seerRating")}
                  placeholder="16"
                  step="0.1"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  EER Rating
                  {isFieldPreFilled("eerRating") && (
                    <span className="ml-2 text-xs text-green-600 font-normal bg-green-100 px-2 py-0.5 rounded-full">
                      ✓ Scanned
                    </span>
                  )}
                </label>
                <input
                  type="number"
                  value={formData.eerRating || ""}
                  onChange={(e) =>
                    handleChange("eerRating", parseInt(e.target.value) || 0)
                  }
                  className={getInputClasses("eerRating")}
                  placeholder="12"
                  step="0.1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Equipment Type
                  {isFieldPreFilled("equipmentType") && (
                    <span className="ml-2 text-xs text-green-600 font-normal bg-green-100 px-2 py-0.5 rounded-full">
                      ✓ Scanned
                    </span>
                  )}
                </label>
                <select
                  value={formData.equipmentType || "air_conditioner"}
                  onChange={(e) =>
                    handleChange("equipmentType", e.target.value)
                  }
                  className={getInputClasses("equipmentType")}
                >
                  <option value="air_conditioner">Air Conditioner</option>
                  <option value="heat_pump">Heat Pump</option>
                  <option value="furnace">Furnace</option>
                  <option value="package_unit">Package Unit</option>
                  <option value="split_system">Split System</option>
                  <option value="mini_split">Mini Split</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Manufacturing Date
                  {isFieldPreFilled("manufactureDate") && (
                    <span className="ml-2 text-xs text-green-600 font-normal bg-green-100 px-2 py-0.5 rounded-full">
                      ✓ Scanned
                    </span>
                  )}
                </label>
                <input
                  type="date"
                  value={formData.manufactureDate || ""}
                  onChange={(e) =>
                    handleChange("manufactureDate", e.target.value)
                  }
                  className={getInputClasses("manufactureDate")}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
            <span className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
              📍
            </span>
            Location
          </h2>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Equipment Location
              {isFieldPreFilled("location") && (
                <span className="ml-2 text-xs text-green-600 font-normal bg-green-100 px-2 py-0.5 rounded-full">
                  ✓ Scanned
                </span>
              )}
            </label>
            <input
              type="text"
              value={formData.location || ""}
              onChange={(e) => handleChange("location", e.target.value)}
              className={getInputClasses("location")}
              placeholder="e.g: Building A roof, Basement, Machine room"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-6 pb-8">
          <button
            type="button"
            onClick={onBack}
            className="w-full sm:flex-1 bg-gray-200 text-gray-800 py-4 px-6 rounded-xl font-semibold hover:bg-gray-300 transition-colors text-lg"
          >
            ← Back
          </button>

          <button
            type="submit"
            className="w-full sm:flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg text-lg"
          >
            <Save className="w-5 h-5" />
            <span>Save and Inspect</span>
          </button>
        </div>
      </form>
    </div>
  );
}
