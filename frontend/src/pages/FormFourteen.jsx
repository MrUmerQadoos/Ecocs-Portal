import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/store/authStore";
import PhotoUploader from "@/components/ui/photo/PhotoUpload";

export default function FormFourteen() {
  const navigate = useNavigate();
  const { processId: urlProcessId } = useParams(); // e.g., /process/:processId/form-fourteen
  const location = useLocation();
  const { toast } = useToast();
  const { user } = useAuthStore();

  // State for form data and metadata
  const [formData, setFormData] = useState({
    hasWaterHeatingPhotos: "",
    waterHeatingDescription: "",
    cylinderSize: "",
    insulated: "",
    insulationThickness: "",
    cylinderThermostat: "",
    immersionHeater: "",
    userId: user?._id || "",
    processId: urlProcessId || "",
  });

  const [docId, setDocId] = useState(null);
  const [taskId, setTaskId] = useState(null);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [isUpdate, setIsUpdate] = useState(false);
  const [isViewOnly, setIsViewOnly] = useState(false);
  const [savedProcessId, setSavedProcessId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Image Handling
  const [waterHeatingFiles, setWaterHeatingFiles] = useState([]);
  const [waterHeatingPreviews, setWaterHeatingPreviews] = useState([]);
  const [waterHeatingDeleted, setWaterHeatingDeleted] = useState([]);

  // Determine mode (edit or view) and load existing data
  useEffect(() => {
    const isViewing = location.pathname.includes("/view-form");
    setIsViewOnly(isViewing || user.role !== "surveyor");
    const queryTaskId = new URLSearchParams(location.search).get("taskId");
    setTaskId(queryTaskId);

    if (urlProcessId && urlProcessId !== "new") {
      setLoading(true);
      fetch(`http://localhost:3000/api/assessments/form-fourteen?processId=${urlProcessId}`, {
        method: "GET",
        credentials: "include",
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data && data.data.length > 0) {
            const existingForm = data.data[0];
            setFormData(existingForm);
            setDocId(existingForm._id);
            setIsUpdate(true);
            setSavedProcessId(existingForm.processId);

            // Set Water Heating photos preview
            if (existingForm.waterHeatingPhotos && existingForm.waterHeatingPhotos.length > 0) {
              const previews = existingForm.waterHeatingPhotos.map(
                (img) => `http://localhost:3000/${img}`
              );
              setWaterHeatingPreviews(previews);
            }
          } else if (isViewing) {
            toast({
              variant: "destructive",
              title: "Error",
              description: "Form Fourteen data not found.",
            });
            navigate("/dashboard");
          } else {
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
            description: "Error fetching Form Fourteen data.",
          });
          navigate("/dashboard");
          console.error("Fetch error:", error);
        })
        .finally(() => setLoading(false));
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

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      userId: user ? user._id : "",
      processId: urlProcessId,
    }));
    setUnsavedChanges(true);
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  // Handle file changes
  const handleFileChange = (e) => {
    if (isViewOnly) return;
    const selectedFiles = Array.from(e.target.files);
    setWaterHeatingFiles((prev) => [...prev, ...selectedFiles]);
    const previewUrls = selectedFiles.map((file) => URL.createObjectURL(file));
    setWaterHeatingPreviews((prev) => [...prev, ...previewUrls]);
    setUnsavedChanges(true);
  };

  // Delete photo handler
  const handleDeleteImage = (index, previewUrl) => {
    if (isViewOnly) return;
    const updatedPreviews = waterHeatingPreviews.filter((_, idx) => idx !== index);
    setWaterHeatingPreviews(updatedPreviews);

    const isNewUpload = previewUrl.startsWith("blob:");
    if (isNewUpload) {
      const updatedFiles = waterHeatingFiles.filter(
        (_, idx) => idx !== index - (waterHeatingPreviews.length - waterHeatingFiles.length)
      );
      setWaterHeatingFiles(updatedFiles);
    } else {
      setWaterHeatingDeleted((prev) => [...prev, previewUrl]);
    }

    setUnsavedChanges(true);
  };

  // Form validation
  const validateForm = () => {
    const newErrors = {};

    if (!formData.hasWaterHeatingPhotos) {
      newErrors.hasWaterHeatingPhotos = "Please specify if water heating photos are available.";
    }
    if (!formData.waterHeatingDescription) {
      newErrors.waterHeatingDescription = "Water heating description is required.";
    }
    if (!formData.cylinderSize) {
      newErrors.cylinderSize = "Cylinder size is required.";
    }
    if (!formData.insulated) {
      newErrors.insulated = "Insulation status is required.";
    }
    if (!formData.insulationThickness) {
      newErrors.insulationThickness = "Insulation thickness is required.";
    }
    if (!formData.cylinderThermostat) {
      newErrors.cylinderThermostat = "Cylinder thermostat status is required.";
    }
    if (!formData.immersionHeater) {
      newErrors.immersionHeater = "Immersion heater type is required.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Save or update the form
  const saveForm = async () => {
    if (isViewOnly) return { success: false };

    if (!validateForm()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please fill in all required fields correctly.",
      });
      return { success: false };
    }

    setLoading(true);
    try {
      const formDataToSend = new FormData();

      // Append non-file fields
      Object.keys(formData).forEach((key) => {
        if (key !== "waterHeatingPhotos") {
          formDataToSend.append(key, formData[key]);
        }
      });

      // Append new files
      if (waterHeatingFiles.length > 0) {
        waterHeatingFiles.forEach((file) => {
          formDataToSend.append("waterHeatingPhotos", file);
        });
      }

      // Append deleted images
      if (waterHeatingDeleted.length > 0) {
        formDataToSend.append("deletedWaterHeatingPhotos", JSON.stringify(waterHeatingDeleted));
      }

      const url = docId
        ? `http://localhost:3000/api/assessments/form-fourteen/${docId}`
        : "http://localhost:3000/api/assessments/form-fourteen";
      const method = docId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        credentials: "include",
        body: formDataToSend,
      });
      const data = await response.json();

      if (data.success) {
        setDocId(data.data._id);
        setSavedProcessId(data.data.processId);
        setIsUpdate(true);
        setUnsavedChanges(false);
        setWaterHeatingFiles([]);
        setWaterHeatingDeleted([]);
        setWaterHeatingPreviews(
          data.data.waterHeatingPhotos.map((photo) => `http://localhost:3000/${photo}`)
        );
        toast({
          title: "Success",
          description: `Form Fourteen ${docId ? "updated" : "saved"} successfully!`,
        });
        return { success: true, processId: data.data.processId };
      } else {
        throw new Error(data.error || "Failed to save Form Fourteen");
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
      console.error("Save error:", error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Handle save button click
  const handleSave = async () => {
    const result = await saveForm();
    if (result.success) {
      if (user.role !== "surveyor") {
        navigate(`/view-form/${result.processId}/form-fourteen?taskId=${taskId}`);
      } else {
        navigate(`/process/${result.processId}/form-fourteen?taskId=${taskId}`, { replace: true });
      }
    }
  };

  // Handle navigation to the next form (assuming Form Fifteen follows)
  const handleNext = async () => {
    if (!isViewOnly) {
      const result = await saveForm();
      if (result.success) {
        if (user.role === "surveyor") {
          navigate(`/process/${result.processId}/form-fifteen?taskId=${taskId}`);
        } else {
          navigate(`/view-form/${result.processId}/form-fifteen?taskId=${taskId}`);
        }
      }
    } else {
      navigate(`/view-form/${savedProcessId || urlProcessId}/form-fifteen?taskId=${taskId}`);
    }
  };

  // Handle navigation to the previous form (Form Thirteen)
  const handlePrevious = async () => {
    if (!isViewOnly) {
      const result = await saveForm();
      if (result.success) {
        if (user.role === "surveyor") {
          navigate(`/process/${result.processId}/form-thirteen?taskId=${taskId}`);
        } else {
          navigate(`/view-form/${result.processId}/form-thirteen?taskId=${taskId}`);
        }
      }
    } else {
      navigate(`/view-form/${savedProcessId || urlProcessId}/form-thirteen?taskId=${taskId}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center px-4 py-6">
      {loading ? (
        <div className="text-center">
          <p>Loading...</p>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white w-full max-w-2xl p-8 rounded-lg shadow"
        >
          <h1 className="text-2xl font-bold mb-6 text-center">
            {isViewOnly ? "View Form Fourteen" : "14. Water Heating"}
          </h1>

          {/* Water Heating Photos? */}
          <div className="mb-6">
            <Label>Water Heating Photos Available?</Label>
            <div className="flex gap-4 mt-2">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="hasWaterHeatingPhotos"
                  value="yes"
                  checked={formData.hasWaterHeatingPhotos === "yes"}
                  onChange={handleChange}
                  disabled={isViewOnly}
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
                  disabled={isViewOnly}
                  className="form-radio"
                />
                <span>No</span>
              </label>
            </div>
            {errors.hasWaterHeatingPhotos && (
              <p className="text-red-500 text-sm mt-1">{errors.hasWaterHeatingPhotos}</p>
            )}
          </div>

          {/* Water Heating Photos */}
          {formData.hasWaterHeatingPhotos === "yes" && (
            <div className="mb-6">
              <PhotoUploader
                label="Water Heating Photos (Recommended)"
                inputName="waterHeatingPhotos"
                onFileChange={handleFileChange}
                imagePreviews={waterHeatingPreviews}
                onDeleteImage={handleDeleteImage}
                isViewOnly={isViewOnly}
              />
            </div>
          )}

          {/* Water Heating Description */}
          <div className="mb-6">
            <Label>Water Heating Description:</Label>
            <textarea
              name="waterHeatingDescription"
              value={formData.waterHeatingDescription}
              onChange={handleChange}
              className={`w-full mt-1 border rounded px-2 py-2 ${errors.waterHeatingDescription ? "border-red-500" : ""}`}
              rows="3"
              disabled={isViewOnly}
            />
            {errors.waterHeatingDescription && (
              <p className="text-red-500 text-sm mt-1">{errors.waterHeatingDescription}</p>
            )}
          </div>

          {/* Cylinder Size */}
          <div className="mb-6">
            <Label>Cylinder Size:</Label>
            <select
              name="cylinderSize"
              value={formData.cylinderSize}
              onChange={handleChange}
              className={`w-full mt-1 border rounded px-2 py-2 ${errors.cylinderSize ? "border-red-500" : ""}`}
              disabled={isViewOnly}
            >
              <option value="">- Select -</option>
              <option value="No Access">No Access</option>
              <option value="Normal">Normal</option>
              <option value="Medium">Medium</option>
              <option value="Large">Large</option>
            </select>
            {errors.cylinderSize && (
              <p className="text-red-500 text-sm mt-1">{errors.cylinderSize}</p>
            )}
          </div>

          {/* Insulated */}
          <div className="mb-6">
            <Label>Insulated:</Label>
            <select
              name="insulated"
              value={formData.insulated}
              onChange={handleChange}
              className={`w-full mt-1 border rounded px-2 py-2 ${errors.insulated ? "border-red-500" : ""}`}
              disabled={isViewOnly}
            >
              <option value="">- Select -</option>
              <option value="No insulation">No insulation</option>
              <option value="Jacket">Jacket</option>
              <option value="Foam">Foam</option>
            </select>
            {errors.insulated && (
              <p className="text-red-500 text-sm mt-1">{errors.insulated}</p>
            )}
          </div>

          {/* Insulation Thickness */}
          <div className="mb-6">
            <Label>Insulation Thickness:</Label>
            <select
              name="insulationThickness"
              value={formData.insulationThickness}
              onChange={handleChange}
              className={`w-full mt-1 border rounded px-2 py-2 ${errors.insulationThickness ? "border-red-500" : ""}`}
              disabled={isViewOnly}
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
            {errors.insulationThickness && (
              <p className="text-red-500 text-sm mt-1">{errors.insulationThickness}</p>
            )}
          </div>

          {/* Cylinder Thermostat */}
          <div className="mb-6">
            <Label>Cylinder Thermostat:</Label>
            <div className="flex gap-4 mt-2">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="cylinderThermostat"
                  value="yes"
                  checked={formData.cylinderThermostat === "yes"}
                  onChange={handleChange}
                  disabled={isViewOnly}
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
                  disabled={isViewOnly}
                  className="form-radio"
                />
                <span>No</span>
              </label>
            </div>
            {errors.cylinderThermostat && (
              <p className="text-red-500 text-sm mt-1">{errors.cylinderThermostat}</p>
            )}
          </div>

          {/* Immersion Heater */}
          <div className="mb-6">
            <Label>Immersion Heater:</Label>
            <select
              name="immersionHeater"
              value={formData.immersionHeater}
              onChange={handleChange}
              className={`w-full mt-1 border rounded px-2 py-2 ${errors.immersionHeater ? "border-red-500" : ""}`}
              disabled={isViewOnly}
            >
              <option value="">- Select -</option>
              <option value="Single">Single</option>
              <option value="Dual">Dual</option>
            </select>
            {errors.immersionHeater && (
              <p className="text-red-500 text-sm mt-1">{errors.immersionHeater}</p>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-6 space-x-2">
            <Button variant="outline" onClick={handlePrevious} disabled={loading}>
              Previous
            </Button>
            {isViewOnly ? (
              <>
                <Button variant="outline" onClick={() => navigate("/dashboard")} disabled={loading}>
                  Back to Dashboard
                </Button>
                <Button variant="secondary" onClick={handleNext} disabled={loading}>
                  Next
                </Button>
              </>
            ) : (
              <>
                <Button onClick={handleSave} disabled={loading}>
                  {loading ? "Saving..." : isUpdate ? "Update" : "Save"}
                </Button>
                <Button variant="secondary" onClick={handleNext} disabled={loading}>
                  Next
                </Button>
              </>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}