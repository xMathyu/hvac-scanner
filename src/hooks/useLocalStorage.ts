"use client";

import { useState, useCallback } from "react";
import {
  HVACEquipment,
  InspectionReport,
  CapturedImage,
  AppError,
} from "@/types";

const DB_NAME = "hvac_scanner_db";
const DB_VERSION = 1;

interface UseLocalStorageReturn {
  // Equipment operations
  saveEquipment: (equipment: HVACEquipment) => Promise<void>;
  getEquipment: (id: string) => Promise<HVACEquipment | null>;
  getAllEquipment: () => Promise<HVACEquipment[]>;
  deleteEquipment: (id: string) => Promise<void>;

  // Report operations
  saveReport: (report: InspectionReport) => Promise<void>;
  getReport: (id: string) => Promise<InspectionReport | null>;
  getAllReports: () => Promise<InspectionReport[]>;
  deleteReport: (id: string) => Promise<void>;

  // Image operations
  saveImage: (image: CapturedImage) => Promise<void>;
  getImage: (id: string) => Promise<CapturedImage | null>;
  deleteImage: (id: string) => Promise<void>;

  // Utility
  clearAllData: () => Promise<void>;
  getStorageInfo: () => Promise<{ used: number; available: number }>;

  // State
  isLoading: boolean;
  error: AppError | null;
}

export function useLocalStorage(): UseLocalStorageReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<AppError | null>(null);

  const openDB = useCallback((): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(new Error("Error opening database"));
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Equipment store
        if (!db.objectStoreNames.contains("equipment")) {
          const equipmentStore = db.createObjectStore("equipment", {
            keyPath: "id",
          });
          equipmentStore.createIndex("createdAt", "createdAt");
          equipmentStore.createIndex("brand", "brand");
          equipmentStore.createIndex("equipmentType", "equipmentType");
        }

        // Reports store
        if (!db.objectStoreNames.contains("reports")) {
          const reportsStore = db.createObjectStore("reports", {
            keyPath: "id",
          });
          reportsStore.createIndex("equipmentId", "equipmentId");
          reportsStore.createIndex("createdAt", "createdAt");
          reportsStore.createIndex("status", "status");
        }

        // Images store
        if (!db.objectStoreNames.contains("images")) {
          const imagesStore = db.createObjectStore("images", { keyPath: "id" });
          imagesStore.createIndex("equipmentId", "equipmentId");
          imagesStore.createIndex("type", "type");
          imagesStore.createIndex("capturedAt", "capturedAt");
        }
      };
    });
  }, []);

  const performDBOperation = useCallback(
    async <T>(operation: (db: IDBDatabase) => Promise<T>): Promise<T> => {
      try {
        setIsLoading(true);
        setError(null);
        const db = await openDB();
        const result = await operation(db);
        db.close();
        return result;
      } catch (err) {
        const appError: AppError = {
          code: "STORAGE_ERROR",
          message: "Local storage error",
          timestamp: new Date(),
          details: { originalError: err },
        };
        setError(appError);
        throw appError;
      } finally {
        setIsLoading(false);
      }
    },
    [openDB]
  );

  // Equipment operations
  const saveEquipment = useCallback(
    async (equipment: HVACEquipment) => {
      return performDBOperation(async (db) => {
        const transaction = db.transaction(["equipment"], "readwrite");
        const store = transaction.objectStore("equipment");
        await new Promise<void>((resolve, reject) => {
          const request = store.put(equipment);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      });
    },
    [performDBOperation]
  );

  const getEquipment = useCallback(
    async (id: string): Promise<HVACEquipment | null> => {
      return performDBOperation(async (db) => {
        const transaction = db.transaction(["equipment"], "readonly");
        const store = transaction.objectStore("equipment");
        return new Promise<HVACEquipment | null>((resolve, reject) => {
          const request = store.get(id);
          request.onsuccess = () => resolve(request.result || null);
          request.onerror = () => reject(request.error);
        });
      });
    },
    [performDBOperation]
  );

  const getAllEquipment = useCallback(async (): Promise<HVACEquipment[]> => {
    return performDBOperation(async (db) => {
      const transaction = db.transaction(["equipment"], "readonly");
      const store = transaction.objectStore("equipment");
      return new Promise<HVACEquipment[]>((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      });
    });
  }, [performDBOperation]);

  const deleteEquipment = useCallback(
    async (id: string) => {
      return performDBOperation(async (db) => {
        const transaction = db.transaction(["equipment"], "readwrite");
        const store = transaction.objectStore("equipment");
        await new Promise<void>((resolve, reject) => {
          const request = store.delete(id);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      });
    },
    [performDBOperation]
  );

  // Report operations
  const saveReport = useCallback(
    async (report: InspectionReport) => {
      return performDBOperation(async (db) => {
        const transaction = db.transaction(["reports"], "readwrite");
        const store = transaction.objectStore("reports");
        await new Promise<void>((resolve, reject) => {
          const request = store.put(report);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      });
    },
    [performDBOperation]
  );

  const getReport = useCallback(
    async (id: string): Promise<InspectionReport | null> => {
      return performDBOperation(async (db) => {
        const transaction = db.transaction(["reports"], "readonly");
        const store = transaction.objectStore("reports");
        return new Promise<InspectionReport | null>((resolve, reject) => {
          const request = store.get(id);
          request.onsuccess = () => resolve(request.result || null);
          request.onerror = () => reject(request.error);
        });
      });
    },
    [performDBOperation]
  );

  const getAllReports = useCallback(async (): Promise<InspectionReport[]> => {
    return performDBOperation(async (db) => {
      const transaction = db.transaction(["reports"], "readonly");
      const store = transaction.objectStore("reports");
      return new Promise<InspectionReport[]>((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      });
    });
  }, [performDBOperation]);

  const deleteReport = useCallback(
    async (id: string) => {
      return performDBOperation(async (db) => {
        const transaction = db.transaction(["reports"], "readwrite");
        const store = transaction.objectStore("reports");
        await new Promise<void>((resolve, reject) => {
          const request = store.delete(id);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      });
    },
    [performDBOperation]
  );

  // Image operations
  const saveImage = useCallback(
    async (image: CapturedImage) => {
      return performDBOperation(async (db) => {
        const transaction = db.transaction(["images"], "readwrite");
        const store = transaction.objectStore("images");
        await new Promise<void>((resolve, reject) => {
          const request = store.put(image);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      });
    },
    [performDBOperation]
  );

  const getImage = useCallback(
    async (id: string): Promise<CapturedImage | null> => {
      return performDBOperation(async (db) => {
        const transaction = db.transaction(["images"], "readonly");
        const store = transaction.objectStore("images");
        return new Promise<CapturedImage | null>((resolve, reject) => {
          const request = store.get(id);
          request.onsuccess = () => resolve(request.result || null);
          request.onerror = () => reject(request.error);
        });
      });
    },
    [performDBOperation]
  );

  const deleteImage = useCallback(
    async (id: string) => {
      return performDBOperation(async (db) => {
        const transaction = db.transaction(["images"], "readwrite");
        const store = transaction.objectStore("images");
        await new Promise<void>((resolve, reject) => {
          const request = store.delete(id);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      });
    },
    [performDBOperation]
  );

  // Utility operations
  const clearAllData = useCallback(async () => {
    return performDBOperation(async (db) => {
      const transaction = db.transaction(
        ["equipment", "reports", "images"],
        "readwrite"
      );
      await Promise.all([
        new Promise<void>((resolve, reject) => {
          const request = transaction.objectStore("equipment").clear();
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        }),
        new Promise<void>((resolve, reject) => {
          const request = transaction.objectStore("reports").clear();
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        }),
        new Promise<void>((resolve, reject) => {
          const request = transaction.objectStore("images").clear();
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        }),
      ]);
    });
  }, [performDBOperation]);

  const getStorageInfo = useCallback(async () => {
    if ("storage" in navigator && "estimate" in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return {
        used: estimate.usage || 0,
        available: estimate.quota || 0,
      };
    }
    return { used: 0, available: 0 };
  }, []);

  return {
    saveEquipment,
    getEquipment,
    getAllEquipment,
    deleteEquipment,
    saveReport,
    getReport,
    getAllReports,
    deleteReport,
    saveImage,
    getImage,
    deleteImage,
    clearAllData,
    getStorageInfo,
    isLoading,
    error,
  };
}
