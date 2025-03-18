import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/store/authStore";

export default function FormSix() {
  const navigate = useNavigate();
  const { processId } = useParams(); // e.g., /process/:processId/form-six
  const { toast } = useToast();
  const { user } = useAuthStore();

  // Document and form tracking
  const [docId, setDocId] = useState(null);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [isUpdate, setIsUpdate] = useState(false);

  // Overall form data (other fields)
  const [formData, setFormData] = useState({
    wallType: "",
    insulationType: "",
    dryLining: "",
    insulationThickness: "",
    externalThickness: "",
    uValue: "",
    partyWallType: "",
    constructionPhoto: "",   // New field
    wallThicknessUnknown: "", // New field
    userId: "",
    processId: processId || "",
  });
  

  // === Group 1: Construction Photos ===
  const [constructionFiles, setConstructionFiles] = useState([]);
  const [constructionPreviews, setConstructionPreviews] = useState([]);
  const [constructionDeleted, setConstructionDeleted] = useState([]);

  // === Group 2: Wall Insulation Photos ===
  const [insulationFiles, setInsulationFiles] = useState([]);
  const [insulationPreviews, setInsulationPreviews] = useState([]);
  const [insulationDeleted, setInsulationDeleted] = useState([]);

  // === Group 3: Wall Thickness Photos ===
  const [thicknessFiles, setThicknessFiles] = useState([]);
  const [thicknessPreviews, setThicknessPreviews] = useState([]);
  const [thicknessDeleted, setThicknessDeleted] = useState([]);

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

  // Fetch existing Form Six data on mount
  useEffect(() => {
    if (user && user._id && processId) {
      fetch(`http://localhost:3000/api/assessments/form-six?userId=${user._id}&processId=${processId}`)
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

            // Set insulation photos preview if available
            if (existingForm.insulationPhotos && existingForm.insulationPhotos.length > 0) {
              const previews = existingForm.insulationPhotos.map(
                (img) => `http://localhost:3000/${img}`
              );
              setInsulationPreviews(previews);
            }

            // Set thickness photos preview if available
            if (existingForm.thicknessPhotos && existingForm.thicknessPhotos.length > 0) {
              const previews = existingForm.thicknessPhotos.map(
                (img) => `http://localhost:3000/${img}`
              );
              setThicknessPreviews(previews);
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

  // Warn about unsaved changes on page unload
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (unsavedChanges) {
        e.preventDefault();
        e.returnValue = "You have unsaved changes. If you leave, your data will be lost.";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [unsavedChanges]);

  // Handle input changes for non-file fields
  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
      userId: user ? user._id : "",
      processId,
    }));
    setUnsavedChanges(true);
  };

  // === File Handlers for Each Group ===

  // Construction Photos
  const handleConstructionFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setConstructionFiles((prev) => [...prev, ...selectedFiles]);
    const previewUrls = selectedFiles.map((file) => URL.createObjectURL(file));
    setConstructionPreviews((prev) => [...prev, ...previewUrls]);
    setUnsavedChanges(true);
  };
  const handleDeleteConstructionImage = (index, previewUrl) => {
    const updatedFiles = constructionFiles.filter((_, idx) => idx !== index);
    const updatedPreviews = constructionPreviews.filter((_, idx) => idx !== index);
    // If this preview corresponds to an already saved image, add it to deleted array.
    // Here, we assume that if previewUrl exists in full URL form, it belongs to a saved image.
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

  // Insulation Photos
  const handleInsulationFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setInsulationFiles((prev) => [...prev, ...selectedFiles]);
    const previewUrls = selectedFiles.map((file) => URL.createObjectURL(file));
    setInsulationPreviews((prev) => [...prev, ...previewUrls]);
    setUnsavedChanges(true);
  };
  const handleDeleteInsulationImage = (index, previewUrl) => {
    const updatedFiles = insulationFiles.filter((_, idx) => idx !== index);
    const updatedPreviews = insulationPreviews.filter((_, idx) => idx !== index);
    setInsulationDeleted((prev) => {
      if (!prev.includes(previewUrl)) {
        return [...prev, previewUrl];
      }
      return prev;
    });
    setInsulationFiles(updatedFiles);
    setInsulationPreviews(updatedPreviews);
    setUnsavedChanges(true);
  };

  // Thickness Photos
  const handleThicknessFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setThicknessFiles((prev) => [...prev, ...selectedFiles]);
    const previewUrls = selectedFiles.map((file) => URL.createObjectURL(file));
    setThicknessPreviews((prev) => [...prev, ...previewUrls]);
    setUnsavedChanges(true);
  };
  const handleDeleteThicknessImage = (index, previewUrl) => {
    const updatedFiles = thicknessFiles.filter((_, idx) => idx !== index);
    const updatedPreviews = thicknessPreviews.filter((_, idx) => idx !== index);
    setThicknessDeleted((prev) => {
      if (!prev.includes(previewUrl)) {
        return [...prev, previewUrl];
      }
      return prev;
    });
    setThicknessFiles(updatedFiles);
    setThicknessPreviews(updatedPreviews);
    setUnsavedChanges(true);
  };

  // Save/Update Handler
  const handleSave = async () => {
    try {
      const formDataToSend = new FormData();

      // Append non-file fields
      for (const key in formData) {
        // For imageUrl, we'll handle the files separately
        if (key === "imageUrl") continue;
        formDataToSend.append(key, formData[key]);
      }

      // Append new files for each image group
      if (constructionFiles.length > 0) {
        constructionFiles.forEach((file) => {
          formDataToSend.append("constructionPhotos", file);
        });
      }
      if (insulationFiles.length > 0) {
        insulationFiles.forEach((file) => {
          formDataToSend.append("insulationPhotos", file);
        });
      }
      if (thicknessFiles.length > 0) {
        thicknessFiles.forEach((file) => {
          formDataToSend.append("thicknessPhotos", file);
        });
      }

      // Append deleted images for each group (as JSON strings)
      if (constructionDeleted.length > 0) {
        formDataToSend.append("deletedConstruction", JSON.stringify(constructionDeleted));
      }
      if (insulationDeleted.length > 0) {
        formDataToSend.append("deletedInsulation", JSON.stringify(insulationDeleted));
      }
      if (thicknessDeleted.length > 0) {
        formDataToSend.append("deletedThickness", JSON.stringify(thicknessDeleted));
      }

      let url = "http://localhost:3000/api/assessments/form-six";
      let method = "POST";
      if (docId) {
        url = `http://localhost:3000/api/assessments/form-six/${docId}`;
        method = "PUT";
      }

      const response = await fetch(url, {
        method,
        body: formDataToSend,
      });
      const data = await response.json();
      if (data.success) {
        if (!docId && data.data && data.data._id) {
          setDocId(data.data._id);
        }
        setIsUpdate(true);
        setUnsavedChanges(false);
        toast({
          title: "Success",
          description: `Form Six ${docId ? "updated" : "saved"} successfully!`,
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
        description: "An error occurred while saving Form Six",
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
    navigate(`/process/${processId}/form-seven`); // adjust route as needed
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
    navigate(`/process/${processId}/form-five`); // adjust route as needed
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center px-4 py-6">
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white w-full max-w-4xl p-8 rounded-lg shadow"
      >
        <h1 className="text-2xl font-bold mb-6 text-center">Form Six: Main Property Walls</h1>

        {/* Section: Construction Photo (recommended) */}
<div className="mb-6">
  <Label className="font-bold">
    Construction
    <span className="font-normal"> photo (recommended)</span>
  </Label>
  <div className="flex items-center gap-4 mt-2">
    <label className="flex items-center gap-2">
      <input
        type="radio"
        name="constructionPhoto"
        value="yes"
        checked={formData.constructionPhoto === "yes"}
        onChange={handleChange}
      />
      Yes
    </label>
    <label className="flex items-center gap-2">
      <input
        type="radio"
        name="constructionPhoto"
        value="no"
        checked={formData.constructionPhoto === "no"}
        onChange={handleChange}
      />
      No
    </label>
  </div>
</div>

       

        

        
        {/* Other Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">

         
        {/* Section: Construction Photos */}

        <div className="mb-6">
          <Label>Construction photo (recommended) | note: can be included in elevation photos</Label>
          <div className="flex flex-col gap-2 mt-2">
            <Button onClick={() => document.getElementById("constructionInput").click()}>
              Choose Photos
            </Button>
            <input
              id="constructionInput"
              type="file"
              accept="image/*, application/pdf"
              multiple
              name="constructionPhotos"
              onChange={handleConstructionFileChange}
              className="hidden"
            />
          </div>
          {constructionPreviews.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {constructionPreviews.map((preview, index) => (
                <div key={index} className="relative">
                  <img src={preview} alt="Construction Preview" className="w-32 h-32 object-cover rounded" />
                  <button
                    onClick={() => handleDeleteConstructionImage(index, preview)}
                    className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
          {/* Dropdown: Type */}
          <div>
            <Label htmlFor="wallType">Type</Label>
            <select
              id="wallType"
              name="wallType"
              value={formData.wallType}
              onChange={handleChange}
              className="w-full mt-1 border rounded px-2 py-2"
            >
              <option value="">- Select -</option>
              <option value="Stone">Stone</option>
              <option value="Brick">Brick</option>
              <option value="Cavity">Cavity</option>
              <option value="Timber">Timber</option>
            </select>
          </div>
          {/* Dropdown: Insulation */}
          <div>
            <Label htmlFor="insulationType">Insulation</Label>
            <select
              id="insulationType"
              name="insulationType"
              value={formData.insulationType}
              onChange={handleChange}
              className="w-full mt-1 border rounded px-2 py-2"
            >
              <option value="">- Select -</option>
              <option value="External">External</option>
              <option value="Internal">Internal</option>
              <option value="None">None</option>
            </select>
          </div>
          {/* Radio: Dry-lining */}
          <div>
            <Label>Dry-lining (applicable for Stone/ Solid Brick/ Cavity walls)</Label>
            <div className="flex items-center gap-4 mt-2">
              <label className="flex items-center gap-1">
                <input
                  type="radio"
                  name="dryLining"
                  value="yes"
                  checked={formData.dryLining === "yes"}
                  onChange={handleChange}
                />
                Yes
              </label>
              <label className="flex items-center gap-1">
                <input
                  type="radio"
                  name="dryLining"
                  value="no"
                  checked={formData.dryLining === "no"}
                  onChange={handleChange}
                />
                No
              </label>
            </div>
          </div>
          {/* Dropdown: Insulation Thickness */}
          <div>
            <Label htmlFor="insulationThickness">Insulation Thickness</Label>
            <select
              id="insulationThickness"
              name="insulationThickness"
              value={formData.insulationThickness}
              onChange={handleChange}
              className="w-full mt-1 border rounded px-2 py-2"
            >
              <option value="">- Select -</option>
              <option value="50mm">50mm</option>
              <option value="100mm">100mm</option>
              <option value="150mm">150mm</option>
              <option value="200mm">200mm</option>
            </select>
          </div>

          {/* Section: Wall Insulation Photos */}
        <div className="mb-6">
          <Label>Wall insulation photos</Label>
          <div className="flex flex-col gap-2 mt-2">
            <Button onClick={() => document.getElementById("insulationInput").click()}>
              Choose Photos
            </Button>
            <input
              id="insulationInput"
              type="file"
              accept="image/*, application/pdf"
              multiple
              name="insulationPhotos"
              onChange={handleInsulationFileChange}
              className="hidden"
            />
          </div>
          {insulationPreviews.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {insulationPreviews.map((preview, index) => (
                <div key={index} className="relative">
                  <img src={preview} alt="Insulation Preview" className="w-32 h-32 object-cover rounded" />
                  <button
                    onClick={() => handleDeleteInsulationImage(index, preview)}
                    className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        
          {/* Input: External Wall Thickness */}
          <div>
            <Label htmlFor="externalThickness">External Wall Thickness (mm)</Label>
            <Input
              id="externalThickness"
              name="externalThickness"
              placeholder="e.g., 150"
              value={formData.externalThickness}
              onChange={handleChange}
            />
          </div>

          {/* Section: Wall Thickness Unknown */}
<div className="mb-6">
  <Label className="font-semibold">
    Wall Thickness Unknown
  </Label>
  <div className="flex items-center gap-4 mt-2">
    <label className="flex items-center gap-2">
      <input
        type="radio"
        name="wallThicknessUnknown"
        value="yes"
        checked={formData.wallThicknessUnknown === "yes"}
        onChange={handleChange}
      />
      Yes
    </label>
    <label className="flex items-center gap-2">
      <input
        type="radio"
        name="wallThicknessUnknown"
        value="no"
        checked={formData.wallThicknessUnknown === "no"}
        onChange={handleChange}
      />
      No
    </label>
  </div>
</div>


{/* Section: Wall Thickness Photos */}
<div className="mb-6">
          <Label>Wall thickness photos (recommended)</Label>
          <div className="flex flex-col gap-2 mt-2">
            <Button onClick={() => document.getElementById("thicknessInput").click()}>
              Choose Photos
            </Button>
            <input
              id="thicknessInput"
              type="file"
              accept="image/*, application/pdf"
              multiple
              name="thicknessPhotos"
              onChange={handleThicknessFileChange}
              className="hidden"
            />
          </div>
          {thicknessPreviews.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {thicknessPreviews.map((preview, index) => (
                <div key={index} className="relative">
                  <img src={preview} alt="Thickness Preview" className="w-32 h-32 object-cover rounded" />
                  <button
                    onClick={() => handleDeleteThicknessImage(index, preview)}
                    className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>


          {/* Input: U-value known */}
          <div>
            <Label htmlFor="uValue">U-value known (W/m²K)</Label>
            <Input
              id="uValue"
              name="uValue"
              placeholder="e.g., 1.2"
              value={formData.uValue}
              onChange={handleChange}
            />
            <p className="text-sm text-gray-500 mt-1">
              Note: documentary evidence required to overwrite U-value
            </p>
          </div>
          {/* Dropdown: Party Wall Type */}
          <div>
            <Label htmlFor="partyWallType">Party Wall Type (if applicable)</Label>
            <select
              id="partyWallType"
              name="partyWallType"
              value={formData.partyWallType}
              onChange={handleChange}
              className="w-full mt-1 border rounded px-2 py-2"
            >
              <option value="">- Select -</option>
              <option value="Solid Masonry/Timber/System Build">Solid Masonry/Timber/System Build</option>
              <option value="Cavity Masonry unfilled">Cavity Masonry unfilled</option>
              <option value="Cavity Masonry filled">Cavity Masonry filled</option>
              <option value="Unable to determine">Unable to determine</option>
            </select>
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
