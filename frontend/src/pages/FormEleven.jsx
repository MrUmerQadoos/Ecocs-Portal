import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/store/authStore";

export default function FormEleven() {
  const navigate = useNavigate();
  const { processId } = useParams(); // e.g., /process/:processId/form-eleven
  const { toast } = useToast();
  const { user } = useAuthStore();

  const [docId, setDocId] = useState(null);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [isUpdate, setIsUpdate] = useState(false);

  const [formData, setFormData] = useState({
    hasDoorsPhotos: "", // "yes" or "no"
    totalNumberOfDoors: "",
    numberOfInsulatedDoors: "",
    averageUValueInsulatedDoors: "",
    glazedArea: "",
    proportionDoubleTripleGlazed: "",
    frameType: "",
    userId: "",
    processId: processId || "",
  });

  // Image Handling
  const [doorsPhotosFiles, setDoorsPhotosFiles] = useState([]);
  const [doorsPhotosPreviews, setDoorsPhotosPreviews] = useState([]);
  const [doorsPhotosDeleted, setDoorsPhotosDeleted] = useState([]);

  const [windowsPhotosFiles, setWindowsPhotosFiles] = useState([]);
  const [windowsPhotosPreviews, setWindowsPhotosPreviews] = useState([]);
  const [windowsPhotosDeleted, setWindowsPhotosDeleted] = useState([]);

  const [openingsPhotosFiles, setOpeningsPhotosFiles] = useState([]);
  const [openingsPhotosPreviews, setOpeningsPhotosPreviews] = useState([]);
  const [openingsPhotosDeleted, setOpeningsPhotosDeleted] = useState([]);

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

  // Fetch existing Form Eleven data on mount
  useEffect(() => {
    if (user && user._id && processId) {
      fetch(`http://localhost:3000/api/assessments/form-eleven?userId=${user._id}&processId=${processId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data && data.data.length > 0) {
            const existingForm = data.data[0];
            setFormData(existingForm);
            setDocId(existingForm._id);
            setIsUpdate(true);

            // Set doors photos preview if available
            if (existingForm.doorsPhotos && existingForm.doorsPhotos.length > 0) {
              const previews = existingForm.doorsPhotos.map((img) => `http://localhost:3000/${img}`);
              setDoorsPhotosPreviews(previews);
            }

            // Set windows photos preview if available
            if (existingForm.windowsPhotos && existingForm.windowsPhotos.length > 0) {
              const previews = existingForm.windowsPhotos.map((img) => `http://localhost:3000/${img}`);
              setWindowsPhotosPreviews(previews);
            }

            // Set openings photos preview if available
            if (existingForm.openingsPhotos && existingForm.openingsPhotos.length > 0) {
              const previews = existingForm.openingsPhotos.map((img) => `http://localhost:3000/${img}`);
              setOpeningsPhotosPreviews(previews);
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
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setUnsavedChanges(true);
  };

  // Handle doors photos file change
  const handleDoorsPhotosFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setDoorsPhotosFiles((prev) => [...prev, ...selectedFiles]);
    const previewUrls = selectedFiles.map((file) => URL.createObjectURL(file));
    setDoorsPhotosPreviews((prev) => [...prev, ...previewUrls]);
    setUnsavedChanges(true);
  };

  // Handle windows photos file change
  const handleWindowsPhotosFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setWindowsPhotosFiles((prev) => [...prev, ...selectedFiles]);
    const previewUrls = selectedFiles.map((file) => URL.createObjectURL(file));
    setWindowsPhotosPreviews((prev) => [...prev, ...previewUrls]);
    setUnsavedChanges(true);
  };

  // Handle openings photos file change
  const handleOpeningsPhotosFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setOpeningsPhotosFiles((prev) => [...prev, ...selectedFiles]);
    const previewUrls = selectedFiles.map((file) => URL.createObjectURL(file));
    setOpeningsPhotosPreviews((prev) => [...prev, ...previewUrls]);
    setUnsavedChanges(true);
  };

  // Delete Photo Handlers
  const handleDeleteDoorsPhotosImage = (index, previewUrl) => {
    const updatedFiles = doorsPhotosFiles.filter((_, idx) => idx !== index);
    const updatedPreviews = doorsPhotosPreviews.filter((_, idx) => idx !== index);
    setDoorsPhotosDeleted((prev) => {
      if (!prev.includes(previewUrl)) {
        return [...prev, previewUrl];
      }
      return prev;
    });
    setDoorsPhotosFiles(updatedFiles);
    setDoorsPhotosPreviews(updatedPreviews);
    setUnsavedChanges(true);
  };

  const handleDeleteWindowsPhotosImage = (index, previewUrl) => {
    const updatedFiles = windowsPhotosFiles.filter((_, idx) => idx !== index);
    const updatedPreviews = windowsPhotosPreviews.filter((_, idx) => idx !== index);
    setWindowsPhotosDeleted((prev) => {
      if (!prev.includes(previewUrl)) {
        return [...prev, previewUrl];
      }
      return prev;
    });
    setWindowsPhotosFiles(updatedFiles);
    setWindowsPhotosPreviews(updatedPreviews);
    setUnsavedChanges(true);
  };

  const handleDeleteOpeningsPhotosImage = (index, previewUrl) => {
    const updatedFiles = openingsPhotosFiles.filter((_, idx) => idx !== index);
    const updatedPreviews = openingsPhotosPreviews.filter((_, idx) => idx !== index);
    setOpeningsPhotosDeleted((prev) => {
      if (!prev.includes(previewUrl)) {
        return [...prev, previewUrl];
      }
      return prev;
    });
    setOpeningsPhotosFiles(updatedFiles);
    setOpeningsPhotosPreviews(updatedPreviews);
    setUnsavedChanges(true);
  };

  // Save/Update Handler
  const handleSave = async () => {
    try {
      const formDataToSend = new FormData();

      // Append non-file fields
      for (const key in formData) {
        formDataToSend.append(key, formData[key]);
      }

      // Append files
      if (doorsPhotosFiles.length > 0) {
        doorsPhotosFiles.forEach((file) => {
          formDataToSend.append("doorsPhotos", file);
        });
      }
      if (windowsPhotosFiles.length > 0) {
        windowsPhotosFiles.forEach((file) => {
          formDataToSend.append("windowsPhotos", file);
        });
      }
      if (openingsPhotosFiles.length > 0) {
        openingsPhotosFiles.forEach((file) => {
          formDataToSend.append("openingsPhotos", file);
        });
      }

      // Append deleted images
      if (doorsPhotosDeleted.length > 0) {
        formDataToSend.append("deletedDoorsPhotos", JSON.stringify(doorsPhotosDeleted));
      }
      if (windowsPhotosDeleted.length > 0) {
        formDataToSend.append("deletedWindowsPhotos", JSON.stringify(windowsPhotosDeleted));
      }
      if (openingsPhotosDeleted.length > 0) {
        formDataToSend.append("deletedOpeningsPhotos", JSON.stringify(openingsPhotosDeleted));
      }

      let url = "http://localhost:3000/api/assessments/form-eleven";
      let method = "POST";
      if (docId) {
        url = `http://localhost:3000/api/assessments/form-eleven/${docId}`;
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
          description: `Form Eleven ${docId ? "updated" : "saved"} successfully!`,
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
        description: "An error occurred while saving Form Eleven",
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
    navigate(`/process/${processId}/form-twelve`); // Assuming Form Twelve follows
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
    navigate(`/process/${processId}/form-ten`);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center px-4 py-6">
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white w-full max-w-4xl p-8 rounded-lg shadow"
      >
        <h1 className="text-2xl font-bold mb-6 text-center">Form Eleven: Doors & Windows</h1>

        {/* Section: Doors Photos */}
        <div className="mb-6">
          <Label>Doors Photos?</Label>
          <div className="flex gap-4 mt-2">
            <label>
              <input
                type="radio"
                name="hasDoorsPhotos"
                value="yes"
                checked={formData.hasDoorsPhotos === "yes"}
                onChange={handleChange}
              />{" "}
              Yes
            </label>
            <label>
              <input
                type="radio"
                name="hasDoorsPhotos"
                value="no"
                checked={formData.hasDoorsPhotos === "no"}
                onChange={handleChange}
              />{" "}
              No
            </label>
          </div>
        </div>

        {/* Section: Upload Doors Photos */}
        {formData.hasDoorsPhotos === "yes" && (
          <div className="mb-6">
            <Label>Upload Doors Photos (Recommended)</Label>
            <div className="flex flex-col gap-2 mt-2">
              <Button onClick={() => document.getElementById("doorsPhotosInput").click()}>
                Choose Photos
              </Button>
              <input
                id="doorsPhotosInput"
                type="file"
                accept="image/*"
                multiple
                name="doorsPhotos"
                onChange={handleDoorsPhotosFileChange}
                className="hidden"
              />
            </div>
            {doorsPhotosPreviews.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {doorsPhotosPreviews.map((preview, index) => (
                  <div key={index} className="relative">
                    <img src={preview} alt="Doors Preview" className="w-32 h-32 object-cover rounded" />
                    <button
                      onClick={() => handleDeleteDoorsPhotosImage(index, preview)}
                      className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Section: Door Details */}
        <div className="mb-6 flex gap-4">
          <div className="flex-1">
            <Label>Total Number of Doors:</Label>
            <Input
              type="text"
              name="totalNumberOfDoors"
              value={formData.totalNumberOfDoors}
              onChange={handleChange}
              className="mt-1"
            />
          </div>
          <div className="flex-1">
            <Label>Number of Insulated Doors:</Label>
            <Input
              type="text"
              name="numberOfInsulatedDoors"
              value={formData.numberOfInsulatedDoors}
              onChange={handleChange}
              className="mt-1"
            />
          </div>
          <div className="flex-1">
            <Label>Average U-value of Insulated Door(s) (Wm²K):</Label>
            <Input
              type="text"
              name="averageUValueInsulatedDoors"
              value={formData.averageUValueInsulatedDoors}
              onChange={handleChange}
              placeholder="Note: documentary evidence required to overwrite default U-values"
              className="mt-1"
            />
          </div>
        </div>

        {/* Section: Upload Windows Photos */}
        <div className="mb-6">
          <Label>Upload Windows Photos (Recommended)</Label>
          <div className="flex flex-col gap-2 mt-2">
            <Button onClick={() => document.getElementById("windowsPhotosInput").click()}>
              Choose Photos
            </Button>
            <input
              id="windowsPhotosInput"
              type="file"
              accept="image/*"
              multiple
              name="windowsPhotos"
              onChange={handleWindowsPhotosFileChange}
              className="hidden"
            />
          </div>
          {windowsPhotosPreviews.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {windowsPhotosPreviews.map((preview, index) => (
                <div key={index} className="relative">
                  <img src={preview} alt="Windows Preview" className="w-32 h-32 object-cover rounded" />
                  <button
                    onClick={() => handleDeleteWindowsPhotosImage(index, preview)}
                    className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section: Glazed Area */}
        <div className="mb-6">
          <Label>Glazed Area:</Label>
          <select
            name="glazedArea"
            value={formData.glazedArea}
            onChange={handleChange}
            className="w-full mt-1 border rounded px-2 py-2"
          >
            <option value="">- Select -</option>
            <option value="Typical">Typical</option>
            <option value="More than typical">More than typical</option>
            <option value="Less than typical">Less than typical</option>
            <option value="Much More than typical">Much More than typical</option>
            <option value="Much Less than typical">Much Less than typical</option>
          </select>
          <small className="text-gray-500">
            Note: if Much More/Much Less than typical, please see page 6 for details of extended window data
          </small>
        </div>

        {/* Section: Proportion Double/Triple-glazed */}
        <div className="mb-6">
          <Label>Proportion Double/Triple-glazed (percentage) %:</Label>
          <div className="relative">
            <Input
              type="number"
              name="proportionDoubleTripleGlazed"
              value={formData.proportionDoubleTripleGlazed}
              onChange={handleChange}
              className="mt-1 pr-8"
              step="any"
            />
            <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500">%</span>
          </div>
        </div>

        {/* Section: Frame Type */}
        <div className="mb-6">
          <Label>Frame Type (Double pre 2002 or unknown install date only):</Label>
          <select
            name="frameType"
            value={formData.frameType}
            onChange={handleChange}
            className="w-full mt-1 border rounded px-2 py-2"
          >
            <option value="">- Select -</option>
            <option value="PVC frame">PVC frame</option>
            <option value="Non-PVC frame">Non-PVC frame</option>
          </select>
        </div>

        {/* Section: Upload Openings Photos */}
        <div className="mb-6">
          <Label>Openings Photos (Recommended)</Label>
          <small className="text-gray-500 block">Note: several elements may be shown in one photograph</small>
          <div className="flex flex-col gap-2 mt-2">
            <Button onClick={() => document.getElementById("openingsPhotosInput").click()}>
              Choose Photos
            </Button>
            <input
              id="openingsPhotosInput"
              type="file"
              accept="image/*"
              multiple
              name="openingsPhotos"
              onChange={handleOpeningsPhotosFileChange}
              className="hidden"
            />
          </div>
          {openingsPhotosPreviews.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {openingsPhotosPreviews.map((preview, index) => (
                <div key={index} className="relative">
                  <img src={preview} alt="Openings Preview" className="w-32 h-32 object-cover rounded" />
                  <button
                    onClick={() => handleDeleteOpeningsPhotosImage(index, preview)}
                    className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
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