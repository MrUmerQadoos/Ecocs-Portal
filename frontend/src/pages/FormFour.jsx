import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/store/authStore";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"; // Assuming you have a Dialog component

export default function FormFour() {
  const navigate = useNavigate();
  const { processId: urlProcessId } = useParams();
  const location = useLocation();
  const { toast } = useToast();
  const { user } = useAuthStore();

  // State for form data and metadata
  const [formData, setFormData] = useState({
    isConservatory: "", // "yes" or "no"
    isThermallySeparated: "", // "yes" or "no"
    photoThermalSeparation: [], // Array of file paths from the backend
    isFixedHeaters: "", // "yes" or "no"
    floorArea: "",
    doubleGlazed: "", // "yes" or "no"
    glazedPerimeter: "",
    roomHeight: "", // e.g. "1 Storey", "2 Storey", etc.
    userId: user?._id || "",
    processId: urlProcessId || "",
  });

  const [formId, setFormId] = useState(null);
  const [taskId, setTaskId] = useState(null);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [isUpdate, setIsUpdate] = useState(false);
  const [isViewOnly, setIsViewOnly] = useState(false);
  const [savedProcessId, setSavedProcessId] = useState(null);

  // File upload state
  const [files, setFiles] = useState([]); // New files to upload
  const [imagePreviews, setImagePreviews] = useState([]); // Previews for both existing and new images
  const [deletedImages, setDeletedImages] = useState([]); // Track deleted images

  // State for image preview modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  // Determine mode (edit or view) and load existing data
  useEffect(() => {
    const isViewing = location.pathname.includes("/view-form");
    setIsViewOnly(isViewing || user.role !== "surveyor");
    const queryTaskId = new URLSearchParams(location.search).get("taskId");
    setTaskId(queryTaskId);

    if (urlProcessId && urlProcessId !== "new") {
      fetch(`http://localhost:3000/api/assessments/form-four?processId=${urlProcessId}`, {
        method: "GET",
        credentials: "include",
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data) {
            // Data exists, populate the form
            setFormData(data.data);
            setFormId(data.data._id);
            setIsUpdate(true);
            setSavedProcessId(data.data.processId);
            // Set image previews for existing photos
            if (data.data.photoThermalSeparation && data.data.photoThermalSeparation.length > 0) {
              const previews = data.data.photoThermalSeparation.map(
                (photo) => `http://localhost:3000/${photo}`
              );
              setImagePreviews(previews);
            }
          } else if (isViewing) {
            // In view mode, if no data exists, redirect to dashboard
            toast({
              variant: "destructive",
              title: "Error",
              description: "Form Four data not found.",
            });
            navigate("/dashboard");
          } else {
            // In edit mode, if no data exists, allow the surveyor to create a new form
            setFormData((prev) => ({
              ...prev,
              userId: user?._id || "",
              processId: urlProcessId,
            }));
          }
        })
        .catch((error) => {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to load Form Four data.",
          });
          navigate("/dashboard");
          console.error("Fetch error:", error);
        });
    }
  }, [urlProcessId, user, location, toast, navigate]);

  // Warn about unsaved changes in edit mode
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (unsavedChanges && !isViewOnly) {
        e.preventDefault();
        e.returnValue = "You have unsaved changes. Are you sure you want to leave?";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [unsavedChanges, isViewOnly]);

  // Handle input changes (including radio & text fields)
  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
      userId: user ? user._id : "",
      processId: urlProcessId,
    }));
    setUnsavedChanges(true);
  };

  // Handle file upload for thermal-separation photos
  const handleFileChange = (e) => {
    if (isViewOnly) return;
    const selectedFiles = Array.from(e.target.files);
    setFiles((prevFiles) => [...prevFiles, ...selectedFiles]);

    // Create previews for the uploaded images
    const previewUrls = selectedFiles.map((file) => URL.createObjectURL(file));
    setImagePreviews((prevPreviews) => [...prevPreviews, ...previewUrls]);

    setUnsavedChanges(true);
  };

  // Delete an image (either a new upload or an existing one)
  const handleDeleteImage = (index, imageUrl) => {
    if (isViewOnly) return;
    // Remove from previews
    const updatedPreviews = imagePreviews.filter((_, idx) => idx !== index);
    setImagePreviews(updatedPreviews);

    // If the image is a new upload (not yet saved to the backend), remove it from files
    const isNewUpload = imageUrl.startsWith("blob:");
    if (isNewUpload) {
      const updatedFiles = files.filter((_, idx) => idx !== index - (imagePreviews.length - files.length));
      setFiles(updatedFiles);
    } else {
      // If the image is an existing one (from the backend), add it to deletedImages
      setDeletedImages((prev) => [...prev, imageUrl]);
    }

    setUnsavedChanges(true);
  };

  // Open image preview modal
  const handleImageClick = (imageUrl) => {
    setSelectedImage(imageUrl);
    setIsModalOpen(true);
  };

  // Download an image
  const handleDownloadImage = (imageUrl) => {
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = imageUrl.split("/").pop(); // Use the filename from the URL
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Save or update the form
  const saveForm = async () => {
    if (isViewOnly) return { success: false };

    try {
      const formDataToSend = new FormData();

      // Append form fields (excluding photoThermalSeparation, which will be handled separately)
      for (const key in formData) {
        if (key !== "photoThermalSeparation") {
          formDataToSend.append(key, formData[key]);
        }
      }

      // Append new files to photoThermalSeparation
      if (files.length > 0) {
        files.forEach((file) => {
          formDataToSend.append("photoThermalSeparation", file);
        });
      }

      // Append deleted images (if any)
      if (deletedImages.length > 0) {
        formDataToSend.append("deletedImages", JSON.stringify(deletedImages));
      }

      const url = formId
        ? `http://localhost:3000/api/assessments/form-four/${formId}`
        : "http://localhost:3000/api/assessments/form-four";
      const method = formId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        credentials: "include",
        body: formDataToSend,
      });
      const data = await response.json();

      if (data.success) {
        setFormId(data.data._id);
        setSavedProcessId(data.data.processId);
        setIsUpdate(true);
        setUnsavedChanges(false);
        setFiles([]); // Clear new files after saving
        setDeletedImages([]); // Clear deleted images after saving
        // Update image previews with the new list from the backend
        setImagePreviews(
          data.data.photoThermalSeparation.map((photo) => `http://localhost:3000/${photo}`)
        );
        toast({
          title: "Success",
          description: `Form Four ${formId ? "updated" : "saved"} successfully!`,
        });
        return { success: true, processId: data.data.processId };
      } else {
        throw new Error(data.error || "Failed to save Form Four");
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
      console.error("Save error:", error);
      return { success: false, error: error.message };
    }
  };

  // Handle save button click
  const handleSave = async () => {
    const result = await saveForm();
    if (result.success) {
      if (user.role !== "surveyor") {
        navigate(`/view-form/${result.processId}/form-four?taskId=${taskId}`);
      } else {
        navigate(`/process/${result.processId}/form-four?taskId=${taskId}`, { replace: true });
      }
    }
  };

  // Handle navigation to the next form
  const handleNext = async () => {
    if (!isViewOnly) {
      const result = await saveForm();
      if (result.success) {
        if (user.role === "surveyor") {
          navigate(`/process/${result.processId}/form-five?taskId=${taskId}`);
        } else {
          navigate(`/view-form/${result.processId}/form-five?taskId=${taskId}`);
        }
      }
    } else {
      navigate(`/view-form/${savedProcessId || urlProcessId}/form-five?taskId=${taskId}`);
    }
  };

  // Handle navigation to the previous form
  const handlePrevious = async () => {
    if (!isViewOnly) {
      const result = await saveForm();
      if (result.success) {
        if (user.role === "surveyor") {
          navigate(`/process/${result.processId}/form-three?taskId=${taskId}`);
        } else {
          navigate(`/view-form/${result.processId}/form-three?taskId=${taskId}`);
        }
      }
    } else {
      navigate(`/view-form/${savedProcessId || urlProcessId}/form-three?taskId=${taskId}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center px-4 py-6">
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white w-full max-w-4xl p-8 rounded-lg shadow"
      >
        <h1 className="text-2xl font-bold mb-6 text-center">
          {isViewOnly ? "View Form Four" : "4. Is there a Conservatory?"}
        </h1>

        {/* Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Conservatory */}
          <div>
            <Label>Is there a Conservatory?</Label>
            <div className="flex items-center gap-4 mt-2">
              <label className="flex items-center gap-1">
                <input
                  type="radio"
                  name="isConservatory"
                  value="yes"
                  checked={formData.isConservatory === "yes"}
                  onChange={handleChange}
                  disabled={isViewOnly}
                />
                Yes
              </label>
              <label className="flex items-center gap-1">
                <input
                  type="radio"
                  name="isConservatory"
                  value="no"
                  checked={formData.isConservatory === "no"}
                  onChange={handleChange}
                  disabled={isViewOnly}
                />
                No
              </label>
            </div>
          </div>

          {/* Thermally Separated */}
          <div>
            <Label>Is it thermally separated?</Label>
            <div className="flex items-center gap-4 mt-2">
              <label className="flex items-center gap-1">
                <input
                  type="radio"
                  name="isThermallySeparated"
                  value="yes"
                  checked={formData.isThermallySeparated === "yes"}
                  onChange={handleChange}
                  disabled={isViewOnly}
                />
                Yes
              </label>
              <label className="flex items-center gap-1">
                <input
                  type="radio"
                  name="isThermallySeparated"
                  value="no"
                  checked={formData.isThermallySeparated === "no"}
                  onChange={handleChange}
                  disabled={isViewOnly}
                />
                No
              </label>
            </div>
          </div>

          {/* Thermal Separation Photos */}
          <div>
            <Label>Photo of thermal separation (recommended)</Label>
            <div className="flex flex-col gap-2 mt-2">
              {!isViewOnly && (
                <Button onClick={() => document.getElementById("photoInput").click()}>
                  Choose Photos
                </Button>
              )}
              <input
                id="photoInput"
                type="file"
                accept="image/*"
                multiple
                name="photoThermalSeparation"
                onChange={handleFileChange}
                className="hidden"
                disabled={isViewOnly}
              />
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="relative inline-block">
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-32 h-32 object-cover rounded cursor-pointer"
                    onClick={() => handleImageClick(preview)}
                  />
                  <div className="absolute top-0 right-0 flex gap-1">
                    {!isViewOnly && (
                      <button
                        onClick={() => handleDeleteImage(index, preview)}
                        className="bg-red-500 text-white rounded-full p-1"
                      >
                        ✕
                      </button>
                    )}
                    <button
                      onClick={() => handleDownloadImage(preview)}
                      className="bg-blue-500 text-white rounded-full p-1"
                    >
                      ↓
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Other Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          {/* Floor Area */}
          <div>
            <Label htmlFor="floorArea">Floor Area(m²)</Label>
            <Input
              id="floorArea"
              name="floorArea"
              placeholder="e.g. 20"
              value={formData.floorArea}
              onChange={handleChange}
              disabled={isViewOnly}
            />
          </div>
          {/* Double Glazed */}
          <div>
            <Label>Double Glazed:</Label>
            <div className="flex items-center gap-4 mt-2">
              <label className="flex items-center gap-1">
                <input
                  type="radio"
                  name="doubleGlazed"
                  value="yes"
                  checked={formData.doubleGlazed === "yes"}
                  onChange={handleChange}
                  disabled={isViewOnly}
                />
                Yes
              </label>
              <label className="flex items-center gap-1">
                <input
                  type="radio"
                  name="doubleGlazed"
                  value="no"
                  checked={formData.doubleGlazed === "no"}
                  onChange={handleChange}
                  disabled={isViewOnly}
                />
                No
              </label>
            </div>
          </div>
          {/* Glazed Perimeter */}
          <div>
            <Label htmlFor="glazedPerimeter">Glazed Perimeter (m):</Label>
            <Input
              id="glazedPerimeter"
              name="glazedPerimeter"
              placeholder="e.g. 10"
              value={formData.glazedPerimeter}
              onChange={handleChange}
              disabled={isViewOnly}
            />
          </div>
        </div>

        {/* Room Height */}
        <div className="mt-6">
          <Label htmlFor="roomHeight">Room Height</Label>
          <select
            id="roomHeight"
            name="roomHeight"
            value={formData.roomHeight}
            onChange={handleChange}
            className="w-full mt-1 border rounded px-2 py-2"
            disabled={isViewOnly}
          >
            <option value="">- Select -</option>
            <option value="1 Storey">1 Storey</option>
            <option value="1.5 Storey">1.5 Storey</option>
            <option value="2 Storey">2 Storey</option>
            <option value="2.5 Storey">2.5 Storey</option>
            <option value="3 Storey">3 Storey</option>
          </select>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6 space-x-2">
          <Button variant="outline" onClick={handlePrevious}>
            Previous
          </Button>
          {isViewOnly ? (
            <>
              <Button variant="outline" onClick={() => navigate("/dashboard")}>
                Back to Dashboard
              </Button>
              <Button variant="secondary" onClick={handleNext}>
                Next
              </Button>
            </>
          ) : (
            <>
              <Button onClick={handleSave}>{isUpdate ? "Update" : "Save"}</Button>
              <Button variant="secondary" onClick={handleNext}>
                Next
              </Button>
            </>
          )}
        </div>
      </motion.div>

      {/* Image Preview Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Image Preview</DialogTitle>
            <DialogClose />
          </DialogHeader>
          {selectedImage && (
            <div className="flex flex-col items-center">
              <img src={selectedImage} alt="Full Preview" className="max-w-full max-h-[70vh] object-contain" />
              <Button
                onClick={() => handleDownloadImage(selectedImage)}
                className="mt-4 bg-blue-500 hover:bg-blue-600"
              >
                Download Image
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}