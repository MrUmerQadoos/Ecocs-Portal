import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/store/authStore";
import PhotoUploader from "@/components/ui/photo/PhotoUpload";

export default function FormNineteen() {
  const navigate = useNavigate();
  const { processId: urlProcessId } = useParams(); // e.g., /process/:processId/form-nineteen
  const location = useLocation();
  const { toast } = useToast();
  const { user } = useAuthStore();

  // State for form data and metadata
  const [formData, setFormData] = useState({
    terrainType: "", // "Urban...", "Suburban", "Rural"
    windTurbinePresent: "", // "yes" or "no"
    windTurbineDetailsKnown: "", // "yes" or "no"
    numberOfTurbines: "", // numeric
    rotorDiameter: "", // numeric (meters)
    heightAboveRidge: "", // numeric (meters)
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

  // Image Handling for "Other details" (file-upload_21)
  const [otherDetailsFiles, setOtherDetailsFiles] = useState([]);
  const [otherDetailsPreviews, setOtherDetailsPreviews] = useState([]);
  const [otherDetailsDeleted, setOtherDetailsDeleted] = useState([]);

  // Determine mode (edit or view) and load existing data
  useEffect(() => {
    const isViewing = location.pathname.includes("/view-form");
    setIsViewOnly(isViewing || user.role !== "surveyor");
    const queryTaskId = new URLSearchParams(location.search).get("taskId");
    setTaskId(queryTaskId);

    if (urlProcessId && urlProcessId !== "new") {
      setLoading(true);
      fetch(`http://localhost:3000/api/assessments/form-nineteen?processId=${urlProcessId}`, {
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

            // Set Other Details photos preview
            if (existingForm.otherDetailsPhotos && existingForm.otherDetailsPhotos.length > 0) {
              const previews = existingForm.otherDetailsPhotos.map(
                (img) => `http://localhost:3000/${img}`
              );
              setOtherDetailsPreviews(previews);
            }
          } else if (isViewing) {
            toast({
              variant: "destructive",
              title: "Error",
              description: "Form Nineteen data not found.",
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
            description: "Error fetching Form Nineteen data.",
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

  // Handle file changes for "Other details"
  const handleFileChange = (e) => {
    if (isViewOnly) return;
    const selectedFiles = Array.from(e.target.files);
    setOtherDetailsFiles((prev) => [...prev, ...selectedFiles]);
    const previewUrls = selectedFiles.map((file) => URL.createObjectURL(file));
    setOtherDetailsPreviews((prev) => [...prev, ...previewUrls]);
    setUnsavedChanges(true);
  };

  // Delete photo handler
  const handleDeleteImage = (index, previewUrl) => {
    if (isViewOnly) return;
    const updatedPreviews = otherDetailsPreviews.filter((_, idx) => idx !== index);
    setOtherDetailsPreviews(updatedPreviews);

    const isNewUpload = previewUrl.startsWith("blob:");
    if (isNewUpload) {
      const updatedFiles = otherDetailsFiles.filter(
        (_, idx) => idx !== index - (otherDetailsPreviews.length - otherDetailsFiles.length)
      );
      setOtherDetailsFiles(updatedFiles);
    } else {
      setOtherDetailsDeleted((prev) => [...prev, previewUrl]);
    }

    setUnsavedChanges(true);
  };

  // Form validation
  const validateForm = () => {
    const newErrors = {};

    if (!formData.terrainType) {
      newErrors.terrainType = "Terrain type is required.";
    }
    if (!formData.windTurbinePresent) {
      newErrors.windTurbinePresent = "Wind turbine presence is required.";
    }
    if (formData.windTurbinePresent === "yes") {
      if (!formData.windTurbineDetailsKnown) {
        newErrors.windTurbineDetailsKnown = "Wind turbine details known selection is required.";
      }
      if (formData.windTurbineDetailsKnown === "yes") {
        if (!formData.numberOfTurbines || isNaN(formData.numberOfTurbines) || formData.numberOfTurbines < 0) {
          newErrors.numberOfTurbines = "Number of turbines must be a valid non-negative number.";
        }
        if (!formData.rotorDiameter || isNaN(formData.rotorDiameter) || formData.rotorDiameter <= 0) {
          newErrors.rotorDiameter = "Rotor diameter must be a valid positive number.";
        }
        if (!formData.heightAboveRidge || isNaN(formData.heightAboveRidge)) {
          newErrors.heightAboveRidge = "Height above ridge must be a valid number.";
        }
      }
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
        if (key !== "otherDetailsPhotos") {
          formDataToSend.append(key, formData[key]);
        }
      });

      // Append new files
      if (otherDetailsFiles.length > 0) {
        otherDetailsFiles.forEach((file) => {
          formDataToSend.append("otherDetailsPhotos", file);
        });
      }

      // Append deleted images
      if (otherDetailsDeleted.length > 0) {
        formDataToSend.append("deletedOtherDetailsPhotos", JSON.stringify(otherDetailsDeleted));
      }

      const url = docId
        ? `http://localhost:3000/api/assessments/form-nineteen/${docId}`
        : "http://localhost:3000/api/assessments/form-nineteen";
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
        setOtherDetailsFiles([]);
        setOtherDetailsDeleted([]);
        setOtherDetailsPreviews(
          data.data.otherDetailsPhotos.map((photo) => `http://localhost:3000/${photo}`)
        );
        toast({
          title: "Success",
          description: `Form Nineteen ${docId ? "updated" : "saved"} successfully!`,
        });
        return { success: true, processId: data.data.processId };
      } else {
        throw new Error(data.error || "Failed to save Form Nineteen");
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
        navigate(`/view-form/${result.processId}/form-nineteen?taskId=${taskId}`);
      } else {
        navigate(`/process/${result.processId}/form-nineteen?taskId=${taskId}`, { replace: true });
      }
    }
  };

  // Handle navigation to the next form (Form Twenty)
  const handleNext = async () => {
    if (!isViewOnly) {
      const result = await saveForm();
      if (result.success) {
        if (user.role === "surveyor") {
          navigate(`/process/${result.processId}/form-twenty?taskId=${taskId}`);
        } else {
          navigate(`/view-form/${result.processId}/form-twenty?taskId=${taskId}`);
        }
      }
    } else {
      navigate(`/view-form/${savedProcessId || urlProcessId}/form-twenty?taskId=${taskId}`);
    }
  };

  // Handle navigation to the previous form (Form Eighteen)
  const handlePrevious = async () => {
    if (!isViewOnly) {
      const result = await saveForm();
      if (result.success) {
        if (user.role === "surveyor") {
          navigate(`/process/${result.processId}/form-eighteen?taskId=${taskId}`);
        } else {
          navigate(`/view-form/${result.processId}/form-eighteen?taskId=${taskId}`);
        }
      }
    } else {
      navigate(`/view-form/${savedProcessId || urlProcessId}/form-eighteen?taskId=${taskId}`);
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
            {isViewOnly ? "View Form Nineteen" : "19. Wind Turbine"}
          </h1>

          {/* Terrain Type */}
          <div className="mb-6">
            <Label>Terrain Type:</Label>
            <select
              name="terrainType"
              value={formData.terrainType}
              onChange={handleChange}
              className={`w-full mt-1 border rounded px-2 py-2 ${errors.terrainType ? "border-red-500" : ""}`}
              disabled={isViewOnly}
            >
              <option value="">- Select -</option>
              <option value="Urban (closely spaced buildings of 4 storeys or more)">
                Urban (closely spaced buildings of 4 storeys or more)
              </option>
              <option value="Suburban">Suburban</option>
              <option value="Rural">Rural</option>
            </select>
            {errors.terrainType && (
              <p className="text-red-500 text-sm mt-1">{errors.terrainType}</p>
            )}
          </div>

          {/* Wind Turbine Present */}
          <div className="mb-6">
            <Label>Wind Turbine Present?</Label>
            <div className="flex gap-4 mt-2">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="windTurbinePresent"
                  value="yes"
                  checked={formData.windTurbinePresent === "yes"}
                  onChange={handleChange}
                  disabled={isViewOnly}
                  className="form-radio"
                />
                <span>Yes</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="windTurbinePresent"
                  value="no"
                  checked={formData.windTurbinePresent === "no"}
                  onChange={handleChange}
                  disabled={isViewOnly}
                  className="form-radio"
                />
                <span>No</span>
              </label>
            </div>
            {errors.windTurbinePresent && (
              <p className="text-red-500 text-sm mt-1">{errors.windTurbinePresent}</p>
            )}
          </div>

          {/* Wind Turbine Details Known */}
          {formData.windTurbinePresent === "yes" && (
            <>
              <div className="mb-6">
                <Label>Wind Turbine Details Known?</Label>
                <div className="flex gap-4 mt-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="windTurbineDetailsKnown"
                      value="yes"
                      checked={formData.windTurbineDetailsKnown === "yes"}
                      onChange={handleChange}
                      disabled={isViewOnly}
                      className="form-radio"
                    />
                    <span>Yes</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="windTurbineDetailsKnown"
                      value="no"
                      checked={formData.windTurbineDetailsKnown === "no"}
                      onChange={handleChange}
                      disabled={isViewOnly}
                      className="form-radio"
                    />
                    <span>No</span>
                  </label>
                </div>
                {errors.windTurbineDetailsKnown && (
                  <p className="text-red-500 text-sm mt-1">{errors.windTurbineDetailsKnown}</p>
                )}
              </div>

              {/* Wind Turbine Details */}
              {formData.windTurbineDetailsKnown === "yes" && (
                <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Number of Turbines:</Label>
                    <Input
                      type="number"
                      name="numberOfTurbines"
                      value={formData.numberOfTurbines}
                      onChange={handleChange}
                      className={errors.numberOfTurbines ? "border-red-500" : ""}
                      disabled={isViewOnly}
                      step="1"
                      min="0"
                    />
                    {errors.numberOfTurbines && (
                      <p className="text-red-500 text-sm mt-1">{errors.numberOfTurbines}</p>
                    )}
                  </div>
                  <div>
                    <Label>Rotor Diameter (m):</Label>
                    <Input
                      type="number"
                      name="rotorDiameter"
                      value={formData.rotorDiameter}
                      onChange={handleChange}
                      className={errors.rotorDiameter ? "border-red-500" : ""}
                      disabled={isViewOnly}
                      step="any"
                      min="0"
                    />
                    {errors.rotorDiameter && (
                      <p className="text-red-500 text-sm mt-1">{errors.rotorDiameter}</p>
                    )}
                  </div>
                  <div>
                    <Label>Height Above Ridge (m):</Label>
                    <Input
                      type="number"
                      name="heightAboveRidge"
                      value={formData.heightAboveRidge}
                      onChange={handleChange}
                      className={errors.heightAboveRidge ? "border-red-500" : ""}
                      disabled={isViewOnly}
                      step="any"
                    />
                    {errors.heightAboveRidge && (
                      <p className="text-red-500 text-sm mt-1">{errors.heightAboveRidge}</p>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Other Details (File Upload) */}
          <div className="mb-6">
            <PhotoUploader
              label="Other Details (Optional)"
              inputName="otherDetailsPhotos"
              onFileChange={handleFileChange}
              imagePreviews={otherDetailsPreviews}
              onDeleteImage={handleDeleteImage}
              isViewOnly={isViewOnly}
            />
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