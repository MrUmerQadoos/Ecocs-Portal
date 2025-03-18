import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/store/authStore";

export default function FormFour() {
  const navigate = useNavigate();
  const { processId } = useParams(); // read processId from the URL, e.g. /process/:processId/form-four
  const { toast } = useToast();
  const { user } = useAuthStore();

  // Document ID and unsaved-changes tracking
  const [docId, setDocId] = useState(null);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [isUpdate, setIsUpdate] = useState(false);

  // File upload state (for thermal-separation photos)
  const [files, setFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [deletedImages, setDeletedImages] = useState([]); // Track deleted images

  // Form fields
  const [formData, setFormData] = useState({
    isConservatory: "",         // "yes" or "no"
    isThermallySeparated: "",   // "yes" or "no"
    photoThermalSeparation: [], // will store the file path from the backend
    isFixedHeaters: "",         // "yes" or "no"
    floorArea: "",
    doubleGlazed: "",           // "yes" or "no"
    glazedPerimeter: "",
    roomHeight: "",             // e.g. "1 Storey", "2 Storey", etc.
    userId: "",
    processId: processId || "",
  });

  // 1) Set userId and processId when they change
  useEffect(() => {
    if (user && user._id) {
      setFormData((prev) => ({
        ...prev,
        userId: user._id,
        processId,
      }));
    }
  }, [user, processId]);

  // 2) Fetch existing Form Four data (by userId & processId) on mount
  useEffect(() => {
    if (user && user._id && processId) {
      fetch(`http://localhost:3000/api/assessments/form-four?userId=${user._id}&processId=${processId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data && data.data.length > 0) {
            const existingForm = data.data[0];
            setFormData(existingForm);
            setDocId(existingForm._id);
            setIsUpdate(true);

            // Set image previews
            if (existingForm.photoThermalSeparation) {
              const previews = existingForm.photoThermalSeparation.map(photo => `http://localhost:3000/${photo}`);
              setImagePreviews(previews);
            }
          }
        })
        .catch((error) => {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Error fetching saved data.",
          });
          console.error("Fetch error:", error);
        });
    }
  }, [user, processId, toast]);

  // 3) Warn user about unsaved changes when leaving the page
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (unsavedChanges) {
        e.preventDefault();
        e.returnValue = "You have unsaved changes. If you leave, your data will be lost.";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [unsavedChanges]);

  // 4) Handle input changes (including radio & text fields)
  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
      userId: user ? user._id : "",
      processId,
    }));
    setUnsavedChanges(true);
  };

  // 5) Handle file upload for thermal-separation photos
  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles((prevFiles) => [...prevFiles, ...selectedFiles]);

    // Create previews for the uploaded images
    const previewUrls = selectedFiles.map((file) => URL.createObjectURL(file));
    setImagePreviews((prevPreviews) => [...prevPreviews, ...previewUrls]);

    setUnsavedChanges(true);
  };

  // Optional: delete the selected image
  const handleDeleteImage = (index, imageUrl) => {
    const updatedFiles = files.filter((_, idx) => idx !== index);
    const updatedPreviews = imagePreviews.filter((_, idx) => idx !== index);

    // Track deleted images
    setDeletedImages((prev) => {
      if (!prev.includes(imageUrl)) {
        return [...prev, imageUrl];
      }
      return prev;
    });

    setFiles(updatedFiles);
    setImagePreviews(updatedPreviews);
    setUnsavedChanges(true);
  };

  // Save or Update Form Four
  const handleSave = async () => {
    try {
      const formDataToSend = new FormData();

      // Append form fields except photoThermalSeparation if no new files are added
      for (const key in formData) {
        if (key === "photoThermalSeparation" && files.length === 0) continue;
        formDataToSend.append(key, formData[key]);
      }

      // Append new files to photoThermalSeparation
      if (files.length > 0) {
        files.forEach((file) => {
          formDataToSend.append("photoThermalSeparation", file);
        });
      }

      // Include deleted images in the request
      if (deletedImages.length > 0) {
        formDataToSend.append("deletedImages", JSON.stringify(deletedImages));
      }

      let url = "http://localhost:3000/api/assessments/form-four";
      let method = "POST";
      if (docId) {
        url = `http://localhost:3000/api/assessments/form-four/${docId}`;
        method = "PUT";
      }

      const response = await fetch(url, {
        method,
        body: formDataToSend,
      });

      const data = await response.json();

      if (data.success) {
        if (!docId && data.data && data.data._id) {
          setDocId(data.data._id);
        }
        setIsUpdate(true);
        setUnsavedChanges(false);
        toast({
          title: "Success",
          description: `Form Four ${docId ? "updated" : "saved"} successfully!`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: data.error || "Save failed",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An error occurred while saving Form Four",
      });
      console.error("Save error:", error);
    }
  };

  // Navigation
  const handleNext = () => {
    if (unsavedChanges) {
      toast({
        variant: "warning",
        title: "Unsaved changes",
        description: "Please save before proceeding.",
      });
      return;
    }
    navigate(`/process/${processId}/form-five`);
  };

  const handlePrevious = () => {
    if (unsavedChanges) {
      toast({
        variant: "warning",
        title: "Unsaved changes",
        description: "Please save before navigating back.",
      });
      return;
    }
    navigate(`/process/${processId}/form-three`);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center px-4 py-6">
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white w-full max-w-4xl p-8 rounded-lg shadow"
      >
        <h1 className="text-2xl font-bold mb-6 text-center">4. Is there a Conservatory?</h1>

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
                />
                No
              </label>
            </div>
          </div>

          {/* Thermal Separation Photos */}
          <div>
            <Label>Photo of thermal separation (recommended)</Label>
            <div className="flex flex-col gap-2 mt-2">
              <Button onClick={() => document.getElementById("photoInput").click()}>
                Choose Photos
              </Button>
              <input
                id="photoInput"
                type="file"
                accept="image/*"
                multiple
                name="photoThermalSeparation"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
            <div className="mt-2">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="relative inline-block mr-2">
                  <img src={preview} alt="Preview" className="w-32 h-32 object-cover rounded" />
                  <button
                    onClick={() => handleDeleteImage(index, preview)}
                    className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                  >
                    ✕
                  </button>
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
        <div className="flex justify-between mt-6">
          <Button variant="outline" onClick={handlePrevious}>
            Previous
          </Button>
          <Button onClick={handleSave}>{isUpdate ? "Update" : "Save"}</Button>
          <Button variant="outline" onClick={handleNext}>
            Next
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
