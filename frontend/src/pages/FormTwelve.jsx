import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/store/authStore";

export default function FormTwelve() {
  const navigate = useNavigate();
  const { processId } = useParams(); // e.g., /process/:processId/form-twelve
  const { toast } = useToast();
  const { user } = useAuthStore();

  const [docId, setDocId] = useState(null);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [isUpdate, setIsUpdate] = useState(false);

  const [formData, setFormData] = useState({
    hasVentilationCoolingPhotos: "", // "yes" or "no"
    numberOfOpenFireplaces: "",
    mechanicalVentilation: "",
    userId: "",
    processId: processId || "",
  });

  // Image Handling
  const [ventilationCoolingFiles, setVentilationCoolingFiles] = useState([]);
  const [ventilationCoolingPreviews, setVentilationCoolingPreviews] = useState([]);
  const [ventilationCoolingDeleted, setVentilationCoolingDeleted] = useState([]);

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

  // Fetch existing Form Twelve data on mount
  useEffect(() => {
    if (user && user._id && processId) {
      fetch(`http://localhost:3000/api/assessments/form-twelve?userId=${user._id}&processId=${processId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data && data.data.length > 0) {
            const existingForm = data.data[0];
            setFormData(existingForm);
            setDocId(existingForm._id);
            setIsUpdate(true);

            // Set ventilation & cooling photos preview if available
            if (existingForm.ventilationCoolingPhotos && existingForm.ventilationCoolingPhotos.length > 0) {
              const previews = existingForm.ventilationCoolingPhotos.map(
                (img) => `http://localhost:3000/${img}`
              );
              setVentilationCoolingPreviews(previews);
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

  // Handle ventilation & cooling photos file change
  const handleVentilationCoolingFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setVentilationCoolingFiles((prev) => [...prev, ...selectedFiles]);
    const previewUrls = selectedFiles.map((file) => URL.createObjectURL(file));
    setVentilationCoolingPreviews((prev) => [...prev, ...previewUrls]);
    setUnsavedChanges(true);
  };

  // Delete ventilation & cooling photo
  const handleDeleteVentilationCoolingImage = (index, previewUrl) => {
    const updatedFiles = ventilationCoolingFiles.filter((_, idx) => idx !== index);
    const updatedPreviews = ventilationCoolingPreviews.filter((_, idx) => idx !== index);
    setVentilationCoolingDeleted((prev) => {
      if (!prev.includes(previewUrl)) {
        return [...prev, previewUrl];
      }
      return prev;
    });
    setVentilationCoolingFiles(updatedFiles);
    setVentilationCoolingPreviews(updatedPreviews);
    setUnsavedChanges(true);
  };

  // Save/Update Handler
  const handleSave = async () => {
    try {
      const formDataToSend = new FormData();

      // Append non-file fields
      for (const key in formData) {
        formDataToSend.append(key, formData[key]);
      }

      // Append ventilation & cooling photos
      if (ventilationCoolingFiles.length > 0) {
        ventilationCoolingFiles.forEach((file) => {
          formDataToSend.append("ventilationCoolingPhotos", file);
        });
      }

      // Append deleted images
      if (ventilationCoolingDeleted.length > 0) {
        formDataToSend.append("deletedVentilationCooling", JSON.stringify(ventilationCoolingDeleted));
      }

      let url = "http://localhost:3000/api/assessments/form-twelve";
      let method = "POST";
      if (docId) {
        url = `http://localhost:3000/api/assessments/form-twelve/${docId}`;
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
          description: `Form Twelve ${docId ? "updated" : "saved"} successfully!`,
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
        description: "An error occurred while saving Form Twelve",
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
    navigate(`/process/${processId}/form-thirteen`); // Assuming Form Thirteen follows
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
    navigate(`/process/${processId}/form-eleven`);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center px-4 py-6">
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white w-full max-w-4xl p-8 rounded-lg shadow"
      >
        <h1 className="text-2xl font-bold mb-6 text-center">Form Twelve: Ventilation</h1>

        {/* Section: Ventilation & Cooling Photos */}
        <div className="mb-6">
          <Label>Ventilation & Cooling Photos?</Label>
          <div className="flex gap-4 mt-2">
            <label>
              <input
                type="radio"
                name="hasVentilationCoolingPhotos"
                value="yes"
                checked={formData.hasVentilationCoolingPhotos === "yes"}
                onChange={handleChange}
              />{" "}
              Yes
            </label>
            <label>
              <input
                type="radio"
                name="hasVentilationCoolingPhotos"
                value="no"
                checked={formData.hasVentilationCoolingPhotos === "no"}
                onChange={handleChange}
              />{" "}
              No
            </label>
          </div>
        </div>

        {/* Section: Upload Ventilation & Cooling Photos */}
        {formData.hasVentilationCoolingPhotos === "yes" && (
          <div className="mb-6">
            <Label>Ventilation & Cooling Photos</Label>
            <div className="flex flex-col gap-2 mt-2">
              <Button onClick={() => document.getElementById("ventilationCoolingInput").click()}>
                Choose Photos
              </Button>
              <input
                id="ventilationCoolingInput"
                type="file"
                accept="image/*"
                multiple
                name="ventilationCoolingPhotos"
                onChange={handleVentilationCoolingFileChange}
                className="hidden"
              />
            </div>
            {ventilationCoolingPreviews.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {ventilationCoolingPreviews.map((preview, index) => (
                  <div key={index} className="relative">
                    <img
                      src={preview}
                      alt="Ventilation & Cooling Preview"
                      className="w-32 h-32 object-cover rounded"
                    />
                    <button
                      onClick={() => handleDeleteVentilationCoolingImage(index, preview)}
                      className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Section: Number of Open Fireplaces */}
        <div className="mb-6">
          <Label>No. of Open Fireplaces:</Label>
          <Input
            type="number"
            name="numberOfOpenFireplaces"
            value={formData.numberOfOpenFireplaces}
            onChange={handleChange}
            className="mt-1"
            step="any"
          />
        </div>

        {/* Section: Mechanical Ventilation */}
        <div className="mb-6">
          <Label>Mechanical Ventilation:</Label>
          <select
            name="mechanicalVentilation"
            value={formData.mechanicalVentilation}
            onChange={handleChange}
            className="w-full mt-1 border rounded px-2 py-2"
          >
            <option value="">- Select -</option>
            <option value="Supply Extract System">Supply Extract System</option>
            <option value="Fixed Space Cooling">Fixed Space Cooling</option>
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