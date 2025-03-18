import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/store/authStore";
import PhotoUploader from "@/components/ui/photo/PhotoUpload";

export default function FormFive() {
  const navigate = useNavigate();
  const { processId } = useParams();
  const { toast } = useToast();
  const { user } = useAuthStore();

  const [docId, setDocId] = useState(null);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [isUpdate, setIsUpdate] = useState(false);
  const [files, setFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [deletedImages, setDeletedImages] = useState([]);

  const [formData, setFormData] = useState({
    corridor: "",
    corridorPhotos: [],
    shelteredWallLength: "",
    positionInBlock: "",
    whichFloor: "",
    userId: "",
    processId: processId || "",
  });

  // 1) Set userId & processId when user changes
  useEffect(() => {
    if (user && user._id) {
      setFormData((prev) => ({
        ...prev,
        userId: user._id,
        processId,
      }));
    }
  }, [user, processId]);

  // 2) Fetch existing data on mount if user & processId exist
  useEffect(() => {
    if (user && user._id && processId) {
      fetch(`http://localhost:3000/api/assessments/form-five?userId=${user._id}&processId=${processId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data && data.data.length > 0) {
            const existingForm = data.data[0];
            setFormData(existingForm);
            setDocId(existingForm._id);
            setIsUpdate(true);
            if (existingForm.corridorPhotos) {
              setImagePreviews(existingForm.corridorPhotos.map((photo) => `http://localhost:3000/${photo}`));
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

  // 3) Warn user about unsaved changes on page unload
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

  // 4) Handle input changes
  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
      userId: user ? user._id : "",
      processId,
    }));
    setUnsavedChanges(true);
  };

  // 5) Handle file upload (corridor photos)
  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles((prevFiles) => [...prevFiles, ...selectedFiles]);
    const previewUrls = selectedFiles.map((file) => URL.createObjectURL(file));
    setImagePreviews((prevPreviews) => [...prevPreviews, ...previewUrls]);
    setUnsavedChanges(true);
  };

  // Handle delete image
  const handleDeleteImage = (index, previewUrl) => {
    const updatedFiles = files.filter((_, idx) => idx !== index);
    const updatedPreviews = imagePreviews.filter((_, idx) => idx !== index);
    setDeletedImages((prev) => {
      if (!prev.includes(previewUrl) && previewUrl.includes("localhost")) {
        return [...prev, previewUrl];
      }
      return prev;
    });
    setFiles(updatedFiles);
    setImagePreviews(updatedPreviews);
    setUnsavedChanges(true);
  };
  
  // 6) Save or Update
  const handleSave = async () => {
    try {
      const formDataToSend = new FormData();

      // Append form fields except corridorPhotos if no new files are added
      for (const key in formData) {
        if (key === "corridorPhotos" && files.length === 0) continue; // Only append corridorPhotos if files are added
        formDataToSend.append(key, formData[key]);
      }

      // Append new files to corridorPhotos
      if (files.length > 0) {
        files.forEach((file) => {
          formDataToSend.append("corridorPhotos", file);
        });
      }

      // Include deleted images in the request to remove them
      if (deletedImages.length > 0) {
        formDataToSend.append("deletedImages", JSON.stringify(deletedImages));
      }

      let url = "http://localhost:3000/api/assessments/form-five";
      let method = "POST";
      if (docId) {
        url = `http://localhost:3000/api/assessments/form-five/${docId}`;
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
          description: `Form Five ${docId ? "updated" : "saved"} successfully!`,
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
        description: "An error occurred while saving Form Five",
      });
      console.error("Save error:", error);
    }
  };

  // 7) Navigation
  const handleNext = () => {
    if (unsavedChanges) {
      toast({
        variant: "warning",
        title: "Unsaved changes",
        description: "Please save before proceeding.",
      });
      return;
    }
    navigate(`/process/${processId}/form-six`);
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
    navigate(`/process/${processId}/form-four`);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center px-4 py-6">
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white w-full max-w-4xl p-8 rounded-lg shadow"
      >
        <h1 className="text-2xl font-bold mb-6 text-center">4. Flats/Maisonettes</h1>

        {/* Corridor */}
        <div className="mb-4">
          <Label htmlFor="corridor">Corridor</Label>
          <select
            id="corridor"
            name="corridor"
            value={formData.corridor}
            onChange={handleChange}
            className="w-full mt-1 border rounded px-2 py-2"
          >
            <option value="">- Select -</option>
            <option value="None">None</option>
            <option value="Heated">Heated</option>
            <option value="Unheated">Unheated</option>
          </select>
        </div>

        {/* Photo of corridor/sheltered wall */}
        <div className="mb-4">
        <div className="mb-4">
          <PhotoUploader
            onFileChange={handleFileChange}
            imagePreviews={imagePreviews}
            onDeleteImage={handleDeleteImage}
            label="Photo of corridor/sheltered wall (recommended)"
            inputName="corridorPhotos"
          />
        </div>
        </div>

        {/* Length of Sheltered Wall (m) if unheated */}
        <div className="mb-4">
          <Label htmlFor="shelteredWallLength">Length of Sheltered Wall (m) if unheated</Label>
          <Input
            id="shelteredWallLength"
            name="shelteredWallLength"
            placeholder="e.g. 10"
            value={formData.shelteredWallLength}
            onChange={handleChange}
          />
          <p className="text-sm text-gray-500 mt-1">
            Note: remember to include this measurement in the overall heat loss wall perimeter
          </p>
        </div>

        {/* Position + Which Floor */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Position of flat/maisonette in block */}
          <div>
            <Label htmlFor="positionInBlock">Position of flat/maisonette in block</Label>
            <select
              id="positionInBlock"
              name="positionInBlock"
              value={formData.positionInBlock}
              onChange={handleChange}
              className="w-full mt-1 border rounded px-2 py-2"
            >
              <option value="">- Select -</option>
              <option value="Basement">Basement</option>
              <option value="Ground Floor">Ground Floor</option>
              <option value="Mid Floor">Mid Floor</option>
              <option value="Top Floor">Top Floor</option>
            </select>
          </div>

          {/* Which Floor? */}
          <div>
            <Label htmlFor="whichFloor">Which Floor?</Label>
            <Input
              id="whichFloor"
              name="whichFloor"
              placeholder="e.g. 2nd"
              value={formData.whichFloor}
              onChange={handleChange}
            />
          </div>
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
