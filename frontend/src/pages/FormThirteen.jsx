import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/store/authStore";
import PhotoUploader from "@/components/ui/photo/PhotoUpload";

export default function FormThirteen() {
  const navigate = useNavigate();
  const { processId: urlProcessId } = useParams(); // e.g., /process/:processId/form-thirteen
  const location = useLocation();
  const { toast } = useToast();
  const { user } = useAuthStore();

  // State for form data and metadata
  const [formData, setFormData] = useState({
    mainHeating1: {
      type: "",
      makeAndModel: "",
      pcdfBoilerReference: "",
      heatingCode: "",
      heatingPumpAge: "",
      heatEmitter: "",
      designFlowTemperature: "",
      flueType: "",
      fanAssistedFlue: "",
      pcdfHeatingControls: "",
      compensatorFromPcdf: "",
      percentageOfHeat: "",
      mainHeating1Controls: "",
    },
    mainHeating2: {
      type: "",
      makeAndModel: "",
      pcdfBoilerReference: "",
      heatingCode: "",
      heatingPumpAge: "",
      heatEmitter: "",
      designFlowTemperature: "",
      flueType: "",
      fanAssistedFlue: "",
      pcdfHeatingControls: "",
      compensatorFromPcdf: "",
      percentageOfHeat: "",
      mainHeating2Controls: "",
    },
    secondaryHeating: "",
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
  const [mainHeating1Files, setMainHeating1Files] = useState([]);
  const [mainHeating1Previews, setMainHeating1Previews] = useState([]);
  const [mainHeating1Deleted, setMainHeating1Deleted] = useState([]);

  const [mainHeating2Files, setMainHeating2Files] = useState([]);
  const [mainHeating2Previews, setMainHeating2Previews] = useState([]);
  const [mainHeating2Deleted, setMainHeating2Deleted] = useState([]);

  const [secondaryHeatingFiles, setSecondaryHeatingFiles] = useState([]);
  const [secondaryHeatingPreviews, setSecondaryHeatingPreviews] = useState([]);
  const [secondaryHeatingDeleted, setSecondaryHeatingDeleted] = useState([]);

  // Determine mode (edit or view) and load existing data
  useEffect(() => {
    const isViewing = location.pathname.includes("/view-form");
    setIsViewOnly(isViewing || user.role !== "surveyor");
    const queryTaskId = new URLSearchParams(location.search).get("taskId");
    setTaskId(queryTaskId);

    if (urlProcessId && urlProcessId !== "new") {
      setLoading(true);
      fetch(`http://localhost:3000/api/assessments/form-thirteen?processId=${urlProcessId}`, {
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

            // Set Main Heating 1 photos preview
            if (existingForm.mainHeating1Photos && existingForm.mainHeating1Photos.length > 0) {
              const previews = existingForm.mainHeating1Photos.map(
                (img) => `http://localhost:3000/${img}`
              );
              setMainHeating1Previews(previews);
            }

            // Set Main Heating 2 photos preview
            if (existingForm.mainHeating2Photos && existingForm.mainHeating2Photos.length > 0) {
              const previews = existingForm.mainHeating2Photos.map(
                (img) => `http://localhost:3000/${img}`
              );
              setMainHeating2Previews(previews);
            }

            // Set Secondary Heating photos preview
            if (
              existingForm.secondaryHeatingPhotos &&
              existingForm.secondaryHeatingPhotos.length > 0
            ) {
              const previews = existingForm.secondaryHeatingPhotos.map(
                (img) => `http://localhost:3000/${img}`
              );
              setSecondaryHeatingPreviews(previews);
            }
          } else if (isViewing) {
            toast({
              variant: "destructive",
              title: "Error",
              description: "Form Thirteen data not found.",
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
            description: "Error fetching Form Thirteen data.",
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
  const handleChange = (e, section) => {
    const { name, value } = e.target;
    if (section === "mainHeating1" || section === "mainHeating2") {
      setFormData((prev) => ({
        ...prev,
        [section]: {
          ...prev[section],
          [name]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        userId: user ? user._id : "",
        processId: urlProcessId,
      }));
    }
    setUnsavedChanges(true);
    setErrors((prev) => ({ ...prev, [`${section}.${name}`]: "" }));
  };

  // Handle file changes
  const handleMainHeating1FileChange = (e) => {
    if (isViewOnly) return;
    const selectedFiles = Array.from(e.target.files);
    setMainHeating1Files((prev) => [...prev, ...selectedFiles]);
    const previewUrls = selectedFiles.map((file) => URL.createObjectURL(file));
    setMainHeating1Previews((prev) => [...prev, ...previewUrls]);
    setUnsavedChanges(true);
  };

  const handleMainHeating2FileChange = (e) => {
    if (isViewOnly) return;
    const selectedFiles = Array.from(e.target.files);
    setMainHeating2Files((prev) => [...prev, ...selectedFiles]);
    const previewUrls = selectedFiles.map((file) => URL.createObjectURL(file));
    setMainHeating2Previews((prev) => [...prev, ...previewUrls]);
    setUnsavedChanges(true);
  };

  const handleSecondaryHeatingFileChange = (e) => {
    if (isViewOnly) return;
    const selectedFiles = Array.from(e.target.files);
    setSecondaryHeatingFiles((prev) => [...prev, ...selectedFiles]);
    const previewUrls = selectedFiles.map((file) => URL.createObjectURL(file));
    setSecondaryHeatingPreviews((prev) => [...prev, ...previewUrls]);
    setUnsavedChanges(true);
  };

  // Delete photo handlers
  const handleDeleteMainHeating1Image = (index, previewUrl) => {
    if (isViewOnly) return;
    const updatedPreviews = mainHeating1Previews.filter((_, idx) => idx !== index);
    setMainHeating1Previews(updatedPreviews);

    const isNewUpload = previewUrl.startsWith("blob:");
    if (isNewUpload) {
      const updatedFiles = mainHeating1Files.filter(
        (_, idx) => idx !== index - (mainHeating1Previews.length - mainHeating1Files.length)
      );
      setMainHeating1Files(updatedFiles);
    } else {
      setMainHeating1Deleted((prev) => [...prev, previewUrl]);
    }

    setUnsavedChanges(true);
  };

  const handleDeleteMainHeating2Image = (index, previewUrl) => {
    if (isViewOnly) return;
    const updatedPreviews = mainHeating2Previews.filter((_, idx) => idx !== index);
    setMainHeating2Previews(updatedPreviews);

    const isNewUpload = previewUrl.startsWith("blob:");
    if (isNewUpload) {
      const updatedFiles = mainHeating2Files.filter(
        (_, idx) => idx !== index - (mainHeating2Previews.length - mainHeating2Files.length)
      );
      setMainHeating2Files(updatedFiles);
    } else {
      setMainHeating2Deleted((prev) => [...prev, previewUrl]);
    }

    setUnsavedChanges(true);
  };

  const handleDeleteSecondaryHeatingImage = (index, previewUrl) => {
    if (isViewOnly) return;
    const updatedPreviews = secondaryHeatingPreviews.filter((_, idx) => idx !== index);
    setSecondaryHeatingPreviews(updatedPreviews);

    const isNewUpload = previewUrl.startsWith("blob:");
    if (isNewUpload) {
      const updatedFiles = secondaryHeatingFiles.filter(
        (_, idx) => idx !== index - (secondaryHeatingPreviews.length - secondaryHeatingFiles.length)
      );
      setSecondaryHeatingFiles(updatedFiles);
    } else {
      setSecondaryHeatingDeleted((prev) => [...prev, previewUrl]);
    }

    setUnsavedChanges(true);
  };

  // Form validation
  const validateForm = () => {
    const newErrors = {};

    // Validate Main Heating 1
    if (!formData.mainHeating1.type) {
      newErrors["mainHeating1.type"] = "Type is required for Main Heating 1.";
    }
    if (
      formData.mainHeating1.percentageOfHeat &&
      (isNaN(formData.mainHeating1.percentageOfHeat) ||
        formData.mainHeating1.percentageOfHeat < 0 ||
        formData.mainHeating1.percentageOfHeat > 100)
    ) {
      newErrors["mainHeating1.percentageOfHeat"] = "Percentage of heat must be between 0 and 100.";
    }

    // Validate Main Heating 2 (only if fields are filled)
    if (
      formData.mainHeating2.type &&
      formData.mainHeating2.percentageOfHeat &&
      (isNaN(formData.mainHeating2.percentageOfHeat) ||
        formData.mainHeating2.percentageOfHeat < 0 ||
        formData.mainHeating2.percentageOfHeat > 100)
    ) {
      newErrors["mainHeating2.percentageOfHeat"] = "Percentage of heat must be between 0 and 100.";
    }

    // Validate total percentage if both are provided
    const totalPercentage =
      (parseFloat(formData.mainHeating1.percentageOfHeat) || 0) +
      (parseFloat(formData.mainHeating2.percentageOfHeat) || 0);
    if (
      formData.mainHeating1.percentageOfHeat &&
      formData.mainHeating2.percentageOfHeat &&
      totalPercentage > 100
    ) {
      newErrors["mainHeating1.percentageOfHeat"] = "Total percentage of heat cannot exceed 100%.";
      newErrors["mainHeating2.percentageOfHeat"] = "Total percentage of heat cannot exceed 100%.";
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
      formDataToSend.append("mainHeating1", JSON.stringify(formData.mainHeating1));
      formDataToSend.append("mainHeating2", JSON.stringify(formData.mainHeating2));
      formDataToSend.append("secondaryHeating", formData.secondaryHeating);
      formDataToSend.append("userId", formData.userId);
      formDataToSend.append("processId", formData.processId);

      // Append new files
      if (mainHeating1Files.length > 0) {
        mainHeating1Files.forEach((file) => {
          formDataToSend.append("mainHeating1Photos", file);
        });
      }
      if (mainHeating2Files.length > 0) {
        mainHeating2Files.forEach((file) => {
          formDataToSend.append("mainHeating2Photos", file);
        });
      }
      if (secondaryHeatingFiles.length > 0) {
        secondaryHeatingFiles.forEach((file) => {
          formDataToSend.append("secondaryHeatingPhotos", file);
        });
      }

      // Append deleted images
      if (mainHeating1Deleted.length > 0) {
        formDataToSend.append("deletedMainHeating1Photos", JSON.stringify(mainHeating1Deleted));
      }
      if (mainHeating2Deleted.length > 0) {
        formDataToSend.append("deletedMainHeating2Photos", JSON.stringify(mainHeating2Deleted));
      }
      if (secondaryHeatingDeleted.length > 0) {
        formDataToSend.append(
          "deletedSecondaryHeatingPhotos",
          JSON.stringify(secondaryHeatingDeleted)
        );
      }

      const url = docId
        ? `http://localhost:3000/api/assessments/form-thirteen/${docId}`
        : "http://localhost:3000/api/assessments/form-thirteen";
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
        setMainHeating1Files([]);
        setMainHeating2Files([]);
        setSecondaryHeatingFiles([]);
        setMainHeating1Deleted([]);
        setMainHeating2Deleted([]);
        setSecondaryHeatingDeleted([]);
        setMainHeating1Previews(
          data.data.mainHeating1Photos.map((photo) => `http://localhost:3000/${photo}`)
        );
        setMainHeating2Previews(
          data.data.mainHeating2Photos.map((photo) => `http://localhost:3000/${photo}`)
        );
        setSecondaryHeatingPreviews(
          data.data.secondaryHeatingPhotos.map((photo) => `http://localhost:3000/${photo}`)
        );
        toast({
          title: "Success",
          description: `Form Thirteen ${docId ? "updated" : "saved"} successfully!`,
        });
        return { success: true, processId: data.data.processId };
      } else {
        throw new Error(data.error || "Failed to save Form Thirteen");
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
        navigate(`/view-form/${result.processId}/form-thirteen?taskId=${taskId}`);
      } else {
        navigate(`/process/${result.processId}/form-thirteen?taskId=${taskId}`, { replace: true });
      }
    }
  };

  // Handle navigation to the next form (Form Fourteen)
  const handleNext = async () => {
    if (!isViewOnly) {
      const result = await saveForm();
      if (result.success) {
        if (user.role === "surveyor") {
          navigate(`/process/${result.processId}/form-fourteen?taskId=${taskId}`);
        } else {
          navigate(`/view-form/${result.processId}/form-fourteen?taskId=${taskId}`);
        }
      }
    } else {
      navigate(`/view-form/${savedProcessId || urlProcessId}/form-fourteen?taskId=${taskId}`);
    }
  };

  // Handle navigation to the previous form (Form Twelve)
  const handlePrevious = async () => {
    if (!isViewOnly) {
      const result = await saveForm();
      if (result.success) {
        if (user.role === "surveyor") {
          navigate(`/process/${result.processId}/form-twelve?taskId=${taskId}`);
        } else {
          navigate(`/view-form/${result.processId}/form-twelve?taskId=${taskId}`);
        }
      }
    } else {
      navigate(`/view-form/${savedProcessId || urlProcessId}/form-twelve?taskId=${taskId}`);
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
            {isViewOnly ? "View Form Thirteen" : "13. Heating"}
          </h1>

          <div className="flex flex-col md:flex-row gap-6">
            {/* Main Heating 1 */}
            <div className="flex-1">
              <h2 className="text-xl font-semibold mb-4">Main Heating 1</h2>

              {/* Main Heating 1 Photos */}
              <div className="mb-6">
                <PhotoUploader
                  label="Main Heating 1 Photos (Recommended)"
                  inputName="mainHeating1Photos"
                  onFileChange={handleMainHeating1FileChange}
                  imagePreviews={mainHeating1Previews}
                  onDeleteImage={handleDeleteMainHeating1Image}
                  isViewOnly={isViewOnly}
                />
              </div>

              <div className="mb-4">
                <Label>Type:</Label>
                <Input
                  type="text"
                  name="type"
                  value={formData.mainHeating1.type}
                  onChange={(e) => handleChange(e, "mainHeating1")}
                  className={`mt-1 ${errors["mainHeating1.type"] ? "border-red-500" : ""}`}
                  disabled={isViewOnly}
                />
                {errors["mainHeating1.type"] && (
                  <p className="text-red-500 text-sm mt-1">{errors["mainHeating1.type"]}</p>
                )}
              </div>
              <div className="mb-4">
                <Label>Make &amp; Model:</Label>
                <Input
                  type="text"
                  name="makeAndModel"
                  value={formData.mainHeating1.makeAndModel}
                  onChange={(e) => handleChange(e, "mainHeating1")}
                  className="mt-1"
                  disabled={isViewOnly}
                />
              </div>
              <div className="mb-4">
                <Label>PCDF Boiler Reference:</Label>
                <Input
                  type="text"
                  name="pcdfBoilerReference"
                  value={formData.mainHeating1.pcdfBoilerReference}
                  onChange={(e) => handleChange(e, "mainHeating1")}
                  className="mt-1"
                  disabled={isViewOnly}
                />
              </div>
              <div className="mb-4">
                <Label>Heating Code:</Label>
                <Input
                  type="text"
                  name="heatingCode"
                  value={formData.mainHeating1.heatingCode}
                  onChange={(e) => handleChange(e, "mainHeating1")}
                  className="mt-1"
                  disabled={isViewOnly}
                />
              </div>
              <div className="mb-4">
                <Label>Heating Pump Age:</Label>
                <select
                  name="heatingPumpAge"
                  value={formData.mainHeating1.heatingPumpAge}
                  onChange={(e) => handleChange(e, "mainHeating1")}
                  className="w-full mt-1 border rounded px-2 py-2"
                  disabled={isViewOnly}
                >
                  <option value="">- Select -</option>
                  <option value="2012 or earlier">2012 or earlier</option>
                  <option value="2013 or later">2013 or later</option>
                  <option value="Unknown">Unknown</option>
                </select>
              </div>
              <div className="mb-4">
                <Label>Heat Emitter:</Label>
                <select
                  name="heatEmitter"
                  value={formData.mainHeating1.heatEmitter}
                  onChange={(e) => handleChange(e, "mainHeating1")}
                  className="w-full mt-1 border rounded px-2 py-2"
                  disabled={isViewOnly}
                >
                  <option value="">- Select -</option>
                  <option value="Underfloor Heating">Underfloor Heating</option>
                  <option value="Radiators">Radiators</option>
                </select>
              </div>
              <div className="mb-4">
                <Label>Design Flow Temperature:</Label>
                <select
                  name="designFlowTemperature"
                  value={formData.mainHeating1.designFlowTemperature}
                  onChange={(e) => handleChange(e, "mainHeating1")}
                  className="w-full mt-1 border rounded px-2 py-2"
                  disabled={isViewOnly}
                >
                  <option value="">- Select -</option>
                  <option value="Unknown">Unknown</option>
                  <option value="Normal (>45C)">Normal (&gt;45C)</option>
                  <option value="35C-45C">35C-45C</option>
                  <option value="<=35C">&lt;=35C</option>
                </select>
                <small className="text-gray-500">Documentary evidence required</small>
              </div>
              <div className="mb-4">
                <Label>Flue Type:</Label>
                <select
                  name="flueType"
                  value={formData.mainHeating1.flueType}
                  onChange={(e) => handleChange(e, "mainHeating1")}
                  className="w-full mt-1 border rounded px-2 py-2"
                  disabled={isViewOnly}
                >
                  <option value="">- Select -</option>
                  <option value="Balanced">Balanced</option>
                  <option value="Open">Open</option>
                </select>
                <small className="text-gray-500">Documentary evidence required</small>
              </div>
              <div className="mb-4">
                <Label>Fan Assisted Flue:</Label>
                <select
                  name="fanAssistedFlue"
                  value={formData.mainHeating1.fanAssistedFlue}
                  onChange={(e) => handleChange(e, "mainHeating1")}
                  className="w-full mt-1 border rounded px-2 py-2"
                  disabled={isViewOnly}
                >
                  <option value="">- Select -</option>
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
                <small className="text-gray-500">Documentary evidence required</small>
              </div>
              <div className="mb-4">
                <Label>PCDF Heating Controls:</Label>
                <Input
                  type="text"
                  name="pcdfHeatingControls"
                  value={formData.mainHeating1.pcdfHeatingControls}
                  onChange={(e) => handleChange(e, "mainHeating1")}
                  className="mt-1"
                  disabled={isViewOnly}
                />
              </div>
              <div className="mb-4">
                <Label>Compensator from PCDF:</Label>
                <Input
                  type="text"
                  name="compensatorFromPcdf"
                  value={formData.mainHeating1.compensatorFromPcdf}
                  onChange={(e) => handleChange(e, "mainHeating1")}
                  className="mt-1"
                  disabled={isViewOnly}
                />
              </div>
              <div className="mb-4">
                <Label>Percentage of Heat (%):</Label>
                <Input
                  type="number"
                  name="percentageOfHeat"
                  value={formData.mainHeating1.percentageOfHeat}
                  onChange={(e) => handleChange(e, "mainHeating1")}
                  className={`mt-1 ${
                    errors["mainHeating1.percentageOfHeat"] ? "border-red-500" : ""
                  }`}
                  step="1"
                  min="0"
                  max="100"
                  disabled={isViewOnly}
                />
                {errors["mainHeating1.percentageOfHeat"] && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors["mainHeating1.percentageOfHeat"]}
                  </p>
                )}
              </div>
              <div className="mb-4">
                <Label>Main Heating 1 Controls:</Label>
                <Input
                  type="text"
                  name="mainHeating1Controls"
                  value={formData.mainHeating1.mainHeating1Controls}
                  onChange={(e) => handleChange(e, "mainHeating1")}
                  className="mt-1"
                  disabled={isViewOnly}
                />
              </div>
            </div>

            {/* Main Heating 2 */}
            <div className="flex-1">
              <h2 className="text-xl font-semibold mb-4">Main Heating 2</h2>

              {/* Main Heating 2 Photos */}
              <div className="mb-6">
                <PhotoUploader
                  label="Main Heating 2 Photos (Optional)"
                  inputName="mainHeating2Photos"
                  onFileChange={handleMainHeating2FileChange}
                  imagePreviews={mainHeating2Previews}
                  onDeleteImage={handleDeleteMainHeating2Image}
                  isViewOnly={isViewOnly}
                />
              </div>

              <div className="mb-4">
                <Label>Type:</Label>
                <Input
                  type="text"
                  name="type"
                  value={formData.mainHeating2.type}
                  onChange={(e) => handleChange(e, "mainHeating2")}
                  className="mt-1"
                  disabled={isViewOnly}
                />
              </div>
              <div className="mb-4">
                <Label>Make &amp; Model:</Label>
                <Input
                  type="text"
                  name="makeAndModel"
                  value={formData.mainHeating2.makeAndModel}
                  onChange={(e) => handleChange(e, "mainHeating2")}
                  className="mt-1"
                  disabled={isViewOnly}
                />
              </div>
              <div className="mb-4">
                <Label>PCDF Boiler Reference:</Label>
                <Input
                  type="text"
                  name="pcdfBoilerReference"
                  value={formData.mainHeating2.pcdfBoilerReference}
                  onChange={(e) => handleChange(e, "mainHeating2")}
                  className="mt-1"
                  disabled={isViewOnly}
                />
              </div>
              <div className="mb-4">
                <Label>Heating Code:</Label>
                <Input
                  type="text"
                  name="heatingCode"
                  value={formData.mainHeating2.heatingCode}
                  onChange={(e) => handleChange(e, "mainHeating2")}
                  className="mt-1"
                  disabled={isViewOnly}
                />
              </div>
              <div className="mb-4">
                <Label>Heating Pump Age:</Label>
                <select
                  name="heatingPumpAge"
                  value={formData.mainHeating2.heatingPumpAge}
                  onChange={(e) => handleChange(e, "mainHeating2")}
                  className="w-full mt-1 border rounded px-2 py-2"
                  disabled={isViewOnly}
                >
                  <option value="">- Select -</option>
                  <option value="2012 or earlier">2012 or earlier</option>
                  <option value="2013 or later">2013 or later</option>
                  <option value="Unknown">Unknown</option>
                </select>
              </div>
              <div className="mb-4">
                <Label>Heat Emitter:</Label>
                <select
                  name="heatEmitter"
                  value={formData.mainHeating2.heatEmitter}
                  onChange={(e) => handleChange(e, "mainHeating2")}
                  className="w-full mt-1 border rounded px-2 py-2"
                  disabled={isViewOnly}
                >
                  <option value="">- Select -</option>
                  <option value="Underfloor Heating">Underfloor Heating</option>
                  <option value="Radiators">Radiators</option>
                </select>
              </div>
              <div className="mb-4">
                <Label>Design Flow Temperature:</Label>
                <select
                  name="designFlowTemperature"
                  value={formData.mainHeating2.designFlowTemperature}
                  onChange={(e) => handleChange(e, "mainHeating2")}
                  className="w-full mt-1 border rounded px-2 py-2"
                  disabled={isViewOnly}
                >
                  <option value="">- Select -</option>
                  <option value="Unknown">Unknown</option>
                  <option value="Normal (>45C)">Normal (&gt;45C)</option>
                  <option value="35C-45C">35C-45C</option>
                  <option value="<=35C">&lt;=35C</option>
                </select>
                <small className="text-gray-500">Documentary evidence required</small>
              </div>
              <div className="mb-4">
                <Label>Flue Type:</Label>
                <select
                  name="flueType"
                  value={formData.mainHeating2.flueType}
                  onChange={(e) => handleChange(e, "mainHeating2")}
                  className="w-full mt-1 border rounded px-2 py-2"
                  disabled={isViewOnly}
                >
                  <option value="">- Select -</option>
                  <option value="Balanced">Balanced</option>
                  <option value="Open">Open</option>
                </select>
                <small className="text-gray-500">Documentary evidence required</small>
              </div>
              <div className="mb-4">
                <Label>Fan Assisted Flue:</Label>
                <select
                  name="fanAssistedFlue"
                  value={formData.mainHeating2.fanAssistedFlue}
                  onChange={(e) => handleChange(e, "mainHeating2")}
                  className="w-full mt-1 border rounded px-2 py-2"
                  disabled={isViewOnly}
                >
                  <option value="">- Select -</option>
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
                <small className="text-gray-500">Documentary evidence required</small>
              </div>
              <div className="mb-4">
                <Label>PCDF Heating Controls:</Label>
                <Input
                  type="text"
                  name="pcdfHeatingControls"
                  value={formData.mainHeating2.pcdfHeatingControls}
                  onChange={(e) => handleChange(e, "mainHeating2")}
                  className="mt-1"
                  disabled={isViewOnly}
                />
              </div>
              <div className="mb-4">
                <Label>Compensator from PCDF:</Label>
                <Input
                  type="text"
                  name="compensatorFromPcdf"
                  value={formData.mainHeating2.compensatorFromPcdf}
                  onChange={(e) => handleChange(e, "mainHeating2")}
                  className="mt-1"
                  disabled={isViewOnly}
                />
              </div>
              <div className="mb-4">
                <Label>Percentage of Heat (%):</Label>
                <Input
                  type="number"
                  name="percentageOfHeat"
                  value={formData.mainHeating2.percentageOfHeat}
                  onChange={(e) => handleChange(e, "mainHeating2")}
                  className={`mt-1 ${
                    errors["mainHeating2.percentageOfHeat"] ? "border-red-500" : ""
                  }`}
                  step="1"
                  min="0"
                  max="100"
                  disabled={isViewOnly}
                />
                {errors["mainHeating2.percentageOfHeat"] && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors["mainHeating2.percentageOfHeat"]}
                  </p>
                )}
              </div>
              <div className="mb-4">
                <Label>Main Heating 2 Controls:</Label>
                <Input
                  type="text"
                  name="mainHeating2Controls"
                  value={formData.mainHeating2.mainHeating2Controls}
                  onChange={(e) => handleChange(e, "mainHeating2")}
                  className="mt-1"
                  disabled={isViewOnly}
                />
              </div>
            </div>
          </div>

          {/* Secondary Heating */}
          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-4">Secondary Heating</h2>
            <div className="mb-4">
              <Label>Secondary Heating:</Label>
              <Input
                type="text"
                name="secondaryHeating"
                value={formData.secondaryHeating}
                onChange={handleChange}
                className="mt-1"
                disabled={isViewOnly}
              />
            </div>
            <div className="mb-6">
              <PhotoUploader
                label="Secondary Heating Photos (Recommended)"
                inputName="secondaryHeatingPhotos"
                onFileChange={handleSecondaryHeatingFileChange}
                imagePreviews={secondaryHeatingPreviews}
                onDeleteImage={handleDeleteSecondaryHeatingImage}
                isViewOnly={isViewOnly}
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
                <Button
                  variant="outline"
                  onClick={() => navigate("/dashboard")}
                  disabled={loading}
                >
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