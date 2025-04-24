import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/store/authStore";
import PhotoUploader from "@/components/ui/photo/PhotoUpload";

export default function FormFifteen() {
  const navigate = useNavigate();
  const { processId: urlProcessId } = useParams(); // e.g., /process/:processId/form-fifteen
  const location = useLocation();
  const { toast } = useToast();
  const { user } = useAuthStore();

  // State for form data and metadata
  const [formData, setFormData] = useState({
    hasSolarWaterHeating: "", // "yes" or "no"
    areDetailsKnown: "", // "yes" or "no"
    collectorElevation: "", // "Horizontal", "30°", etc.
    overshading: "", // "Heavy", "Significant", etc.
    solarPump: "", // "Unknown", "Electrically powered", etc.
    solarCollectorDetailsKnown: "", // "yes" or "no"
    userId: user?._id || "",
    processId: urlProcessId || "",
  });

  const [docId, setDocId] = useState(null);
  const [taskId, setTaskId] = useState(null);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [isUpdate, setIsUpdate] = useState(false);
  const [isViewOnly, setIsViewOnly] = useState(false);
  const [savedProcessId, setSavedProcessId] = useState(null);
  const [loading, setLoading] = useState(false); // Loading state for API calls
  const [errors, setErrors] = useState({}); // Form validation errors

  // Image Handling (optional, remove if not needed)
  const [solarPhotos, setSolarPhotos] = useState([]);
  const [solarPreviews, setSolarPreviews] = useState([]);
  const [solarDeleted, setSolarDeleted] = useState([]);

  // Determine mode (edit or view) and load existing data
  useEffect(() => {
    const isViewing = location.pathname.includes("/view-form");
    setIsViewOnly(isViewing || user.role !== "surveyor");
    const queryTaskId = new URLSearchParams(location.search).get("taskId");
    setTaskId(queryTaskId);

    if (urlProcessId && urlProcessId !== "new") {
      setLoading(true);
      fetch(`http://localhost:3000/api/assessments/form-fifteen?processId=${urlProcessId}`, {
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

            // Set solar photos preview if available (optional)
            if (existingForm.solarPhotos && existingForm.solarPhotos.length > 0) {
              const previews = existingForm.solarPhotos.map(
                (img) => `http://localhost:3000/${img}`
              );
              setSolarPreviews(previews);
            }
          } else if (isViewing) {
            toast({
              variant: "destructive",
              title: "Error",
              description: "Form Fifteen data not found.",
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
            description: "Error fetching Form Fifteen data.",
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
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
      userId: user ? user._id : "",
      processId: urlProcessId,
    }));
    setUnsavedChanges(true);
    // Clear validation error for the field
    setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
  };

  // Handle solar photo file change (optional)
  const handleSolarFileChange = (e) => {
    if (isViewOnly) return;
    const selectedFiles = Array.from(e.target.files);
    setSolarPhotos((prev) => [...prev, ...selectedFiles]);
    const previewUrls = selectedFiles.map((file) => URL.createObjectURL(file));
    setSolarPreviews((prev) => [...prev, ...previewUrls]);
    setUnsavedChanges(true);
  };

  // Delete solar photo (optional)
  const handleDeleteSolarImage = (index, previewUrl) => {
    if (isViewOnly) return;
    const updatedPreviews = solarPreviews.filter((_, idx) => idx !== index);
    setSolarPreviews(updatedPreviews);

    const isNewUpload = previewUrl.startsWith("blob:");
    if (isNewUpload) {
      const updatedFiles = solarPhotos.filter(
        (_, idx) => idx !== index - (solarPreviews.length - solarPhotos.length)
      );
      setSolarPhotos(updatedFiles);
    } else {
      setSolarDeleted((prev) => [...prev, previewUrl]);
    }

    setUnsavedChanges(true);
  };

  // Form validation
  const validateForm = () => {
    const newErrors = {};

    if (!formData.hasSolarWaterHeating) {
      newErrors.hasSolarWaterHeating = "Solar water heating selection is required.";
    }
    if (!formData.areDetailsKnown) {
      newErrors.areDetailsKnown = "Details known selection is required.";
    }
    if (!formData.collectorElevation) {
      newErrors.collectorElevation = "Collector elevation is required.";
    }
    if (!formData.overshading) {
      newErrors.overshading = "Overshading selection is required.";
    }
    if (!formData.solarPump) {
      newErrors.solarPump = "Solar pump selection is required.";
    }
    if (!formData.solarCollectorDetailsKnown) {
      newErrors.solarCollectorDetailsKnown = "Solar collector details known selection is required.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Save or update the form
  const saveForm = async () => {
    if (isViewOnly) return { success: false };

    // Validate form before saving
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
      for (const key in formData) {
        if (key !== "solarPhotos") {
          formDataToSend.append(key, formData[key]);
        }
      }

      // Append new files (optional)
      if (solarPhotos.length > 0) {
        solarPhotos.forEach((file) => {
          formDataToSend.append("solarPhotos", file);
        });
      }

      // Append deleted images (optional)
      if (solarDeleted.length > 0) {
        formDataToSend.append("deletedSolarPhotos", JSON.stringify(solarDeleted));
      }

      const url = docId
        ? `http://localhost:3000/api/assessments/form-fifteen/${docId}`
        : "http://localhost:3000/api/assessments/form-fifteen";
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
        setSolarPhotos([]);
        setSolarDeleted([]);
        setSolarPreviews(
          data.data.solarPhotos?.map((photo) => `http://localhost:3000/${photo}`) || []
        );
        toast({
          title: "Success",
          description: `Form Fifteen ${docId ? "updated" : "saved"} successfully!`,
        });
        return { success: true, processId: data.data.processId };
      } else {
        throw new Error(data.error || "Failed to save Form Fifteen");
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
        navigate(`/view-form/${result.processId}/form-fifteen?taskId=${taskId}`);
      } else {
        navigate(`/process/${result.processId}/form-fifteen?taskId=${taskId}`, { replace: true });
      }
    }
  };

  // Handle navigation to the next form
  const handleNext = async () => {
    if (!isViewOnly) {
      const result = await saveForm();
      if (result.success) {
        if (user.role === "surveyor") {
          navigate(`/process/${result.processId}/form-sixteen?taskId=${taskId}`);
        } else {
          navigate(`/view-form/${result.processId}/form-sixteen?taskId=${taskId}`);
        }
      }
    } else {
      navigate(`/view-form/${savedProcessId || urlProcessId}/form-sixteen?taskId=${taskId}`);
    }
  };

  // Handle navigation to the previous form
  const handlePrevious = async () => {
    if (!isViewOnly) {
      const result = await saveForm();
      if (result.success) {
        if (user.role === "surveyor") {
          navigate(`/process/${result.processId}/form-fourteen?taskId=${taskId}`);
        } else {
          navigate(`/view-form/${result.processId}/form-fourteen?taskId=${taskId}`);
        }
      }
    } else {
      navigate(`/view-form/${savedProcessId || urlProcessId}/form-fourteen?taskId=${taskId}`);
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
          className="bg-white w-full max-w-4xl p-8 rounded-lg shadow"
        >
          <h1 className="text-2xl font-bold mb-6 text-center">
            {isViewOnly ? "View Form Fifteen" : "15. Solar Water Heating"}
          </h1>

          {/* Section: Has Solar Water Heating */}
          <div className="mb-6">
            <Label>Solar Water Heating:</Label>
            <div className="flex gap-4 mt-2">
              <label>
                <input
                  type="radio"
                  name="hasSolarWaterHeating"
                  value="yes"
                  checked={formData.hasSolarWaterHeating === "yes"}
                  onChange={handleChange}
                  disabled={isViewOnly}
                />{" "}
                Yes
              </label>
              <label>
                <input
                  type="radio"
                  name="hasSolarWaterHeating"
                  value="no"
                  checked={formData.hasSolarWaterHeating === "no"}
                  onChange={handleChange}
                  disabled={isViewOnly}
                />{" "}
                No
              </label>
            </div>
            {errors.hasSolarWaterHeating && (
              <p className="text-red-500 text-sm mt-1">{errors.hasSolarWaterHeating}</p>
            )}
          </div>

          {/* Section: Upload Solar Photos (optional) */}
          {formData.hasSolarWaterHeating === "yes" && (
            <div className="mb-6">
              <PhotoUploader
                label="Upload Solar Water Heating Photos"
                inputName="solarPhotos"
                onFileChange={handleSolarFileChange}
                imagePreviews={solarPreviews}
                onDeleteImage={handleDeleteSolarImage}
                isViewOnly={isViewOnly}
              />
            </div>
          )}

          {/* Section: Are Details Known */}
          <div className="mb-6">
            <Label>Are Details Known:</Label>
            <div className="flex gap-4 mt-2">
              <label>
                <input
                  type="radio"
                  name="areDetailsKnown"
                  value="yes"
                  checked={formData.areDetailsKnown === "yes"}
                  onChange={handleChange}
                  disabled={isViewOnly}
                />{" "}
                Yes
              </label>
              <label>
                <input
                  type="radio"
                  name="areDetailsKnown"
                  value="no"
                  checked={formData.areDetailsKnown === "no"}
                  onChange={handleChange}
                  disabled={isViewOnly}
                />{" "}
                No
              </label>
            </div>
            {errors.areDetailsKnown && (
              <p className="text-red-500 text-sm mt-1">{errors.areDetailsKnown}</p>
            )}
          </div>

          {/* Section: Collector Elevation */}
          <div className="mb-6">
            <Label>Collector Elevation:</Label>
            <select
              name="collectorElevation"
              value={formData.collectorElevation}
              onChange={handleChange}
              className={`w-full mt-1 border rounded px-2 py-2 ${errors.collectorElevation ? "border-red-500" : ""}`}
              disabled={isViewOnly}
            >
              <option value="">- Select -</option>
              <option value="Horizontal">Horizontal</option>
              <option value="30°">30°</option>
              <option value="45°">45°</option>
              <option value="60°">60°</option>
              <option value="Vertical">Vertical</option>
            </select>
            {errors.collectorElevation && (
              <p className="text-red-500 text-sm mt-1">{errors.collectorElevation}</p>
            )}
          </div>

          {/* Section: Overshading */}
          <div className="mb-6">
            <Label>Overshading:</Label>
            <select
              name="overshading"
              value={formData.overshading}
              onChange={handleChange}
              className={`w-full mt-1 border rounded px-2 py-2 ${errors.overshading ? "border-red-500" : ""}`}
              disabled={isViewOnly}
            >
              <option value="">- Select -</option>
              <option value="Heavy">Heavy</option>
              <option value="Significant">Significant</option>
              <option value="Modest">Modest</option>
              <option value="None or Little">None or Little</option>
            </select>
            {errors.overshading && (
              <p className="text-red-500 text-sm mt-1">{errors.overshading}</p>
            )}
          </div>

          {/* Section: Solar Pump */}
          <div className="mb-6">
            <Label>Solar Pump:</Label>
            <select
              name="solarPump"
              value={formData.solarPump}
              onChange={handleChange}
              className={`w-full mt-1 border rounded px-2 py-2 ${errors.solarPump ? "border-red-500" : ""}`}
              disabled={isViewOnly}
            >
              <option value="">- Select -</option>
              <option value="Unknown">Unknown</option>
              <option value="Electrically powered">Electrically powered</option>
              <option value="PV powered">PV powered</option>
            </select>
            {errors.solarPump && (
              <p className="text-red-500 text-sm mt-1">{errors.solarPump}</p>
            )}
          </div>

          {/* Section: Solar Collector Details Known */}
          <div className="mb-6">
            <Label>Solar Collector Details Known:</Label>
            <div className="flex items-center gap-2">
              <div className="flex gap-4 mt-2">
                <label>
                  <input
                    type="radio"
                    name="solarCollectorDetailsKnown"
                    value="yes"
                    checked={formData.solarCollectorDetailsKnown === "yes"}
                    onChange={handleChange}
                    disabled={isViewOnly}
                  />{" "}
                  Yes
                </label>
                <label>
                  <input
                    type="radio"
                    name="solarCollectorDetailsKnown"
                    value="no"
                    checked={formData.solarCollectorDetailsKnown === "no"}
                    onChange={handleChange}
                    disabled={isViewOnly}
                  />{" "}
                  No
                </label>
              </div>
              <div className="relative group">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 25 25"
                  className="text-gray-500 cursor-pointer"
                >
                  <path
                    d="m329 393l0-46c0-2-1-4-2-6-2-2-4-3-7-3l-27 0 0-146c0-3-1-5-3-7-2-1-4-2-7-2l-91 0c-3 0-5 1-7 2-1 2-2 4-2 7l0 46c0 2 1 5 2 6 2 2 4 3 7 3l27 0 0 91-27 0c-3 0-5 1-7 3-1 2-2 4-2 6l0 46c0 3 1 5 2 7 2 1 4 2 7 2l128 0c3 0 5-1 7-2 1-2 2-4 2-7z m-36-256l0-46c0-2-1-4-3-6-2-2-4-3-7-3l-54 0c-3 0-5 1-7 3-2 2-3 4-3 6l0 46c0 3 1 5 3 7 2 1 4 2 7 2l54 0c3 0 5-1 7-2 2-2 3-4 3-7z m182 119c0 40-9 77-29 110-20 34-46 60-80 80-33 20-70 29-110 29-40 0-77-9-110-29-34-20-60-46-80-80-20-33-29-70-29-110 0-40 9-77 29-110 20-34 46-60 80-80 33-20 70-29 110-29 40 0 77 9 110 29 34 20 60 46 80 80 20 33 29 70 29 110z"
                    transform="scale(0.046875 0.046875)"
                  />
                </svg>
                <div className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 -top-10 left-0">
                  If known, please see page 7 for further details
                </div>
              </div>
            </div>
            {errors.solarCollectorDetailsKnown && (
              <p className="text-red-500 text-sm mt-1">{errors.solarCollectorDetailsKnown}</p>
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