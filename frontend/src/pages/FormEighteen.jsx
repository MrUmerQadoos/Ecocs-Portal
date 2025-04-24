import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/store/authStore";
import PhotoUploader from "@/components/ui/photo/PhotoUpload";

export default function FormEighteen() {
  const navigate = useNavigate();
  const { processId: urlProcessId } = useParams(); // e.g., /process/:processId/form-eighteen
  const location = useLocation();
  const { toast } = useToast();
  const { user } = useAuthStore();

  // State for form data and metadata
  const [formData, setFormData] = useState({
    hasNewTechPhotos: "", // "yes" or "no" (input_radio_43)
    photovoltaicPanel: "", // "None", "Panel Details", "% of roof area" (dropdown_54)
    pvPanels: [
      { pvCellsKwPeak: "", orientation: "", elevation: "", overshading: "", connected: "" },
      { pvCellsKwPeak: "", orientation: "", elevation: "", overshading: "", connected: "" },
      { pvCellsKwPeak: "", orientation: "", elevation: "", overshading: "", connected: "" },
    ], // Array for three sets of PV panel details
    proportionOfRoofArea: "", // numeric_field_28
    connectedToDwellingMeter: "", // "yes" or "no" (input_radio_16)
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

  // Image Handling (for New Technologies photos if present)
  const [newTechPhotos, setNewTechPhotos] = useState([]);
  const [newTechPreviews, setNewTechPreviews] = useState([]);
  const [newTechDeleted, setNewTechDeleted] = useState([]);

  // Determine mode (edit or view) and load existing data
  useEffect(() => {
    const isViewing = location.pathname.includes("/view-form");
    setIsViewOnly(isViewing || user.role !== "surveyor");
    const queryTaskId = new URLSearchParams(location.search).get("taskId");
    setTaskId(queryTaskId);

    if (urlProcessId && urlProcessId !== "new") {
      setLoading(true);
      fetch(`http://localhost:3000/api/assessments/form-eighteen?processId=${urlProcessId}`, {
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

            // Set New Tech photos preview if available
            if (existingForm.newTechPhotos && existingForm.newTechPhotos.length > 0) {
              const previews = existingForm.newTechPhotos.map(
                (img) => `http://localhost:3000/${img}`
              );
              setNewTechPreviews(previews);
            }
          } else if (isViewing) {
            toast({
              variant: "destructive",
              title: "Error",
              description: "Form Eighteen data not found.",
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
            description: "Error fetching Form Eighteen data.",
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
    setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
  };

  // Handle PV panel field changes
  const handlePvPanelChange = (index, field, value) => {
    setFormData((prev) => {
      const updatedPvPanels = [...prev.pvPanels];
      updatedPvPanels[index] = { ...updatedPvPanels[index], [field]: value };
      return { ...prev, pvPanels: updatedPvPanels };
    });
    setUnsavedChanges(true);
    setErrors((prev) => ({ ...prev, [`pvPanels.${index}.${field}`]: "" }));
  };

  // Handle New Tech photo file change
  const handleNewTechFileChange = (e) => {
    if (isViewOnly) return;
    const selectedFiles = Array.from(e.target.files);
    setNewTechPhotos((prev) => [...prev, ...selectedFiles]);
    const previewUrls = selectedFiles.map((file) => URL.createObjectURL(file));
    setNewTechPreviews((prev) => [...prev, ...previewUrls]);
    setUnsavedChanges(true);
  };

  // Delete New Tech photo
  const handleDeleteNewTechImage = (index, previewUrl) => {
    if (isViewOnly) return;
    const updatedPreviews = newTechPreviews.filter((_, idx) => idx !== index);
    setNewTechPreviews(updatedPreviews);

    const isNewUpload = previewUrl.startsWith("blob:");
    if (isNewUpload) {
      const updatedFiles = newTechPhotos.filter(
        (_, idx) => idx !== index - (newTechPreviews.length - newTechPhotos.length)
      );
      setNewTechPhotos(updatedFiles);
    } else {
      setNewTechDeleted((prev) => [...prev, previewUrl]);
    }

    setUnsavedChanges(true);
  };

  // Form validation
  const validateForm = () => {
    const newErrors = {};

    if (!formData.hasNewTechPhotos) {
      newErrors.hasNewTechPhotos = "New technologies photos selection is required.";
    }
    if (!formData.photovoltaicPanel) {
      newErrors.photovoltaicPanel = "Photovoltaic panel selection is required.";
    }
    if (formData.photovoltaicPanel === "Panel Details") {
      formData.pvPanels.forEach((panel, index) => {
        if (panel.pvCellsKwPeak || panel.orientation || panel.elevation || panel.overshading || panel.connected) {
          if (!panel.pvCellsKwPeak) newErrors[`pvPanels.${index}.pvCellsKwPeak`] = "PV Cells kW Peak is required.";
          if (!panel.orientation) newErrors[`pvPanels.${index}.orientation`] = "Orientation is required.";
          if (!panel.elevation) newErrors[`pvPanels.${index}.elevation`] = "Elevation is required.";
          if (!panel.overshading) newErrors[`pvPanels.${index}.overshading`] = "Overshading is required.";
          if (!panel.connected) newErrors[`pvPanels.${index}.connected`] = "Connected is required.";
        }
      });
    }
    if (formData.photovoltaicPanel === "% of roof area" && !formData.proportionOfRoofArea) {
      newErrors.proportionOfRoofArea = "Proportion of roof area is required.";
    }
    if (!formData.connectedToDwellingMeter) {
      newErrors.connectedToDwellingMeter = "Connected to dwelling’s electricity meter selection is required.";
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
        if (key === "pvPanels") {
          formDataToSend.append("pvPanels", JSON.stringify(formData.pvPanels));
        } else if (key !== "newTechPhotos") {
          formDataToSend.append(key, formData[key]);
        }
      }

      // Append new files
      if (newTechPhotos.length > 0) {
        newTechPhotos.forEach((file) => {
          formDataToSend.append("newTechPhotos", file);
        });
      }

      // Append deleted images
      if (newTechDeleted.length > 0) {
        formDataToSend.append("deletedNewTechPhotos", JSON.stringify(newTechDeleted));
      }

      const url = docId
        ? `http://localhost:3000/api/assessments/form-eighteen/${docId}`
        : "http://localhost:3000/api/assessments/form-eighteen";
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
        setNewTechPhotos([]);
        setNewTechDeleted([]);
        setNewTechPreviews(
          data.data.newTechPhotos?.map((photo) => `http://localhost:3000/${photo}`) || []
        );
        toast({
          title: "Success",
          description: `Form Eighteen ${docId ? "updated" : "saved"} successfully!`,
        });
        return { success: true, processId: data.data.processId };
      } else {
        throw new Error(data.error || "Failed to save Form Eighteen");
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
        navigate(`/view-form/${result.processId}/form-eighteen?taskId=${taskId}`);
      } else {
        navigate(`/process/${result.processId}/form-eighteen?taskId=${taskId}`, { replace: true });
      }
    }
  };

  // Handle navigation to the next form
  const handleNext = async () => {
    if (!isViewOnly) {
      const result = await saveForm();
      if (result.success) {
        if (user.role === "surveyor") {
          navigate(`/process/${result.processId}/form-nineteen?taskId=${taskId}`);
        } else {
          navigate(`/view-form/${result.processId}/form-nineteen?taskId=${taskId}`);
        }
      }
    } else {
      navigate(`/view-form/${savedProcessId || urlProcessId}/form-nineteen?taskId=${taskId}`);
    }
  };

  // Handle navigation to the previous form
  const handlePrevious = async () => {
    if (!isViewOnly) {
      const result = await saveForm();
      if (result.success) {
        if (user.role === "surveyor") {
          navigate(`/process/${result.processId}/form-seventeen?taskId=${taskId}`);
        } else {
          navigate(`/view-form/${result.processId}/form-seventeen?taskId=${taskId}`);
        }
      }
    } else {
      navigate(`/view-form/${savedProcessId || urlProcessId}/form-seventeen?taskId=${taskId}`);
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
            {isViewOnly ? "View Form Eighteen" : "18. New Technologies"}
          </h1>

          {/* Section: New Technologies Photos */}
          <div className="mb-6">
            <Label>New Technologies Photos?</Label>
            <div className="flex gap-4 mt-2">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="hasNewTechPhotos"
                  value="yes"
                  checked={formData.hasNewTechPhotos === "yes"}
                  onChange={handleChange}
                  disabled={isViewOnly}
                  className="form-radio"
                />
                <span>Yes</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="hasNewTechPhotos"
                  value="no"
                  checked={formData.hasNewTechPhotos === "no"}
                  onChange={handleChange}
                  disabled={isViewOnly}
                  className="form-radio"
                />
                <span>No</span>
              </label>
            </div>
            {errors.hasNewTechPhotos && (
              <p className="text-red-500 text-sm mt-1">{errors.hasNewTechPhotos}</p>
            )}
          </div>

          {/* Section: Upload New Tech Photos (if yes) */}
          {formData.hasNewTechPhotos === "yes" && (
            <div className="mb-6">
              <PhotoUploader
                label="Upload New Technologies Photos"
                inputName="newTechPhotos"
                onFileChange={handleNewTechFileChange}
                imagePreviews={newTechPreviews}
                onDeleteImage={handleDeleteNewTechImage}
                isViewOnly={isViewOnly}
              />
            </div>
          )}

          {/* Section: Photovoltaic Panel */}
          <div className="mb-6">
            <Label>Photovoltaic Panel:</Label>
            <select
              name="photovoltaicPanel"
              value={formData.photovoltaicPanel}
              onChange={handleChange}
              className={`w-full mt-1 border rounded px-2 py-2 ${errors.photovoltaicPanel ? "border-red-500" : ""}`}
              disabled={isViewOnly}
            >
              <option value="">- Select -</option>
              <option value="None">None</option>
              <option value="Panel Details">Panel Details</option>
              <option value="% of roof area">% of roof area</option>
            </select>
            {errors.photovoltaicPanel && (
              <p className="text-red-500 text-sm mt-1">{errors.photovoltaicPanel}</p>
            )}
          </div>

          {/* Section: PV Panel Details (if Panel Details selected) */}
          {formData.photovoltaicPanel === "Panel Details" && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4">PV Panel Details</h3>
              {formData.pvPanels.map((panel, index) => (
                <div key={index} className="mb-4 border p-4 rounded">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div>
                      <Label>PV Cells kW Peak:</Label>
                      <input
                        type="text"
                        value={panel.pvCellsKwPeak}
                        onChange={(e) => handlePvPanelChange(index, "pvCellsKwPeak", e.target.value)}
                        className={`w-full mt-1 border rounded px-2 py-2 ${errors[`pvPanels.${index}.pvCellsKwPeak`] ? "border-red-500" : ""}`}
                        disabled={isViewOnly}
                      />
                      {errors[`pvPanels.${index}.pvCellsKwPeak`] && (
                        <p className="text-red-500 text-sm mt-1">{errors[`pvPanels.${index}.pvCellsKwPeak`]}</p>
                      )}
                    </div>
                    <div>
                      <Label>Orientation:</Label>
                      <input
                        type="text"
                        value={panel.orientation}
                        onChange={(e) => handlePvPanelChange(index, "orientation", e.target.value)}
                        className={`w-full mt-1 border rounded px-2 py-2 ${errors[`pvPanels.${index}.orientation`] ? "border-red-500" : ""}`}
                        disabled={isViewOnly}
                      />
                      {errors[`pvPanels.${index}.orientation`] && (
                        <p className="text-red-500 text-sm mt-1">{errors[`pvPanels.${index}.orientation`]}</p>
                      )}
                    </div>
                    <div>
                      <Label>Elevation:</Label>
                      <input
                        type="text"
                        value={panel.elevation}
                        onChange={(e) => handlePvPanelChange(index, "elevation", e.target.value)}
                        className={`w-full mt-1 border rounded px-2 py-2 ${errors[`pvPanels.${index}.elevation`] ? "border-red-500" : ""}`}
                        disabled={isViewOnly}
                      />
                      {errors[`pvPanels.${index}.elevation`] && (
                        <p className="text-red-500 text-sm mt-1">{errors[`pvPanels.${index}.elevation`]}</p>
                      )}
                    </div>
                    <div>
                      <Label>Overshading:</Label>
                      <input
                        type="text"
                        value={panel.overshading}
                        onChange={(e) => handlePvPanelChange(index, "overshading", e.target.value)}
                        className={`w-full mt-1 border rounded px-2 py-2 ${errors[`pvPanels.${index}.overshading`] ? "border-red-500" : ""}`}
                        disabled={isViewOnly}
                      />
                      {errors[`pvPanels.${index}.overshading`] && (
                        <p className="text-red-500 text-sm mt-1">{errors[`pvPanels.${index}.overshading`]}</p>
                      )}
                    </div>
                    <div>
                      <Label>Connected:</Label>
                      <input
                        type="text"
                        value={panel.connected}
                        onChange={(e) => handlePvPanelChange(index, "connected", e.target.value)}
                        className={`w-full mt-1 border rounded px-2 py-2 ${errors[`pvPanels.${index}.connected`] ? "border-red-500" : ""}`}
                        disabled={isViewOnly}
                      />
                      {errors[`pvPanels.${index}.connected`] && (
                        <p className="text-red-500 text-sm mt-1">{errors[`pvPanels.${index}.connected`]}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Section: Proportion of Roof Area (if % of roof area selected) */}
          {formData.photovoltaicPanel === "% of roof area" && (
            <div className="mb-6">
              <Label>Proportion of Roof Area:</Label>
              <input
                type="number"
                name="proportionOfRoofArea"
                value={formData.proportionOfRoofArea}
                onChange={handleChange}
                className={`w-full mt-1 border rounded px-2 py-2 ${errors.proportionOfRoofArea ? "border-red-500" : ""}`}
                disabled={isViewOnly}
                placeholder="%"
                step="any"
              />
              {errors.proportionOfRoofArea && (
                <p className="text-red-500 text-sm mt-1">{errors.proportionOfRoofArea}</p>
              )}
            </div>
          )}

          {/* Section: Connected to Dwelling’s Electricity Meter */}
          <div className="mb-6">
            <Label>Connected to Dwelling’s Electricity Meter:</Label>
            <div className="flex gap-4 mt-2">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="connectedToDwellingMeter"
                  value="yes"
                  checked={formData.connectedToDwellingMeter === "yes"}
                  onChange={handleChange}
                  disabled={isViewOnly}
                  className="form-radio"
                />
                <span>Yes</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="connectedToDwellingMeter"
                  value="no"
                  checked={formData.connectedToDwellingMeter === "no"}
                  onChange={handleChange}
                  disabled={isViewOnly}
                  className="form-radio"
                />
                <span>No</span>
              </label>
            </div>
            {errors.connectedToDwellingMeter && (
              <p className="text-red-500 text-sm mt-1">{errors.connectedToDwellingMeter}</p>
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