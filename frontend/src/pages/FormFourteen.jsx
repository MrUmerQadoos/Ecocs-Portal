import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/store/authStore";

export default function FormFourteen() {
  const navigate = useNavigate();
  const { processId } = useParams(); // e.g., /process/:processId/form-fourteen
  const { toast } = useToast();
  const { user } = useAuthStore();

  const [docId, setDocId] = useState(null);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [isUpdate, setIsUpdate] = useState(false);

  const [formData, setFormData] = useState({
    hasWaterHeatingPhotos: "",
    waterHeatingDescription: "",
    cylinderSize: "",
    insulated: "",
    insulationThickness: "",
    cylinderThermostat: "",
    immersionHeater: "",
    userId: "",
    processId: processId || "",
  });

  // File Handling
  const [waterHeatingFiles, setWaterHeatingFiles] = useState([]);
  const [waterHeatingPreviews, setWaterHeatingPreviews] = useState([]);
  const [waterHeatingDeleted, setWaterHeatingDeleted] = useState([]);

  // Set userId and processId when available
  useEffect(() => {
    if (user && user._id) {
      setFormData((prev) => ({
        ...prev,
        userId: user._id,
        processId,
      }));
    }
  }, [user, processId]);

  // Fetch existing Form Fourteen data on mount
  useEffect(() => {
    if (user && user._id && processId) {
      fetch(`http://localhost:3000/api/assessments/form-fourteen?userId=${user._id}&processId=${processId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data && data.data.length > 0) {
            const existingForm = data.data[0];
            setFormData(existingForm);
            setDocId(existingForm._id);
            setIsUpdate(true);

            // Set Water Heating photos preview
            if (existingForm.waterHeatingPhotos && existingForm.waterHeatingPhotos.length > 0) {
              const previews = existingForm.waterHeatingPhotos.map((img) => `http://localhost:3000/${img}`);
              setWaterHeatingPreviews(previews);
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

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setUnsavedChanges(true);
  };

  // Handle file changes
  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setWaterHeatingFiles((prev) => [...prev, ...selectedFiles]);
    const previewUrls = selectedFiles.map((file) => URL.createObjectURL(file));
    setWaterHeatingPreviews((prev) => [...prev, ...previewUrls]);
    setUnsavedChanges(true);
  };

  // Delete photo handler
  const handleDeleteImage = (index, previewUrl) => {
    const updatedFiles = waterHeatingFiles.filter((_, idx) => idx !== index);
    const updatedPreviews = waterHeatingPreviews.filter((_, idx) => idx !== index);
    setWaterHeatingDeleted((prev) => {
      if (!prev.includes(previewUrl)) {
        return [...prev, previewUrl];
      }
      return prev;
    });
    setWaterHeatingFiles(updatedFiles);
    setWaterHeatingPreviews(updatedPreviews);
    setUnsavedChanges(true);
  };

  // Save/Update Handler
  const handleSave = async () => {
    try {
      const formDataToSend = new FormData();

      // Append non-file fields
      Object.keys(formData).forEach((key) => {
        formDataToSend.append(key, formData[key]);
      });

      // Append files
      waterHeatingFiles.forEach((file) => formDataToSend.append("waterHeatingPhotos", file));

      // Append deleted images
      if (waterHeatingDeleted.length > 0) {
        formDataToSend.append("deletedWaterHeatingPhotos", JSON.stringify(waterHeatingDeleted));
      }

      let url = "http://localhost:3000/api/assessments/form-fourteen";
      let method = "POST";
      if (docId) {
        url = `http://localhost:3000/api/assessments/form-fourteen/${docId}`;
        method = "PUT";
      }

      const response = await fetch(url, {
        method,
        body: formDataToSend,
      });
      const data = await response.json();
      if (data.success) {
        setDocId(data.data._id);
        setIsUpdate(true);
        setUnsavedChanges(false);
        toast({
          title: "Success",
          description: `Form Fourteen ${docId ? "updated" : "saved"} successfully!`,
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
        description: "An error occurred while saving Form Fourteen",
      });
      console.error("Save error:", error);
    }
  };

  // Navigation Handlers
  const handleNext = () => {
    if (unsavedChanges) {
      toast({
        variant: "warning",
        title: "Unsaved changes",
        description: "Please save before proceeding.",
      });
      return;
    }
    navigate(`/process/${processId}/form-fifteen`); // Assuming Form Fifteen follows
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
    navigate(`/process/${processId}/form-thirteen`);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center px-4 py-6">
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white w-full max-w-2xl p-8 rounded-lg shadow"
      >
        <h1 className="text-2xl font-bold mb-6 text-center">Form Fourteen: Water Heating</h1>

        {/* Water Heating Photos? */}
        <div className="mb-6">
          <Label>Water Heating Photos?</Label>
          <div className="flex gap-4 mt-2">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="hasWaterHeatingPhotos"
                value="yes"
                checked={formData.hasWaterHeatingPhotos === "yes"}
                onChange={handleChange}
                className="form-radio"
              />
              <span>Yes</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="hasWaterHeatingPhotos"
                value="no"
                checked={formData.hasWaterHeatingPhotos === "no"}
                onChange={handleChange}
                className="form-radio"
              />
              <span>No</span>
            </label>
          </div>
        </div>

        {/* Water Heating Photos */}
        <div className="mb-6">
          <Label>Water Heating Photos (Recommended)</Label>
          <div className="flex flex-col gap-2 mt-2">
            <Button onClick={() => document.getElementById("waterHeatingInput").click()}>
              Choose Photos
            </Button>
            <input
              id="waterHeatingInput"
              type="file"
              accept="image/*"
              multiple
              name="waterHeatingPhotos"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
          {waterHeatingPreviews.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {waterHeatingPreviews.map((preview, index) => (
                <div key={index} className="relative">
                  <img
                    src={preview}
                    alt="Water Heating Preview"
                    className="w-32 h-32 object-cover rounded"
                  />
                  <button
                    onClick={() => handleDeleteImage(index, preview)}
                    className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Water Heating Description */}
        <div className="mb-6">
          <Label>Water Heating Description</Label>
          <textarea
            name="waterHeatingDescription"
            value={formData.waterHeatingDescription}
            onChange={handleChange}
            className="w-full mt-1 border rounded px-2 py-2"
            rows="3"
          />
        </div>

        {/* Cylinder Size */}
        <div className="mb-6">
          <Label>Cylinder Size</Label>
          <select
            name="cylinderSize"
            value={formData.cylinderSize}
            onChange={handleChange}
            className="w-full mt-1 border rounded px-2 py-2"
          >
            <option value="">- Select -</option>
            <option value="No Access">No Access</option>
            <option value="Normal">Normal</option>
            <option value="Medium">Medium</option>
            <option value="Large">Large</option>
          </select>
        </div>

        {/* Insulated */}
        <div className="mb-6">
          <Label>Insulated</Label>
          <select
            name="insulated"
            value={formData.insulated}
            onChange={handleChange}
            className="w-full mt-1 border rounded px-2 py-2"
          >
            <option value="">- Select -</option>
            <option value="No insulation">No insulation</option>
            <option value="Jacket">Jacket</option>
            <option value="Foam">Foam</option>
          </select>
        </div>

        {/* Insulation Thickness */}
        <div className="mb-6">
          <Label>Insulation Thickness</Label>
          <select
            name="insulationThickness"
            value={formData.insulationThickness}
            onChange={handleChange}
            className="w-full mt-1 border rounded px-2 py-2"
          >
            <option value="">- Select -</option>
            <option value="None">None</option>
            <option value="12mm">12mm</option>
            <option value="25mm">25mm</option>
            <option value="38mm">38mm</option>
            <option value="50mm">50mm</option>
            <option value="80mm">80mm</option>
            <option value="120mm">120mm</option>
            <option value="160mm">160mm</option>
          </select>
        </div>

        {/* Cylinder Thermostat */}
        <div className="mb-6">
          <Label>Cylinder Thermostat</Label>
          <div className="flex gap-4 mt-2">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="cylinderThermostat"
                value="yes"
                checked={formData.cylinderThermostat === "yes"}
                onChange={handleChange}
                className="form-radio"
              />
              <span>Yes</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="cylinderThermostat"
                value="no"
                checked={formData.cylinderThermostat === "no"}
                onChange={handleChange}
                className="form-radio"
              />
              <span>No</span>
            </label>
          </div>
        </div>

        {/* Immersion Heater */}
        <div className="mb-6">
          <Label>Immersion Heater</Label>
          <select
            name="immersionHeater"
            value={formData.immersionHeater}
            onChange={handleChange}
            className="w-full mt-1 border rounded px-2 py-2"
          >
            <option value="">- Select -</option>
            <option value="Single">Single</option>
            <option value="Dual">Dual</option>
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