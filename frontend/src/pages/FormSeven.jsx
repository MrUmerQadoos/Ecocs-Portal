import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/store/authStore";
import PhotoUploader from "@/components/ui/photo/PhotoUpload";

export default function FormSeven() {
  const navigate = useNavigate();
  const { processId: urlProcessId } = useParams(); // e.g., /process/:processId/form-seven
  const location = useLocation();
  const { toast } = useToast();
  const { user } = useAuthStore();

  // State for form data and metadata
  const [formData, setFormData] = useState({
    hasAlternativeWalls: "",
    wallArea: "",
    shelteredWall: "",
    wallType: "",
    insulation: "",
    externalWallThickness: "",
    wallThicknessUnknown: "",
    insulationThickness: "",
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
  const [wallInsulationFiles, setWallInsulationFiles] = useState([]);
  const [wallInsulationPreviews, setWallInsulationPreviews] = useState([]);
  const [wallInsulationDeleted, setWallInsulationDeleted] = useState([]);

  const [alternativeWallsFiles, setAlternativeWallsFiles] = useState([]);
  const [alternativeWallsPreviews, setAlternativeWallsPreviews] = useState([]);
  const [alternativeWallsDeleted, setAlternativeWallsDeleted] = useState([]);

  const [wallThicknessFiles, setWallThicknessFiles] = useState([]);
  const [wallThicknessPreviews, setWallThicknessPreviews] = useState([]);
  const [wallThicknessDeleted, setWallThicknessDeleted] = useState([]);

  // Determine mode (edit or view) and load existing data
  useEffect(() => {
    const isViewing = location.pathname.includes("/view-form");
    setIsViewOnly(isViewing || user.role !== "surveyor");
    const queryTaskId = new URLSearchParams(location.search).get("taskId");
    setTaskId(queryTaskId);

    if (urlProcessId && urlProcessId !== "new") {
      setLoading(true);
      fetch(`http://localhost:3000/api/assessments/form-seven?processId=${urlProcessId}`, {
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

            // Set wall insulation photos preview if available
            if (existingForm.wallInsulationPhotos && existingForm.wallInsulationPhotos.length > 0) {
              const previews = existingForm.wallInsulationPhotos.map(
                (img) => `http://localhost:3000/${img}`
              );
              setWallInsulationPreviews(previews);
            }

            // Set alternative walls photos preview if available
            if (existingForm.alternativeWallsPhotos && existingForm.alternativeWallsPhotos.length > 0) {
              const previews = existingForm.alternativeWallsPhotos.map(
                (img) => `http://localhost:3000/${img}`
              );
              setAlternativeWallsPreviews(previews);
            }

            // Set wall thickness photos preview if available
            if (existingForm.wallThicknessPhotos && existingForm.wallThicknessPhotos.length > 0) {
              const previews = existingForm.wallThicknessPhotos.map(
                (img) => `http://localhost:3000/${img}`
              );
              setWallThicknessPreviews(previews);
            }
          } else if (isViewing) {
            toast({
              variant: "destructive",
              title: "Error",
              description: "Form Seven data not found.",
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
            description: "Error fetching Form Seven data.",
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

  // Wall Insulation Photos
  const handleWallInsulationFileChange = (e) => {
    if (isViewOnly) return;
    const selectedFiles = Array.from(e.target.files);
    setWallInsulationFiles((prev) => [...prev, ...selectedFiles]);
    const previewUrls = selectedFiles.map((file) => URL.createObjectURL(file));
    setWallInsulationPreviews((prev) => [...prev, ...previewUrls]);
    setUnsavedChanges(true);
  };

  const handleDeleteWallInsulationImage = (index, previewUrl) => {
    if (isViewOnly) return;
    const updatedPreviews = wallInsulationPreviews.filter((_, idx) => idx !== index);
    setWallInsulationPreviews(updatedPreviews);

    const isNewUpload = previewUrl.startsWith("blob:");
    if (isNewUpload) {
      const updatedFiles = wallInsulationFiles.filter(
        (_, idx) => idx !== index - (wallInsulationPreviews.length - wallInsulationFiles.length)
      );
      setWallInsulationFiles(updatedFiles);
    } else {
      setWallInsulationDeleted((prev) => [...prev, previewUrl]);
    }

    setUnsavedChanges(true);
  };

  // Alternative Walls Photos
  const handleAlternativeWallsFileChange = (e) => {
    if (isViewOnly) return;
    const selectedFiles = Array.from(e.target.files);
    setAlternativeWallsFiles((prev) => [...prev, ...selectedFiles]);
    const previewUrls = selectedFiles.map((file) => URL.createObjectURL(file));
    setAlternativeWallsPreviews((prev) => [...prev, ...previewUrls]);
    setUnsavedChanges(true);
  };

  const handleDeleteAlternativeWallsImage = (index, previewUrl) => {
    if (isViewOnly) return;
    const updatedPreviews = alternativeWallsPreviews.filter((_, idx) => idx !== index);
    setAlternativeWallsPreviews(updatedPreviews);

    const isNewUpload = previewUrl.startsWith("blob:");
    if (isNewUpload) {
      const updatedFiles = alternativeWallsFiles.filter(
        (_, idx) => idx !== index - (alternativeWallsPreviews.length - alternativeWallsFiles.length)
      );
      setAlternativeWallsFiles(updatedFiles);
    } else {
      setAlternativeWallsDeleted((prev) => [...prev, previewUrl]);
    }

    setUnsavedChanges(true);
  };

  // Wall Thickness Photos
  const handleWallThicknessFileChange = (e) => {
    if (isViewOnly) return;
    const selectedFiles = Array.from(e.target.files);
    setWallThicknessFiles((prev) => [...prev, ...selectedFiles]);
    const previewUrls = selectedFiles.map((file) => URL.createObjectURL(file));
    setWallThicknessPreviews((prev) => [...prev, ...previewUrls]);
    setUnsavedChanges(true);
  };

  const handleDeleteWallThicknessImage = (index, previewUrl) => {
    if (isViewOnly) return;
    const updatedPreviews = wallThicknessPreviews.filter((_, idx) => idx !== index);
    setWallThicknessPreviews(updatedPreviews);

    const isNewUpload = previewUrl.startsWith("blob:");
    if (isNewUpload) {
      const updatedFiles = wallThicknessFiles.filter(
        (_, idx) => idx !== index - (wallThicknessPreviews.length - wallThicknessFiles.length)
      );
      setWallThicknessFiles(updatedFiles);
    } else {
      setWallThicknessDeleted((prev) => [...prev, previewUrl]);
    }

    setUnsavedChanges(true);
  };

  // Form validation
  const validateForm = () => {
    const newErrors = {};

    if (!formData.hasAlternativeWalls) {
      newErrors.hasAlternativeWalls = "Alternative walls selection is required.";
    }
    if (!formData.wallArea) {
      newErrors.wallArea = "Wall area is required.";
    } else if (isNaN(formData.wallArea) || formData.wallArea <= 0) {
      newErrors.wallArea = "Wall area must be a positive number.";
    }
    if (!formData.shelteredWall) {
      newErrors.shelteredWall = "Sheltered wall selection is required.";
    }
    if (!formData.wallType) {
      newErrors.wallType = "Wall type is required.";
    }
    if (!formData.insulation) {
      newErrors.insulation = "Insulation type is required.";
    }
    if (!formData.externalWallThickness) {
      newErrors.externalWallThickness = "External wall thickness is required.";
    } else if (isNaN(formData.externalWallThickness) || formData.externalWallThickness <= 0) {
      newErrors.externalWallThickness = "External wall thickness must be a positive number.";
    }
    if (!formData.wallThicknessUnknown) {
      newErrors.wallThicknessUnknown = "Wall thickness unknown selection is required.";
    }
    if (!formData.insulationThickness) {
      newErrors.insulationThickness = "Insulation thickness is required.";
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
          key !== "wallInsulationPhotos" &&
          key !== "alternativeWallsPhotos" &&
          key !== "wallThicknessPhotos"
        ) {
          formDataToSend.append(key, formData[key]);
        }
      }

      // Append new files for each image group
      if (wallInsulationFiles.length > 0) {
        wallInsulationFiles.forEach((file) => {
          formDataToSend.append("wallInsulationPhotos", file);
        });
      }
      if (alternativeWallsFiles.length > 0) {
        alternativeWallsFiles.forEach((file) => {
          formDataToSend.append("alternativeWallsPhotos", file);
        });
      }
      if (wallThicknessFiles.length > 0) {
        wallThicknessFiles.forEach((file) => {
          formDataToSend.append("wallThicknessPhotos", file);
        });
      }

      // Append deleted images for each group
      if (wallInsulationDeleted.length > 0) {
        formDataToSend.append("deletedWallInsulation", JSON.stringify(wallInsulationDeleted));
      }
      if (alternativeWallsDeleted.length > 0) {
        formDataToSend.append("deletedAlternativeWalls", JSON.stringify(alternativeWallsDeleted));
      }
      if (wallThicknessDeleted.length > 0) {
        formDataToSend.append("deletedWallThickness", JSON.stringify(wallThicknessDeleted));
      }

      const url = docId
        ? `http://localhost:3000/api/assessments/form-seven/${docId}`
        : "http://localhost:3000/api/assessments/form-seven";
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
        setWallInsulationFiles([]);
        setAlternativeWallsFiles([]);
        setWallThicknessFiles([]);
        setWallInsulationDeleted([]);
        setAlternativeWallsDeleted([]);
        setWallThicknessDeleted([]);
        setWallInsulationPreviews(
          data.data.wallInsulationPhotos.map((photo) => `http://localhost:3000/${photo}`)
        );
        setAlternativeWallsPreviews(
          data.data.alternativeWallsPhotos.map((photo) => `http://localhost:3000/${photo}`)
        );
        setWallThicknessPreviews(
          data.data.wallThicknessPhotos.map((photo) => `http://localhost:3000/${photo}`)
        );
        toast({
          title: "Success",
          description: `Form Seven ${docId ? "updated" : "saved"} successfully!`,
        });
        return { success: true, processId: data.data.processId };
      } else {
        throw new Error(data.error || "Failed to save Form Seven");
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
        navigate(`/view-form/${result.processId}/form-seven?taskId=${taskId}`);
      } else {
        navigate(`/process/${result.processId}/form-seven?taskId=${taskId}`, { replace: true });
      }
    }
  };

  // Handle navigation to the next form
  const handleNext = async () => {
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

  // Handle navigation to the previous form
  const handlePrevious = async () => {
    if (!isViewOnly) {
      const result = await saveForm();
      if (result.success) {
        if (user.role === "surveyor") {
          navigate(`/process/${result.processId}/form-six?taskId=${taskId}`);
        } else {
          navigate(`/view-form/${result.processId}/form-six?taskId=${taskId}`);
        }
      }
    } else {
      navigate(`/view-form/${savedProcessId || urlProcessId}/form-six?taskId=${taskId}`);
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
            {isViewOnly ? "View Form Seven" : "7. Alternative Walls"}
          </h1>

          {/* Section: Has Alternative Walls */}
          <div className="mb-6">
            <Label>Alternative Walls (recommended):</Label>
            <div className="flex gap-4 mt-2">
              <label>
                <input
                  type="radio"
                  name="hasAlternativeWalls"
                  value="yes"
                  checked={formData.hasAlternativeWalls === "yes"}
                  onChange={handleChange}
                  disabled={isViewOnly}
                />{" "}
                Yes
              </label>
              <label>
                <input
                  type="radio"
                  name="hasAlternativeWalls"
                  value="no"
                  checked={formData.hasAlternativeWalls === "no"}
                  onChange={handleChange}
                  disabled={isViewOnly}
                />{" "}
                No
              </label>
            </div>
            {errors.hasAlternativeWalls && (
              <p className="text-red-500 text-sm mt-1">{errors.hasAlternativeWalls}</p>
            )}
          </div>

          {/* Section: Wall Insulation Photos */}
          <div className="mb-6">
            <PhotoUploader
              label="Wall Insulation Photos"
              inputName="wallInsulationPhotos"
              onFileChange={handleWallInsulationFileChange}
              imagePreviews={wallInsulationPreviews}
              onDeleteImage={handleDeleteWallInsulationImage}
              isViewOnly={isViewOnly}
            />
          </div>

          {/* Section: Wall Area and Sheltered Wall */}
          <div className="mb-6 flex gap-4">
            <div className="flex-1">
              <Label>Wall Area (m²):</Label>
              <Input
                type="text"
                name="wallArea"
                value={formData.wallArea}
                onChange={handleChange}
                placeholder="Note: ensure area of any openings has been subtracted"
                className={`mt-1 ${errors.wallArea ? "border-red-500" : ""}`}
                disabled={isViewOnly}
              />
              {errors.wallArea && (
                <p className="text-red-500 text-sm mt-1">{errors.wallArea}</p>
              )}
            </div>
            <div className="flex-1">
              <Label>Sheltered Wall (flats only):</Label>
              <div className="flex gap-4 mt-2">
                <label>
                  <input
                    type="radio"
                    name="shelteredWall"
                    value="yes"
                    checked={formData.shelteredWall === "yes"}
                    onChange={handleChange}
                    disabled={isViewOnly}
                  />{" "}
                  Yes
                </label>
                <label>
                  <input
                    type="radio"
                    name="shelteredWall"
                    value="no"
                    checked={formData.shelteredWall === "no"}
                    onChange={handleChange}
                    disabled={isViewOnly}
                  />{" "}
                  No
                </label>
              </div>
              {errors.shelteredWall && (
                <p className="text-red-500 text-sm mt-1">{errors.shelteredWall}</p>
              )}
            </div>
          </div>

          {/* Section: Wall Type */}
          <div className="mb-6">
            <Label>Type:</Label>
            <select
              name="wallType"
              value={formData.wallType}
              onChange={handleChange}
              className={`w-full mt-1 border rounded px-2 py-2 ${errors.wallType ? "border-red-500" : ""}`}
              disabled={isViewOnly}
            >
              <option value="">- Select -</option>
              <option value="granite or whinstone">Stone (Granite or Whinstone)</option>
              <option value="sandstone or limestone">Stone (Sandstone or Limestone)</option>
              <option value="Solid Brick">Solid Brick</option>
              <option value="Cob">Cob</option>
              <option value="Cavity">Cavity</option>
              <option value="Timber Frame">Timber Frame</option>
              <option value="System Build">System Build</option>
            </select>
            {errors.wallType && (
              <p className="text-red-500 text-sm mt-1">{errors.wallType}</p>
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
              <option value="External">External</option>
              <option value="Filled Cavity">Filled Cavity</option>
              <option value="Filled Cavity + Internal">Filled Cavity + Internal</option>
              <option value="Filled Cavity + External">Filled Cavity + External</option>
              <option value="Unfilled Cavity + Internal">Unfilled Cavity + Internal</option>
              <option value="Unfilled Cavity + External">Unfilled Cavity + External</option>
              <option value="Internal">Internal</option>
              <option value="As Built">As Built</option>
              <option value="Unknown">Unknown</option>
            </select>
            {errors.insulation && (
              <p className="text-red-500 text-sm mt-1">{errors.insulation}</p>
            )}
          </div>

          {/* Section: Alternative Walls Photos */}
          <div className="mb-6">
            <PhotoUploader
              label="Alternative Walls Photos (recommended)"
              inputName="alternativeWallsPhotos"
              onFileChange={handleAlternativeWallsFileChange}
              imagePreviews={alternativeWallsPreviews}
              onDeleteImage={handleDeleteAlternativeWallsImage}
              isViewOnly={isViewOnly}
            />
          </div>

          {/* Section: External Wall Thickness, Wall Thickness Unknown, Wall Thickness Photos */}
          <div className="mb-6 flex gap-4">
            <div className="flex-1">
              <Label>External Wall Thickness (mm):</Label>
              <Input
                type="text"
                name="externalWallThickness"
                value={formData.externalWallThickness}
                onChange={handleChange}
                className={`mt-1 ${errors.externalWallThickness ? "border-red-500" : ""}`}
                disabled={isViewOnly}
              />
              {errors.externalWallThickness && (
                <p className="text-red-500 text-sm mt-1">{errors.externalWallThickness}</p>
              )}
            </div>
            <div className="flex-1">
              <Label>Wall Thickness Unknown:</Label>
              <div className="flex gap-4 mt-2">
                <label>
                  <input
                    type="radio"
                    name="wallThicknessUnknown"
                    value="yes"
                    checked={formData.wallThicknessUnknown === "yes"}
                    onChange={handleChange}
                    disabled={isViewOnly}
                  />{" "}
                  Yes
                </label>
                <label>
                  <input
                    type="radio"
                    name="wallThicknessUnknown"
                    value="no"
                    checked={formData.wallThicknessUnknown === "no"}
                    onChange={handleChange}
                    disabled={isViewOnly}
                  />{" "}
                  No
                </label>
              </div>
              {errors.wallThicknessUnknown && (
                <p className="text-red-500 text-sm mt-1">{errors.wallThicknessUnknown}</p>
              )}
            </div>
            <div className="flex-1">
              <PhotoUploader
                label="Wall Thickness Photos (recommended)"
                inputName="wallThicknessPhotos"
                onFileChange={handleWallThicknessFileChange}
                imagePreviews={wallThicknessPreviews}
                onDeleteImage={handleDeleteWallThicknessImage}
                isViewOnly={isViewOnly}
              />
            </div>
          </div>

          {/* Section: Insulation Thickness */}
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