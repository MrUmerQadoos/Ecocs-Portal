import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/store/authStore";
import PhotoUploader from "@/components/ui/photo/PhotoUpload";

export default function FormEight() {
  const navigate = useNavigate();
  const { processId: urlProcessId } = useParams(); // e.g., /process/:processId/form-eight
  const location = useLocation();
  const { toast } = useToast();
  const { user } = useAuthStore();

  // State for form data and metadata
  const [formData, setFormData] = useState({
    hasConstructionPhotos: "", // "yes" or "no"
    roofType: "", // "Pitched (slates/tiles), access to loft", etc.
    insulationType: "", // "Joists", "Rafters", etc.
    insulationDepthPitched: "", // "12mm", "25mm", etc.
    insulationDepthFlat: "", // "None", "As Built", etc.
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

  // Image Handling
  const [constructionFiles, setConstructionFiles] = useState([]);
  const [constructionPreviews, setConstructionPreviews] = useState([]);
  const [constructionDeleted, setConstructionDeleted] = useState([]);

  const [loftInsulationFiles, setLoftInsulationFiles] = useState([]);
  const [loftInsulationPreviews, setLoftInsulationPreviews] = useState([]);
  const [loftInsulationDeleted, setLoftInsulationDeleted] = useState([]);

  // Determine mode (edit or view) and load existing data
  useEffect(() => {
    const isViewing = location.pathname.includes("/view-form");
    setIsViewOnly(isViewing || user.role !== "surveyor");
    const queryTaskId = new URLSearchParams(location.search).get("taskId");
    setTaskId(queryTaskId);

    if (urlProcessId && urlProcessId !== "new") {
      setLoading(true);
      fetch(`http://localhost:3000/api/assessments/form-eight?processId=${urlProcessId}`, {
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

            // Set construction photos preview if available
            if (existingForm.constructionPhotos && existingForm.constructionPhotos.length > 0) {
              const previews = existingForm.constructionPhotos.map(
                (img) => `http://localhost:3000/${img}`
              );
              setConstructionPreviews(previews);
            }

            // Set loft insulation photos preview if available
            if (existingForm.loftInsulationPhotos && existingForm.loftInsulationPhotos.length > 0) {
              const previews = existingForm.loftInsulationPhotos.map(
                (img) => `http://localhost:3000/${img}`
              );
              setLoftInsulationPreviews(previews);
            }
          } else if (isViewing) {
            toast({
              variant: "destructive",
              title: "Error",
              description: "Form Eight data not found.",
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
            description: "Error fetching Form Eight data.",
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

  // Handle construction photo file change
  const handleConstructionFileChange = (e) => {
    if (isViewOnly) return;
    const selectedFiles = Array.from(e.target.files);
    setConstructionFiles((prev) => [...prev, ...selectedFiles]);
    const previewUrls = selectedFiles.map((file) => URL.createObjectURL(file));
    setConstructionPreviews((prev) => [...prev, ...previewUrls]);
    setUnsavedChanges(true);
  };

  // Handle loft insulation photo file change
  const handleLoftInsulationFileChange = (e) => {
    if (isViewOnly) return;
    const selectedFiles = Array.from(e.target.files);
    setLoftInsulationFiles((prev) => [...prev, ...selectedFiles]);
    const previewUrls = selectedFiles.map((file) => URL.createObjectURL(file));
    setLoftInsulationPreviews((prev) => [...prev, ...previewUrls]);
    setUnsavedChanges(true);
  };

  // Delete construction photo
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

  // Delete loft insulation photo
  const handleDeleteLoftInsulationImage = (index, previewUrl) => {
    if (isViewOnly) return;
    const updatedPreviews = loftInsulationPreviews.filter((_, idx) => idx !== index);
    setLoftInsulationPreviews(updatedPreviews);

    const isNewUpload = previewUrl.startsWith("blob:");
    if (isNewUpload) {
      const updatedFiles = loftInsulationFiles.filter(
        (_, idx) => idx !== index - (loftInsulationPreviews.length - loftInsulationFiles.length)
      );
      setLoftInsulationFiles(updatedFiles);
    } else {
      setLoftInsulationDeleted((prev) => [...prev, previewUrl]);
    }

    setUnsavedChanges(true);
  };

  // Form validation
  const validateForm = () => {
    const newErrors = {};

    if (!formData.hasConstructionPhotos) {
      newErrors.hasConstructionPhotos = "Construction photos selection is required.";
    }
    if (!formData.roofType) {
      newErrors.roofType = "Roof type is required.";
    }
    if (!formData.insulationType) {
      newErrors.insulationType = "Insulation type is required.";
    }
    if (!formData.insulationDepthPitched) {
      newErrors.insulationDepthPitched = "Insulation depth (Pitched/Thatch) is required.";
    }
    if (!formData.insulationDepthFlat) {
      newErrors.insulationDepthFlat = "Insulation depth (Flat/Sloping Ceiling) is required.";
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
        if (key !== "constructionPhotos" && key !== "loftInsulationPhotos") {
          formDataToSend.append(key, formData[key]);
        }
      }

      // Append new files for each image group
      if (constructionFiles.length > 0) {
        constructionFiles.forEach((file) => {
          formDataToSend.append("constructionPhotos", file);
        });
      }
      if (loftInsulationFiles.length > 0) {
        loftInsulationFiles.forEach((file) => {
          formDataToSend.append("loftInsulationPhotos", file);
        });
      }

      // Append deleted images for each group
      if (constructionDeleted.length > 0) {
        formDataToSend.append("deletedConstruction", JSON.stringify(constructionDeleted));
      }
      if (loftInsulationDeleted.length > 0) {
        formDataToSend.append("deletedLoftInsulation", JSON.stringify(loftInsulationDeleted));
      }

      const url = docId
        ? `http://localhost:3000/api/assessments/form-eight/${docId}`
        : "http://localhost:3000/api/assessments/form-eight";
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
        setConstructionFiles([]);
        setLoftInsulationFiles([]);
        setConstructionDeleted([]);
        setLoftInsulationDeleted([]);
        setConstructionPreviews(
          data.data.constructionPhotos.map((photo) => `http://localhost:3000/${photo}`)
        );
        setLoftInsulationPreviews(
          data.data.loftInsulationPhotos.map((photo) => `http://localhost:3000/${photo}`)
        );
        toast({
          title: "Success",
          description: `Form Eight ${docId ? "updated" : "saved"} successfully!`,
        });
        return { success: true, processId: data.data.processId };
      } else {
        throw new Error(data.error || "Failed to save Form Eight");
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
        navigate(`/view-form/${result.processId}/form-eight?taskId=${taskId}`);
      } else {
        navigate(`/process/${result.processId}/form-eight?taskId=${taskId}`, { replace: true });
      }
    }
  };

  // Handle navigation to the next form
  const handleNext = async () => {
    if (!isViewOnly) {
      const result = await saveForm();
      if (result.success) {
        if (user.role === "surveyor") {
          navigate(`/process/${result.processId}/form-nine?taskId=${taskId}`);
        } else {
          navigate(`/view-form/${result.processId}/form-nine?taskId=${taskId}`);
        }
      }
    } else {
      navigate(`/view-form/${savedProcessId || urlProcessId}/form-nine?taskId=${taskId}`);
    }
  };

  // Handle navigation to the previous form
  const handlePrevious = async () => {
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
            {isViewOnly ? "View Form Eight" : "8. Main Roof"}
          </h1>

          {/* Section: Has Construction Photos */}
          <div className="mb-6">
            <Label>Construction Photos (recommended):</Label>
            <div className="flex gap-4 mt-2">
              <label>
                <input
                  type="radio"
                  name="hasConstructionPhotos"
                  value="yes"
                  checked={formData.hasConstructionPhotos === "yes"}
                  onChange={handleChange}
                  disabled={isViewOnly}
                />{" "}
                Yes
              </label>
              <label>
                <input
                  type="radio"
                  name="hasConstructionPhotos"
                  value="no"
                  checked={formData.hasConstructionPhotos === "no"}
                  onChange={handleChange}
                  disabled={isViewOnly}
                />{" "}
                No
              </label>
            </div>
            {errors.hasConstructionPhotos && (
              <p className="text-red-500 text-sm mt-1">{errors.hasConstructionPhotos}</p>
            )}
          </div>

          {/* Section: Upload Construction Photos */}
          {formData.hasConstructionPhotos === "yes" && (
            <div className="mb-6">
              <PhotoUploader
                label="Upload Construction Photos (Recommended)"
                inputName="constructionPhotos"
                onFileChange={handleConstructionFileChange}
                imagePreviews={constructionPreviews}
                onDeleteImage={handleDeleteConstructionImage}
                isViewOnly={isViewOnly}
              />
            </div>
          )}

          {/* Section: Roof Type */}
          <div className="mb-6">
            <Label>Type:</Label>
            <select
              name="roofType"
              value={formData.roofType}
              onChange={handleChange}
              className={`w-full mt-1 border rounded px-2 py-2 ${errors.roofType ? "border-red-500" : ""}`}
              disabled={isViewOnly}
            >
              <option value="">- Select -</option>
              <option value="Pitched (slates/tiles), access to loft">Pitched (slates/tiles), access to loft</option>
              <option value="Pitched (slates/tiles), no access">Pitched (slates/tiles), no access</option>
              <option value="Pitched, sloping ceiling">Pitched, sloping ceiling</option>
              <option value="Pitched (thatch)">Pitched (thatch)</option>
              <option value="Flat">Flat</option>
              <option value="Same dwelling above">Same dwelling above</option>
              <option value="Another dwelling above">Another dwelling above</option>
            </select>
            {errors.roofType && (
              <p className="text-red-500 text-sm mt-1">{errors.roofType}</p>
            )}
          </div>

          {/* Section: Insulation Type */}
          <div className="mb-6">
            <Label>Insulation:</Label>
            <select
              name="insulationType"
              value={formData.insulationType}
              onChange={handleChange}
              className={`w-full mt-1 border rounded px-2 py-2 ${errors.insulationType ? "border-red-500" : ""}`}
              disabled={isViewOnly}
            >
              <option value="">- Select -</option>
              <option value="Joists">Joists</option>
              <option value="Rafters">Rafters</option>
              <option value="As built">As built</option>
              <option value="Unknown">Unknown</option>
              <option value="None">None</option>
            </select>
            {errors.insulationType && (
              <p className="text-red-500 text-sm mt-1">{errors.insulationType}</p>
            )}
          </div>

          {/* Section: Insulation Depth (Pitched/Thatch) */}
          <div className="mb-6">
            <Label>Insulation Depth (Pitched/Thatch):</Label>
            <select
              name="insulationDepthPitched"
              value={formData.insulationDepthPitched}
              onChange={handleChange}
              className={`w-full mt-1 border rounded px-2 py-2 ${errors.insulationDepthPitched ? "border-red-500" : ""}`}
              disabled={isViewOnly}
            >
              <option value="">- Select -</option>
              <option value="12mm">12mm</option>
              <option value="25mm">25mm</option>
              <option value="50mm">50mm</option>
              <option value="75mm">75mm</option>
              <option value="100mm">100mm</option>
              <option value="150mm">150mm</option>
              <option value="200mm">200mm</option>
              <option value="250mm">250mm</option>
              <option value="270mm">270mm</option>
              <option value="300mm">300mm</option>
              <option value="350mm">350mm</option>
              <option value="400+mm">400+mm</option>
            </select>
            {errors.insulationDepthPitched && (
              <p className="text-red-500 text-sm mt-1">{errors.insulationDepthPitched}</p>
            )}
          </div>

          {/* Section: Insulation Depth (Flat/Sloping Ceiling) */}
          <div className="mb-6">
            <Label>Insulation Depth (Flat/Sloping Ceiling):</Label>
            <select
              name="insulationDepthFlat"
              value={formData.insulationDepthFlat}
              onChange={handleChange}
              className={`w-full mt-1 border rounded px-2 py-2 ${errors.insulationDepthFlat ? "border-red-500" : ""}`}
              disabled={isViewOnly}
            >
              <option value="">- Select -</option>
              <option value="None">None</option>
              <option value="As Built">As Built</option>
              <option value="50mm">50mm</option>
              <option value="100mm">100mm</option>
              <option value="150mm or more">150mm or more</option>
              <option value="Unknown">Unknown</option>
            </select>
            {errors.insulationDepthFlat && (
              <p className="text-red-500 text-sm mt-1">{errors.insulationDepthFlat}</p>
            )}
          </div>

          {/* Section: Upload Loft Insulation Photos */}
          <div className="mb-6">
            <PhotoUploader
              label="Loft Insulation Depth Photos (recommended)"
              inputName="loftInsulationPhotos"
              onFileChange={handleLoftInsulationFileChange}
              imagePreviews={loftInsulationPreviews}
              onDeleteImage={handleDeleteLoftInsulationImage}
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