import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/store/authStore";
import PhotoUploader from "@/components/ui/photo/PhotoUpload";

export default function FormTwenty() {
  const navigate = useNavigate();
  const { processId: urlProcessId } = useParams(); // e.g., /process/:processId/form-twenty
  const location = useLocation();
  const { toast } = useToast();
  const { user } = useAuthStore();

  // State for form data and metadata
  const [formData, setFormData] = useState({
    electricityMeterType: "", // "Single", "Dual", etc.
    mainsGas: "", // "Mains gas supply available", etc.
    epcExists: "", // "yes" or "no"
    relatedPartyDisclosure: "", // "No related party", etc.
    addenda: "", // "Wall type does not correspond", etc.
    doubleGlazingAppropriate: "", // "yes" or "no"
    wallInsulationIssues: "", // "Has the property any ‘Access Issues’", etc.
    photoChecklist: "", // "External elevations", etc.
    siteInspectionNotes: "", // Textarea input
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
  const [checklistPhotos, setChecklistPhotos] = useState([]);
  const [checklistPreviews, setChecklistPreviews] = useState([]);
  const [checklistDeleted, setChecklistDeleted] = useState([]);

  // Determine mode (edit or view) and load existing data
  useEffect(() => {
    const isViewing = location.pathname.includes("/view-form");
    setIsViewOnly(isViewing || user.role !== "surveyor");
    const queryTaskId = new URLSearchParams(location.search).get("taskId");
    setTaskId(queryTaskId);

    if (urlProcessId && urlProcessId !== "new") {
      setLoading(true);
      fetch(`http://localhost:3000/api/assessments/form-twenty?processId=${urlProcessId}`, {
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

            // Set checklist photos preview if available
            if (existingForm.checklistPhotos && existingForm.checklistPhotos.length > 0) {
              const previews = existingForm.checklistPhotos.map(
                (img) => `http://localhost:3000/${img}`
              );
              setChecklistPreviews(previews);
            }
          } else if (isViewing) {
            toast({
              variant: "destructive",
              title: "Error",
              description: "Form Twenty data not found.",
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
            description: "Error fetching Form Twenty data.",
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

  // Handle checklist photo file change
  const handleChecklistFileChange = (e) => {
    if (isViewOnly) return;
    const selectedFiles = Array.from(e.target.files);
    setChecklistPhotos((prev) => [...prev, ...selectedFiles]);
    const previewUrls = selectedFiles.map((file) => URL.createObjectURL(file));
    setChecklistPreviews((prev) => [...prev, ...previewUrls]);
    setUnsavedChanges(true);
  };

  // Delete checklist photo
  const handleDeleteChecklistImage = (index) => {
    if (isViewOnly) return;
    const previewUrl = checklistPreviews[index];
    const updatedPreviews = checklistPreviews.filter((_, idx) => idx !== index);
    setChecklistPreviews(updatedPreviews);

    if (previewUrl.startsWith("blob:")) {
      const fileIndex = checklistPhotos.findIndex(
        (file) => URL.createObjectURL(file) === previewUrl
      );
      if (fileIndex !== -1) {
        const updatedFiles = checklistPhotos.filter((_, idx) => idx !== fileIndex);
        setChecklistPhotos(updatedFiles);
      }
      URL.revokeObjectURL(previewUrl);
    } else {
      setChecklistDeleted((prev) => [...prev, previewUrl]);
    }

    setUnsavedChanges(true);
  };

  // Form validation
  const validateForm = () => {
    const newErrors = {};

    if (!formData.electricityMeterType) {
      newErrors.electricityMeterType = "Electricity meter type is required.";
    }
    if (!formData.mainsGas) {
      newErrors.mainsGas = "Mains gas selection is required.";
    }
    if (!formData.epcExists) {
      newErrors.epcExists = "EPC existence selection is required.";
    }
    if (!formData.relatedPartyDisclosure) {
      newErrors.relatedPartyDisclosure = "Related party disclosure is required.";
    }
    if (!formData.addenda) {
      newErrors.addenda = "Addenda selection is required.";
    }
    if (!formData.doubleGlazingAppropriate) {
      newErrors.doubleGlazingAppropriate = "Double glazing selection is required.";
    }
    if (!formData.wallInsulationIssues) {
      newErrors.wallInsulationIssues = "Wall insulation issues selection is required.";
    }
    if (!formData.photoChecklist) {
      newErrors.photoChecklist = "Photo checklist selection is required.";
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
        if (key !== "checklistPhotos") {
          formDataToSend.append(key, formData[key]);
        }
      }

      // Append new files
      if (checklistPhotos.length > 0) {
        checklistPhotos.forEach((file) => {
          formDataToSend.append("checklistPhotos", file);
        });
      }

      // Append deleted images
      if (checklistDeleted.length > 0) {
        formDataToSend.append("deletedChecklistPhotos", JSON.stringify(checklistDeleted));
      }

      const url = docId
        ? `http://localhost:3000/api/assessments/form-twenty/${docId}`
        : "http://localhost:3000/api/assessments/form-twenty";
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
        setChecklistPhotos([]);
        setChecklistDeleted([]);
        setChecklistPreviews(
          data.data.checklistPhotos?.map((photo) => `http://localhost:3000/${photo}`) || []
        );
        toast({
          title: "Success",
          description: `Form Twenty ${docId ? "updated" : "saved"} successfully!`,
        });
        return { success: true, processId: data.data.processId };
      } else {
        throw new Error(data.error || "Failed to save Form Twenty");
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
        navigate(`/view-form/${result.processId}/form-twenty?taskId=${taskId}`);
      } else {
        navigate(`/process/${result.processId}/form-twenty?taskId=${taskId}`, { replace: true });
      }
    }
  };

  // Handle navigation to the next form
  const handleNext = async () => {
    if (!isViewOnly) {
      const result = await saveForm();
      if (result.success) {
        navigate(`/process/${result.processId}/form-twenty-one?taskId=${taskId}`);
      }
    } else {
      navigate(`/view-form/${savedProcessId || urlProcessId}/form-twenty-one?taskId=${taskId}`);
    }
  };

  // Handle navigation to the previous form
  const handlePrevious = async () => {
    if (!isViewOnly) {
      const result = await saveForm();
      if (result.success) {
        if (user.role === "surveyor") {
          navigate(`/process/${result.processId}/form-nineteen?taskId=${taskId}`);
        } else {
          navigate(`/view-form/${result.processId}/form-nineteen?taskId=${taskId}`);
        }
      }
    } else {
      navigate(`/view-form/${savedProcessId || urlProcessId}/form-nineteen?taskId=${taskId}`);
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
            {isViewOnly ? "View Form Twenty" : "19. Electricity Meter"}
          </h1>

          {/* Section: Electricity Meter Type */}
          <div className="mb-6">
            <Label>Electricity Meter Type:</Label>
            <select
              name="electricityMeterType"
              value={formData.electricityMeterType}
              onChange={handleChange}
              className={`w-full mt-1 border rounded px-2 py-2 ${errors.electricityMeterType ? "border-red-500" : ""}`}
              disabled={isViewOnly}
            >
              <option value="">- Select -</option>
              <option value="Single">Single</option>
              <option value="Dual">Dual</option>
              <option value="18 Hour">18 Hour</option>
              <option value="24 Hour">24 Hour</option>
              <option value="Unknown">Unknown</option>
            </select>
            {errors.electricityMeterType && (
              <p className="text-red-500 text-sm mt-1">{errors.electricityMeterType}</p>
            )}
          </div>

          {/* Section: Mains Gas */}
          <div className="mb-6">
            <Label>
              Mains Gas:
              <span className="ml-2 text-gray-500 cursor-pointer" title="In the absence of gas heating appliance/s in the property, a gas meter must be present">
                ⓘ
              </span>
            </Label>
            <select
              name="mainsGas"
              value={formData.mainsGas}
              onChange={handleChange}
              className={`w-full mt-1 border rounded px-2 py-2 ${errors.mainsGas ? "border-red-500" : ""}`}
              disabled={isViewOnly}
            >
              <option value="">- Select -</option>
              <option value="Mains gas supply available">Mains gas supply available</option>
              <option value="Confirm you have checked for the existence of an EPC before carrying out another energy assessment">
                Confirm you have checked for the existence of an EPC
              </option>
            </select>
            {errors.mainsGas && (
              <p className="text-red-500 text-sm mt-1">{errors.mainsGas}</p>
            )}
          </div>

          {/* Section: Does an EPC Exist */}
          <div className="mb-6">
            <Label>
              Does an EPC exist at the point of carrying out this energy assessment?
              <span className="ml-2 text-gray-500 cursor-pointer" title="If an EPC does exist, please select why another energy assessment needs to be undertaken (please see pre defined answers shown on the RdSAP online software).">
                ⓘ
              </span>
            </Label>
            <div className="flex gap-4 mt-2">
              <label>
                <input
                  type="radio"
                  name="epcExists"
                  value="yes"
                  checked={formData.epcExists === "yes"}
                  onChange={handleChange}
                  disabled={isViewOnly}
                />{" "}
                Yes
              </label>
              <label>
                <input
                  type="radio"
                  name="epcExists"
                  value="no"
                  checked={formData.epcExists === "no"}
                  onChange={handleChange}
                  disabled={isViewOnly}
                />{" "}
                No
              </label>
            </div>
            {errors.epcExists && (
              <p className="text-red-500 text-sm mt-1">{errors.epcExists}</p>
            )}
          </div>

          {/* Section: Related Party Disclosure */}
          <div className="mb-6">
            <Label>Related Party Disclosure:</Label>
            <select
              name="relatedPartyDisclosure"
              value={formData.relatedPartyDisclosure}
              onChange={handleChange}
              className={`w-full mt-1 border rounded px-2 py-2 ${errors.relatedPartyDisclosure ? "border-red-500" : ""}`}
              disabled={isViewOnly}
            >
              <option value="">- Select -</option>
              <option value="No related party">No related party</option>
              <option value="Relative of homeowner or occupier of the property">
                Relative of homeowner or occupier
              </option>
              <option value="Residing at the property">Residing at the property</option>
              <option value="Financial interest in the property">Financial interest in the property</option>
              <option value="Owner or director of the organisation dealing with the property transaction">
                Owner or director of organisation
              </option>
              <option value="Employed by the professional dealing with the property transaction">
                Employed by the professional
              </option>
            </select>
            {errors.relatedPartyDisclosure && (
              <p className="text-red-500 text-sm mt-1">{errors.relatedPartyDisclosure}</p>
            )}
          </div>

          {/* Section: Addenda */}
          <div className="mb-6">
            <Label>Addenda:</Label>
            <select
              name="addenda"
              value={formData.addenda}
              onChange={handleChange}
              className={`w-full mt-1 border rounded px-2 py-2 ${errors.addenda ? "border-red-500" : ""}`}
              disabled={isViewOnly}
            >
              <option value="">- Select -</option>
              <option value="Wall type does not correspond to options available in RdSAP">
                Wall type does not correspond
              </option>
              <option value="Dwelling has a swimming pool">Dwelling has a swimming pool</option>
              <option value="Dwelling has micro-CHP not found in database">
                Micro-CHP not in database
              </option>
              <option value="Storage heater or dual immersion, and single electric meter">
                Storage heater, single meter
              </option>
              <option value="PVs or wind turbine present on the property (England, Wales or Scotland)">
                PVs or wind turbine
              </option>
              <option value="Two main heating systems and heating system upgrade is recommended">
                Two heating systems
              </option>
              <option value="Dual electricity meter selected but there is also an electricity meter for an off-peak tarif">
                Dual meter with off-peak
              </option>
              <option value="Single electricity meter but there is also an electricity meter for an off-peak tarif">
                Single meter with off-peak
              </option>
              <option value="Dwelling is using a biomass fuel that is not in the RdSAP fuel options">
                Biomass fuel not in RdSAP
              </option>
              <option value="Dwelling has a special energy saving feature">
                Special energy saving feature
              </option>
            </select>
            {errors.addenda && (
              <p className="text-red-500 text-sm mt-1">{errors.addenda}</p>
            )}
          </div>

          {/* Section: Double Glazing Appropriate */}
          <div className="mb-6">
            <Label>
              Double Glazing Appropriate:
              <span className="ml-2 text-gray-500 cursor-pointer" title="Should be ticked unless documentary evidence confirms otherwise">
                ⓘ
              </span>
            </Label>
            <div className="flex gap-4 mt-2">
              <label>
                <input
                  type="radio"
                  name="doubleGlazingAppropriate"
                  value="yes"
                  checked={formData.doubleGlazingAppropriate === "yes"}
                  onChange={handleChange}
                  disabled={isViewOnly}
                />{" "}
                Yes
              </label>
              <label>
                <input
                  type="radio"
                  name="doubleGlazingAppropriate"
                  value="no"
                  checked={formData.doubleGlazingAppropriate === "no"}
                  onChange={handleChange}
                  disabled={isViewOnly}
                />{" "}
                No
              </label>
            </div>
            {errors.doubleGlazingAppropriate && (
              <p className="text-red-500 text-sm mt-1">{errors.doubleGlazingAppropriate}</p>
            )}
          </div>

          {/* Section: Wall Insulation Issues */}
          <div className="mb-6">
            <Label>
              Any Wall Insulation Issues:
              <span className="ml-2 text-gray-500 cursor-pointer" title="Cavity / stone / system built construction only">
                ⓘ
              </span>
            </Label>
            <select
              name="wallInsulationIssues"
              value={formData.wallInsulationIssues}
              onChange={handleChange}
              className={`w-full mt-1 border rounded px-2 py-2 ${errors.wallInsulationIssues ? "border-red-500" : ""}`}
              disabled={isViewOnly}
            >
              <option value="">- Select -</option>
              <option value="Has the property any ‘Access Issues’ for potential wall insulation?">
                Access Issues
              </option>
              <option value="Has the property any ‘narrow cavity(s)’ (<50mm)?">

                Narrow cavity(s) (50mm)
              </option>
            </select>
            {errors.wallInsulationIssues && (
              <p className="text-red-500 text-sm mt-1">{errors.wallInsulationIssues}</p>
            )}
          </div>

          {/* Section: Photo Checklist */}
          <div className="mb-6">
            <Label>Photo Checklist:</Label>
            <select
              name="photoChecklist"
              value={formData.photoChecklist}
              onChange={handleChange}
              className={`w-full mt-1 border rounded px-2 py-2 ${errors.photoChecklist ? "border-red-500" : ""}`}
              disabled={isViewOnly}
            >
              <option value="">- Select -</option>
              <option value="External elevations - showing openings, extensions, conservatories, roof rooms, wall construction etc.">
                External elevations
              </option>
              <option value="Insulation levels - level and coverage of loft insulation, wall insulation etc.">
                Insulation levels
              </option>
              <option value="Heating systems - radiators, boiler showing key features, heating controls, water heating etc.">
                Heating systems
              </option>
              <option value="Other features - PV, solar water heating, wind turbine, LPG cylinder etc.">
                Other features
              </option>
            </select>
            {errors.photoChecklist && (
              <p className="text-red-500 text-sm mt-1">{errors.photoChecklist}</p>
            )}
          </div>

          {/* Section: Upload Checklist Photos */}
          {formData.photoChecklist && (
            <div className="mb-6">
              <PhotoUploader
                label="Upload Photo Checklist Photos"
                inputName="checklistPhotos"
                onFileChange={handleChecklistFileChange}
                imagePreviews={checklistPreviews}
                onDeleteImage={handleDeleteChecklistImage}
                isViewOnly={isViewOnly}
              />
            </div>
          )}

          {/* Section: Site Inspection Notes */}
          <div className="mb-6">
            <Label>Site Inspection Notes:</Label>
            <textarea
              name="siteInspectionNotes"
              value={formData.siteInspectionNotes}
              onChange={handleChange}
              className={`w-full mt-1 border rounded px-2 py-2 ${errors.siteInspectionNotes ? "border-red-500" : ""}`}
              rows="4"
              disabled={isViewOnly}
            />
            {errors.siteInspectionNotes && (
              <p className="text-red-500 text-sm mt-1">{errors.siteInspectionNotes}</p>
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