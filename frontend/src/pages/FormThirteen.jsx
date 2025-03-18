import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/store/authStore";

export default function FormThirteen() {
  const navigate = useNavigate();
  const { processId } = useParams(); // e.g., /process/:processId/form-thirteen
  const { toast } = useToast();
  const { user } = useAuthStore();

  const [docId, setDocId] = useState(null);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [isUpdate, setIsUpdate] = useState(false);

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
    userId: "",
    processId: processId || "",
  });

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

  // Set userId and processId when available
  useEffect(() => {
    if (user && user._id) {
      setFormData((prev) => ({
        ...prev,
        userId: user._id,
        processId,
      }));
    }
  }, [user, processId]);

  // Fetch existing Form Thirteen data on mount
  useEffect(() => {
    if (user && user._id && processId) {
      fetch(`http://localhost:3000/api/assessments/form-thirteen?userId=${user._id}&processId=${processId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data && data.data.length > 0) {
            const existingForm = data.data[0];
            setFormData(existingForm);
            setDocId(existingForm._id);
            setIsUpdate(true);

            // Set Main Heating 1 photos preview
            if (existingForm.mainHeating1Photos && existingForm.mainHeating1Photos.length > 0) {
              const previews = existingForm.mainHeating1Photos.map((img) => `http://localhost:3000/${img}`);
              setMainHeating1Previews(previews);
            }

            // Set Main Heating 2 photos preview
            if (existingForm.mainHeating2Photos && existingForm.mainHeating2Photos.length > 0) {
              const previews = existingForm.mainHeating2Photos.map((img) => `http://localhost:3000/${img}`);
              setMainHeating2Previews(previews);
            }

            // Set Secondary Heating photos preview
            if (existingForm.secondaryHeatingPhotos && existingForm.secondaryHeatingPhotos.length > 0) {
              const previews = existingForm.secondaryHeatingPhotos.map((img) => `http://localhost:3000/${img}`);
              setSecondaryHeatingPreviews(previews);
            }
          }
        })
        .catch((error) => {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Error fetching saved data.",
          });
          console.error("Fetch error:", error);
        });
    }
  }, [user, processId, toast]);

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
      }));
    }
    setUnsavedChanges(true);
  };

  // Handle file changes
  const handleMainHeating1FileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setMainHeating1Files((prev) => [...prev, ...selectedFiles]);
    const previewUrls = selectedFiles.map((file) => URL.createObjectURL(file));
    setMainHeating1Previews((prev) => [...prev, ...previewUrls]);
    setUnsavedChanges(true);
  };

  const handleMainHeating2FileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setMainHeating2Files((prev) => [...prev, ...selectedFiles]);
    const previewUrls = selectedFiles.map((file) => URL.createObjectURL(file));
    setMainHeating2Previews((prev) => [...prev, ...previewUrls]);
    setUnsavedChanges(true);
  };

  const handleSecondaryHeatingFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setSecondaryHeatingFiles((prev) => [...prev, ...selectedFiles]);
    const previewUrls = selectedFiles.map((file) => URL.createObjectURL(file));
    setSecondaryHeatingPreviews((prev) => [...prev, ...previewUrls]);
    setUnsavedChanges(true);
  };

  // Delete photo handlers
  const handleDeleteMainHeating1Image = (index, previewUrl) => {
    const updatedFiles = mainHeating1Files.filter((_, idx) => idx !== index);
    const updatedPreviews = mainHeating1Previews.filter((_, idx) => idx !== index);
    setMainHeating1Deleted((prev) => {
      if (!prev.includes(previewUrl)) {
        return [...prev, previewUrl];
      }
      return prev;
    });
    setMainHeating1Files(updatedFiles);
    setMainHeating1Previews(updatedPreviews);
    setUnsavedChanges(true);
  };

  const handleDeleteMainHeating2Image = (index, previewUrl) => {
    const updatedFiles = mainHeating2Files.filter((_, idx) => idx !== index);
    const updatedPreviews = mainHeating2Previews.filter((_, idx) => idx !== index);
    setMainHeating2Deleted((prev) => {
      if (!prev.includes(previewUrl)) {
        return [...prev, previewUrl];
      }
      return prev;
    });
    setMainHeating2Files(updatedFiles);
    setMainHeating2Previews(updatedPreviews);
    setUnsavedChanges(true);
  };

  const handleDeleteSecondaryHeatingImage = (index, previewUrl) => {
    const updatedFiles = secondaryHeatingFiles.filter((_, idx) => idx !== index);
    const updatedPreviews = secondaryHeatingPreviews.filter((_, idx) => idx !== index);
    setSecondaryHeatingDeleted((prev) => {
      if (!prev.includes(previewUrl)) {
        return [...prev, previewUrl];
      }
      return prev;
    });
    setSecondaryHeatingFiles(updatedFiles);
    setSecondaryHeatingPreviews(updatedPreviews);
    setUnsavedChanges(true);
  };

  // Save/Update Handler
  const handleSave = async () => {
    try {
      const formDataToSend = new FormData();

      // Append non-file fields
      formDataToSend.append("mainHeating1", JSON.stringify(formData.mainHeating1));
      formDataToSend.append("mainHeating2", JSON.stringify(formData.mainHeating2));
      formDataToSend.append("secondaryHeating", formData.secondaryHeating);
      formDataToSend.append("userId", formData.userId);
      formDataToSend.append("processId", formData.processId);

      // Append files
      mainHeating1Files.forEach((file) => formDataToSend.append("mainHeating1Photos", file));
      mainHeating2Files.forEach((file) => formDataToSend.append("mainHeating2Photos", file));
      secondaryHeatingFiles.forEach((file) => formDataToSend.append("secondaryHeatingPhotos", file));

      // Append deleted images
      if (mainHeating1Deleted.length > 0) {
        formDataToSend.append("deletedMainHeating1", JSON.stringify(mainHeating1Deleted));
      }
      if (mainHeating2Deleted.length > 0) {
        formDataToSend.append("deletedMainHeating2", JSON.stringify(mainHeating2Deleted));
      }
      if (secondaryHeatingDeleted.length > 0) {
        formDataToSend.append("deletedSecondaryHeating", JSON.stringify(secondaryHeatingDeleted));
      }

      let url = "http://localhost:3000/api/assessments/form-thirteen";
      let method = "POST";
      if (docId) {
        url = `http://localhost:3000/api/assessments/form-thirteen/${docId}`;
        method = "PUT";
      }

      const response = await fetch(url, {
        method,
        body: formDataToSend,
      });
      const data = await response.json();
      if (data.success) {
        setDocId(data.data._id);
        setIsUpdate(true);
        setUnsavedChanges(false);
        toast({
          title: "Success",
          description: `Form Thirteen ${docId ? "updated" : "saved"} successfully!`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: data.error || "Save failed",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An error occurred while saving Form Thirteen",
      });
      console.error("Save error:", error);
    }
  };

  // Navigation Handlers
  const handleNext = () => {
    if (unsavedChanges) {
      toast({
        variant: "warning",
        title: "Unsaved changes",
        description: "Please save before proceeding.",
      });
      return;
    }
    navigate(`/process/${processId}/form-fourteen`); // Assuming Form Fourteen follows
  };

  const handlePrevious = () => {
    if (unsavedChanges) {
      toast({
        variant: "warning",
        title: "Unsaved changes",
        description: "Please save before navigating back.",
      });
      return;
    }
    navigate(`/process/${processId}/form-twelve`);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center px-4 py-6">
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white w-full max-w-4xl p-8 rounded-lg shadow"
      >
        <h1 className="text-2xl font-bold mb-6 text-center">Form Thirteen: Heating</h1>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Main Heating 1 */}
          <div className="flex-1">
            <h2 className="text-xl font-semibold mb-4">Main Heating 1</h2>

            {/* Main Heating 1 Photos */}
            <div className="mb-6">
              <Label>Main Heating 1 Photos</Label>
              <div className="flex flex-col gap-2 mt-2">
                <Button onClick={() => document.getElementById("mainHeating1Input").click()}>
                  Choose Photos
                </Button>
                <input
                  id="mainHeating1Input"
                  type="file"
                  accept="image/*"
                  multiple
                  name="mainHeating1Photos"
                  onChange={handleMainHeating1FileChange}
                  className="hidden"
                />
              </div>
              {mainHeating1Previews.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {mainHeating1Previews.map((preview, index) => (
                    <div key={index} className="relative">
                      <img
                        src={preview}
                        alt="Main Heating 1 Preview"
                        className="w-32 h-32 object-cover rounded"
                      />
                      <button
                        onClick={() => handleDeleteMainHeating1Image(index, preview)}
                        className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mb-4">
              <Label>Type</Label>
              <Input
                type="text"
                name="type"
                value={formData.mainHeating1.type}
                onChange={(e) => handleChange(e, "mainHeating1")}
                className="mt-1"
              />
            </div>
            <div className="mb-4">
              <Label>Make & Model</Label>
              <Input
                type="text"
                name="makeAndModel"
                value={formData.mainHeating1.makeAndModel}
                onChange={(e) => handleChange(e, "mainHeating1")}
                className="mt-1"
              />
            </div>
            <div className="mb-4">
              <Label>PCDF Boiler Reference</Label>
              <Input
                type="text"
                name="pcdfBoilerReference"
                value={formData.mainHeating1.pcdfBoilerReference}
                onChange={(e) => handleChange(e, "mainHeating1")}
                className="mt-1"
              />
            </div>
            <div className="mb-4">
              <Label>Heating Code</Label>
              <Input
                type="text"
                name="heatingCode"
                value={formData.mainHeating1.heatingCode}
                onChange={(e) => handleChange(e, "mainHeating1")}
                className="mt-1"
              />
            </div>
            <div className="mb-4">
              <Label>Heating Pump Age</Label>
              <select
                name="heatingPumpAge"
                value={formData.mainHeating1.heatingPumpAge}
                onChange={(e) => handleChange(e, "mainHeating1")}
                className="w-full mt-1 border rounded px-2 py-2"
              >
                <option value="">- Select -</option>
                <option value="2012 or earlier">2012 or earlier</option>
                <option value="2013 or later">2013 or later</option>
                <option value="Unknown">Unknown</option>
              </select>
            </div>
            <div className="mb-4">
              <Label>Heat Emitter</Label>
              <select
                name="heatEmitter"
                value={formData.mainHeating1.heatEmitter}
                onChange={(e) => handleChange(e, "mainHeating1")}
                className="w-full mt-1 border rounded px-2 py-2"
              >
                <option value="">- Select -</option>
                <option value="Underfloor Heating">Underfloor Heating</option>
                <option value="Radiators">Radiators</option>
              </select>
            </div>
            <div className="mb-4">
              <Label>Design Flow Temperature</Label>
              <select
                name="designFlowTemperature"
                value={formData.mainHeating1.designFlowTemperature}
                onChange={(e) => handleChange(e, "mainHeating1")}
                className="w-full mt-1 border rounded px-2 py-2"
              >
                <option value="">- Select -</option>
                <option value="Unknown">Unknown</option>
                <option value="Normal (>45°C)">Normal (less then 45°C)</option>
                <option value="35°C-45°C">35°C-45°C</option>
                <option value="<=35°C">&lt;=35°C</option>
              </select>
              <small className="text-gray-500">Documentary evidence required</small>
            </div>
            <div className="mb-4">
              <Label>Flue Type</Label>
              <select
                name="flueType"
                value={formData.mainHeating1.flueType}
                onChange={(e) => handleChange(e, "mainHeating1")}
                className="w-full mt-1 border rounded px-2 py-2"
              >
                <option value="">- Select -</option>
                <option value="Balanced">Balanced</option>
                <option value="Open">Open</option>
              </select>
              <small className="text-gray-500">Documentary evidence required</small>
            </div>
            <div className="mb-4">
              <Label>Fan Assisted Flue</Label>
              <select
                name="fanAssistedFlue"
                value={formData.mainHeating1.fanAssistedFlue}
                onChange={(e) => handleChange(e, "mainHeating1")}
                className="w-full mt-1 border rounded px-2 py-2"
              >
                <option value="">- Select -</option>
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
              <small className="text-gray-500">Documentary evidence required</small>
            </div>
            <div className="mb-4">
              <Label>PCDF Heating Controls</Label>
              <Input
                type="text"
                name="pcdfHeatingControls"
                value={formData.mainHeating1.pcdfHeatingControls}
                onChange={(e) => handleChange(e, "mainHeating1")}
                className="mt-1"
              />
            </div>
            <div className="mb-4">
              <Label>Compensator from PCDF</Label>
              <Input
                type="text"
                name="compensatorFromPcdf"
                value={formData.mainHeating1.compensatorFromPcdf}
                onChange={(e) => handleChange(e, "mainHeating1")}
                className="mt-1"
              />
            </div>
            <div className="mb-4">
              <Label>Percentage of Heat (%)</Label>
              <Input
                type="number"
                name="percentageOfHeat"
                value={formData.mainHeating1.percentageOfHeat}
                onChange={(e) => handleChange(e, "mainHeating1")}
                className="mt-1"
                step="any"
              />
            </div>
            <div className="mb-4">
              <Label>Main Heating 1 Controls</Label>
              <Input
                type="number"
                name="mainHeating1Controls"
                value={formData.mainHeating1.mainHeating1Controls}
                onChange={(e) => handleChange(e, "mainHeating1")}
                className="mt-1"
                step="any"
              />
            </div>
          </div>

          {/* Main Heating 2 */}
          <div className="flex-1">
            <h2 className="text-xl font-semibold mb-4">Main Heating 2</h2>

            {/* Main Heating 2 Photos */}
            <div className="mb-6">
              <Label>Main Heating 2 Photos</Label>
              <div className="flex flex-col gap-2 mt-2">
                <Button onClick={() => document.getElementById("mainHeating2Input").click()}>
                  Choose Photos
                </Button>
                <input
                  id="mainHeating2Input"
                  type="file"
                  accept="image/*"
                  multiple
                  name="mainHeating2Photos"
                  onChange={handleMainHeating2FileChange}
                  className="hidden"
                />
              </div>
              {mainHeating2Previews.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {mainHeating2Previews.map((preview, index) => (
                    <div key={index} className="relative">
                      <img
                        src={preview}
                        alt="Main Heating 2 Preview"
                        className="w-32 h-32 object-cover rounded"
                      />
                      <button
                        onClick={() => handleDeleteMainHeating2Image(index, preview)}
                        className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mb-4">
              <Label>Type</Label>
              <Input
                type="text"
                name="type"
                value={formData.mainHeating2.type}
                onChange={(e) => handleChange(e, "mainHeating2")}
                className="mt-1"
              />
            </div>
            <div className="mb-4">
              <Label>Make & Model</Label>
              <Input
                type="text"
                name="makeAndModel"
                value={formData.mainHeating2.makeAndModel}
                onChange={(e) => handleChange(e, "mainHeating2")}
                className="mt-1"
              />
            </div>
            <div className="mb-4">
              <Label>PCDF Boiler Reference</Label>
              <Input
                type="text"
                name="pcdfBoilerReference"
                value={formData.mainHeating2.pcdfBoilerReference}
                onChange={(e) => handleChange(e, "mainHeating2")}
                className="mt-1"
              />
            </div>
            <div className="mb-4">
              <Label>Heating Code</Label>
              <Input
                type="text"
                name="heatingCode"
                value={formData.mainHeating2.heatingCode}
                onChange={(e) => handleChange(e, "mainHeating2")}
                className="mt-1"
              />
            </div>
            <div className="mb-4">
              <Label>Heating Pump Age</Label>
              <select
                name="heatingPumpAge"
                value={formData.mainHeating2.heatingPumpAge}
                onChange={(e) => handleChange(e, "mainHeating2")}
                className="w-full mt-1 border rounded px-2 py-2"
              >
                <option value="">- Select -</option>
                <option value="2012 or earlier">2012 or earlier</option>
                <option value="2013 or later">2013 or later</option>
                <option value="Unknown">Unknown</option>
              </select>
            </div>
            <div className="mb-4">
              <Label>Heat Emitter</Label>
              <select
                name="heatEmitter"
                value={formData.mainHeating2.heatEmitter}
                onChange={(e) => handleChange(e, "mainHeating2")}
                className="w-full mt-1 border rounded px-2 py-2"
              >
                <option value="">- Select -</option>
                <option value="Underfloor Heating">Underfloor Heating</option>
                <option value="Radiators">Radiators</option>
              </select>
            </div>
            <div className="mb-4">
              <Label>Design Flow Temperature</Label>
              <select
                name="designFlowTemperature"
                value={formData.mainHeating2.designFlowTemperature}
                onChange={(e) => handleChange(e, "mainHeating2")}
                className="w-full mt-1 border rounded px-2 py-2"
              >
                <option value="">- Select -</option>
                <option value="Unknown">Unknown</option>
                <option value="Normal (>45°C)">Normal (less then 45°C)</option>
                <option value="35°C-45°C">35°C-45°C</option>
                <option value="<=35°C">&lt;=35°C</option>
              </select>
              <small className="text-gray-500">Documentary evidence required</small>
            </div>
            <div className="mb-4">
              <Label>Flue Type</Label>
              <select
                name="flueType"
                value={formData.mainHeating2.flueType}
                onChange={(e) => handleChange(e, "mainHeating2")}
                className="w-full mt-1 border rounded px-2 py-2"
              >
                <option value="">- Select -</option>
                <option value="Balanced">Balanced</option>
                <option value="Open">Open</option>
              </select>
              <small className="text-gray-500">Documentary evidence required</small>
            </div>
            <div className="mb-4">
              <Label>Fan Assisted Flue</Label>
              <select
                name="fanAssistedFlue"
                value={formData.mainHeating2.fanAssistedFlue}
                onChange={(e) => handleChange(e, "mainHeating2")}
                className="w-full mt-1 border rounded px-2 py-2"
              >
                <option value="">- Select -</option>
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
              <small className="text-gray-500">Documentary evidence required</small>
            </div>
            <div className="mb-4">
              <Label>PCDF Heating Controls</Label>
              <Input
                type="text"
                name="pcdfHeatingControls"
                value={formData.mainHeating2.pcdfHeatingControls}
                onChange={(e) => handleChange(e, "mainHeating2")}
                className="mt-1"
              />
            </div>
            <div className="mb-4">
              <Label>Compensator from PCDF</Label>
              <Input
                type="text"
                name="compensatorFromPcdf"
                value={formData.mainHeating2.compensatorFromPcdf}
                onChange={(e) => handleChange(e, "mainHeating2")}
                className="mt-1"
              />
            </div>
            <div className="mb-4">
              <Label>Percentage of Heat (%)</Label>
              <Input
                type="number"
                name="percentageOfHeat"
                value={formData.mainHeating2.percentageOfHeat}
                onChange={(e) => handleChange(e, "mainHeating2")}
                className="mt-1"
                step="any"
              />
            </div>
            <div className="mb-4">
              <Label>Main Heating 2 Controls</Label>
              <Input
                type="number"
                name="mainHeating2Controls"
                value={formData.mainHeating2.mainHeating2Controls}
                onChange={(e) => handleChange(e, "mainHeating2")}
                className="mt-1"
                step="any"
              />
            </div>
          </div>
        </div>

        {/* Secondary Heating */}
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-4">Secondary Heating</h2>
          <div className="mb-4">
            <Label>Secondary Heating</Label>
            <Input
              type="text"
              name="secondaryHeating"
              value={formData.secondaryHeating}
              onChange={handleChange}
              className="mt-1"
            />
          </div>
          <div className="mb-6">
            <Label>Secondary Heating Photos (Recommended)</Label>
            <div className="flex flex-col gap-2 mt-2">
              <Button onClick={() => document.getElementById("secondaryHeatingInput").click()}>
                Choose Photos
              </Button>
              <input
                id="secondaryHeatingInput"
                type="file"
                accept="image/*"
                multiple
                name="secondaryHeatingPhotos"
                onChange={handleSecondaryHeatingFileChange}
                className="hidden"
              />
            </div>
            {secondaryHeatingPreviews.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {secondaryHeatingPreviews.map((preview, index) => (
                  <div key={index} className="relative">
                    <img
                      src={preview}
                      alt="Secondary Heating Preview"
                      className="w-32 h-32 object-cover rounded"
                    />
                    <button
                      onClick={() => handleDeleteSecondaryHeatingImage(index, preview)}
                      className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6">
          <Button variant="outline" onClick={handlePrevious}>
            Previous
          </Button>
          <Button onClick={handleSave}>{isUpdate ? "Update" : "Save"}</Button>
          <Button variant="outline" onClick={handleNext}>
            Next
          </Button>
        </div>
      </motion.div>
    </div>
  );
}