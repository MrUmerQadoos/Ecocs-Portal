  import { useState, useEffect } from "react";
  import { useNavigate, useParams, useLocation } from "react-router-dom";
  import { motion } from "framer-motion";
  import { Button } from "@/components/ui/button";
  import { Label } from "@/components/ui/label";
  import { Input } from "@/components/ui/input";
  import { useToast } from "@/hooks/use-toast";
  import { useAuthStore } from "@/store/authStore";
  import PhotoUploader from "@/components/ui/photo/PhotoUpload";

  export default function FormTwelve() {
    const navigate = useNavigate();
    const { processId: urlProcessId } = useParams(); // e.g., /process/:processId/form-twelve
    const location = useLocation();
    const { toast } = useToast();
    const { user } = useAuthStore();

    // State for form data and metadata
    const [formData, setFormData] = useState({
      hasVentilationCoolingPhotos: "", // "yes" or "no"
      numberOfOpenFireplaces: "",
      mechanicalVentilation: "",
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
    const [ventilationCoolingFiles, setVentilationCoolingFiles] = useState([]);
    const [ventilationCoolingPreviews, setVentilationCoolingPreviews] = useState([]);
    const [ventilationCoolingDeleted, setVentilationCoolingDeleted] = useState([]);

    // Determine mode (edit or view) and load existing data
    useEffect(() => {
      const isViewing = location.pathname.includes("/view-form");
      setIsViewOnly(isViewing || user.role !== "surveyor");
      const queryTaskId = new URLSearchParams(location.search).get("taskId");
      setTaskId(queryTaskId);

      if (urlProcessId && urlProcessId !== "new") {
        setLoading(true);
        fetch(`http://localhost:3000/api/assessments/form-twelve?processId=${urlProcessId}`, {
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

              // Set ventilation & cooling photos preview if available
              if (existingForm.ventilationCoolingPhotos && existingForm.ventilationCoolingPhotos.length > 0) {
                const previews = existingForm.ventilationCoolingPhotos.map(
                  (img) => `http://localhost:3000/${img}`
                );
                setVentilationCoolingPreviews(previews);
              }
            } else if (isViewing) {
              toast({
                variant: "destructive",
                title: "Error",
                description: "Form Twelve data not found.",
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
              description: "Error fetching Form Twelve data.",
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

    // Handle ventilation & cooling photos file change
    const handleVentilationCoolingFileChange = (e) => {
      if (isViewOnly) return;
      const selectedFiles = Array.from(e.target.files);
      setVentilationCoolingFiles((prev) => [...prev, ...selectedFiles]);
      const previewUrls = selectedFiles.map((file) => URL.createObjectURL(file));
      setVentilationCoolingPreviews((prev) => [...prev, ...previewUrls]);
      setUnsavedChanges(true);
    };

    // Delete ventilation & cooling photo
    const handleDeleteVentilationCoolingImage = (index, previewUrl) => {
      if (isViewOnly) return;
      const updatedPreviews = ventilationCoolingPreviews.filter((_, idx) => idx !== index);
      setVentilationCoolingPreviews(updatedPreviews);

      const isNewUpload = previewUrl.startsWith("blob:");
      if (isNewUpload) {
        const updatedFiles = ventilationCoolingFiles.filter(
          (_, idx) => idx !== index - (ventilationCoolingPreviews.length - ventilationCoolingFiles.length)
        );
        setVentilationCoolingFiles(updatedFiles);
      } else {
        setVentilationCoolingDeleted((prev) => [...prev, previewUrl]);
      }

      setUnsavedChanges(true);
    };

    // Form validation
    const validateForm = () => {
      const newErrors = {};

      if (!formData.hasVentilationCoolingPhotos) {
        newErrors.hasVentilationCoolingPhotos = "Please specify if ventilation & cooling photos are available.";
      }
      if (!formData.numberOfOpenFireplaces && formData.numberOfOpenFireplaces !== "0") {
        newErrors.numberOfOpenFireplaces = "Number of open fireplaces is required.";
      }
      if (!formData.mechanicalVentilation) {
        newErrors.mechanicalVentilation = "Mechanical ventilation type is required.";
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
          if (key !== "ventilationCoolingPhotos") {
            formDataToSend.append(key, formData[key]);
          }
        }

        // Append new files
        if (ventilationCoolingFiles.length > 0) {
          ventilationCoolingFiles.forEach((file) => {
            formDataToSend.append("ventilationCoolingPhotos", file);
          });
        }

        // Append deleted images
        if (ventilationCoolingDeleted.length > 0) {
          formDataToSend.append("deletedVentilationCoolingPhotos", JSON.stringify(ventilationCoolingDeleted));
        }

        const url = docId
          ? `http://localhost:3000/api/assessments/form-twelve/${docId}`
          : "http://localhost:3000/api/assessments/form-twelve";
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
          setVentilationCoolingFiles([]);
          setVentilationCoolingDeleted([]);
          setVentilationCoolingPreviews(
            data.data.ventilationCoolingPhotos.map((photo) => `http://localhost:3000/${photo}`)
          );
          toast({
            title: "Success",
            description: `Form Twelve ${docId ? "updated" : "saved"} successfully!`,
          });
          return { success: true, processId: data.data.processId };
        } else {
          throw new Error(data.error || "Failed to save Form Twelve");
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
          navigate(`/view-form/${result.processId}/form-twelve?taskId=${taskId}`);
        } else {
          navigate(`/process/${result.processId}/form-twelve?taskId=${taskId}`, { replace: true });
        }
      }
    };

    // Handle navigation to the next form (assuming Form Thirteen follows)
    const handleNext = async () => {
      if (!isViewOnly) {
        const result = await saveForm();
        if (result.success) {
          if (user.role === "surveyor") {
            navigate(`/process/${result.processId}/form-thirteen?taskId=${taskId}`);
          } else {
            navigate(`/view-form/${result.processId}/form-thirteen?taskId=${taskId}`);
          }
        }
      } else {
        navigate(`/view-form/${savedProcessId || urlProcessId}/form-thirteen?taskId=${taskId}`);
      }
    };

    // Handle navigation to the previous form (Form Eleven)
    const handlePrevious = async () => {
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
              {isViewOnly ? "View Form Twelve" : "12. Ventilation"}
            </h1>

            {/* Section: Ventilation & Cooling Photos */}
            <div className="mb-6">
              <Label>Ventilation & Cooling Photos Available?</Label>
              <div className="flex gap-4 mt-2">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="hasVentilationCoolingPhotos"
                    value="yes"
                    checked={formData.hasVentilationCoolingPhotos === "yes"}
                    onChange={handleChange}
                    disabled={isViewOnly}
                  />
                  Yes
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="hasVentilationCoolingPhotos"
                    value="no"
                    checked={formData.hasVentilationCoolingPhotos === "no"}
                    onChange={handleChange}
                    disabled={isViewOnly}
                  />
                  No
                </label>
              </div>
              {errors.hasVentilationCoolingPhotos && (
                <p className="text-red-500 text-sm mt-1">{errors.hasVentilationCoolingPhotos}</p>
              )}
            </div>

            {/* Section: Upload Ventilation & Cooling Photos */}
            {formData.hasVentilationCoolingPhotos === "yes" && (
              <div className="mb-6">
                <PhotoUploader
                  label="Upload Ventilation & Cooling Photos (Recommended)"
                  inputName="ventilationCoolingPhotos"
                  onFileChange={handleVentilationCoolingFileChange}
                  imagePreviews={ventilationCoolingPreviews}
                  onDeleteImage={handleDeleteVentilationCoolingImage}
                  isViewOnly={isViewOnly}
                />
              </div>
            )}

            {/* Section: Number of Open Fireplaces */}
            <div className="mb-6">
              <Label>Number of Open Fireplaces:</Label>
              <Input
                type="number"
                name="numberOfOpenFireplaces"
                value={formData.numberOfOpenFireplaces}
                onChange={handleChange}
                className={`mt-1 ${errors.numberOfOpenFireplaces ? "border-red-500" : ""}`}
                step="1"
                min="0"
                disabled={isViewOnly}
              />
              {errors.numberOfOpenFireplaces && (
                <p className="text-red-500 text-sm mt-1">{errors.numberOfOpenFireplaces}</p>
              )}
            </div>

            {/* Section: Mechanical Ventilation */}
            <div className="mb-6">
              <Label>Mechanical Ventilation:</Label>
              <select
                name="mechanicalVentilation"
                value={formData.mechanicalVentilation}
                onChange={handleChange}
                className={`w-full mt-1 border rounded px-2 py-2 ${errors.mechanicalVentilation ? "border-red-500" : ""}`}
                disabled={isViewOnly}
              >
                <option value="">- Select -</option>
                <option value="Supply Extract System">Supply Extract System</option>
                <option value="Fixed Space Cooling">Fixed Space Cooling</option>
                <option value="None">None</option>
              </select>
              {errors.mechanicalVentilation && (
                <p className="text-red-500 text-sm mt-1">{errors.mechanicalVentilation}</p>
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