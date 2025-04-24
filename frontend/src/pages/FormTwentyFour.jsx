import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/store/authStore";
import PhotoUploader from "@/components/ui/photo/PhotoUpload";

export default function FormTwentyFour() {
  const navigate = useNavigate();
  const { processId: urlProcessId } = useParams();
  const location = useLocation();
  const { toast } = useToast();
  const { user } = useAuthStore();

  // State for form data and metadata
  const [formData, setFormData] = useState({
    wallType: "",
    insulationThickness: "",
    insulationType: "",
    alternativeWallThickness: "",
    wallThicknessUnknown: "",
    uValueKnown: "",
    partyWallType: "",
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
  const [constructionPhotos, setConstructionPhotos] = useState([]);
  const [constructionPreviews, setConstructionPreviews] = useState([]);
  const [constructionDeleted, setConstructionDeleted] = useState([]);
  const [wallInsulationPhotos, setWallInsulationPhotos] = useState([]);
  const [wallInsulationPreviews, setWallInsulationPreviews] = useState([]);
  const [wallInsulationDeleted, setWallInsulationDeleted] = useState([]);

  // Determine mode (edit or view) and load existing data
  useEffect(() => {
    const isViewing = location.pathname.includes("/view-form");
    setIsViewOnly(isViewing || user.role !== "surveyor");
    const queryTaskId = new URLSearchParams(location.search).get("taskId");
    setTaskId(queryTaskId);

    if (urlProcessId && urlProcessId !== "new") {
      setLoading(true);
      fetch(`http://localhost:3000/api/assessments/form-twenty-four?processId=${urlProcessId}`, {
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

            // Set photo previews
            if (existingForm.constructionPhotos && existingForm.constructionPhotos.length > 0) {
              setConstructionPreviews(
                existingForm.constructionPhotos.map((img) => `http://localhost:3000/${img}`)
              );
            }
            if (existingForm.wallInsulationPhotos && existingForm.wallInsulationPhotos.length > 0) {
              setWallInsulationPreviews(
                existingForm.wallInsulationPhotos.map((img) => `http://localhost:3000/${img}`)
              );
            }
          } else if (isViewing) {
            toast({
              variant: "destructive",
              title: "Error",
              description: "Form Twenty-Four data not found.",
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
            description: "Error fetching Form Twenty-Four data.",
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

  // Handle file changes
  const handleFileChange = (e, field) => {
    if (isViewOnly) return;
    const selectedFiles = Array.from(e.target.files);
    if (field === "constructionPhotos") {
      setConstructionPhotos((prev) => [...prev, ...selectedFiles]);
      setConstructionPreviews((prev) => [
        ...prev,
        ...selectedFiles.map((file) => URL.createObjectURL(file)),
      ]);
    } else if (field === "wallInsulationPhotos") {
      setWallInsulationPhotos((prev) => [...prev, ...selectedFiles]);
      setWallInsulationPreviews((prev) => [
        ...prev,
        ...selectedFiles.map((file) => URL.createObjectURL(file)),
      ]);
    }
    setUnsavedChanges(true);
  };

  // Delete photo
  const handleDeleteImage = (index, previewUrl, field) => {
    if (isViewOnly) return;
    if (field === "constructionPhotos") {
      const updatedPreviews = constructionPreviews.filter((_, idx) => idx !== index);
      setConstructionPreviews(updatedPreviews);
      const isNewUpload = previewUrl.startsWith("blob:");
      if (isNewUpload) {
        const updatedFiles = constructionPhotos.filter(
          (_, idx) => idx !== index - (constructionPreviews.length - constructionPhotos.length)
        );
        setConstructionPhotos(updatedFiles);
      } else {
        setConstructionDeleted((prev) => [...prev, previewUrl]);
      }
    } else if (field === "wallInsulationPhotos") {
      const updatedPreviews = wallInsulationPreviews.filter((_, idx) => idx !== index);
      setWallInsulationPreviews(updatedPreviews);
      const isNewUpload = previewUrl.startsWith("blob:");
      if (isNewUpload) {
        const updatedFiles = wallInsulationPhotos.filter(
          (_, idx) => idx !== index - (wallInsulationPreviews.length - wallInsulationPhotos.length)
        );
        setWallInsulationPhotos(updatedFiles);
      } else {
        setWallInsulationDeleted((prev) => [...prev, previewUrl]);
      }
    }
    setUnsavedChanges(true);
  };

  // Form validation
  const validateForm = () => {
    const newErrors = {};

    if (!formData.wallType) newErrors.wallType = "Wall Type is required.";
    if (!formData.insulationThickness) newErrors.insulationThickness = "Insulation Thickness is required.";
    if (!formData.insulationType) newErrors.insulationType = "Insulation Type is required.";
    if (!formData.alternativeWallThickness) newErrors.alternativeWallThickness = "Alternative Wall Thickness is required.";
    if (!formData.wallThicknessUnknown) newErrors.wallThicknessUnknown = "Wall Thickness Unknown is required.";
    if (!formData.uValueKnown) newErrors.uValueKnown = "U-value Known is required.";
    if (!formData.partyWallType) newErrors.partyWallType = "Party Wall Type is required.";

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
      for (const key in formData) {
        formDataToSend.append(key, formData[key]);
      }

      // Append files
      constructionPhotos.forEach((file) => formDataToSend.append("constructionPhotos", file));
      wallInsulationPhotos.forEach((file) => formDataToSend.append("wallInsulationPhotos", file));

      // Append deleted images
      if (constructionDeleted.length > 0) {
        formDataToSend.append("deletedConstructionPhotos", JSON.stringify(constructionDeleted));
      }
      if (wallInsulationDeleted.length > 0) {
        formDataToSend.append("deletedWallInsulationPhotos", JSON.stringify(wallInsulationDeleted));
      }

      const url = docId
        ? `http://localhost:3000/api/assessments/form-twenty-four/${docId}`
        : "http://localhost:3000/api/assessments/form-twenty-four";
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
        setConstructionPhotos([]);
        setWallInsulationPhotos([]);
        setConstructionDeleted([]);
        setWallInsulationDeleted([]);
        setConstructionPreviews(
          data.data.constructionPhotos.map((photo) => `http://localhost:3000/${photo}`)
        );
        setWallInsulationPreviews(
          data.data.wallInsulationPhotos.map((photo) => `http://localhost:3000/${photo}`)
        );
        toast({
          title: "Success",
          description: `Form Twenty-Four ${docId ? "updated" : "saved"} successfully!`,
        });
        return { success: true, processId: data.data.processId };
      } else {
        throw new Error(data.error || "Failed to save Form Twenty-Four");
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
        navigate(`/view-form/${result.processId}/form-twenty-four?taskId=${taskId}`);
      } else {
        navigate(`/process/${result.processId}/form-twenty-four?taskId=${taskId}`, { replace: true });
      }
    }
  };

  // Handle navigation to the next form
  const handleNext = async () => {
    if (!isViewOnly) {
      const result = await saveForm();
      if (result.success) {
        if (user.role === "surveyor") {
          navigate(`/process/${result.processId}/form-twenty-five?taskId=${taskId}`);
        } else {
          navigate(`/view-form/${result.processId}/form-twenty-five?taskId=${taskId}`);
        }
      }
    } else {
      navigate(`/view-form/${savedProcessId || urlProcessId}/form-twenty-five?taskId=${taskId}`);
    }
  };

  // Handle navigation to the previous form
  const handlePrevious = async () => {
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
            {isViewOnly ? "View Form Twenty-Four" : "24. Extension Walls"}
          </h1>

          {/* Section Break */}
          <div className="ff-el-group ff-el-section-break ff_center" data-name="section_break-3_39">
            <h3 className="ff-el-section-title">3. Extension Walls</h3>
            <div className="ff-section_break_desk"></div>
            <hr />
          </div>

          {/* Construction Photos */}
          <div className="ff-el-group">
            <div className="ff-el-input--label asterisk-right">
              <Label>Construction photo (recommended):</Label>
            </div>
            <div className="ff-el-input--content">
              <PhotoUploader
                label="Choose File"
                inputName="constructionPhotos"
                onFileChange={(e) => handleFileChange(e, "constructionPhotos")}
                imagePreviews={constructionPreviews}
                onDeleteImage={(index, url) => handleDeleteImage(index, url, "constructionPhotos")}
                isViewOnly={isViewOnly}
                className="ff_upload_btn ff-btn"
                listClassName="ff-uploaded-list"
                listStyle={{ fontSize: "12px", marginTop: "15px" }}
              />
            </div>
          </div>

          {/* Wall Type */}
          <div className="ff-el-group">
            <div className="ff-el-input--label asterisk-right">
              <Label htmlFor="ff_3_dropdown_64">Type:</Label>
            </div>
            <div className="ff-el-input--content">
              <select
                name="wallType"
                id="ff_3_dropdown_64"
                value={formData.wallType}
                onChange={handleChange}
                className={`ff-el-form-control w-full mt-1 border rounded px-2 py-2 ${errors.wallType ? "border-red-500" : ""}`}
                aria-required="true"
                disabled={isViewOnly}
              >
                <option value="">- Select -</option>
                <option value="Stone">Stone</option>
                <option value="Solid Brick">Solid Brick</option>
                <option value="Cob">Cob</option>
                <option value="Cavity">Cavity</option>
                <option value="Timber Frame">Timber Frame</option>
                <option value="System Build">System Build</option>
                <option value="Park Home Wall">Park Home Wall</option>
              </select>
              {errors.wallType && <p className="text-red-500 text-sm mt-1">{errors.wallType}</p>}
            </div>
          </div>

          {/* Insulation Thickness */}
          <div className="ff-el-group">
            <div className="ff-el-input--label asterisk-right">
              <Label htmlFor="ff_3_dropdown_65">Insulation Thickness:</Label>
              <span className="ff-el-tooltip" title="applicable to Stone/ Solid Brick/ Cavity walls only">
                (applicable to Stone/ Solid Brick/ Cavity walls only)
              </span>
            </div>
            <div className="ff-el-input--content">
              <select
                name="insulationThickness"
                id="ff_3_dropdown_65"
                value={formData.insulationThickness}
                onChange={handleChange}
                className={`ff-el-form-control w-full mt-1 border rounded px-2 py-2 ${errors.insulationThickness ? "border-red-500" : ""}`}
                aria-required="true"
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
          </div>

          {/* Insulation Type */}
          <div className="ff-el-group">
            <div className="ff-el-input--label asterisk-right">
              <Label htmlFor="ff_3_dropdown_66">Insulation:</Label>
              <span className="ff-el-tooltip" title="applicable to Stone/ Solid Brick/ Cavity walls only">
                (applicable to Stone/ Solid Brick/ Cavity walls only)
              </span>
            </div>
            <div className="ff-el-input--content">
              <select
                name="insulationType"
                id="ff_3_dropdown_66"
                value={formData.insulationType}
                onChange={handleChange}
                className={`ff-el-form-control w-full mt-1 border rounded px-2 py-2 ${errors.insulationType ? "border-red-500" : ""}`}
                aria-required="true"
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
                <option value="Dry-lining">Dry-lining</option>
              </select>
              {errors.insulationType && <p className="text-red-500 text-sm mt-1">{errors.insulationType}</p>}
            </div>
          </div>

          {/* Wall Insulation Photos */}
          <div className="ff-el-group">
            <div className="ff-el-input--label asterisk-right">
              <Label>Wall insulation (recommended):</Label>
            </div>
            <div className="ff-el-input--content">
              <PhotoUploader
                label="Choose File"
                inputName="wallInsulationPhotos"
                onFileChange={(e) => handleFileChange(e, "wallInsulationPhotos")}
                imagePreviews={wallInsulationPreviews}
                onDeleteImage={(index, url) => handleDeleteImage(index, url, "wallInsulationPhotos")}
                isViewOnly={isViewOnly}
                className="ff_upload_btn ff-btn"
                listClassName="ff-uploaded-list"
                listStyle={{ fontSize: "12px", marginTop: "15px" }}
              />
            </div>
          </div>

          {/* Alternative Wall Thickness */}
          <div className="ff-el-group">
            <div className="ff-el-input--label asterisk-right">
              <Label htmlFor="ff_3_numeric_field_35">Alternative Wall Thickness (mm):</Label>
            </div>
            <div className="ff-el-input--content">
              <input
                type="number"
                name="alternativeWallThickness"
                id="ff_3_numeric_field_35"
                value={formData.alternativeWallThickness}
                onChange={handleChange}
                className={`ff-el-form-control w-full mt-1 border rounded px-2 py-2 ${errors.alternativeWallThickness ? "border-red-500" : ""}`}
                inputMode="numeric"
                step="any"
                aria-required="true"
                disabled={isViewOnly}
              />
              {errors.alternativeWallThickness && (
                <p className="text-red-500 text-sm mt-1">{errors.alternativeWallThickness}</p>
              )}
            </div>
          </div>

          {/* Wall Thickness Unknown */}
          <div className="ff-el-group">
            <div className="ff-el-input--label asterisk-right">
              <Label htmlFor="ff_3_numeric_field_36">Wall Thickness Unknown:</Label>
            </div>
            <div className="ff-el-input--content">
              <input
                type="number"
                name="wallThicknessUnknown"
                id="ff_3_numeric_field_36"
                value={formData.wallThicknessUnknown}
                onChange={handleChange}
                className={`ff-el-form-control w-full mt-1 border rounded px-2 py-2 ${errors.wallThicknessUnknown ? "border-red-500" : ""}`}
                inputMode="numeric"
                step="any"
                aria-required="true"
                disabled={isViewOnly}
              />
              {errors.wallThicknessUnknown && (
                <p className="text-red-500 text-sm mt-1">{errors.wallThicknessUnknown}</p>
              )}
            </div>
          </div>

          {/* U-value Known */}
          <div className="ff-el-group">
            <div className="ff-el-input--label asterisk-right">
              <Label htmlFor="ff_3_numeric_field_37">U-value known (Wm²K):</Label>
              <span className="ff-el-tooltip" title="Documentary evidence required to overwrite U-value">
                (Documentary evidence required to overwrite U-value)
              </span>
            </div>
            <div className="ff-el-input--content">
              <input
                type="number"
                name="uValueKnown"
                id="ff_3_numeric_field_37"
                value={formData.uValueKnown}
                onChange={handleChange}
                className={`ff-el-form-control w-full mt-1 border rounded px-2 py-2 ${errors.uValueKnown ? "border-red-500" : ""}`}
                inputMode="numeric"
                step="any"
                aria-required="true"
                disabled={isViewOnly}
              />
              {errors.uValueKnown && <p className="text-red-500 text-sm mt-1">{errors.uValueKnown}</p>}
            </div>
          </div>

          {/* Party Wall Type */}
          <div className="ff-el-group">
            <div className="ff-el-input--label asterisk-right">
              <Label htmlFor="ff_3_dropdown_68">Party Wall Type (if applicable):</Label>
            </div>
            <div className="ff-el-input--content">
              <select
                name="partyWallType"
                id="ff_3_dropdown_68"
                value={formData.partyWallType}
                onChange={handleChange}
                className={`ff-el-form-control w-full mt-1 border rounded px-2 py-2 ${errors.partyWallType ? "border-red-500" : ""}`}
                aria-required="true"
                disabled={isViewOnly}
              >
                <option value="">- Select -</option>
                <option value="Solid Masonry/ Timber/ System Build">Solid Masonry/ Timber/ System Build</option>
                <option value="Cavity Masonry unfilled">Cavity Masonry unfilled</option>
                <option value="Cavity Masonry filled">Cavity Masonry filled</option>
                <option value="Unable to determine">Unable to determine</option>
              </select>
              {errors.partyWallType && <p className="text-red-500 text-sm mt-1">{errors.partyWallType}</p>}
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