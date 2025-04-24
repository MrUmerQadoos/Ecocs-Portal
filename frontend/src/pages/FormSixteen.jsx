import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/store/authStore";
import PhotoUploader from "@/components/ui/photo/PhotoUpload";

export default function FormSixteen() {
  const navigate = useNavigate();
  const { processId: urlProcessId } = useParams(); // e.g., /process/:processId/form-sixteen
  const location = useLocation();
  const { toast } = useToast();
  const { user } = useAuthStore();

  // State for form data and metadata
  const [formData, setFormData] = useState({
    totalRoomsWithBathOrShower: "", // numeric_field_22
    roomsWithMixerShowerNoBath: "", // numeric_field_23
    roomsWithBathAndMixerShower: "", // numeric_field_24
    isWwhrsPresent: "", // dropdown_51: "No/Unknown", "Yes - Instantaneous Type", etc.
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

  // Image Handling (for WWHRS photos if present)
  const [wwhrsPhotos, setWwhrsPhotos] = useState([]);
  const [wwhrsPreviews, setWwhrsPreviews] = useState([]);
  const [wwhrsDeleted, setWwhrsDeleted] = useState([]);

  // Determine mode (edit or view) and load existing data
  useEffect(() => {
    const isViewing = location.pathname.includes("/view-form");
    setIsViewOnly(isViewing || user.role !== "surveyor");
    const queryTaskId = new URLSearchParams(location.search).get("taskId");
    setTaskId(queryTaskId);

    if (urlProcessId && urlProcessId !== "new") {
      setLoading(true);
      fetch(`http://localhost:3000/api/assessments/form-sixteen?processId=${urlProcessId}`, {
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

            // Set WWHRS photos preview if available
            if (existingForm.wwhrsPhotos && existingForm.wwhrsPhotos.length > 0) {
              const previews = existingForm.wwhrsPhotos.map(
                (img) => `http://localhost:3000/${img}`
              );
              setWwhrsPreviews(previews);
            }
          } else if (isViewing) {
            toast({
              variant: "destructive",
              title: "Error",
              description: "Form Sixteen data not found.",
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
            description: "Error fetching Form Sixteen data.",
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

  // Handle WWHRS photo file change
  const handleWwhrsFileChange = (e) => {
    if (isViewOnly) return;
    const selectedFiles = Array.from(e.target.files);
    setWwhrsPhotos((prev) => [...prev, ...selectedFiles]);
    const previewUrls = selectedFiles.map((file) => URL.createObjectURL(file));
    setWwhrsPreviews((prev) => [...prev, ...previewUrls]);
    setUnsavedChanges(true);
  };

  // Delete WWHRS photo
  const handleDeleteWwhrsImage = (index, previewUrl) => {
    if (isViewOnly) return;
    const updatedPreviews = wwhrsPreviews.filter((_, idx) => idx !== index);
    setWwhrsPreviews(updatedPreviews);

    const isNewUpload = previewUrl.startsWith("blob:");
    if (isNewUpload) {
      const updatedFiles = wwhrsPhotos.filter(
        (_, idx) => idx !== index - (wwhrsPreviews.length - wwhrsPhotos.length)
      );
      setWwhrsPhotos(updatedFiles);
    } else {
      setWwhrsDeleted((prev) => [...prev, previewUrl]);
    }

    setUnsavedChanges(true);
  };

  // Form validation
  const validateForm = () => {
    const newErrors = {};

    if (!formData.totalRoomsWithBathOrShower) {
      newErrors.totalRoomsWithBathOrShower = "Total number of rooms with bath or shower is required.";
    }
    if (!formData.roomsWithMixerShowerNoBath) {
      newErrors.roomsWithMixerShowerNoBath = "Number of rooms with mixer shower and no bath is required.";
    }
    if (!formData.roomsWithBathAndMixerShower) {
      newErrors.roomsWithBathAndMixerShower = "Number of rooms with bath and mixer shower is required.";
    }
    if (!formData.isWwhrsPresent) {
      newErrors.isWwhrsPresent = "WWHRS presence selection is required.";
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
        if (key !== "wwhrsPhotos") {
          formDataToSend.append(key, formData[key]);
        }
      }

      // Append new files
      if (wwhrsPhotos.length > 0) {
        wwhrsPhotos.forEach((file) => {
          formDataToSend.append("wwhrsPhotos", file);
        });
      }

      // Append deleted images
      if (wwhrsDeleted.length > 0) {
        formDataToSend.append("deletedWwhrsPhotos", JSON.stringify(wwhrsDeleted));
      }

      const url = docId
        ? `http://localhost:3000/api/assessments/form-sixteen/${docId}`
        : "http://localhost:3000/api/assessments/form-sixteen";
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
        setWwhrsPhotos([]);
        setWwhrsDeleted([]);
        setWwhrsPreviews(
          data.data.wwhrsPhotos?.map((photo) => `http://localhost:3000/${photo}`) || []
        );
        toast({
          title: "Success",
          description: `Form Sixteen ${docId ? "updated" : "saved"} successfully!`,
        });
        return { success: true, processId: data.data.processId };
      } else {
        throw new Error(data.error || "Failed to save Form Sixteen");
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
        navigate(`/view-form/${result.processId}/form-sixteen?taskId=${taskId}`);
      } else {
        navigate(`/process/${result.processId}/form-sixteen?taskId=${taskId}`, { replace: true });
      }
    }
  };

  // Handle navigation to the next form
  const handleNext = async () => {
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

  // Handle navigation to the previous form
  const handlePrevious = async () => {
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
            {isViewOnly ? "View Form Sixteen" : "16. WWHRS (Waste Water Heat Recovery System)"}
          </h1>
          <p className="text-sm text-gray-600 mb-4 text-center">
            Note: Documentary evidence required
          </p>

          {/* Section: Total Number of Rooms with Bath and/or Shower */}
          <div className="mb-6">
            <Label>Total Number of Rooms with Bath and/or Shower:</Label>
            <input
              type="number"
              name="totalRoomsWithBathOrShower"
              value={formData.totalRoomsWithBathOrShower}
              onChange={handleChange}
              className={`w-full mt-1 border rounded px-2 py-2 ${errors.totalRoomsWithBathOrShower ? "border-red-500" : ""}`}
              disabled={isViewOnly}
              min="0"
              step="1"
            />
            {errors.totalRoomsWithBathOrShower && (
              <p className="text-red-500 text-sm mt-1">{errors.totalRoomsWithBathOrShower}</p>
            )}
          </div>

          {/* Section: Number of Rooms with Mixer Shower and No Bath */}
          <div className="mb-6">
            <Label>Number of Rooms with Mixer Shower and No Bath:</Label>
            <input
              type="number"
              name="roomsWithMixerShowerNoBath"
              value={formData.roomsWithMixerShowerNoBath}
              onChange={handleChange}
              className={`w-full mt-1 border rounded px-2 py-2 ${errors.roomsWithMixerShowerNoBath ? "border-red-500" : ""}`}
              disabled={isViewOnly}
              min="0"
              step="1"
            />
            {errors.roomsWithMixerShowerNoBath && (
              <p className="text-red-500 text-sm mt-1">{errors.roomsWithMixerShowerNoBath}</p>
            )}
          </div>

          {/* Section: Number of Rooms with Bath and Mixer Shower */}
          <div className="mb-6">
            <Label>Number of Rooms with Bath and Mixer Shower:</Label>
            <input
              type="number"
              name="roomsWithBathAndMixerShower"
              value={formData.roomsWithBathAndMixerShower}
              onChange={handleChange}
              className={`w-full mt-1 border rounded px-2 py-2 ${errors.roomsWithBathAndMixerShower ? "border-red-500" : ""}`}
              disabled={isViewOnly}
              min="0"
              step="1"
            />
            {errors.roomsWithBathAndMixerShower && (
              <p className="text-red-500 text-sm mt-1">{errors.roomsWithBathAndMixerShower}</p>
            )}
          </div>

          {/* Section: Is WWHRS Present */}
          <div className="mb-6">
            <Label>Is WWHRS Present in the Property:</Label>
            <div className="flex items-center gap-2">
              <select
                name="isWwhrsPresent"
                value={formData.isWwhrsPresent}
                onChange={handleChange}
                className={`w-full mt-1 border rounded px-2 py-2 ${errors.isWwhrsPresent ? "border-red-500" : ""}`}
                disabled={isViewOnly}
              >
                <option value="">- Select -</option>
                <option value="No/Unknown">No/Unknown</option>
                <option value="Yes - Instantaneous Type">Yes - Instantaneous Type</option>
                <option value="Yes - Storage">Yes - Storage</option>
                <option value="Yes - Both">Yes - Both</option>
              </select>
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
                  If yes, please see page 7 for further details of WWHRS
                </div>
              </div>
            </div>
            {errors.isWwhrsPresent && (
              <p className="text-red-500 text-sm mt-1">{errors.isWwhrsPresent}</p>
            )}
          </div>

          {/* Section: Upload WWHRS Photos (if present) */}
          {formData.isWwhrsPresent && formData.isWwhrsPresent !== "No/Unknown" && (
            <div className="mb-6">
              <PhotoUploader
                label="Upload WWHRS Photos (Documentary Evidence)"
                inputName="wwhrsPhotos"
                onFileChange={handleWwhrsFileChange}
                imagePreviews={wwhrsPreviews}
                onDeleteImage={handleDeleteWwhrsImage}
                isViewOnly={isViewOnly}
              />
            </div>
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