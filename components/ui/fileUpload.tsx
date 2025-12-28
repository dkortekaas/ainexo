"use client";

import { useState, useRef, useEffect } from "react";
import { Upload, X, File as FileIcon, Camera, Image } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";

type FileUploadProps = {
  onFileSelect: (file: File | null) => void;
  selectedFile: File | null;
  accept?: string;
  disabled?: boolean;
};

export default function FileUpload({
  onFileSelect,
  selectedFile,
  accept = "image/*, application/pdf",
  disabled = false,
}: FileUploadProps) {
  const t = useTranslations("fileUpload");
  const [dragActive, setDragActive] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isCapturingPhoto, setIsCapturingPhoto] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [streamActive, setStreamActive] = useState(false);
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(
    null
  );

  // Check if we're on mobile and if the device has camera capability
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768 || "ontouchstart" in window);
    };

    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);

    return () => {
      window.removeEventListener("resize", checkIfMobile);
    };
  }, []);

  // Cleanup camera stream when component unmounts or when no longer capturing
  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, []);

  const stopCameraStream = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      const tracks = stream.getTracks();

      tracks.forEach((track) => {
        track.stop();
      });

      videoRef.current.srcObject = null;
      setStreamActive(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0 && !disabled) {
      const file = e.dataTransfer.files[0];
      onFileSelect(file);
      if (inputRef.current) {
        inputRef.current.value = ""; // Reset input value to allow selecting the same file again
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      onFileSelect(file);
      if (inputRef.current) {
        inputRef.current.value = ""; // Reset input value to allow selecting the same file again
      }
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (inputRef.current) {
      inputRef.current.click();
    }
  };

  const removeFile = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onFileSelect(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const getFileSize = (size: number) => {
    if (size < 1024) {
      return `${size} bytes`;
    } else if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(1)} KB`;
    } else {
      return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    }
  };

  // Handle opening the camera on mobile devices
  const startCamera = async () => {
    setIsCapturingPhoto(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setStreamActive(true);
        setCameraPermission(true);
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setCameraPermission(false);
      setIsCapturingPhoto(false);
    }
  };

  // Capture a photo from the camera stream
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current || !streamActive) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the current video frame on the canvas
    const context = canvas.getContext("2d");
    if (context) {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert the canvas to a file
      canvas.toBlob(
        (blob) => {
          if (blob) {
            // Create a File from the Blob
            const file = new globalThis.File(
              [blob],
              `captured-photo-${Date.now()}.jpg`,
              {
                type: "image/jpeg",
              }
            );

            // Handle the captured photo
            onFileSelect(file);

            // Clean up
            stopCameraStream();
            setIsCapturingPhoto(false);
          }
        },
        "image/jpeg",
        0.9
      );
    }
  };

  // Cancel photo capture
  const cancelCapture = () => {
    stopCameraStream();
    setIsCapturingPhoto(false);
  };

  // If in camera capture mode, show the camera UI
  if (isCapturingPhoto) {
    return (
      <Dialog open={isCapturingPhoto} onOpenChange={setIsCapturingPhoto}>
        <DialogContent className="sm:max-w-[425px] p-0 bg-black">
          <div className="relative flex-1 flex items-center justify-center bg-black">
            {cameraPermission === false ? (
              <Alert variant="destructive" className="m-4">
                <AlertDescription>
                  <p className="mb-4">{t("cameraPermissionRequired")}</p>
                  <p>{t("cameraPermissionRequiredDescription")}</p>
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <video
                  ref={videoRef}
                  className="max-h-full max-w-full object-contain"
                  autoPlay
                  playsInline
                />
                <canvas ref={canvasRef} className="hidden" />
              </>
            )}
          </div>
          <div className="bg-black p-4 flex justify-between items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={cancelCapture}
              className="text-white hover:bg-gray-800"
            >
              <X className="w-6 h-6" />
            </Button>
            {cameraPermission !== false && (
              <Button
                variant="outline"
                size="icon"
                onClick={capturePhoto}
                className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center"
                disabled={!streamActive}
              >
                <div className="w-12 h-12 rounded-full bg-white"></div>
              </Button>
            )}
            <div className="w-10"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Card
      className={`${
        dragActive ? "border-primary" : "border-dashed"
      } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        onChange={handleChange}
        className="hidden"
        accept={accept}
        disabled={disabled}
        capture={isMobile ? "environment" : undefined}
      />

      {selectedFile ? (
        <div className="flex flex-col items-center">
          <div className="bg-primary/10 p-3 rounded-full mb-3">
            <FileIcon className="h-6 w-6 text-primary" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-primary mb-1 break-all max-w-xs">
              {selectedFile.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {getFileSize(selectedFile.size)}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={removeFile}
            className="mt-4 text-destructive hover:text-destructive/90"
            disabled={disabled}
          >
            <X className="h-4 w-4 mr-1" />
            {t("removeFile")}
          </Button>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <div className="bg-muted p-3 rounded-full mb-4">
            <Upload className="h-6 w-6 text-muted-foreground" />
          </div>

          {isMobile ? (
            <div className="flex flex-col items-center text-center">
              <p className="text-sm text-muted-foreground mb-4">
                {t("chooseMethod")}
              </p>
              <div className="grid grid-cols-2 gap-4 w-full">
                <Button
                  variant="outline"
                  onClick={startCamera}
                  className="flex flex-col items-center p-4 h-auto"
                  disabled={disabled}
                >
                  <Camera className="h-8 w-8 text-primary mb-2" />
                  <span className="text-sm font-medium">{t("makePhoto")}</span>
                </Button>

                <Button
                  variant="outline"
                  onClick={handleClick}
                  className="flex flex-col items-center p-4 h-auto"
                  disabled={disabled}
                >
                  <Image
                    className="h-8 w-8 text-primary mb-2"
                    aria-label="Gallery icon"
                  />
                  <span className="text-sm font-medium">{t("gallery")}</span>
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                {t("supportedFormats")}
              </p>
            </div>
          ) : (
            <div
              className={`flex flex-col items-center ${
                !disabled && "cursor-pointer"
              }`}
              onClick={disabled ? undefined : handleClick}
            >
              <p className="text-sm text-muted-foreground mb-1 text-center">
                {t("dragAndDrop")}
              </p>
              <Button
                variant="link"
                className="text-primary"
                disabled={disabled}
              >
                {t("browseFiles")}
              </Button>
              <p className="text-xs text-muted-foreground mt-3">
                {t("supportedFormats")}
              </p>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
