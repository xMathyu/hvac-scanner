"use client";

import { useState, useRef, useCallback } from "react";
import { CameraCapture, AppError } from "@/types";

interface UseCameraReturn {
  isOpen: boolean;
  captures: CameraCapture[];
  error: AppError | null;
  isCapturing: boolean;
  openCamera: () => void;
  closeCamera: () => void;
  capturePhoto: () => Promise<void>;
  retakePhoto: (index: number) => void;
  clearCaptures: () => void;
}

export function useCamera(): UseCameraReturn {
  const [isOpen, setIsOpen] = useState(false);
  const [captures, setCaptures] = useState<CameraCapture[]>([]);
  const [error, setError] = useState<AppError | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const openCamera = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment", // Use back camera on mobile
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsOpen(true);
    } catch (err) {
      const error: AppError = {
        code: "CAMERA_ACCESS_DENIED",
        message: "Could not access camera. Please check permissions.",
        timestamp: new Date(),
        details: { originalError: err },
      };
      setError(error);
    }
  }, []);

  const closeCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsOpen(false);
  }, []);

  const capturePhoto = useCallback(async () => {
    if (!videoRef.current || !streamRef.current) return;

    try {
      setIsCapturing(true);
      setError(null);

      const canvas = document.createElement("canvas");
      const video = videoRef.current;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not create canvas context");

      ctx.drawImage(video, 0, 0);

      // Convert to blob
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

      // Create file
      const file = new File([blob], `hvac_photo_${Date.now()}.jpg`, {
        type: "image/jpeg",
      });

      // Create preview URL
      const preview = URL.createObjectURL(blob);

      const newCapture: CameraCapture = {
        file,
        preview,
        timestamp: new Date(),
      };

      setCaptures((prev) => [...prev, newCapture]);
    } catch (err) {
      const error: AppError = {
        code: "PROCESSING_ERROR",
        message: "Error capturing photo",
        timestamp: new Date(),
        details: { originalError: err },
      };
      setError(error);
    } finally {
      setIsCapturing(false);
    }
  }, []);

  const retakePhoto = useCallback((index: number) => {
    setCaptures((prev) => {
      const newCaptures = [...prev];
      // Revoke the URL to free memory
      URL.revokeObjectURL(newCaptures[index].preview);
      newCaptures.splice(index, 1);
      return newCaptures;
    });
  }, []);

  const clearCaptures = useCallback(() => {
    captures.forEach((capture) => {
      URL.revokeObjectURL(capture.preview);
    });
    setCaptures([]);
  }, [captures]);

  return {
    isOpen,
    captures,
    error,
    isCapturing,
    openCamera,
    closeCamera,
    capturePhoto,
    retakePhoto,
    clearCaptures,
  };
}
