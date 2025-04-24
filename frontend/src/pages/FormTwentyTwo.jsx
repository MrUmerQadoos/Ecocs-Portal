import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/store/authStore";
import PhotoUploader from "@/components/ui/photo/PhotoUpload";

export default function FormTwentyTwo() {
  const navigate = useNavigate();
  const { processId: urlProcessId } = useParams();
  const location = useLocation();
  const { toast } = useToast();
  const { user } = useAuthStore();

  // State for form data and metadata
  const [formData, setFormData] = useState({
    extensionDateBand: "",
    extensionRoomsInRoofDateBand: "",
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
  const [extensionRoomPhotos, setExtensionRoomPhotos] = useState([]);
  const [extensionRoomPreviews, setExtensionRoomPreviews] = useState([]);
  const [extensionRoomDeleted, setExtensionRoomDeleted] = useState([]);

  // Determine mode (edit or view) and load existing data
  useEffect(() => {
    const isViewing = location.pathname.includes("/view-form");
    setIsViewOnly(isViewing || user.role !== "surveyor");
    const queryTaskId = new URLSearchParams(location.search).get("taskId");
    setTaskId(queryTaskId);

    if (urlProcessId && urlProcessId !== "new") {
      setLoading(true);
      fetch(`http://localhost:3000/api/assessments/form-twenty-two?processId=${urlProcessId}`, {
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

            // Set extension room photos preview if available
            if (existingForm.extensionRoomPhotos && existingForm.extensionRoomPhotos.length > 0) {
              const previews = existingForm.extensionRoomPhotos.map(
                (img) => `http://localhost:3000/${img}`
              );
              setExtensionRoomPreviews(previews);
            }
          } else if (isViewing) {
            toast({
              variant: "destructive",
              title: "Error",
              description: "Form Twenty-Two data not found.",
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
            description: "Error fetching Form Twenty-Two data.",
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

  // Handle extension room photo file change
  const handleExtensionRoomFileChange = (e) => {
    if (isViewOnly) return;
    const selectedFiles = Array.from(e.target.files);
    setExtensionRoomPhotos((prev) => [...prev, ...selectedFiles]);
    const previewUrls = selectedFiles.map((file) => URL.createObjectURL(file));
    setExtensionRoomPreviews((prev) => [...prev, ...previewUrls]);
    setUnsavedChanges(true);
  };

  // Delete extension room photo
  const handleDeleteExtensionRoomImage = (index, previewUrl) => {
    if (isViewOnly) return;
    const updatedPreviews = extensionRoomPreviews.filter((_, idx) => idx !== index);
    setExtensionRoomPreviews(updatedPreviews);

    const isNewUpload = previewUrl.startsWith("blob:");
    if (isNewUpload) {
      const updatedFiles = extensionRoomPhotos.filter(
        (_, idx) => idx !== index - (extensionRoomPreviews.length - extensionRoomPhotos.length)
      );
      setExtensionRoomPhotos(updatedFiles);
    } else {
      setExtensionRoomDeleted((prev) => [...prev, previewUrl]);
    }

    setUnsavedChanges(true);
  };

  // Form validation
  const validateForm = () => {
    const newErrors = {};

    if (!formData.extensionDateBand) {
      newErrors.extensionDateBand = "Extension Date Band is required.";
    }
    if (!formData.extensionRoomsInRoofDateBand) {
      newErrors.extensionRoomsInRoofDateBand = "Extension Rooms in Roof Date Band is required.";
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
        formDataToSend.append(key, formData[key]);
      }

      // Append new files
      if (extensionRoomPhotos.length > 0) {
        extensionRoomPhotos.forEach((file) => {
          formDataToSend.append("extensionRoomPhotos", file);
        });
      }

      // Append deleted images
      if (extensionRoomDeleted.length > 0) {
        formDataToSend.append("deletedExtensionRoomPhotos", JSON.stringify(extensionRoomDeleted));
      }

      const url = docId
        ? `http://localhost:3000/api/assessments/form-twenty-two/${docId}`
        : "http://localhost:3000/api/assessments/form-twenty-two";
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
        setExtensionRoomPhotos([]);
        setExtensionRoomDeleted([]);
        setExtensionRoomPreviews(
          data.data.extensionRoomPhotos.map((photo) => `http://localhost:3000/${photo}`)
        );
        toast({
          title: "Success",
          description: `Form Twenty-Two ${docId ? "updated" : "saved"} successfully!`,
        });
        return { success: true, processId: data.data.processId };
      } else {
        throw new Error(data.error || "Failed to save Form Twenty-Two");
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
        navigate(`/view-form/${result.processId}/form-twenty-two?taskId=${taskId}`);
      } else {
        navigate(`/process/${result.processId}/form-twenty-two?taskId=${taskId}`, { replace: true });
      }
    }
  };

  // Handle navigation to the next form
  const handleNext = async () => {
    if (!isViewOnly) {
      const result = await saveForm();
      if (result.success) {
        if (user.role === "surveyor") {
          navigate(`/process/${result.processId}/form-twenty-three?taskId=${taskId}`);
        } else {
          navigate(`/view-form/${result.processId}/form-twenty-three?taskId=${taskId}`);
        }
      }
    } else {
      navigate(`/view-form/${savedProcessId || urlProcessId}/form-twenty-three?taskId=${taskId}`);
    }
  };

  // Handle navigation to the previous form
  const handlePrevious = async () => {
    if (!isViewOnly) {
      const result = await saveForm();
      if (result.success) {
        if (user.role === "surveyor") {
          navigate(`/process/${result.processId}/form-twenty-one?taskId=${taskId}`);
        } else {
          navigate(`/view-form/${result.processId}/form-twenty-one?taskId=${taskId}`);
        }
      }
    } else {
      navigate(`/view-form/${savedProcessId || urlProcessId}/form-twenty-one?taskId=${taskId}`);
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
            {isViewOnly ? "View Form Twenty-Two" : "22. Extension Details"}
          </h1>

          {/* Section Break */}
          <div className="ff-el-group ff-el-section-break ff_center" data-name="section_break-3_30">
            <h3 className="ff-el-section-title">1. Extension Date</h3>
            <div className="ff-section_break_desk"></div>
            <hr />
          </div>

          {/* Section: Extension Date Band */}
          <div className="ff-el-group">
            <div className="ff-el-input--label asterisk-right">
              <Label htmlFor="ff_3_numeric_field_38">Extension Date Band (please fill in):</Label>
            </div>
            <div className="ff-el-input--content">
              <input
                type="number"
                name="extensionDateBand"
                id="ff_3_numeric_field_38"
                value={formData.extensionDateBand}
                onChange={handleChange}
                className={`ff-el-form-control w-full mt-1 border rounded px-2 py-2 ${errors.extensionDateBand ? "border-red-500" : ""}`}
                inputMode="numeric"
                step="any"
                aria-required="true"
                disabled={isViewOnly}
              />
              {errors.extensionDateBand && (
                <p className="text-red-500 text-sm mt-1">{errors.extensionDateBand}</p>
              )}
            </div>
          </div>

          {/* Section: Extension Room Photos */}
          <div className="ff-el-group">
            <div className="ff-el-input--label asterisk-right">
              <Label>Extension Room</Label>
            </div>
            <div className="ff-el-input--content">
              <PhotoUploader
                label="Choose File"
                inputName="extensionRoomPhotos"
                onFileChange={handleExtensionRoomFileChange}
                imagePreviews={extensionRoomPreviews}
                onDeleteImage={handleDeleteExtensionRoomImage}
                isViewOnly={isViewOnly}
                className="ff_upload_btn ff-btn"
                listClassName="ff-uploaded-list"
                listStyle={{ fontSize: "12px", marginTop: "15px" }}
              />
            </div>
          </div>

          {/* Section: Extension Rooms in Roof Date Band */}
          <div className="ff-el-group">
            <div className="ff-el-input--label asterisk-right">
              <Label htmlFor="ff_3_input_text_79">Extension Room/s in Roof Date Band:</Label>
            </div>
            <div className="ff-el-input--content">
              <input
                type="text"
                name="extensionRoomsInRoofDateBand"
                id="ff_3_input_text_79"
                value={formData.extensionRoomsInRoofDateBand}
                onChange={handleChange}
                className={`ff-el-form-control w-full mt-1 border rounded px-2 py-2 ${errors.extensionRoomsInRoofDateBand ? "border-red-500" : ""}`}
                aria-required="true"
                disabled={isViewOnly}
              />
              {errors.extensionRoomsInRoofDateBand && (
                <p className="text-red-500 text-sm mt-1">{errors.extensionRoomsInRoofDateBand}</p>
              )}
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