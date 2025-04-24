import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/store/authStore";
import PhotoUploader from "@/components/ui/photo/PhotoUpload";

export default function FormSix() {
  const navigate = useNavigate();
  const { processId: urlProcessId } = useParams();
  const location = useLocation();
  const { toast } = useToast();
  const { user } = useAuthStore();

  // State for form data and metadata
  const [formData, setFormData] = useState({
    wallType: "",
    insulationType: "",
    dryLining: "",
    insulationThickness: "",
    externalThickness: "",
    uValue: "",
    partyWallType: "",
    constructionPhoto: "",
    wallThicknessUnknown: "",
    userId: user?._id || "",
    processId: urlProcessId || "",
  });

  const [formId, setFormId] = useState(null);
  const [taskId, setTaskId] = useState(null);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [isUpdate, setIsUpdate] = useState(false);
  const [isViewOnly, setIsViewOnly] = useState(false);
  const [savedProcessId, setSavedProcessId] = useState(null);
  const [loading, setLoading] = useState(false); // Loading state for API calls
  const [errors, setErrors] = useState({}); // Form validation errors

  // File upload states for each group
  const [constructionFiles, setConstructionFiles] = useState([]);
  const [constructionPreviews, setConstructionPreviews] = useState([]);
  const [constructionDeleted, setConstructionDeleted] = useState([]);

  const [insulationFiles, setInsulationFiles] = useState([]);
  const [insulationPreviews, setInsulationPreviews] = useState([]);
  const [insulationDeleted, setInsulationDeleted] = useState([]);

  const [thicknessFiles, setThicknessFiles] = useState([]);
  const [thicknessPreviews, setThicknessPreviews] = useState([]);
  const [thicknessDeleted, setThicknessDeleted] = useState([]);

  // Determine mode (edit or view) and load existing data
  useEffect(() => {
    const isViewing = location.pathname.includes("/view-form");
    setIsViewOnly(isViewing || user.role !== "surveyor");
    const queryTaskId = new URLSearchParams(location.search).get("taskId");
    setTaskId(queryTaskId);

    if (urlProcessId && urlProcessId !== "new") {
      setLoading(true);
      fetch(`http://localhost:3000/api/assessments/form-six?processId=${urlProcessId}`, {
        method: "GET",
        credentials: "include",
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data) {
            setFormData(data.data);
            setFormId(data.data._id);
            setIsUpdate(true);
            setSavedProcessId(data.data.processId);

            // Set previews for each image group
            if (data.data.constructionPhotos && data.data.constructionPhotos.length > 0) {
              const previews = data.data.constructionPhotos.map(
                (photo) => `http://localhost:3000/${photo}`
              );
              setConstructionPreviews(previews);
            }
            if (data.data.insulationPhotos && data.data.insulationPhotos.length > 0) {
              const previews = data.data.insulationPhotos.map(
                (photo) => `http://localhost:3000/${photo}`
              );
              setInsulationPreviews(previews);
            }
            if (data.data.thicknessPhotos && data.data.thicknessPhotos.length > 0) {
              const previews = data.data.thicknessPhotos.map(
                (photo) => `http://localhost:3000/${photo}`
              );
              setThicknessPreviews(previews);
            }
          } else if (isViewing) {
            toast({
              variant: "destructive",
              title: "Error",
              description: "Form Six data not found.",
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
            description: "Failed to load Form Six data.",
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

  // === File Handlers for Each Group ===

  // Construction Photos
  const handleConstructionFileChange = (e) => {
    if (isViewOnly) return;
    const selectedFiles = Array.from(e.target.files);
    setConstructionFiles((prev) => [...prev, ...selectedFiles]);
    const previewUrls = selectedFiles.map((file) => URL.createObjectURL(file));
    setConstructionPreviews((prev) => [...prev, ...previewUrls]);
    setUnsavedChanges(true);
  };

  const handleDeleteConstructionImage = (index, previewUrl) => {
    if (isViewOnly) return;
    const updatedPreviews = constructionPreviews.filter((_, idx) => idx !== index);
    setConstructionPreviews(updatedPreviews);

    const isNewUpload = previewUrl.startsWith("blob:");
    if (isNewUpload) {
      const updatedFiles = constructionFiles.filter(
        (_, idx) => idx !== index - (constructionPreviews.length - constructionFiles.length)
      );
      setConstructionFiles(updatedFiles);
    } else {
      setConstructionDeleted((prev) => [...prev, previewUrl]);
    }

    setUnsavedChanges(true);
  };

  // Insulation Photos
  const handleInsulationFileChange = (e) => {
    if (isViewOnly) return;
    const selectedFiles = Array.from(e.target.files);
    setInsulationFiles((prev) => [...prev, ...selectedFiles]);
    const previewUrls = selectedFiles.map((file) => URL.createObjectURL(file));
    setInsulationPreviews((prev) => [...prev, ...previewUrls]);
    setUnsavedChanges(true);
  };

  const handleDeleteInsulationImage = (index, previewUrl) => {
    if (isViewOnly) return;
    const updatedPreviews = insulationPreviews.filter((_, idx) => idx !== index);
    setInsulationPreviews(updatedPreviews);

    const isNewUpload = previewUrl.startsWith("blob:");
    if (isNewUpload) {
      const updatedFiles = insulationFiles.filter(
        (_, idx) => idx !== index - (insulationPreviews.length - insulationFiles.length)
      );
      setInsulationFiles(updatedFiles);
    } else {
      setInsulationDeleted((prev) => [...prev, previewUrl]);
    }

    setUnsavedChanges(true);
  };

  // Thickness Photos
  const handleThicknessFileChange = (e) => {
    if (isViewOnly) return;
    const selectedFiles = Array.from(e.target.files);
    setThicknessFiles((prev) => [...prev, ...selectedFiles]);
    const previewUrls = selectedFiles.map((file) => URL.createObjectURL(file));
    setThicknessPreviews((prev) => [...prev, ...previewUrls]);
    setUnsavedChanges(true);
  };

  const handleDeleteThicknessImage = (index, previewUrl) => {
    if (isViewOnly) return;
    const updatedPreviews = thicknessPreviews.filter((_, idx) => idx !== index);
    setThicknessPreviews(updatedPreviews);

    const isNewUpload = previewUrl.startsWith("blob:");
    if (isNewUpload) {
      const updatedFiles = thicknessFiles.filter(
        (_, idx) => idx !== index - (thicknessPreviews.length - thicknessFiles.length)
      );
      setThicknessFiles(updatedFiles);
    } else {
      setThicknessDeleted((prev) => [...prev, previewUrl]);
    }

    setUnsavedChanges(true);
  };

  // Form validation
  const validateForm = () => {
    const newErrors = {};

    if (!formData.wallType) {
      newErrors.wallType = "Wall type is required.";
    }
    if (!formData.insulationType) {
      newErrors.insulationType = "Insulation type is required.";
    }
    if (!formData.dryLining) {
      newErrors.dryLining = "Dry-lining selection is required.";
    }
    if (formData.insulationType !== "None" && !formData.insulationThickness) {
      newErrors.insulationThickness = "Insulation thickness is required if insulation is present.";
    }
    if (!formData.externalThickness) {
      newErrors.externalThickness = "External wall thickness is required.";
    } else if (isNaN(formData.externalThickness) || formData.externalThickness <= 0) {
      newErrors.externalThickness = "External wall thickness must be a positive number.";
    }
    if (!formData.wallThicknessUnknown) {
      newErrors.wallThicknessUnknown = "Wall thickness unknown selection is required.";
    }
    if (formData.uValue && (isNaN(formData.uValue) || formData.uValue <= 0)) {
      newErrors.uValue = "U-value must be a positive number if provided.";
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
        if (
          key !== "constructionPhotos" &&
          key !== "insulationPhotos" &&
          key !== "thicknessPhotos"
        ) {
          formDataToSend.append(key, formData[key]);
        }
      }

      // Append new files for each image group
      if (constructionFiles.length > 0) {
        constructionFiles.forEach((file) => {
          formDataToSend.append("constructionPhotos", file);
        });
      }
      if (insulationFiles.length > 0) {
        insulationFiles.forEach((file) => {
          formDataToSend.append("insulationPhotos", file);
        });
      }
      if (thicknessFiles.length > 0) {
        thicknessFiles.forEach((file) => {
          formDataToSend.append("thicknessPhotos", file);
        });
      }

      // Append deleted images for each group
      if (constructionDeleted.length > 0) {
        formDataToSend.append("deletedConstruction", JSON.stringify(constructionDeleted));
      }
      if (insulationDeleted.length > 0) {
        formDataToSend.append("deletedInsulation", JSON.stringify(insulationDeleted));
      }
      if (thicknessDeleted.length > 0) {
        formDataToSend.append("deletedThickness", JSON.stringify(thicknessDeleted));
      }

      const url = formId
        ? `http://localhost:3000/api/assessments/form-six/${formId}`
        : "http://localhost:3000/api/assessments/form-six";
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
        setConstructionFiles([]);
        setInsulationFiles([]);
        setThicknessFiles([]);
        setConstructionDeleted([]);
        setInsulationDeleted([]);
        setThicknessDeleted([]);
        setConstructionPreviews(
          data.data.constructionPhotos.map((photo) => `http://localhost:3000/${photo}`)
        );
        setInsulationPreviews(
          data.data.insulationPhotos.map((photo) => `http://localhost:3000/${photo}`)
        );
        setThicknessPreviews(
          data.data.thicknessPhotos.map((photo) => `http://localhost:3000/${photo}`)
        );
        toast({
          title: "Success",
          description: `Form Six ${formId ? "updated" : "saved"} successfully!`,
        });
        return { success: true, processId: data.data.processId };
      } else {
        throw new Error(data.error || "Failed to save Form Six");
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
        navigate(`/view-form/${result.processId}/form-six?taskId=${taskId}`);
      } else {
        navigate(`/process/${result.processId}/form-six?taskId=${taskId}`, { replace: true });
      }
    }
  };

  // Handle navigation to the next form
  const handleNext = async () => {
    if (!isViewOnly) {
      const result = await saveForm();
      if (result.success) {
        if (user.role === "surveyor") {
          navigate(`/process/${result.processId}/form-seven?taskId=${taskId}`);
        } else {
          navigate(`/view-form/${result.processId}/form-seven?taskId=${taskId}`);
        }
      }
    } else {
      navigate(`/view-form/${savedProcessId || urlProcessId}/form-seven?taskId=${taskId}`);
    }
  };

  // Handle navigation to the previous form
  const handlePrevious = async () => {
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
            {isViewOnly ? "View Form Six" : "6. Main Property Walls"}
          </h1>

          {/* Construction Photo (Yes/No) */}
          <div className="mb-6">
            <Label className="font-bold">
              Construction
              <span className="font-normal"> photo (recommended)</span>
            </Label>
            <div className="flex items-center gap-4 mt-2">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="constructionPhoto"
                  value="yes"
                  checked={formData.constructionPhoto === "yes"}
                  onChange={handleChange}
                  disabled={isViewOnly}
                />
                Yes
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="constructionPhoto"
                  value="no"
                  checked={formData.constructionPhoto === "no"}
                  onChange={handleChange}
                  disabled={isViewOnly}
                />
                No
              </label>
            </div>
          </div>

          {/* Construction Photos */}
          <div className="mb-6">
            <PhotoUploader
              label="Construction photo (recommended) | note: can be included in elevation photos"
              inputName="constructionPhotos"
              onFileChange={handleConstructionFileChange}
              imagePreviews={constructionPreviews}
              onDeleteImage={handleDeleteConstructionImage}
              isViewOnly={isViewOnly}
            />
          </div>

          {/* Other Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            {/* Type */}
            <div>
              <Label htmlFor="wallType">Type</Label>
              <select
                id="wallType"
                name="wallType"
                value={formData.wallType}
                onChange={handleChange}
                className={`w-full mt-1 border rounded px-2 py-2 ${
                  errors.wallType ? "border-red-500" : ""
                }`}
                disabled={isViewOnly}
              >
                <option value="">- Select -</option>
                <option value="Stone">Stone</option>
                <option value="Brick">Brick</option>
                <option value="Cavity">Cavity</option>
                <option value="Timber">Timber</option>
              </select>
              {errors.wallType && (
                <p className="text-red-500 text-sm mt-1">{errors.wallType}</p>
              )}
            </div>

            {/* Insulation */}
            <div>
              <Label htmlFor="insulationType">Insulation</Label>
              <select
                id="insulationType"
                name="insulationType"
                value={formData.insulationType}
                onChange={handleChange}
                className={`w-full mt-1 border rounded px-2 py-2 ${
                  errors.insulationType ? "border-red-500" : ""
                }`}
                disabled={isViewOnly}
              >
                <option value="">- Select -</option>
                <option value="External">External</option>
                <option value="Internal">Internal</option>
                <option value="None">None</option>
              </select>
              {errors.insulationType && (
                <p className="text-red-500 text-sm mt-1">{errors.insulationType}</p>
              )}
            </div>

            {/* Dry-lining */}
            <div>
              <Label>Dry-lining (applicable for Stone/Solid Brick/Cavity walls)</Label>
              <div className="flex items-center gap-4 mt-2">
                <label className="flex items-center gap-1">
                  <input
                    type="radio"
                    name="dryLining"
                    value="yes"
                    checked={formData.dryLining === "yes"}
                    onChange={handleChange}
                    disabled={isViewOnly}
                  />
                  Yes
                </label>
                <label className="flex items-center gap-1">
                  <input
                    type="radio"
                    name="dryLining"
                    value="no"
                    checked={formData.dryLining === "no"}
                    onChange={handleChange}
                    disabled={isViewOnly}
                  />
                  No
                </label>
              </div>
              {errors.dryLining && (
                <p className="text-red-500 text-sm mt-1">{errors.dryLining}</p>
              )}
            </div>

            {/* Insulation Thickness */}
            <div>
              <Label htmlFor="insulationThickness">Insulation Thickness</Label>
              <select
                id="insulationThickness"
                name="insulationThickness"
                value={formData.insulationThickness}
                onChange={handleChange}
                className={`w-full mt-1 border rounded px-2 py-2 ${
                  errors.insulationThickness ? "border-red-500" : ""
                }`}
                disabled={isViewOnly}
              >
                <option value="">- Select -</option>
                <option value="50mm">50mm</option>
                <option value="100mm">100mm</option>
                <option value="150mm">150mm</option>
                <option value="200mm">200mm</option>
              </select>
              {errors.insulationThickness && (
                <p className="text-red-500 text-sm mt-1">{errors.insulationThickness}</p>
              )}
            </div>

            {/* Wall Insulation Photos */}
            <div className="mb-6">
              <PhotoUploader
                label="Wall insulation photos"
                inputName="insulationPhotos"
                onFileChange={handleInsulationFileChange}
                imagePreviews={insulationPreviews}
                onDeleteImage={handleDeleteInsulationImage}
                isViewOnly={isViewOnly}
              />
            </div>

            {/* External Wall Thickness */}
            <div>
              <Label htmlFor="externalThickness">External Wall Thickness (mm)</Label>
              <Input
                id="externalThickness"
                name="externalThickness"
                placeholder="e.g., 150"
                value={formData.externalThickness}
                onChange={handleChange}
                disabled={isViewOnly}
                className={errors.externalThickness ? "border-red-500" : ""}
              />
              {errors.externalThickness && (
                <p className="text-red-500 text-sm mt-1">{errors.externalThickness}</p>
              )}
            </div>

            {/* Wall Thickness Unknown */}
            <div className="mb-6">
              <Label className="font-semibold">Wall Thickness Unknown</Label>
              <div className="flex items-center gap-4 mt-2">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="wallThicknessUnknown"
                    value="yes"
                    checked={formData.wallThicknessUnknown === "yes"}
                    onChange={handleChange}
                    disabled={isViewOnly}
                  />
                  Yes
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="wallThicknessUnknown"
                    value="no"
                    checked={formData.wallThicknessUnknown === "no"}
                    onChange={handleChange}
                    disabled={isViewOnly}
                  />
                  No
                </label>
              </div>
              {errors.wallThicknessUnknown && (
                <p className="text-red-500 text-sm mt-1">{errors.wallThicknessUnknown}</p>
              )}
            </div>

            {/* Wall Thickness Photos */}
            <div className="mb-6">
              <PhotoUploader
                label="Wall thickness photos (recommended)"
                inputName="thicknessPhotos"
                onFileChange={handleThicknessFileChange}
                imagePreviews={thicknessPreviews}
                onDeleteImage={handleDeleteThicknessImage}
                isViewOnly={isViewOnly}
              />
            </div>

            {/* U-value known */}
            <div>
              <Label htmlFor="uValue">U-value known (W/m²K)</Label>
              <Input
                id="uValue"
                name="uValue"
                placeholder="e.g., 1.2"
                value={formData.uValue}
                onChange={handleChange}
                disabled={isViewOnly}
                className={errors.uValue ? "border-red-500" : ""}
              />
              <p className="text-sm text-gray-500 mt-1">
                Note: documentary evidence required to overwrite U-value
              </p>
              {errors.uValue && (
                <p className="text-red-500 text-sm mt-1">{errors.uValue}</p>
              )}
            </div>

            {/* Party Wall Type */}
            <div>
              <Label htmlFor="partyWallType">Party Wall Type (if applicable)</Label>
              <select
                id="partyWallType"
                name="partyWallType"
                value={formData.partyWallType}
                onChange={handleChange}
                className="w-full mt-1 border rounded px-2 py-2"
                disabled={isViewOnly}
              >
                <option value="">- Select -</option>
                <option value="Solid Masonry/Timber/System Build">Solid Masonry/Timber/System Build</option>
                <option value="Cavity Masonry unfilled">Cavity Masonry unfilled</option>
                <option value="Cavity Masonry filled">Cavity Masonry filled</option>
                <option value="Unable to determine">Unable to determine</option>
              </select>
            </div>
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