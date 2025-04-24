import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/store/authStore";
import PhotoUploader from "@/components/ui/photo/PhotoUpload";

export default function FormEleven() {
  const navigate = useNavigate();
  const { processId: urlProcessId } = useParams(); // e.g., /process/:processId/form-eleven
  const location = useLocation();
  const { toast } = useToast();
  const { user } = useAuthStore();

  // State for form data and metadata
  const [formData, setFormData] = useState({
    additionalStructureType: "",
    insulationStatus: "",
    insulationThickness: "",
    additionalNotes: "",
    uValue: "",
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
  const [structurePhotos, setStructurePhotos] = useState([]);
  const [structurePreviews, setStructurePreviews] = useState([]);
  const [structureDeleted, setStructureDeleted] = useState([]);

  const [insulationPhotos, setInsulationPhotos] = useState([]);
  const [insulationPreviews, setInsulationPreviews] = useState([]);
  const [insulationDeleted, setInsulationDeleted] = useState([]);

  // Determine mode (edit or view) and load existing data
  useEffect(() => {
    const isViewing = location.pathname.includes("/view-form");
    setIsViewOnly(isViewing || user.role !== "surveyor");
    const queryTaskId = new URLSearchParams(location.search).get("taskId");
    setTaskId(queryTaskId);

    if (urlProcessId && urlProcessId !== "new") {
      setLoading(true);
      fetch(`http://localhost:3000/api/assessments/form-eleven?processId=${urlProcessId}`, {
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

            // Set structure photos preview if available
            if (existingForm.structurePhotos && existingForm.structurePhotos.length > 0) {
              const previews = existingForm.structurePhotos.map(
                (img) => `http://localhost:3000/${img}`
              );
              setStructurePreviews(previews);
            }
            // Set insulation photos preview if available
            if (existingForm.insulationPhotos && existingForm.insulationPhotos.length > 0) {
              const previews = existingForm.insulationPhotos.map(
                (img) => `http://localhost:3000/${img}`
              );
              setInsulationPreviews(previews);
            }
          } else if (isViewing) {
            toast({
              variant: "destructive",
              title: "Error",
              description: "Form Eleven data not found.",
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
            description: "Error fetching Form Eleven data.",
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

  // Handle structure photo file change
  const handleStructureFileChange = (e) => {
    if (isViewOnly) return;
    const selectedFiles = Array.from(e.target.files);
    setStructurePhotos((prev) => [...prev, ...selectedFiles]);
    const previewUrls = selectedFiles.map((file) => URL.createObjectURL(file));
    setStructurePreviews((prev) => [...prev, ...previewUrls]);
    setUnsavedChanges(true);
  };

  // Delete structure photo
  const handleDeleteStructureImage = (index, previewUrl) => {
    if (isViewOnly) return;
    const updatedPreviews = structurePreviews.filter((_, idx) => idx !== index);
    setStructurePreviews(updatedPreviews);

    const isNewUpload = previewUrl.startsWith("blob:");
    if (isNewUpload) {
      const updatedFiles = structurePhotos.filter(
        (_, idx) => idx !== index - (structurePreviews.length - structurePhotos.length)
      );
      setStructurePhotos(updatedFiles);
    } else {
      setStructureDeleted((prev) => [...prev, previewUrl]);
    }

    setUnsavedChanges(true);
  };

  // Handle insulation photo file change
  const handleInsulationFileChange = (e) => {
    if (isViewOnly) return;
    const selectedFiles = Array.from(e.target.files);
    setInsulationPhotos((prev) => [...prev, ...selectedFiles]);
    const previewUrls = selectedFiles.map((file) => URL.createObjectURL(file));
    setInsulationPreviews((prev) => [...prev, ...previewUrls]);
    setUnsavedChanges(true);
  };

  // Delete insulation photo
  const handleDeleteInsulationImage = (index, previewUrl) => {
    if (isViewOnly) return;
    const updatedPreviews = insulationPreviews.filter((_, idx) => idx !== index);
    setInsulationPreviews(updatedPreviews);

    const isNewUpload = previewUrl.startsWith("blob:");
    if (isNewUpload) {
      const updatedFiles = insulationPhotos.filter(
        (_, idx) => idx !== index - (insulationPreviews.length - insulationPhotos.length)
      );
      setInsulationPhotos(updatedFiles);
    } else {
      setInsulationDeleted((prev) => [...prev, previewUrl]);
    }

    setUnsavedChanges(true);
  };

  // Form validation
  const validateForm = () => {
    const newErrors = {};

    if (!formData.additionalStructureType) {
      newErrors.additionalStructureType = "Structure type is required.";
    }
    if (!formData.insulationStatus) {
      newErrors.insulationStatus = "Insulation status is required.";
    }
    if (formData.insulationStatus === "Installed" && !formData.insulationThickness) {
      newErrors.insulationThickness = "Insulation thickness is required when insulation is installed.";
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
      for (const key in formData) {
        if (key !== "structurePhotos" && key !== "insulationPhotos") {
          formDataToSend.append(key, formData[key]);
        }
      }

      // Append new files
      if (structurePhotos.length > 0) {
        structurePhotos.forEach((file) => {
          formDataToSend.append("structurePhotos", file);
        });
      }
      if (insulationPhotos.length > 0) {
        insulationPhotos.forEach((file) => {
          formDataToSend.append("insulationPhotos", file);
        });
      }

      // Append deleted images
      if (structureDeleted.length > 0) {
        formDataToSend.append("deletedStructurePhotos", JSON.stringify(structureDeleted));
      }
      if (insulationDeleted.length > 0) {
        formDataToSend.append("deletedInsulationPhotos", JSON.stringify(insulationDeleted));
      }

      const url = docId
        ? `http://localhost:3000/api/assessments/form-eleven/${docId}`
        : "http://localhost:3000/api/assessments/form-eleven";
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
        setStructurePhotos([]);
        setInsulationPhotos([]);
        setStructureDeleted([]);
        setInsulationDeleted([]);
        setStructurePreviews(
          data.data.structurePhotos.map((photo) => `http://localhost:3000/${photo}`)
        );
        setInsulationPreviews(
          data.data.insulationPhotos.map((photo) => `http://localhost:3000/${photo}`)
        );
        toast({
          title: "Success",
          description: `Form Eleven ${docId ? "updated" : "saved"} successfully!`,
        });
        return { success: true, processId: data.data.processId };
      } else {
        throw new Error(data.error || "Failed to save Form Eleven");
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
        navigate(`/view-form/${result.processId}/form-eleven?taskId=${taskId}`);
      } else {
        navigate(`/process/${result.processId}/form-eleven?taskId=${taskId}`, { replace: true });
      }
    }
  };

  // Handle navigation to the next form (assuming Form Twelve follows)
  const handleNext = async () => {
    if (!isViewOnly) {
      const result = await saveForm();
      if (result.success) {
        if (user.role === "surveyor") {
          navigate(`/process/${result.processId}/form-twelve?taskId=${taskId}`);
        } else {
          navigate(`/view-form/${result.processId}/form-twelve?taskId=${taskId}`);
        }
      }
    } else {
      navigate(`/view-form/${savedProcessId || urlProcessId}/form-twelve?taskId=${taskId}`);
    }
  };

  // Handle navigation to the previous form (Form Ten)
  const handlePrevious = async () => {
    if (!isViewOnly) {
      const result = await saveForm();
      if (result.success) {
        if (user.role === "surveyor") {
          navigate(`/process/${result.processId}/form-ten?taskId=${taskId}`);
        } else {
          navigate(`/view-form/${result.processId}/form-ten?taskId=${taskId}`);
        }
      }
    } else {
      navigate(`/view-form/${savedProcessId || urlProcessId}/form-ten?taskId=${taskId}`);
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
            {isViewOnly ? "View Form Eleven" : "11. Additional Property Details"}
          </h1>

          {/* Section: Additional Structure Type */}
          <div className="mb-6">
            <Label>Additional Structure Type:</Label>
            <select
              name="additionalStructureType"
              value={formData.additionalStructureType}
              onChange={handleChange}
              className={`w-full mt-1 border rounded px-2 py-2 ${errors.additionalStructureType ? "border-red-500" : ""}`}
              disabled={isViewOnly}
            >
              <option value="">- Select -</option>
              <option value="Extension">Extension</option>
              <option value="Conservatory">Conservatory</option>
              <option value="Porch">Porch</option>
              <option value="Garage">Garage</option>
              <option value="None">None</option>
            </select>
            {errors.additionalStructureType && (
              <p className="text-red-500 text-sm mt-1">{errors.additionalStructureType}</p>
            )}
          </div>

          {/* Section: Structure Photos */}
          {formData.additionalStructureType !== "None" && (
            <div className="mb-6">
              <PhotoUploader
                label="Upload Structure Photos (Recommended)"
                inputName="structurePhotos"
                onFileChange={handleStructureFileChange}
                imagePreviews={structurePreviews}
                onDeleteImage={handleDeleteStructureImage}
                isViewOnly={isViewOnly}
              />
            </div>
          )}

          {/* Section: Insulation Status */}
          <div className="mb-6">
            <Label>Insulation Status:</Label>
            <select
              name="insulationStatus"
              value={formData.insulationStatus}
              onChange={handleChange}
              className={`w-full mt-1 border rounded px-2 py-2 ${errors.insulationStatus ? "border-red-500" : ""}`}
              disabled={isViewOnly}
            >
              <option value="">- Select -</option>
              <option value="Installed">Installed</option>
              <option value="Not Installed">Not Installed</option>
              <option value="Unknown">Unknown</option>
            </select>
            {errors.insulationStatus && (
              <p className="text-red-500 text-sm mt-1">{errors.insulationStatus}</p>
            )}
          </div>

          {/* Section: Insulation Thickness */}
          {formData.insulationStatus === "Installed" && (
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
                <option value="50mm">50mm</option>
                <option value="100mm">100mm</option>
                <option value="150mm">150mm</option>
                <option value="200mm">200mm</option>
                <option value="Unknown">Unknown</option>
              </select>
              {errors.insulationThickness && (
                <p className="text-red-500 text-sm mt-1">{errors.insulationThickness}</p>
              )}
            </div>
          )}

          {/* Section: Insulation Photos */}
          {formData.insulationStatus === "Installed" && (
            <div className="mb-6">
              <PhotoUploader
                label="Upload Insulation Photos (Recommended)"
                inputName="insulationPhotos"
                onFileChange={handleInsulationFileChange}
                imagePreviews={insulationPreviews}
                onDeleteImage={handleDeleteInsulationImage}
                isViewOnly={isViewOnly}
              />
            </div>
          )}

          {/* Section: U-Value */}
          <div className="mb-6">
            <Label>U-Value (W/m²K):</Label>
            <Input
              name="uValue"
              value={formData.uValue}
              onChange={handleChange}
              placeholder="e.g., 1.2"
              className="w-full mt-1 border rounded px-2 py-2"
              disabled={isViewOnly}
            />
            <p className="text-sm text-gray-500 mt-1">
              Note: Leave blank if unknown; documentary evidence required to overwrite.
            </p>
          </div>

          {/* Section: Additional Notes */}
          <div className="mb-6">
            <Label>Additional Notes:</Label>
            <textarea
              name="additionalNotes"
              value={formData.additionalNotes}
              onChange={handleChange}
              className="w-full mt-1 border rounded px-2 py-2"
              rows="3"
              disabled={isViewOnly}
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