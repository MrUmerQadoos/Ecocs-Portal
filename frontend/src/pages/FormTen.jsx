import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/store/authStore";
import PhotoUploader from "@/components/ui/photo/PhotoUpload";

export default function FormTen() {
  const navigate = useNavigate();
  const { processId: urlProcessId } = useParams(); // e.g., /process/:processId/form-ten
  const location = useLocation();
  const { toast } = useToast();
  const { user } = useAuthStore();

  // State for form data and metadata
  const [formData, setFormData] = useState({
    location: "",
    type: "",
    insulation: "",
    insulationThickness: "",
    additionalNotes: "",
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
  const [floorPhotos, setFloorPhotos] = useState([]);
  const [floorPreviews, setFloorPreviews] = useState([]);
  const [floorDeleted, setFloorDeleted] = useState([]);

  // Determine mode (edit or view) and load existing data
  useEffect(() => {
    const isViewing = location.pathname.includes("/view-form");
    setIsViewOnly(isViewing || user.role !== "surveyor");
    const queryTaskId = new URLSearchParams(location.search).get("taskId");
    setTaskId(queryTaskId);

    if (urlProcessId && urlProcessId !== "new") {
      setLoading(true);
      fetch(`http://localhost:3000/api/assessments/form-ten?processId=${urlProcessId}`, {
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

            // Set floor photos preview if available
            if (existingForm.floorPhotos && existingForm.floorPhotos.length > 0) {
              const previews = existingForm.floorPhotos.map(
                (img) => `http://localhost:3000/${img}`
              );
              setFloorPreviews(previews);
            }
          } else if (isViewing) {
            toast({
              variant: "destructive",
              title: "Error",
              description: "Form Ten data not found.",
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
            description: "Error fetching Form Ten data.",
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

  // Handle floor photo file change
  const handleFloorFileChange = (e) => {
    if (isViewOnly) return;
    const selectedFiles = Array.from(e.target.files);
    setFloorPhotos((prev) => [...prev, ...selectedFiles]);
    const previewUrls = selectedFiles.map((file) => URL.createObjectURL(file));
    setFloorPreviews((prev) => [...prev, ...previewUrls]);
    setUnsavedChanges(true);
  };

  // Delete floor photo
  const handleDeleteFloorImage = (index, previewUrl) => {
    if (isViewOnly) return;
    const updatedPreviews = floorPreviews.filter((_, idx) => idx !== index);
    setFloorPreviews(updatedPreviews);

    const isNewUpload = previewUrl.startsWith("blob:");
    if (isNewUpload) {
      const updatedFiles = floorPhotos.filter(
        (_, idx) => idx !== index - (floorPreviews.length - floorPhotos.length)
      );
      setFloorPhotos(updatedFiles);
    } else {
      setFloorDeleted((prev) => [...prev, previewUrl]);
    }

    setUnsavedChanges(true);
  };

  // Form validation
  const validateForm = () => {
    const newErrors = {};

    if (!formData.location) {
      newErrors.location = "Location is required.";
    }
    if (!formData.type) {
      newErrors.type = "Type is required.";
    }
    if (!formData.insulation) {
      newErrors.insulation = "Insulation is required.";
    }
    if (formData.insulation === "Retro-fitted" && !formData.insulationThickness) {
      newErrors.insulationThickness = "Insulation thickness is required for retro-fitted insulation.";
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
        if (key !== "floorPhotos") {
          formDataToSend.append(key, formData[key]);
        }
      }

      // Append new files
      if (floorPhotos.length > 0) {
        floorPhotos.forEach((file) => {
          formDataToSend.append("floorPhotos", file);
        });
      }

      // Append deleted images
      if (floorDeleted.length > 0) {
        formDataToSend.append("deletedFloorPhotos", JSON.stringify(floorDeleted));
      }

      const url = docId
        ? `http://localhost:3000/api/assessments/form-ten/${docId}`
        : "http://localhost:3000/api/assessments/form-ten";
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
        setFloorPhotos([]);
        setFloorDeleted([]);
        setFloorPreviews(
          data.data.floorPhotos.map((photo) => `http://localhost:3000/${photo}`)
        );
        toast({
          title: "Success",
          description: `Form Ten ${docId ? "updated" : "saved"} successfully!`,
        });
        return { success: true, processId: data.data.processId };
      } else {
        throw new Error(data.error || "Failed to save Form Ten");
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
        navigate(`/view-form/${result.processId}/form-ten?taskId=${taskId}`);
      } else {
        navigate(`/process/${result.processId}/form-ten?taskId=${taskId}`, { replace: true });
      }
    }
  };

  // Handle navigation to the next form
  const handleNext = async () => {
    if (!isViewOnly) {
      const result = await saveForm();
      if (result.success) {
        if (user.role === "surveyor") {
          navigate(`/process/${result.processId}/form-eleven?taskId=${taskId}`);
        } else {
          navigate(`/view-form/${result.processId}/form-eleven?taskId=${taskId}`);
        }
      }
    } else {
      navigate(`/view-form/${savedProcessId || urlProcessId}/form-eleven?taskId=${taskId}`);
    }
  };

  // Handle navigation to the previous form
  const handlePrevious = async () => {
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
            {isViewOnly ? "View Form Ten" : "10. Floor Details"}
          </h1>

          {/* Section: Location */}
          <div className="mb-6">
            <Label>Location:</Label>
            <select
              name="location"
              value={formData.location}
              onChange={handleChange}
              className={`w-full mt-1 border rounded px-2 py-2 ${errors.location ? "border-red-500" : ""}`}
              disabled={isViewOnly}
            >
              <option value="">- Select -</option>
              <option value="Ground floor">Ground floor</option>
              <option value="Above partially heated space">Above partially heated space</option>
              <option value="Above unheated space">Above unheated space</option>
              <option value="To external air">To external air</option>
              <option value="Same dwelling below">Same dwelling below</option>
              <option value="Another dwelling below">Another dwelling below</option>
            </select>
            {errors.location && (
              <p className="text-red-500 text-sm mt-1">{errors.location}</p>
            )}
          </div>

          {/* Section: Type */}
          <div className="mb-6">
            <Label>Type:</Label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className={`w-full mt-1 border rounded px-2 py-2 ${errors.type ? "border-red-500" : ""}`}
              disabled={isViewOnly}
            >
              <option value="">- Select -</option>
              <option value="Solid">Solid</option>
              <option value="Suspended timber">Suspended timber</option>
              <option value="Suspended, not timber">Suspended, not timber</option>
              <option value="Unknown">Unknown</option>
            </select>
            {errors.type && (
              <p className="text-red-500 text-sm mt-1">{errors.type}</p>
            )}
          </div>

          {/* Section: Insulation */}
          <div className="mb-6">
            <Label>Insulation:</Label>
            <select
              name="insulation"
              value={formData.insulation}
              onChange={handleChange}
              className={`w-full mt-1 border rounded px-2 py-2 ${errors.insulation ? "border-red-500" : ""}`}
              disabled={isViewOnly}
            >
              <option value="">- Select -</option>
              <option value="As Built">As Built</option>
              <option value="Retro-fitted">Retro-fitted</option>
              <option value="Unknown">Unknown</option>
            </select>
            {errors.insulation && (
              <p className="text-red-500 text-sm mt-1">{errors.insulation}</p>
            )}
          </div>

          {/* Section: Insulation Thickness */}
          {formData.insulation === "Retro-fitted" && (
            <div className="mb-6">
              <Label>Insulation Thickness (if retro-fitted):</Label>
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
                <option value="Unknown">Unknown</option>
              </select>
              {errors.insulationThickness && (
                <p className="text-red-500 text-sm mt-1">{errors.insulationThickness}</p>
              )}
            </div>
          )}

          {/* Section: Upload Floor Photos */}
          <div className="mb-6">
            <PhotoUploader
              label="Upload Floor Photos"
              inputName="floorPhotos"
              onFileChange={handleFloorFileChange}
              imagePreviews={floorPreviews}
              onDeleteImage={handleDeleteFloorImage}
              isViewOnly={isViewOnly}
            />
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