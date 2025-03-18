import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
// import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/store/authStore";

export default function FormNine() {
  const navigate = useNavigate();
  const { processId } = useParams(); // e.g., /process/:processId/form-nine
  const { toast } = useToast();
  const { user } = useAuthStore();

  const [docId, setDocId] = useState(null);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [isUpdate, setIsUpdate] = useState(false);

  const [formData, setFormData] = useState({
    hasMainRoomInRoof: "", // "yes" or "no"
    insulationType: "", // "Flat ceiling only", "All elements", etc.
    insulationThicknessCeiling: "", // "12mm", "25mm", etc.
    insulationOtherParts: "", // "None", "As Built", etc.
    userId: "",
    processId: processId || "",
  });

  // Image Handling
  const [mainRoomPhotos, setMainRoomPhotos] = useState([]);
  const [mainRoomPreviews, setMainRoomPreviews] = useState([]);
  const [mainRoomDeleted, setMainRoomDeleted] = useState([]);

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

  // Fetch existing Form Nine data on mount
  useEffect(() => {
    if (user && user._id && processId) {
      fetch(`http://localhost:3000/api/assessments/form-nine?userId=${user._id}&processId=${processId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data && data.data.length > 0) {
            const existingForm = data.data[0];
            setFormData(existingForm);
            setDocId(existingForm._id);
            setIsUpdate(true);

            // Set main room photos preview if available
            if (existingForm.mainRoomPhotos && existingForm.mainRoomPhotos.length > 0) {
              const previews = existingForm.mainRoomPhotos.map(
                (img) => `http://localhost:3000/${img}`
              );
              setMainRoomPreviews(previews);
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

  // Handle main room photo file change
  const handleMainRoomFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setMainRoomPhotos((prev) => [...prev, ...selectedFiles]);
    const previewUrls = selectedFiles.map((file) => URL.createObjectURL(file));
    setMainRoomPreviews((prev) => [...prev, ...previewUrls]);
    setUnsavedChanges(true);
  };

  // Delete main room photo
  const handleDeleteMainRoomImage = (index, previewUrl) => {
    const updatedFiles = mainRoomPhotos.filter((_, idx) => idx !== index);
    const updatedPreviews = mainRoomPreviews.filter((_, idx) => idx !== index);
    setMainRoomDeleted((prev) => {
      if (!prev.includes(previewUrl)) {
        return [...prev, previewUrl];
      }
      return prev;
    });
    setMainRoomPhotos(updatedFiles);
    setMainRoomPreviews(updatedPreviews);
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

      // Append main room photos
      if (mainRoomPhotos.length > 0) {
        mainRoomPhotos.forEach((file) => {
          formDataToSend.append("mainRoomPhotos", file);
        });
      }

      // Append deleted images
      if (mainRoomDeleted.length > 0) {
        formDataToSend.append("deletedMainRoomPhotos", JSON.stringify(mainRoomDeleted));
      }

      let url = "http://localhost:3000/api/assessments/form-nine";
      let method = "POST";
      if (docId) {
        url = `http://localhost:3000/api/assessments/form-nine/${docId}`;
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
          description: `Form Nine ${docId ? "updated" : "saved"} successfully!`,
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
        description: "An error occurred while saving Form Nine",
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
    navigate(`/process/${processId}/form-ten`);
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
    navigate(`/process/${processId}/form-eight`);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center px-4 py-6">
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white w-full max-w-4xl p-8 rounded-lg shadow"
      >
        <h1 className="text-2xl font-bold mb-6 text-center">Form Nine: Main Room in Roof</h1>

        {/* Section: Has Main Room in Roof */}
        <div className="mb-6">
          <Label>Main Room in Roof (Photos):</Label>
          <div className="flex gap-4 mt-2">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="hasMainRoomInRoof"
                value="yes"
                checked={formData.hasMainRoomInRoof === "yes"}
                onChange={handleChange}
              />
              <span>Yes</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="hasMainRoomInRoof"
                value="no"
                checked={formData.hasMainRoomInRoof === "no"}
                onChange={handleChange}
              />
              <span>No</span>
            </label>
          </div>
        </div>

        {/* Section: Upload Main Room Photos */}
        {formData.hasMainRoomInRoof === "yes" && (
          <div className="mb-6">
            <Label>Upload Main Room in Roof Photos</Label>
            <div className="flex flex-col gap-2 mt-2">
              <Button onClick={() => document.getElementById("mainRoomInput").click()}>
                Choose Photos
              </Button>
              <input
                id="mainRoomInput"
                type="file"
                accept="image/*"
                multiple
                name="mainRoomPhotos"
                onChange={handleMainRoomFileChange}
                className="hidden"
              />
            </div>
            {mainRoomPreviews.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {mainRoomPreviews.map((preview, index) => (
                  <div key={index} className="relative">
                    <img src={preview} alt="Main Room Preview" className="w-32 h-32 object-cover rounded" />
                    <button
                      onClick={() => handleDeleteMainRoomImage(index, preview)}
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

        {/* Section: Insulation Type */}
        <div className="mb-6">
          <Label>Insulation:</Label>
          <select
            name="insulationType"
            value={formData.insulationType}
            onChange={handleChange}
            className="w-full mt-1 border rounded px-2 py-2"
          >
            <option value="">- Select -</option>
            <option value="Flat ceiling only">Flat ceiling only</option>
            <option value="All elements">All elements</option>
            <option value="As Built">As Built</option>
            <option value="Unknown">Unknown</option>
          </select>
        </div>

        {/* Section: Insulation Thickness at Ceiling */}
        <div className="mb-6">
          <Label>Insulation Thickness at Ceiling:</Label>
          <select
            name="insulationThicknessCeiling"
            value={formData.insulationThicknessCeiling}
            onChange={handleChange}
            className="w-full mt-1 border rounded px-2 py-2"
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
        </div>

        {/* Section: Insulation of Other Parts */}
        <div className="mb-6">
          <Label>Insulation of other parts:</Label>
          <select
            name="insulationOtherParts"
            value={formData.insulationOtherParts}
            onChange={handleChange}
            className="w-full mt-1 border rounded px-2 py-2"
          >
            <option value="">- Select -</option>
            <option value="None">None</option>
            <option value="As Built">As Built</option>
            <option value="50mm">50mm</option>
            <option value="100mm">100mm</option>
            <option value="150mm or more">150mm or more</option>
            <option value="Unknown">Unknown</option>
          </select>
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