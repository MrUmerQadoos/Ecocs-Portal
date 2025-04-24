import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/store/authStore";
import PhotoUploader from "@/components/ui/photo/PhotoUpload";

export default function FormSeventeen() {
  const navigate = useNavigate();
  const { processId: urlProcessId } = useParams(); // e.g., /process/:processId/form-seventeen
  const location = useLocation();
  const { toast } = useToast();
  const { user } = useAuthStore();

  // State for form data and metadata
  const [formData, setFormData] = useState({
    hasFghrsPhotos: "", // "yes" or "no" (input_radio_42)
    isFghrsPresent: "", // "yes" or "no" (input_radio_15)
    indexNumber: "", // numeric_field_25
    brandModel: "", // input_text_62
    pvCellsKwp: "", // numeric_field_26
    elevation: "", // numeric_field_27
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

  // Image Handling (for FGHRS photos if present)
  const [fghrsPhotos, setFghrsPhotos] = useState([]);
  const [fghrsPreviews, setFghrsPreviews] = useState([]);
  const [fghrsDeleted, setFghrsDeleted] = useState([]);

  // Determine mode (edit or view) and load existing data
  useEffect(() => {
    const isViewing = location.pathname.includes("/view-form");
    setIsViewOnly(isViewing || user.role !== "surveyor");
    const queryTaskId = new URLSearchParams(location.search).get("taskId");
    setTaskId(queryTaskId);

    if (urlProcessId && urlProcessId !== "new") {
      setLoading(true);
      fetch(`http://localhost:3000/api/assessments/form-seventeen?processId=${urlProcessId}`, {
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

            // Set FGHRS photos preview if available
            if (existingForm.fghrsPhotos && existingForm.fghrsPhotos.length > 0) {
              const previews = existingForm.fghrsPhotos.map(
                (img) => `http://localhost:3000/${img}`
              );
              setFghrsPreviews(previews);
            }
          } else if (isViewing) {
            toast({
              variant: "destructive",
              title: "Error",
              description: "Form Seventeen data not found.",
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
            description: "Error fetching Form Seventeen data.",
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

  // Handle FGHRS photo file change
  const handleFghrsFileChange = (e) => {
    if (isViewOnly) return;
    const selectedFiles = Array.from(e.target.files);
    setFghrsPhotos((prev) => [...prev, ...selectedFiles]);
    const previewUrls = selectedFiles.map((file) => URL.createObjectURL(file));
    setFghrsPreviews((prev) => [...prev, ...previewUrls]);
    setUnsavedChanges(true);
  };

  // Delete FGHRS photo
  const handleDeleteFghrsImage = (index, previewUrl) => {
    if (isViewOnly) return;
    const updatedPreviews = fghrsPreviews.filter((_, idx) => idx !== index);
    setFghrsPreviews(updatedPreviews);

    const isNewUpload = previewUrl.startsWith("blob:");
    if (isNewUpload) {
      const updatedFiles = fghrsPhotos.filter(
        (_, idx) => idx !== index - (fghrsPreviews.length - fghrsPhotos.length)
      );
      setFghrsPhotos(updatedFiles);
    } else {
      setFghrsDeleted((prev) => [...prev, previewUrl]);
    }

    setUnsavedChanges(true);
  };

  // Form validation
  const validateForm = () => {
    const newErrors = {};

    if (!formData.hasFghrsPhotos) {
      newErrors.hasFghrsPhotos = "FGHRS photos selection is required.";
    }
    if (!formData.isFghrsPresent) {
      newErrors.isFghrsPresent = "FGHRS presence selection is required.";
    }
    if (formData.isFghrsPresent === "yes") {
      if (!formData.indexNumber) {
        newErrors.indexNumber = "Index number is required when FGHRS is present.";
      }
      if (!formData.brandModel) {
        newErrors.brandModel = "Brand/Model is required when FGHRS is present.";
      }
      if (!formData.pvCellsKwp) {
        newErrors.pvCellsKwp = "PV Cells kWP is required when FGHRS is present.";
      }
      if (!formData.elevation) {
        newErrors.elevation = "Elevation is required when FGHRS is present.";
      }
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
        if (key !== "fghrsPhotos") {
          formDataToSend.append(key, formData[key]);
        }
      }

      // Append new files
      if (fghrsPhotos.length > 0) {
        fghrsPhotos.forEach((file) => {
          formDataToSend.append("fghrsPhotos", file);
        });
      }

      // Append deleted images
      if (fghrsDeleted.length > 0) {
        formDataToSend.append("deletedFghrsPhotos", JSON.stringify(fghrsDeleted));
      }

      const url = docId
        ? `http://localhost:3000/api/assessments/form-seventeen/${docId}`
        : "http://localhost:3000/api/assessments/form-seventeen";
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
        setFghrsPhotos([]);
        setFghrsDeleted([]);
        setFghrsPreviews(
          data.data.fghrsPhotos?.map((photo) => `http://localhost:3000/${photo}`) || []
        );
        toast({
          title: "Success",
          description: `Form Seventeen ${docId ? "updated" : "saved"} successfully!`,
        });
        return { success: true, processId: data.data.processId };
      } else {
        throw new Error(data.error || "Failed to save Form Seventeen");
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
        navigate(`/view-form/${result.processId}/form-seventeen?taskId=${taskId}`);
      } else {
        navigate(`/process/${result.processId}/form-seventeen?taskId=${taskId}`, { replace: true });
      }
    }
  };

  // Handle navigation to the next form
  const handleNext = async () => {
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

  // Handle navigation to the previous form
  const handlePrevious = async () => {
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
            {isViewOnly ? "View Form Seventeen" : "17. FGHRS (Flue Gas Heat Recovery System)"}
          </h1>

          {/* Section: FGHRS Photos */}
          <div className="mb-6">
            <Label>FGHRS Photos?</Label>
            <div className="flex gap-4 mt-2">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="hasFghrsPhotos"
                  value="yes"
                  checked={formData.hasFghrsPhotos === "yes"}
                  onChange={handleChange}
                  disabled={isViewOnly}
                  className="form-radio"
                />
                <span>Yes</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="hasFghrsPhotos"
                  value="no"
                  checked={formData.hasFghrsPhotos === "no"}
                  onChange={handleChange}
                  disabled={isViewOnly}
                  className="form-radio"
                />
                <span>No</span>
              </label>
            </div>
            {errors.hasFghrsPhotos && (
              <p className="text-red-500 text-sm mt-1">{errors.hasFghrsPhotos}</p>
            )}
          </div>

          {/* Section: Upload FGHRS Photos (if yes) */}
          {formData.hasFghrsPhotos === "yes" && (
            <div className="mb-6">
              <PhotoUploader
                label="Upload FGHRS Photos"
                inputName="fghrsPhotos"
                onFileChange={handleFghrsFileChange}
                imagePreviews={fghrsPreviews}
                onDeleteImage={handleDeleteFghrsImage}
                isViewOnly={isViewOnly}
              />
            </div>
          )}

          {/* Section: FGHRS Present */}
          <div className="mb-6">
            <Label>Present:</Label>
            <div className="flex gap-4 mt-2">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="isFghrsPresent"
                  value="yes"
                  checked={formData.isFghrsPresent === "yes"}
                  onChange={handleChange}
                  disabled={isViewOnly}
                  className="form-radio"
                />
                <span>Yes</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="isFghrsPresent"
                  value="no"
                  checked={formData.isFghrsPresent === "no"}
                  onChange={handleChange}
                  disabled={isViewOnly}
                  className="form-radio"
                />
                <span>No</span>
              </label>
            </div>
            {errors.isFghrsPresent && (
              <p className="text-red-500 text-sm mt-1">{errors.isFghrsPresent}</p>
            )}
          </div>

          {/* Conditional Fields (only if FGHRS is present) */}
          {formData.isFghrsPresent === "yes" && (
            <>
              {/* Section: Index Number */}
              <div className="mb-6">
                <Label>Index Number:</Label>
                <input
                  type="number"
                  name="indexNumber"
                  value={formData.indexNumber}
                  onChange={handleChange}
                  className={`w-full mt-1 border rounded px-2 py-2 ${errors.indexNumber ? "border-red-500" : ""}`}
                  disabled={isViewOnly}
                  step="any"
                />
                {errors.indexNumber && (
                  <p className="text-red-500 text-sm mt-1">{errors.indexNumber}</p>
                )}
              </div>

              {/* Section: Brand/Model */}
              <div className="mb-6">
                <Label>Brand/Model:</Label>
                <input
                  type="text"
                  name="brandModel"
                  value={formData.brandModel}
                  onChange={handleChange}
                  className={`w-full mt-1 border rounded px-2 py-2 ${errors.brandModel ? "border-red-500" : ""}`}
                  disabled={isViewOnly}
                />
                {errors.brandModel && (
                  <p className="text-red-500 text-sm mt-1">{errors.brandModel}</p>
                )}
              </div>

              {/* Section: PV Cells kWP */}
              <div className="mb-6">
                <Label>PV Cells kWP:</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    name="pvCellsKwp"
                    value={formData.pvCellsKwp}
                    onChange={handleChange}
                    className={`w-full mt-1 border rounded px-2 py-2 ${errors.pvCellsKwp ? "border-red-500" : ""}`}
                    disabled={isViewOnly}
                    step="any"
                  />
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
                      Photovoltaic Panel for FGHRS
                    </div>
                  </div>
                </div>
                {errors.pvCellsKwp && (
                  <p className="text-red-500 text-sm mt-1">{errors.pvCellsKwp}</p>
                )}
              </div>

              {/* Section: Elevation */}
              <div className="mb-6">
                <Label>Elevation:</Label>
                <input
                  type="number"
                  name="elevation"
                  value={formData.elevation}
                  onChange={handleChange}
                  className={`w-full mt-1 border rounded px-2 py-2 ${errors.elevation ? "border-red-500" : ""}`}
                  disabled={isViewOnly}
                  step="any"
                />
                {errors.elevation && (
                  <p className="text-red-500 text-sm mt-1">{errors.elevation}</p>
                )}
              </div>
            </>
          )}

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