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

export default function FormTwentySix() {
  const navigate = useNavigate();
  const { processId: urlProcessId } = useParams();
  const location = useLocation();
  const { toast } = useToast();
  const { user } = useAuthStore();

  // State for form data and metadata
  const [formData, setFormData] = useState({
    isSameAsMainRoof: "",
    hasConstructionPhotos: "",
    roofType: "",
    roofInsulation: "",
    insulationDepthFlatSloping: "",
    hasExtensionRoomInRoofPhotos: "",
    roomInRoofInsulation: "",
    insulationThicknessAtCeiling: "",
    insulationOtherParts: "",
    isConnectedToAnotherBuildingPart: "",
    editRoomInRoof: "",
    isSameAsMainFloor: "",
    insulationThicknessRetroFitted: "",
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
  const [constructionPhotos, setConstructionPhotos] = useState([]);
  const [constructionPreviews, setConstructionPreviews] = useState([]);
  const [constructionDeleted, setConstructionDeleted] = useState([]);
  const [loftInsulationDepthPhotos, setLoftInsulationDepthPhotos] = useState([]);
  const [loftInsulationDepthPreviews, setLoftInsulationDepthPreviews] = useState([]);
  const [loftInsulationDepthDeleted, setLoftInsulationDepthDeleted] = useState([]);
  const [extensionRoomInRoofPhotos, setExtensionRoomInRoofPhotos] = useState([]);
  const [extensionRoomInRoofPreviews, setExtensionRoomInRoofPreviews] = useState([]);
  const [extensionRoomInRoofDeleted, setExtensionRoomInRoofDeleted] = useState([]);

  // Determine mode and load data
  useEffect(() => {
    const isViewing = location.pathname.includes("/view-form");
    setIsViewOnly(isViewing || user.role !== "surveyor");
    const queryTaskId = new URLSearchParams(location.search).get("taskId");
    setTaskId(queryTaskId);

    if (urlProcessId && urlProcessId !== "new") {
      setLoading(true);
      fetch(`http://localhost:3000/api/assessments/form-twenty-six?processId=${urlProcessId}`, {
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
            if (existingForm.constructionPhotos?.length > 0) {
              setConstructionPreviews(
                existingForm.constructionPhotos.map((img) => `http://localhost:3000/${img}`)
              );
            }
            if (existingForm.loftInsulationDepthPhotos?.length > 0) {
              setLoftInsulationDepthPreviews(
                existingForm.loftInsulationDepthPhotos.map((img) => `http://localhost:3000/${img}`)
              );
            }
            if (existingForm.extensionRoomInRoofPhotos?.length > 0) {
              setExtensionRoomInRoofPreviews(
                existingForm.extensionRoomInRoofPhotos.map((img) => `http://localhost:3000/${img}`)
              );
            }
          } else if (isViewing) {
            toast({
              variant: "destructive",
              title: "Error",
              description: "Form Twenty-Six data not found.",
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
            description: "Error fetching Form Twenty-Six data.",
          });
          navigate("/dashboard");
          console.error("Fetch error:", error);
        })
        .finally(() => setLoading(false));
    }
  }, [urlProcessId, user, location, toast, navigate]);

  // Warn about unsaved changes
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
    } else if (field === "loftInsulationDepthPhotos") {
      setLoftInsulationDepthPhotos((prev) => [...prev, ...selectedFiles]);
      setLoftInsulationDepthPreviews((prev) => [
        ...prev,
        ...selectedFiles.map((file) => URL.createObjectURL(file)),
      ]);
    } else if (field === "extensionRoomInRoofPhotos") {
      setExtensionRoomInRoofPhotos((prev) => [...prev, ...selectedFiles]);
      setExtensionRoomInRoofPreviews((prev) => [
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
    } else if (field === "loftInsulationDepthPhotos") {
      const updatedPreviews = loftInsulationDepthPreviews.filter((_, idx) => idx !== index);
      setLoftInsulationDepthPreviews(updatedPreviews);
      const isNewUpload = previewUrl.startsWith("blob:");
      if (isNewUpload) {
        const updatedFiles = loftInsulationDepthPhotos.filter(
          (_, idx) => idx !== index - (loftInsulationDepthPreviews.length - loftInsulationDepthPhotos.length)
        );
        setLoftInsulationDepthPhotos(updatedFiles);
      } else {
        setLoftInsulationDepthDeleted((prev) => [...prev, previewUrl]);
      }
    } else if (field === "extensionRoomInRoofPhotos") {
      const updatedPreviews = extensionRoomInRoofPreviews.filter((_, idx) => idx !== index);
      setExtensionRoomInRoofPreviews(updatedPreviews);
      const isNewUpload = previewUrl.startsWith("blob:");
      if (isNewUpload) {
        const updatedFiles = extensionRoomInRoofPhotos.filter(
          (_, idx) => idx !== index - (extensionRoomInRoofPreviews.length - extensionRoomInRoofPhotos.length)
        );
        setExtensionRoomInRoofPhotos(updatedFiles);
      } else {
        setExtensionRoomInRoofDeleted((prev) => [...prev, previewUrl]);
      }
    }
    setUnsavedChanges(true);
  };

  // Form validation
  const validateForm = () => {
    const newErrors = {};

    if (!formData.isSameAsMainRoof) newErrors.isSameAsMainRoof = "Please select if same as main roof.";
    if (!formData.hasConstructionPhotos) newErrors.hasConstructionPhotos = "Please select if construction photos exist.";
    if (!formData.roofType) newErrors.roofType = "Roof Type is required.";
    if (!formData.roofInsulation) newErrors.roofInsulation = "Roof Insulation is required.";
    if (!formData.insulationDepthFlatSloping) newErrors.insulationDepthFlatSloping = "Insulation Depth is required.";
    if (!formData.hasExtensionRoomInRoofPhotos)
      newErrors.hasExtensionRoomInRoofPhotos = "Please select if extension room photos exist.";
    if (!formData.roomInRoofInsulation) newErrors.roomInRoofInsulation = "Room in Roof Insulation is required.";
    if (!formData.insulationThicknessAtCeiling)
      newErrors.insulationThicknessAtCeiling = "Insulation Thickness at Ceiling is required.";
    if (!formData.insulationOtherParts) newErrors.insulationOtherParts = "Insulation of Other Parts is required.";
    if (!formData.isConnectedToAnotherBuildingPart)
      newErrors.isConnectedToAnotherBuildingPart = "Please select if connected to another building part.";
    if (!formData.editRoomInRoof) newErrors.editRoomInRoof = "Please select if editing room in roof.";
    if (!formData.isSameAsMainFloor) newErrors.isSameAsMainFloor = "Please select if same as main floor.";
    if (!formData.insulationThicknessRetroFitted)
      newErrors.insulationThicknessRetroFitted = "Insulation Thickness (retro-fitted) is required.";

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
      loftInsulationDepthPhotos.forEach((file) => formDataToSend.append("loftInsulationDepthPhotos", file));
      extensionRoomInRoofPhotos.forEach((file) => formDataToSend.append("extensionRoomInRoofPhotos", file));

      // Append deleted images
      if (constructionDeleted.length > 0) {
        formDataToSend.append("deletedConstructionPhotos", JSON.stringify(constructionDeleted));
      }
      if (loftInsulationDepthDeleted.length > 0) {
        formDataToSend.append("deletedLoftInsulationDepthPhotos", JSON.stringify(loftInsulationDepthDeleted));
      }
      if (extensionRoomInRoofDeleted.length > 0) {
        formDataToSend.append("deletedExtensionRoomInRoofPhotos", JSON.stringify(extensionRoomInRoofDeleted));
      }

      const url = docId
        ? `http://localhost:3000/api/assessments/form-twenty-six/${docId}`
        : "http://localhost:3000/api/assessments/form-twenty-six";
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
        setLoftInsulationDepthPhotos([]);
        setExtensionRoomInRoofPhotos([]);
        setConstructionDeleted([]);
        setLoftInsulationDepthDeleted([]);
        setExtensionRoomInRoofDeleted([]);
        setConstructionPreviews(
          data.data.constructionPhotos?.map((photo) => `http://localhost:3000/${photo}`) || []
        );
        setLoftInsulationDepthPreviews(
          data.data.loftInsulationDepthPhotos?.map((photo) => `http://localhost:3000/${photo}`) || []
        );
        setExtensionRoomInRoofPreviews(
          data.data.extensionRoomInRoofPhotos?.map((photo) => `http://localhost:3000/${photo}`) || []
        );
        toast({
          title: "Success",
          description: `Form Twenty-Six ${docId ? "updated" : "saved"} successfully!`,
        });
        return { success: true, processId: data.data.processId };
      } else {
        throw new Error(data.error || "Failed to save Form Twenty-Six");
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
        navigate(`/view-form/${result.processId}/form-twenty-six?taskId=${taskId}`);
      } else {
        navigate(`/process/${result.processId}/form-twenty-six?taskId=${taskId}`, { replace: true });
      }
    }
  };

  // Handle navigation to the next form
  const handleNext = async () => {
    if (!isViewOnly) {
      const result = await saveForm();
      if (result.success) {
        navigate(`/dashboard?taskId=${taskId}`);
      }
    } else {
      navigate(`/dashboard?taskId=${taskId}`);
    }
  };

  // Handle navigation to the previous form
  const handlePrevious = async () => {
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
            {isViewOnly ? "View Form Twenty-Six" : "26. RdSAP v9.94 Extensions"}
          </h1>

          {/* Section Break */}
          <div className="ff-el-group ff-el-section-break ff_center" data-name="section_break-3_41">
            <h3 className="ff-el-section-title">RdSAP v9.94 Extensions</h3>
            <div className="ff-section_break_desk"></div>
            <hr />
          </div>

          {/* 5. Extension Roof */}
          <div className="ff-t-container ff-column-container ff_columns_total_2" data-name="ff_cn_id_31">
            <div className="ff-t-cell ff-t-column-1" style={{ flexBasis: "50%" }}>
              <div className="ff-el-group ff-custom_html" data-name="custom_html-3_42">
                <h1>
                  <span style={{ color: "#339966", fontSize: "24px", lineHeight: 1.4 }}>
                    5. Extension Roof
                  </span>
                </h1>
              </div>
            </div>
            <div className="ff-t-cell ff-t-column-2" style={{ flexBasis: "50%" }}>
              <div className="ff-el-group ff_list_buttons">
                <div className="ff-el-input--label asterisk-right">
                  <Label>As Main Roof:</Label>
                </div>
                <div className="ff-el-input--content">
                  <RadioGroup
                    name="isSameAsMainRoof"
                    value={formData.isSameAsMainRoof}
                    onValueChange={(value) =>
                      handleChange({ target: { name: "isSameAsMainRoof", value } })
                    }
                    className="flex space-x-4"
                    disabled={isViewOnly}
                  >
                    <div className="ff-el-form-check">
                      <Label className="ff-el-form-check-label" htmlFor="input_radio_27_yes">
                        <RadioGroupItem
                          value="yes"
                          id="input_radio_27_yes"
                          className="ff-el-form-check-radio"
                        />
                        <span className="ml-2">Yes</span>
                      </Label>
                    </div>
                    <div className="ff-el-form-check">
                      <Label className="ff-el-form-check-label" htmlFor="input_radio_27_no">
                        <RadioGroupItem
                          value="no"
                          id="input_radio_27_no"
                          className="ff-el-form-check-radio"
                        />
                        <span className="ml-2">No</span>
                      </Label>
                    </div>
                  </RadioGroup>
                  {errors.isSameAsMainRoof && (
                    <p className="text-red-500 text-sm mt-1">{errors.isSameAsMainRoof}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Has Construction Photos */}
          <div className="ff-el-group ff_list_buttons">
            <div className="ff-el-input--label asterisk-right">
              <Label>Construction photo (recommended):</Label>
            </div>
            <div className="ff-el-input--content">
              <RadioGroup
                name="hasConstructionPhotos"
                value={formData.hasConstructionPhotos}
                onValueChange={(value) =>
                  handleChange({ target: { name: "hasConstructionPhotos", value } })
                }
                className="flex space-x-4"
                disabled={isViewOnly}
              >
                <div className="ff-el-form-check">
                  <Label className="ff-el-form-check-label" htmlFor="input_radio_28_yes">
                    <RadioGroupItem
                      value="yes"
                      id="input_radio_28_yes"
                      className="ff-el-form-check-radio"
                    />
                    <span className="ml-2">Yes</span>
                  </Label>
                </div>
                <div className="ff-el-form-check">
                  <Label className="ff-el-form-check-label" htmlFor="input_radio_28_no">
                    <RadioGroupItem
                      value="no"
                      id="input_radio_28_no"
                      className="ff-el-form-check-radio"
                    />
                    <span className="ml-2">No</span>
                  </Label>
                </div>
              </RadioGroup>
              {errors.hasConstructionPhotos && (
                <p className="text-red-500 text-sm mt-1">{errors.hasConstructionPhotos}</p>
              )}
            </div>
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

          {/* Roof Type */}
          <div className="ff-el-group">
            <div className="ff-el-input--label asterisk-right">
              <Label htmlFor="ff_3_dropdown_72">Type:</Label>
            </div>
            <div className="ff-el-input--content">
              <select
                name="roofType"
                id="ff_3_dropdown_72"
                value={formData.roofType}
                onChange={handleChange}
                className={`ff-el-form-control w-full mt-1 border rounded px-2 py-2 ${errors.roofType ? "border-red-500" : ""}`}
                aria-required="true"
                disabled={isViewOnly}
              >
                <option value="">- Select -</option>
                <option value="Pitched (slates/tiles), access to loft">Pitched (slates/tiles), access to loft</option>
                <option value="Pitched (slates/tiles), no access">Pitched (slates/tiles), no access</option>
                <option value="Pitched, sloping ceiling">Pitched, sloping ceiling</option>
                <option value="Pitched (thatch)">Pitched (thatch)</option>
                <option value="Flat">Flat</option>
                <option value="Same dwelling above">Same dwelling above</option>
                <option value="Another dwelling above">Another dwelling above</option>
              </select>
              {errors.roofType && <p className="text-red-500 text-sm mt-1">{errors.roofType}</p>}
            </div>
          </div>

          {/* Roof Insulation */}
          <div className="ff-el-group">
            <div className="ff-el-input--label asterisk-right">
              <Label htmlFor="ff_3_dropdown_74">Insulation:</Label>
            </div>
            <div className="ff-el-input--content">
              <select
                name="roofInsulation"
                id="ff_3_dropdown_74"
                value={formData.roofInsulation}
                onChange={handleChange}
                className={`ff-el-form-control w-full mt-1 border rounded px-2 py-2 ${errors.roofInsulation ? "border-red-500" : ""}`}
                aria-required="true"
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
              </select>
              {errors.roofInsulation && (
                <p className="text-red-500 text-sm mt-1">{errors.roofInsulation}</p>
              )}
            </div>
          </div>

          {/* Insulation Depth Flat/Sloping */}
          <div className="ff-el-group">
            <div className="ff-el-input--label asterisk-right">
              <Label htmlFor="ff_3_dropdown_75">Insulation Depth (Flat/ Sloping Ceiling):</Label>
            </div>
            <div className="ff-el-input--content">
              <select
                name="insulationDepthFlatSloping"
                id="ff_3_dropdown_75"
                value={formData.insulationDepthFlatSloping}
                onChange={handleChange}
                className={`ff-el-form-control w-full mt-1 border rounded px-2 py-2 ${errors.insulationDepthFlatSloping ? "border-red-500" : ""}`}
                aria-required="true"
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
              {errors.insulationDepthFlatSloping && (
                <p className="text-red-500 text-sm mt-1">{errors.insulationDepthFlatSloping}</p>
              )}
            </div>
          </div>

          {/* Loft Insulation Depth Photos */}
          <div className="ff-el-group">
            <div className="ff-el-input--label asterisk-right">
              <Label>Loft insulation depth photo (recommended):</Label>
            </div>
            <div className="ff-el-input--content">
              <PhotoUploader
                label="Choose File"
                inputName="loftInsulationDepthPhotos"
                onFileChange={(e) => handleFileChange(e, "loftInsulationDepthPhotos")}
                imagePreviews={loftInsulationDepthPreviews}
                onDeleteImage={(index, url) => handleDeleteImage(index, url, "loftInsulationDepthPhotos")}
                isViewOnly={isViewOnly}
                className="ff_upload_btn ff-btn"
                listClassName="ff-uploaded-list"
                listStyle={{ fontSize: "12px", marginTop: "15px" }}
              />
            </div>
          </div>

          {/* 6. Extension Room in Roof */}
          <div className="ff-t-container ff-column-container ff_columns_total_3" data-name="ff_cn_id_32">
            <div className="ff-t-cell ff-t-column-1" style={{ flexBasis: "33.33%" }}>
              <div className="ff-el-group ff-custom_html" data-name="custom_html-3_43">
                <h1>
                  <span style={{ color: "#339966", fontSize: "24px", lineHeight: 1.4 }}>
                    6. Extension Room in Roof
                  </span>
                </h1>
              </div>
            </div>
            <div className="ff-t-cell ff-t-column-2" style={{ flexBasis: "33.33%" }}>
              <div className="ff-el-group ff_list_buttons">
                <div className="ff-el-input--label asterisk-right">
                  <Label>Extension Room in Roof Photos ?</Label>
                </div>
                <div className="ff-el-input--content">
                  <RadioGroup
                    name="hasExtensionRoomInRoofPhotos"
                    value={formData.hasExtensionRoomInRoofPhotos}
                    onValueChange={(value) =>
                      handleChange({ target: { name: "hasExtensionRoomInRoofPhotos", value } })
                    }
                    className="flex space-x-4"
                    disabled={isViewOnly}
                  >
                    <div className="ff-el-form-check">
                      <Label className="ff-el-form-check-label" htmlFor="input_radio_45_yes">
                        <RadioGroupItem
                          value="yes"
                          id="input_radio_45_yes"
                          className="ff-el-form-check-radio"
                        />
                        <span className="ml-2">Yes</span>
                      </Label>
                    </div>
                    <div className="ff-el-form-check">
                      <Label className="ff-el-form-check-label" htmlFor="input_radio_45_no">
                        <RadioGroupItem
                          value="no"
                          id="input_radio_45_no"
                          className="ff-el-form-check-radio"
                        />
                        <span className="ml-2">No</span>
                      </Label>
                    </div>
                  </RadioGroup>
                  {errors.hasExtensionRoomInRoofPhotos && (
                    <p className="text-red-500 text-sm mt-1">{errors.hasExtensionRoomInRoofPhotos}</p>
                  )}
                </div>
              </div>
            </div>
            <div className="ff-t-cell ff-t-column-3" style={{ flexBasis: "33.33%" }}>
              <div className="ff-el-group">
                <div className="ff-el-input--label asterisk-right">
                  <Label>Extension Room in Roof:</Label>
                </div>
                <div className="ff-el-input--content">
                  <PhotoUploader
                    label="Choose File"
                    inputName="extensionRoomInRoofPhotos"
                    onFileChange={(e) => handleFileChange(e, "extensionRoomInRoofPhotos")}
                    imagePreviews={extensionRoomInRoofPreviews}
                    onDeleteImage={(index, url) => handleDeleteImage(index, url, "extensionRoomInRoofPhotos")}
                    isViewOnly={isViewOnly}
                    className="ff_upload_btn ff-btn"
                    listClassName="ff-uploaded-list"
                    listStyle={{ fontSize: "12px", marginTop: "15px" }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Room in Roof Insulation */}
          <div className="ff-el-group">
            <div className="ff-el-input--label asterisk-right">
              <Label htmlFor="ff_3_dropdown_76">Insulation:</Label>
            </div>
            <div className="ff-el-input--content">
              <select
                name="roomInRoofInsulation"
                id="ff_3_dropdown_76"
                value={formData.roomInRoofInsulation}
                onChange={handleChange}
                className={`ff-el-form-control w-full mt-1 border rounded px-2 py-2 ${errors.roomInRoofInsulation ? "border-red-500" : ""}`}
                aria-required="true"
                disabled={isViewOnly}
              >
                <option value="">- Select -</option>
                <option value="Flat ceiling only">Flat ceiling only</option>
                <option value="All elements">All elements</option>
                <option value="As Built">As Built</option>
                <option value="Unknown">Unknown</option>
              </select>
              {errors.roomInRoofInsulation && (
                <p className="text-red-500 text-sm mt-1">{errors.roomInRoofInsulation}</p>
              )}
            </div>
          </div>

          {/* Insulation Thickness at Ceiling */}
          <div className="ff-el-group">
            <div className="ff-el-input--label asterisk-right">
              <Label htmlFor="ff_3_dropdown_77">Insulation Thickness at Ceiling:</Label>
            </div>
            <div className="ff-el-input--content">
              <select
                name="insulationThicknessAtCeiling"
                id="ff_3_dropdown_77"
                value={formData.insulationThicknessAtCeiling}
                onChange={handleChange}
                className={`ff-el-form-control w-full mt-1 border rounded px-2 py-2 ${errors.insulationThicknessAtCeiling ? "border-red-500" : ""}`}
                aria-required="true"
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
              {errors.insulationThicknessAtCeiling && (
                <p className="text-red-500 text-sm mt-1">{errors.insulationThicknessAtCeiling}</p>
              )}
            </div>
          </div>

          {/* Insulation of Other Parts */}
          <div className="ff-el-group">
            <div className="ff-el-input--label asterisk-right">
              <Label htmlFor="ff_3_dropdown_78">Insulation of other parts:</Label>
            </div>
            <div className="ff-el-input--content">
              <select
                name="insulationOtherParts"
                id="ff_3_dropdown_78"
                value={formData.insulationOtherParts}
                onChange={handleChange}
                className={`ff-el-form-control w-full mt-1 border rounded px-2 py-2 ${errors.insulationOtherParts ? "border-red-500" : ""}`}
                aria-required="true"
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
          </div>

          {/* Connected to Another Building Part */}
          <div className="ff-el-group ff_list_buttons">
            <div className="ff-el-input--label asterisk-right">
              <Label>Connected to another building part?</Label>
              <span
                className="ff-el-tooltip"
                title="only applicable when roof room is connected to an extension/ roof room on the same storey"
              >
                (only applicable when roof room is connected to an extension/ roof room on the same storey)
              </span>
            </div>
            <div className="ff-el-input--content">
              <RadioGroup
                name="isConnectedToAnotherBuildingPart"
                value={formData.isConnectedToAnotherBuildingPart}
                onValueChange={(value) =>
                  handleChange({ target: { name: "isConnectedToAnotherBuildingPart", value } })
                }
                className="flex space-x-4"
                disabled={isViewOnly}
              >
                <div className="ff-el-form-check">
                  <Label className="ff-el-form-check-label" htmlFor="input_radio_31_yes">
                    <RadioGroupItem
                      value="yes"
                      id="input_radio_31_yes"
                      className="ff-el-form-check-radio"
                    />
                    <span className="ml-2">Yes</span>
                  </Label>
                </div>
                <div className="ff-el-form-check">
                  <Label className="ff-el-form-check-label" htmlFor="input_radio_31_no">
                    <RadioGroupItem
                      value="no"
                      id="input_radio_31_no"
                      className="ff-el-form-check-radio"
                    />
                    <span className="ml-2">No</span>
                  </Label>
                </div>
              </RadioGroup>
              {errors.isConnectedToAnotherBuildingPart && (
                <p className="text-red-500 text-sm mt-1">{errors.isConnectedToAnotherBuildingPart}</p>
              )}
            </div>
          </div>

          {/* Edit Room in the Roof */}
          <div className="ff-el-group ff_list_buttons">
            <div className="ff-el-input--label asterisk-right">
              <Label>Edit Room in the Roof:</Label>
              <span className="ff-el-tooltip" title="if ticked, please see page 7 for details">
                (if ticked, please see page 7 for details)
              </span>
            </div>
            <div className="ff-el-input--content">
              <RadioGroup
                name="editRoomInRoof"
                value={formData.editRoomInRoof}
                onValueChange={(value) =>
                  handleChange({ target: { name: "editRoomInRoof", value } })
                }
                className="flex space-x-4"
                disabled={isViewOnly}
              >
                <div className="ff-el-form-check">
                  <Label className="ff-el-form-check-label" htmlFor="input_radio_32_yes">
                    <RadioGroupItem
                      value="yes"
                      id="input_radio_32_yes"
                      className="ff-el-form-check-radio"
                    />
                    <span className="ml-2">Yes</span>
                  </Label>
                </div>
                <div className="ff-el-form-check">
                  <Label className="ff-el-form-check-label" htmlFor="input_radio_32_no">
                    <RadioGroupItem
                      value="no"
                      id="input_radio_32_no"
                      className="ff-el-form-check-radio"
                    />
                    <span className="ml-2">No</span>
                  </Label>
                </div>
              </RadioGroup>
              {errors.editRoomInRoof && (
                <p className="text-red-500 text-sm mt-1">{errors.editRoomInRoof}</p>
              )}
            </div>
          </div>

          {/* 7. Extension Floor */}
          <div className="ff-t-container ff-column-container ff_columns_total_2" data-name="ff_cn_id_33">
            <div className="ff-t-cell ff-t-column-1" style={{ flexBasis: "50%" }}>
              <div className="ff-el-group ff-custom_html" data-name="custom_html-3_44">
                <h1>
                  <span style={{ color: "#339966", fontSize: "24px", lineHeight: 1.4 }}>
                    7. Extension Floor
                  </span>
                </h1>
              </div>
            </div>
            <div className="ff-t-cell ff-t-column-2" style={{ flexBasis: "50%" }}>
              <div className="ff-el-group ff_list_buttons">
                <div className="ff-el-input--label asterisk-right">
                  <Label>As Main Floor:</Label>
                </div>
                <div className="ff-el-input--content">
                  <RadioGroup
                    name="isSameAsMainFloor"
                    value={formData.isSameAsMainFloor}
                    onValueChange={(value) =>
                      handleChange({ target: { name: "isSameAsMainFloor", value } })
                    }
                    className="flex space-x-4"
                    disabled={isViewOnly}
                  >
                    <div className="ff-el-form-check">
                      <Label className="ff-el-form-check-label" htmlFor="input_radio_33_yes">
                        <RadioGroupItem
                          value="yes"
                          id="input_radio_33_yes"
                          className="ff-el-form-check-radio"
                        />
                        <span className="ml-2">Yes</span>
                      </Label>
                    </div>
                    <div className="ff-el-form-check">
                      <Label className="ff-el-form-check-label" htmlFor="input_radio_33_no">
                        <RadioGroupItem
                          value="no"
                          id="input_radio_33_no"
                          className="ff-el-form-check-radio"
                        />
                        <span className="ml-2">No</span>
                      </Label>
                    </div>
                  </RadioGroup>
                  {errors.isSameAsMainFloor && (
                    <p className="text-red-500 text-sm mt-1">{errors.isSameAsMainFloor}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Insulation Thickness (Retro-fitted) */}
          <div className="ff-el-group">
            <div className="ff-el-input--label asterisk-right">
              <Label htmlFor="ff_3_dropdown_82">Insulation Thickness (if retro-fitted):</Label>
            </div>
            <div className="ff-el-input--content">
              <select
                name="insulationThicknessRetroFitted"
                id="ff_3_dropdown_82"
                value={formData.insulationThicknessRetroFitted}
                onChange={handleChange}
                className={`ff-el-form-control w-full mt-1 border rounded px-2 py-2 ${errors.insulationThicknessRetroFitted ? "border-red-500" : ""}`}
                aria-required="true"
                disabled={isViewOnly}
              >
                <option value="">- Select -</option>
                <option value="50mm">50mm</option>
                <option value="100mm">100mm</option>
                <option value="150mm">150mm</option>
                <option value="Unknown">Unknown</option>
              </select>
              {errors.insulationThicknessRetroFitted && (
                <p className="text-red-500 text-sm mt-1">{errors.insulationThicknessRetroFitted}</p>
              )}
            </div>
          </div>

          {/* Additional Notes */}
          <div className="ff-el-group">
            <div className="ff-el-input--label asterisk-right">
              <Label htmlFor="ff_3_description_4">Additional notes:</Label>
            </div>
            <div className="ff-el-input--content">
              <Textarea
                name="additionalNotes"
                id="ff_3_description_4"
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