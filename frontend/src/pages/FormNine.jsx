import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/store/authStore";
import PhotoUploader from "@/components/ui/photo/PhotoUpload";

export default function FormNine() {
  const navigate = useNavigate();
  const { processId: urlProcessId } = useParams(); // e.g., /process/:processId/form-nine
  const location = useLocation();
  const { toast } = useToast();
  const { user } = useAuthStore();

  // State for form data and metadata
  const [formData, setFormData] = useState({
    hasMainRoomInRoof: "", // "yes" or "no"
    insulationType: "", // "Flat ceiling only", "All elements", etc.
    insulationThicknessCeiling: "", // "12mm", "25mm", etc.
    insulationOtherParts: "", // "None", "As Built", etc.
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
  const [mainRoomPhotos, setMainRoomPhotos] = useState([]);
  const [mainRoomPreviews, setMainRoomPreviews] = useState([]);
  const [mainRoomDeleted, setMainRoomDeleted] = useState([]);

  // Determine mode (edit or view) and load existing data
  useEffect(() => {
    const isViewing = location.pathname.includes("/view-form");
    setIsViewOnly(isViewing || user.role !== "surveyor");
    const queryTaskId = new URLSearchParams(location.search).get("taskId");
    setTaskId(queryTaskId);

    if (urlProcessId && urlProcessId !== "new") {
      setLoading(true);
      fetch(`http://localhost:3000/api/assessments/form-nine?processId=${urlProcessId}`, {
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

            // Set main room photos preview if available
            if (existingForm.mainRoomPhotos && existingForm.mainRoomPhotos.length > 0) {
              const previews = existingForm.mainRoomPhotos.map(
                (img) => `http://localhost:3000/${img}`
              );
              setMainRoomPreviews(previews);
            }
          } else if (isViewing) {
            toast({
              variant: "destructive",
              title: "Error",
              description: "Form Nine data not found.",
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
            description: "Error fetching Form Nine data.",
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

  // Handle main room photo file change
  const handleMainRoomFileChange = (e) => {
    if (isViewOnly) return;
    const selectedFiles = Array.from(e.target.files);
    setMainRoomPhotos((prev) => [...prev, ...selectedFiles]);
    const previewUrls = selectedFiles.map((file) => URL.createObjectURL(file));
    setMainRoomPreviews((prev) => [...prev, ...previewUrls]);
    setUnsavedChanges(true);
  };

  // Delete main room photo
  const handleDeleteMainRoomImage = (index, previewUrl) => {
    if (isViewOnly) return;
    const updatedPreviews = mainRoomPreviews.filter((_, idx) => idx !== index);
    setMainRoomPreviews(updatedPreviews);

    const isNewUpload = previewUrl.startsWith("blob:");
    if (isNewUpload) {
      const updatedFiles = mainRoomPhotos.filter(
        (_, idx) => idx !== index - (mainRoomPreviews.length - mainRoomPhotos.length)
      );
      setMainRoomPhotos(updatedFiles);
    } else {
      setMainRoomDeleted((prev) => [...prev, previewUrl]);
    }

    setUnsavedChanges(true);
  };

  // Form validation
  const validateForm = () => {
    const newErrors = {};

    if (!formData.hasMainRoomInRoof) {
      newErrors.hasMainRoomInRoof = "Main room in roof selection is required.";
    }
    if (!formData.insulationType) {
      newErrors.insulationType = "Insulation type is required.";
    }
    if (!formData.insulationThicknessCeiling) {
      newErrors.insulationThicknessCeiling = "Insulation thickness at ceiling is required.";
    }
    if (!formData.insulationOtherParts) {
      newErrors.insulationOtherParts = "Insulation of other parts is required.";
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
        if (key !== "mainRoomPhotos") {
          formDataToSend.append(key, formData[key]);
        }
      }

      // Append new files
      if (mainRoomPhotos.length > 0) {
        mainRoomPhotos.forEach((file) => {
          formDataToSend.append("mainRoomPhotos", file);
        });
      }

      // Append deleted images
      if (mainRoomDeleted.length > 0) {
        formDataToSend.append("deletedMainRoomPhotos", JSON.stringify(mainRoomDeleted));
      }

      const url = docId
        ? `http://localhost:3000/api/assessments/form-nine/${docId}`
        : "http://localhost:3000/api/assessments/form-nine";
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
        setMainRoomPhotos([]);
        setMainRoomDeleted([]);
        setMainRoomPreviews(
          data.data.mainRoomPhotos.map((photo) => `http://localhost:3000/${photo}`)
        );
        toast({
          title: "Success",
          description: `Form Nine ${docId ? "updated" : "saved"} successfully!`,
        });
        return { success: true, processId: data.data.processId };
      } else {
        throw new Error(data.error || "Failed to save Form Nine");
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
        navigate(`/view-form/${result.processId}/form-nine?taskId=${taskId}`);
      } else {
        navigate(`/process/${result.processId}/form-nine?taskId=${taskId}`, { replace: true });
      }
    }
  };

  // Handle navigation to the next form
  const handleNext = async () => {
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

  // Handle navigation to the previous form
  const handlePrevious = async () => {
    if (!isViewOnly) {
      const result = await saveForm();
      if (result.success) {
        if (user.role === "surveyor") {
          navigate(`/process/${result.processId}/form-eight?taskId=${taskId}`);
        } else {
          navigate(`/view-form/${result.processId}/form-eight?taskId=${taskId}`);
        }
      }
    } else {
      navigate(`/view-form/${savedProcessId || urlProcessId}/form-eight?taskId=${taskId}`);
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
            {isViewOnly ? "View Form Nine" : "9. Main Room in Roof"}
          </h1>

          {/* Section: Has Main Room in Roof */}
          <div className="mb-6">
            <Label>Main Room in Roof (Photos):</Label>
            <div className="flex gap-4 mt-2">
              <label>
                <input
                  type="radio"
                  name="hasMainRoomInRoof"
                  value="yes"
                  checked={formData.hasMainRoomInRoof === "yes"}
                  onChange={handleChange}
                  disabled={isViewOnly}
                />{" "}
                Yes
              </label>
              <label>
                <input
                  type="radio"
                  name="hasMainRoomInRoof"
                  value="no"
                  checked={formData.hasMainRoomInRoof === "no"}
                  onChange={handleChange}
                  disabled={isViewOnly}
                />{" "}
                No
              </label>
            </div>
            {errors.hasMainRoomInRoof && (
              <p className="text-red-500 text-sm mt-1">{errors.hasMainRoomInRoof}</p>
            )}
          </div>

          {/* Section: Upload Main Room Photos */}
          {formData.hasMainRoomInRoof === "yes" && (
            <div className="mb-6">
              <PhotoUploader
                label="Upload Main Room in Roof Photos"
                inputName="mainRoomPhotos"
                onFileChange={handleMainRoomFileChange}
                imagePreviews={mainRoomPreviews}
                onDeleteImage={handleDeleteMainRoomImage}
                isViewOnly={isViewOnly}
              />
            </div>
          )}

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
              <option value="Flat ceiling only">Flat ceiling only</option>
              <option value="All elements">All elements</option>
              <option value="As Built">As Built</option>
              <option value="Unknown">Unknown</option>
            </select>
            {errors.insulationType && (
              <p className="text-red-500 text-sm mt-1">{errors.insulationType}</p>
            )}
          </div>

          {/* Section: Insulation Thickness at Ceiling */}
          <div className="mb-6">
            <Label>Insulation Thickness at Ceiling:</Label>
            <select
              name="insulationThicknessCeiling"
              value={formData.insulationThicknessCeiling}
              onChange={handleChange}
              className={`w-full mt-1 border rounded px-2 py-2 ${errors.insulationThicknessCeiling ? "border-red-500" : ""}`}
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
              <option value="Not Applicable">Not Applicable</option>
            </select>
            {errors.insulationThicknessCeiling && (
              <p className="text-red-500 text-sm mt-1">{errors.insulationThicknessCeiling}</p>
            )}
          </div>

          {/* Section: Insulation of Other Parts */}
          <div className="mb-6">
            <Label>Insulation of Other Parts:</Label>
            <select
              name="insulationOtherParts"
              value={formData.insulationOtherParts}
              onChange={handleChange}
              className={`w-full mt-1 border rounded px-2 py-2 ${errors.insulationOtherParts ? "border-red-500" : ""}`}
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
            {errors.insulationOtherParts && (
              <p className="text-red-500 text-sm mt-1">{errors.insulationOtherParts}</p>
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