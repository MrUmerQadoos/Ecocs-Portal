import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Camera, SwitchCamera, X, Eye } from "lucide-react";

export default function PhotoUploader({
  onFileChange, // Callback for file changes
  imagePreviews, // Array of preview URLs
  onDeleteImage, // Callback for deleting an image
  label = "Upload Photos (Recommended)", // Dynamic label with default
  inputName, // Dynamic name for the file input (e.g., "corridorPhotos")
  multiple = true, // Allow multiple file uploads by default
  isViewOnly = false, // Prop to disable interactions in view mode
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false); // For preview modal
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraFacingMode, setCameraFacingMode] = useState("environment");
  const [videoStream, setVideoStream] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null); // For image preview modal
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const inputId = `${inputName}-input`; // Unique ID based on inputName

  // Cleanup stream on unmount
  useEffect(() => {
    return () => {
      if (videoStream) {
        videoStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [videoStream]);

  // Handle browse files
  const handleBrowseClick = () => {
    if (isViewOnly) return;
    document.getElementById(inputId).click();
    setIsModalOpen(false);
  };

  // Start camera
  const handleCameraClick = async () => {
    if (isViewOnly) return;
    try {
      if (videoStream) {
        videoStream.getTracks().forEach((track) => track.stop());
      }
      const constraints = { video: { facingMode: cameraFacingMode } };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setVideoStream(stream);
      setCameraActive(true);
      setIsModalOpen(false);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
    }
  };

  // Switch camera
  const toggleCamera = () => {
    if (isViewOnly) return;
    const newFacingMode = cameraFacingMode === "user" ? "environment" : "user";
    setCameraFacingMode(newFacingMode);
    if (videoStream) {
      videoStream.getTracks().forEach((track) => track.stop());
      handleCameraClick();
    }
  };

  // Capture photo
  const handleCapture = () => {
    if (isViewOnly) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);

    const dataUrl = canvas.toDataURL("image/png");
    const imageFile = dataUrlToFile(dataUrl, `${inputName}-captured.png`);
    onFileChange({ target: { files: [imageFile] } });

    if (videoStream) {
      videoStream.getTracks().forEach((track) => track.stop());
    }
    setCameraActive(false);
    setVideoStream(null);
  };

  // Convert data URL to file
  const dataUrlToFile = (dataUrl, filename) => {
    const [header, base64] = dataUrl.split(",");
    const mime = header.match(/:(.*?);/)[1];
    const binary = atob(base64);
    const arrayBuffer = new ArrayBuffer(binary.length);
    const uint8Array = new Uint8Array(arrayBuffer);
    for (let i = 0; i < binary.length; i++) {
      uint8Array[i] = binary.charCodeAt(i);
    }
    return new File([uint8Array], filename, { type: mime });
  };

  // Handle close camera
  const handleCloseCamera = () => {
    if (isViewOnly) return;
    if (videoStream) {
      videoStream.getTracks().forEach((track) => track.stop());
    }
    setCameraActive(false);
    setVideoStream(null);
  };

  // Open image preview modal
  const handleImageClick = (imageUrl) => {
    setSelectedImage(imageUrl);
    setIsPreviewModalOpen(true);
  };

  return (
    <div className="w-full">
      <Label className="text-sm font-medium">{label}</Label>

      {/* Choose Photo Button and Preview Icon */}
      <div className="mt-2 flex items-center gap-2">
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button className="w-full md:w-auto" disabled={isViewOnly}>
              Choose Photo
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Select Photo Source</DialogTitle>
              <DialogDescription>
                Choose to upload from your device or use the camera.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <Button variant="outline" onClick={handleBrowseClick} disabled={isViewOnly}>
                Browse Files
              </Button>
              <Button variant="outline" onClick={handleCameraClick} disabled={isViewOnly}>
                <Camera className="mr-2 h-4 w-4" /> Use Camera
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Preview Icon */}
        {imagePreviews?.length > 0 && (
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsPreviewModalOpen(true)}
            className="w-10 h-10"
          >
            <Eye className="h-5 w-5" />
          </Button>
        )}

        {/* Hidden File Input */}
        <input
          id={inputId}
          type="file"
          accept="image/*"
          multiple={multiple}
          name={inputName}
          onChange={(e) => {
            onFileChange(e);
            setIsModalOpen(false);
          }}
          className="hidden"
          disabled={isViewOnly}
        />
      </div>

      {/* Camera Interface */}
      {cameraActive && (
        <div className="mt-4 relative bg-black rounded-lg overflow-hidden max-w-[100%] md:max-w-[500px] mx-auto">
          <video ref={videoRef} className="w-full h-auto" autoPlay muted />
          <canvas ref={canvasRef} className="hidden" />
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4 p-2">
            <Button
              variant="secondary"
              size="icon"
              onClick={toggleCamera}
              className="rounded-full bg-white/90 hover:bg-white"
              disabled={isViewOnly}
            >
              <SwitchCamera className="h-5 w-5" />
            </Button>
            <Button
              size="lg"
              onClick={handleCapture}
              className="rounded-full w-16 h-16 bg-white/90 hover:bg-white text-black"
              disabled={isViewOnly}
            >
              <Camera className="h-6 w-6" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              onClick={handleCloseCamera}
              className="rounded-full bg-white/90 hover:bg-white"
              disabled={isViewOnly}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
      )}

      {/* Image Thumbnails (No Preview on Click) */}
      {imagePreviews?.length > 0 && (
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {imagePreviews.map((preview, index) => (
            <div key={index} className="relative">
              <img
                src={preview}
                alt={`${inputName} Preview ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg shadow-md"
              />
              {!isViewOnly && (
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => onDeleteImage(index, preview)}
                  className="absolute top-1 right-1 rounded-full w-6 h-6"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      <Dialog open={isPreviewModalOpen} onOpenChange={setIsPreviewModalOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Select Image to Preview</DialogTitle>
            <DialogDescription>Click an image to view it in full size.</DialogDescription>
            <DialogClose />
          </DialogHeader>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {imagePreviews?.map((preview, index) => (
              <div key={index} className="relative">
                <img
                  src={preview}
                  alt={`${inputName} Preview ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg shadow-md cursor-pointer"
                  onClick={() => handleImageClick(preview)}
                />
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Full Image Preview Modal */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Image Preview</DialogTitle>
            <DialogDescription>Preview of the selected photo.</DialogDescription>
            <DialogClose />
          </DialogHeader>
          {selectedImage && (
            <div className="flex flex-col items-center">
              <img
                src={selectedImage}
                alt="Full Preview"
                className="max-w-full max-h-[70vh] object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}