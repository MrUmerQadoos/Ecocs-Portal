import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/store/authStore";
import PhotoUploader from "@/components/ui/photo/PhotoUpload";

export default function FormTwentyFive() {
  const navigate = useNavigate();
  const { processId: urlProcessId } = useParams();
  const location = useLocation();
  const { toast } = useToast();
  const { user } = useAuthStore();

  // State for form data and metadata
  const [formData, setFormData] = useState({
    hasAlternativeWallsPhotos: "",
    wallArea: "",
    isShelteredWall: "",
    wallType: "",
    hasWallInsulation: "",
    alternativeWallThickness: "",
    isWallThicknessUnknown: "",
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
  const [alternativeWallsPhotos, setAlternativeWallsPhotos] = useState([]);
  const [alternativeWallsPreviews, setAlternativeWallsPreviews] = useState([]);
  const [alternativeWallsDeleted, setAlternativeWallsDeleted] = useState([]);
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
      fetch(`http://localhost:3000/api/assessments/form-twenty-five?processId=${urlProcessId}`, {
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
            if (existingForm.alternativeWallsPhotos && existingForm.alternativeWallsPhotos.length > 0) {
              setAlternativeWallsPreviews(
                existingForm.alternativeWallsPhotos.map((img) => `http://localhost:3000/${img}`)
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
              description: "Form Twenty-Five data not found.",
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
            description: "Error fetching Form Twenty-Five data.",
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
    if (field === "alternativeWallsPhotos") {
      setAlternativeWallsPhotos((prev) => [...prev, ...selectedFiles]);
      setAlternativeWallsPreviews((prev) => [
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
    if (field === "alternativeWallsPhotos") {
      const updatedPreviews = alternativeWallsPreviews.filter((_, idx) => idx !== index);
      setAlternativeWallsPreviews(updatedPreviews);
      const isNewUpload = previewUrl.startsWith("blob:");
      if (isNewUpload) {
        const updatedFiles = alternativeWallsPhotos.filter(
          (_, idx) => idx !== index - (alternativeWallsPreviews.length - alternativeWallsPhotos.length)
        );
        setAlternativeWallsPhotos(updatedFiles);
      } else {
        setAlternativeWallsDeleted((prev) => [...prev, previewUrl]);
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

    if (!formData.hasAlternativeWallsPhotos) {
      newErrors.hasAlternativeWallsPhotos = "Please select whether there are alternative walls photos.";
    }
    if (!formData.wallArea) newErrors.wallArea = "Wall Area is required.";
    if (!formData.isShelteredWall) newErrors.isShelteredWall = "Please select whether it’s a sheltered wall.";
    if (!formData.wallType) newErrors.wallType = "Wall Type is required.";
    if (!formData.hasWallInsulation) newErrors.hasWallInsulation = "Please select whether there is wall insulation.";
    if (!formData.alternativeWallThickness) {
      newErrors.alternativeWallThickness = "Alternative Wall Thickness is required.";
    }
    if (!formData.isWallThicknessUnknown) {
      newErrors.isWallThicknessUnknown = "Please select whether wall thickness is unknown.";
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
      for (const key in formData) {
        formDataToSend.append(key, formData[key]);
      }

      // Append files
      alternativeWallsPhotos.forEach((file) => formDataToSend.append("alternativeWallsPhotos", file));
      wallInsulationPhotos.forEach((file) => formDataToSend.append("wallInsulationPhotos", file));

      // Append deleted images
      if (alternativeWallsDeleted.length > 0) {
        formDataToSend.append("deletedAlternativeWallsPhotos", JSON.stringify(alternativeWallsDeleted));
      }
      if (wallInsulationDeleted.length > 0) {
        formDataToSend.append("deletedWallInsulationPhotos", JSON.stringify(wallInsulationDeleted));
      }

      const url = docId
        ? `http://localhost:3000/api/assessments/form-twenty-five/${docId}`
        : "http://localhost:3000/api/assessments/form-twenty-five";
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
        setAlternativeWallsPhotos([]);
        setWallInsulationPhotos([]);
        setAlternativeWallsDeleted([]);
        setWallInsulationDeleted([]);
        setAlternativeWallsPreviews(
          data.data.alternativeWallsPhotos.map((photo) => `http://localhost:3000/${photo}`)
        );
        setWallInsulationPreviews(
          data.data.wallInsulationPhotos.map((photo) => `http://localhost:3000/${photo}`)
        );
        toast({
          title: "Success",
          description: `Form Twenty-Five ${docId ? "updated" : "saved"} successfully!`,
        });
        return { success: true, processId: data.data.processId };
      } else {
        throw new Error(data.error || "Failed to save Form Twenty-Five");
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
        navigate(`/view-form/${result.processId}/form-twenty-five?taskId=${taskId}`);
      } else {
        navigate(`/process/${result.processId}/form-twenty-five?taskId=${taskId}`, { replace: true });
      }
    }
  };

  // Handle navigation to the next form
  const handleNext = async () => {
    if (!isViewOnly) {
      const result = await saveForm();
      if (result.success) {
        if (user.role === "surveyor") {
          navigate(`/process/${result.processId}/form-twenty-six?taskId=${taskId}`);
        } else {
          navigate(`/view-form/${result.processId}/form-twenty-six?taskId=${taskId}`);
        }
      }
    } else {
      navigate(`/view-form/${savedProcessId || urlProcessId}/form-twenty-six?taskId=${taskId}`);
    }
  };

  // Handle navigation to the previous form
  const handlePrevious = async () => {
    if (!isViewOnly) {
      const result = await saveForm();
      if (result.success) {
        if (user.role === "surveyor") {
          navigate(`/process/${result.processId}/form-twenty-four?taskId=${taskId}`);
        } else {
          navigate(`/view-form/${result.processId}/form-twenty-four?taskId=${taskId}`);
        }
      }
    } else {
      navigate(`/view-form/${savedProcessId || urlProcessId}/form-twenty-four?taskId=${taskId}`);
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
            {isViewOnly ? "View Form Twenty-Five" : "25. Alternative Walls"}
          </h1>

          {/* Section Break */}
          <div className="ff-el-group ff-el-section-break ff_center" data-name="section_break-3_40">
            <h3 className="ff-el-section-title">4. Alternative Walls</h3>
            <div className="ff-section_break_desk"></div>
            <hr />
          </div>

          {/* Has Alternative Walls Photos */}
          <div className="ff-el-group ff_list_buttons">
            <div className="ff-el-input--label asterisk-right">
              <Label>Alternative Walls Photos ?</Label>
            </div>
            <div className="ff-el-input--content">
              <RadioGroup
                name="hasAlternativeWallsPhotos"
                value={formData.hasAlternativeWallsPhotos}
                onValueChange={(value) =>
                  handleChange({ target: { name: "hasAlternativeWallsPhotos", value } })
                }
                className="flex space-x-4"
                disabled={isViewOnly}
              >
                <div className="ff-el-form-check">
                  <Label className="ff-el-form-check-label" htmlFor="input_radio_44_yes">
                    <RadioGroupItem
                      value="yes"
                      id="input_radio_44_yes"
                      className="ff-el-form-check-radio"
                    />
                    <span className="ml-2">Yes</span>
                  </Label>
                </div>
                <div className="ff-el-form-check">
                  <Label className="ff-el-form-check-label" htmlFor="input_radio_44_no">
                    <RadioGroupItem
                      value="no"
                      id="input_radio_44_no"
                      className="ff-el-form-check-radio"
                    />
                    <span className="ml-2">No</span>
                  </Label>
                </div>
              </RadioGroup>
              {errors.hasAlternativeWallsPhotos && (
                <p className="text-red-500 text-sm mt-1">{errors.hasAlternativeWallsPhotos}</p>
              )}
            </div>
          </div>

          {/* Alternative Walls Photos */}
          <div className="ff-el-group">
            <div className="ff-el-input--label asterisk-right">
              <Label>Alternative Walls:</Label>
            </div>
            <div className="ff-el-input--content">
              <PhotoUploader
                label="Choose File"
                inputName="alternativeWallsPhotos"
                onFileChange={(e) => handleFileChange(e, "alternativeWallsPhotos")}
                imagePreviews={alternativeWallsPreviews}
                onDeleteImage={(index, url) => handleDeleteImage(index, url, "alternativeWallsPhotos")}
                isViewOnly={isViewOnly}
                className="ff_upload_btn ff-btn"
                listClassName="ff-uploaded-list"
                listStyle={{ fontSize: "12px", marginTop: "15px" }}
              />
            </div>
          </div>

          {/* Wall Area */}
          <div className="ff-el-group">
            <div className="ff-el-input--label asterisk-right">
              <Label htmlFor="ff_3_numeric_field_39">Wall Area (m²):</Label>
              <span className="ff-el-tooltip" title="ensure area of any openings has been subtracted">
                (ensure area of any openings has been subtracted)
              </span>
            </div>
            <div className="ff-el-input--content">
              <input
                type="number"
                name="wallArea"
                id="ff_3_numeric_field_39"
                value={formData.wallArea}
                onChange={handleChange}
                className={`ff-el-form-control w-full mt-1 border rounded px-2 py-2 ${errors.wallArea ? "border-red-500" : ""}`}
                inputMode="numeric"
                step="any"
                aria-required="true"
                disabled={isViewOnly}
              />
              {errors.wallArea && <p className="text-red-500 text-sm mt-1">{errors.wallArea}</p>}
            </div>
          </div>

          {/* Is Sheltered Wall */}
          <div className="ff-el-group ff_list_buttons">
            <div className="ff-el-input--label asterisk-right">
              <Label>Sheltered Wall (flats only):</Label>
            </div>
            <div className="ff-el-input--content">
              <RadioGroup
                name="isShelteredWall"
                value={formData.isShelteredWall}
                onValueChange={(value) =>
                  handleChange({ target: { name: "isShelteredWall", value } })
                }
                className="flex space-x-4"
                disabled={isViewOnly}
              >
                <div className="ff-el-form-check">
                  <Label className="ff-el-form-check-label" htmlFor="input_radio_24_yes">
                    <RadioGroupItem
                      value="yes"
                      id="input_radio_24_yes"
                      className="ff-el-form-check-radio"
                    />
                    <span className="ml-2">Yes</span>
                  </Label>
                </div>
                <div className="ff-el-form-check">
                  <Label className="ff-el-form-check-label" htmlFor="input_radio_24_no">
                    <RadioGroupItem
                      value="no"
                      id="input_radio_24_no"
                      className="ff-el-form-check-radio"
                    />
                    <span className="ml-2">No</span>
                  </Label>
                </div>
              </RadioGroup>
              {errors.isShelteredWall && (
                <p className="text-red-500 text-sm mt-1">{errors.isShelteredWall}</p>
              )}
            </div>
          </div>

          {/* Wall Type */}
          <div className="ff-el-group">
            <div className="ff-el-input--label asterisk-right">
              <Label htmlFor="ff_3_dropdown_69">Type:</Label>
            </div>
            <div className="ff-el-input--content">
              <select
                name="wallType"
                id="ff_3_dropdown_69"
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
              </select>
              {errors.wallType && <p className="text-red-500 text-sm mt-1">{errors.wallType}</p>}
            </div>
          </div>

          {/* Has Wall Insulation */}
          <div className="ff-el-group ff_list_buttons">
            <div className="ff-el-input--label asterisk-right">
              <Label>Wall insulation (recommended)</Label>
            </div>
            <div className="ff-el-input--content">
              <RadioGroup
                name="hasWallInsulation"
                value={formData.hasWallInsulation}
                onValueChange={(value) =>
                  handleChange({ target: { name: "hasWallInsulation", value } })
                }
                className="flex space-x-4"
                disabled={isViewOnly}
              >
                <div className="ff-el-form-check">
                  <Label className="ff-el-form-check-label" htmlFor="input_radio_25_yes">
                    <RadioGroupItem
                      value="yes"
                      id="input_radio_25_yes"
                      className="ff-el-form-check-radio"
                    />
                    <span className="ml-2">Yes</span>
                  </Label>
                </div>
                <div className="ff-el-form-check">
                  <Label className="ff-el-form-check-label" htmlFor="input_radio_25_no">
                    <RadioGroupItem
                      value="no"
                      id="input_radio_25_no"
                      className="ff-el-form-check-radio"
                    />
                    <span className="ml-2">No</span>
                  </Label>
                </div>
              </RadioGroup>
              {errors.hasWallInsulation && (
                <p className="text-red-500 text-sm mt-1">{errors.hasWallInsulation}</p>
              )}
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
              <Label htmlFor="ff_3_numeric_field_40">Alternative Wall Thickness (mm):</Label>
            </div>
            <div className="ff-el-input--content">
              <input
                type="number"
                name="alternativeWallThickness"
                id="ff_3_numeric_field_40"
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

          {/* Is Wall Thickness Unknown */}
          <div className="ff-el-group ff_list_buttons">
            <div className="ff-el-input--label asterisk-right">
              <Label>Wall Thickness Unknown:</Label>
            </div>
            <div className="ff-el-input--content">
              <RadioGroup
                name="isWallThicknessUnknown"
                value={formData.isWallThicknessUnknown}
                onValueChange={(value) =>
                  handleChange({ target: { name: "isWallThicknessUnknown", value } })
                }
                className="flex space-x-4"
                disabled={isViewOnly}
              >
                <div className="ff-el-form-check">
                  <Label className="ff-el-form-check-label" htmlFor="input_radio_26_yes">
                    <RadioGroupItem
                      value="yes"
                      id="input_radio_26_yes"
                      className="ff-el-form-check-radio"
                    />
                    <span className="ml-2">Yes</span>
                  </Label>
                </div>
                <div className="ff-el-form-check">
                  <Label className="ff-el-form-check-label" htmlFor="input_radio_26_no">
                    <RadioGroupItem
                      value="no"
                      id="input_radio_26_no"
                      className="ff-el-form-check-radio"
                    />
                    <span className="ml-2">No</span>
                  </Label>
                </div>
              </RadioGroup>
              {errors.isWallThicknessUnknown && (
                <p className="text-red-500 text-sm mt-1">{errors.isWallThicknessUnknown}</p>
              )}
            </div>
          </div>

          {/* Additional Notes */}
          <div className="ff-el-group">
            <div className="ff-el-input--label asterisk-right">
              <Label htmlFor="ff_3_description_3">Additional notes:</Label>
            </div>
            <div className="ff-el-input--content">
              <Textarea
                name="additionalNotes"
                id="ff_3_description_3"
                value={formData.additionalNotes}
                onChange={handleChange}
                className="ff-el-form-control w-full mt-1 border rounded px-2 py-2"
                rows={3}
                disabled={isViewOnly}
              />
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