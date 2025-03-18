import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/store/authStore";
import PhotoUploader from "@/components/ui/photo/PhotoUpload";

export default function FormEight() {
  const navigate = useNavigate();
  const { processId } = useParams(); // e.g., /process/:processId/form-eight
  const { toast } = useToast();
  const { user } = useAuthStore();

  const [docId, setDocId] = useState(null);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [isUpdate, setIsUpdate] = useState(false);

  const [formData, setFormData] = useState({
    hasConstructionPhotos: "", // "yes" or "no"
    roofType: "", // "Pitched (slates/tiles), access to loft", etc.
    insulationType: "", // "Joists", "Rafters", etc.
    insulationDepthPitched: "", // "12mm", "25mm", etc.
    insulationDepthFlat: "", // "None", "As Built", etc.
    userId: "",
    processId: processId || "",
  });

  // Image Handling
  const [constructionFiles, setConstructionFiles] = useState([]);
  const [constructionPreviews, setConstructionPreviews] = useState([]);
  const [constructionDeleted, setConstructionDeleted] = useState([]);

  const [loftInsulationFiles, setLoftInsulationFiles] = useState([]);
  const [loftInsulationPreviews, setLoftInsulationPreviews] = useState([]);
  const [loftInsulationDeleted, setLoftInsulationDeleted] = useState([]);

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

  // Fetch existing Form Eight data on mount
  useEffect(() => {
    if (user && user._id && processId) {
      fetch(`http://localhost:3000/api/assessments/form-eight?userId=${user._id}&processId=${processId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data && data.data.length > 0) {
            const existingForm = data.data[0];
            setFormData(existingForm);
            setDocId(existingForm._id);
            setIsUpdate(true);

            // Set construction photos preview if available
            if (existingForm.constructionPhotos && existingForm.constructionPhotos.length > 0) {
              const previews = existingForm.constructionPhotos.map(
                (img) => `http://localhost:3000/${img}`
              );
              setConstructionPreviews(previews);
            }

            // Set loft insulation photos preview if available
            if (existingForm.loftInsulationPhotos && existingForm.loftInsulationPhotos.length > 0) {
              const previews = existingForm.loftInsulationPhotos.map(
                (img) => `http://localhost:3000/${img}`
              );
              setLoftInsulationPreviews(previews);
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

  // Handle construction photo file change
  const handleConstructionFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setConstructionFiles((prev) => [...prev, ...selectedFiles]);
    const previewUrls = selectedFiles.map((file) => URL.createObjectURL(file));
    setConstructionPreviews((prev) => [...prev, ...previewUrls]);
    setUnsavedChanges(true);
  };

  // Handle loft insulation photo file change
  const handleLoftInsulationFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setLoftInsulationFiles((prev) => [...prev, ...selectedFiles]);
    const previewUrls = selectedFiles.map((file) => URL.createObjectURL(file));
    setLoftInsulationPreviews((prev) => [...prev, ...previewUrls]);
    setUnsavedChanges(true);
  };

  // Delete construction photo
  const handleDeleteConstructionImage = (index, previewUrl) => {
    const updatedFiles = constructionFiles.filter((_, idx) => idx !== index);
    const updatedPreviews = constructionPreviews.filter((_, idx) => idx !== index);
    setConstructionDeleted((prev) => {
      if (!prev.includes(previewUrl)) {
        return [...prev, previewUrl];
      }
      return prev;
    });
    setConstructionFiles(updatedFiles);
    setConstructionPreviews(updatedPreviews);
    setUnsavedChanges(true);
  };

  // Delete loft insulation photo
  const handleDeleteLoftInsulationImage = (index, previewUrl) => {
    const updatedFiles = loftInsulationFiles.filter((_, idx) => idx !== index);
    const updatedPreviews = loftInsulationPreviews.filter((_, idx) => idx !== index);
    setLoftInsulationDeleted((prev) => {
      if (!prev.includes(previewUrl)) {
        return [...prev, previewUrl];
      }
      return prev;
    });
    setLoftInsulationFiles(updatedFiles);
    setLoftInsulationPreviews(updatedPreviews);
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

      // Append construction photos
      if (constructionFiles.length > 0) {
        constructionFiles.forEach((file) => {
          formDataToSend.append("constructionPhotos", file);
        });
      }

      // Append loft insulation photos
      if (loftInsulationFiles.length > 0) {
        loftInsulationFiles.forEach((file) => {
          formDataToSend.append("loftInsulationPhotos", file);
        });
      }

      // Append deleted images
      if (constructionDeleted.length > 0) {
        formDataToSend.append("deletedConstruction", JSON.stringify(constructionDeleted));
      }
      if (loftInsulationDeleted.length > 0) {
        formDataToSend.append("deletedLoftInsulation", JSON.stringify(loftInsulationDeleted));
      }

      let url = "http://localhost:3000/api/assessments/form-eight";
      let method = "POST";
      if (docId) {
        url = `http://localhost:3000/api/assessments/form-eight/${docId}`;
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
          description: `Form Eight ${docId ? "updated" : "saved"} successfully!`,
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
        description: "An error occurred while saving Form Eight",
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
    navigate(`/process/${processId}/form-nine`);
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
    navigate(`/process/${processId}/form-seven`);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center px-4 py-6">
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white w-full max-w-4xl p-8 rounded-lg shadow"
      >
        <h1 className="text-2xl font-bold mb-6 text-center">Form Eight: Main Roof</h1>

        {/* Section: Construction Photos */}
        <div className="mb-6">
          <Label>Construction photo (recommended):</Label>
          <div className="flex gap-4 mt-2">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="hasConstructionPhotos"
                value="yes"
                checked={formData.hasConstructionPhotos === "yes"}
                onChange={handleChange}
              />
              <span>Yes</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="hasConstructionPhotos"
                value="no"
                checked={formData.hasConstructionPhotos === "no"}
                onChange={handleChange}
              />
              <span>No</span>
            </label>
          </div>
        </div>

        {/* Section: Upload Construction Photos */}
        {formData.hasConstructionPhotos === "yes" && (
          <div className="mb-6">
            <PhotoUploader
              onFileChange={handleConstructionFileChange}
              imagePreviews={constructionPreviews}
              onDeleteImage={handleDeleteConstructionImage}
              label="Upload Construction Photos (Recommended)"
              inputName="constructionPhotos"
            />
          </div>
        )}

        {/* Section: Roof Type */}
        <div className="mb-6">
          <Label>Type:</Label>
          <select
            name="roofType"
            value={formData.roofType}
            onChange={handleChange}
            className="w-full mt-1 border rounded px-2 py-2"
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
        </div>

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
            <option value="Joists">Joists</option>
            <option value="Rafters">Rafters</option>
            <option value="As built">As built</option>
            <option value="Unknown">Unknown</option>
            <option value="None">None</option>
          </select>
        </div>

        {/* Section: Insulation Depth (Pitched/ Thatch) */}
        <div className="mb-6">
          <Label>Insulation Depth (Pitched/ Thatch):</Label>
          <select
            name="insulationDepthPitched"
            value={formData.insulationDepthPitched}
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
          </select>
        </div>

        {/* Section: Insulation Depth (Flat/ Sloping Ceiling) */}
        <div className="mb-6">
          <Label>Insulation Depth (Flat/ Sloping Ceiling):</Label>
          <select
            name="insulationDepthFlat"
            value={formData.insulationDepthFlat}
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

        {/* Section: Upload Loft Insulation Photos */}
        <div className="mb-6">
          <PhotoUploader
            onFileChange={handleLoftInsulationFileChange}
            imagePreviews={loftInsulationPreviews}
            onDeleteImage={handleDeleteLoftInsulationImage}
            label="Loft insulation depth photos (recommended)"
            inputName="loftInsulationPhotos"
          />
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