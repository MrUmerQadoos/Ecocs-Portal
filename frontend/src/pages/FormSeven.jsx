import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/store/authStore";

export default function FormSeven() {
  const navigate = useNavigate();
  const { processId } = useParams(); // e.g., /process/:processId/form-seven
  const { toast } = useToast();
  const { user } = useAuthStore();

  const [docId, setDocId] = useState(null);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [isUpdate, setIsUpdate] = useState(false);

  const [formData, setFormData] = useState({
    hasAlternativeWalls: "",
    wallArea: "",
    shelteredWall: "",
    wallType: "",
    insulation: "",
    externalWallThickness: "",
    wallThicknessUnknown: "",
    insulationThickness: "",
    userId: "",
    processId: processId || "",
  });

  // Image Handling
  const [wallInsulationFiles, setWallInsulationFiles] = useState([]);
  const [wallInsulationPreviews, setWallInsulationPreviews] = useState([]);
  const [wallInsulationDeleted, setWallInsulationDeleted] = useState([]);

  const [alternativeWallsFiles, setAlternativeWallsFiles] = useState([]);
  const [alternativeWallsPreviews, setAlternativeWallsPreviews] = useState([]);
  const [alternativeWallsDeleted, setAlternativeWallsDeleted] = useState([]);

  const [wallThicknessFiles, setWallThicknessFiles] = useState([]);
  const [wallThicknessPreviews, setWallThicknessPreviews] = useState([]);
  const [wallThicknessDeleted, setWallThicknessDeleted] = useState([]);

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

  // Fetch existing Form Seven data on mount
  useEffect(() => {
    if (user && user._id && processId) {
      fetch(`http://localhost:3000/api/assessments/form-seven?userId=${user._id}&processId=${processId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data && data.data.length > 0) {
            const existingForm = data.data[0];
            setFormData(existingForm);
            setDocId(existingForm._id);
            setIsUpdate(true);

            // Set wall insulation photos preview if available
            if (existingForm.wallInsulationPhotos && existingForm.wallInsulationPhotos.length > 0) {
              const previews = existingForm.wallInsulationPhotos.map(
                (img) => `http://localhost:3000/${img}`
              );
              setWallInsulationPreviews(previews);
            }

            // Set alternative walls photos preview if available
            if (existingForm.alternativeWallsPhotos && existingForm.alternativeWallsPhotos.length > 0) {
              const previews = existingForm.alternativeWallsPhotos.map(
                (img) => `http://localhost:3000/${img}`
              );
              setAlternativeWallsPreviews(previews);
            }

            // Set wall thickness photos preview if available
            if (existingForm.wallThicknessPhotos && existingForm.wallThicknessPhotos.length > 0) {
              const previews = existingForm.wallThicknessPhotos.map(
                (img) => `http://localhost:3000/${img}`
              );
              setWallThicknessPreviews(previews);
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
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    setUnsavedChanges(true);
  };

  // Handle wall insulation photo file change
  const handleWallInsulationFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setWallInsulationFiles((prev) => [...prev, ...selectedFiles]);
    const previewUrls = selectedFiles.map((file) => URL.createObjectURL(file));
    setWallInsulationPreviews((prev) => [...prev, ...previewUrls]);
    setUnsavedChanges(true);
  };

  // Handle alternative walls photo file change
  const handleAlternativeWallsFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setAlternativeWallsFiles((prev) => [...prev, ...selectedFiles]);
    const previewUrls = selectedFiles.map((file) => URL.createObjectURL(file));
    setAlternativeWallsPreviews((prev) => [...prev, ...previewUrls]);
    setUnsavedChanges(true);
  };

  // Handle wall thickness photo file change
  const handleWallThicknessFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setWallThicknessFiles((prev) => [...prev, ...selectedFiles]);
    const previewUrls = selectedFiles.map((file) => URL.createObjectURL(file));
    setWallThicknessPreviews((prev) => [...prev, ...previewUrls]);
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

      // Append files for wall insulation, alternative walls, and wall thickness photos
      if (wallInsulationFiles.length > 0) {
        wallInsulationFiles.forEach((file) => {
          formDataToSend.append("wallInsulationPhotos", file);
        });
      }

      if (alternativeWallsFiles.length > 0) {
        alternativeWallsFiles.forEach((file) => {
          formDataToSend.append("alternativeWallsPhotos", file);
        });
      }

      if (wallThicknessFiles.length > 0) {
        wallThicknessFiles.forEach((file) => {
          formDataToSend.append("wallThicknessPhotos", file);
        });
      }

      // Append deleted images for each group (as JSON strings)
      if (wallInsulationDeleted.length > 0) {
        formDataToSend.append("deletedWallInsulation", JSON.stringify(wallInsulationDeleted));
      }
      if (alternativeWallsDeleted.length > 0) {
        formDataToSend.append("deletedAlternativeWalls", JSON.stringify(alternativeWallsDeleted));
      }
      if (wallThicknessDeleted.length > 0) {
        formDataToSend.append("deletedWallThickness", JSON.stringify(wallThicknessDeleted));
      }

      let url = "http://localhost:3000/api/assessments/form-seven";
      let method = "POST";
      if (docId) {
        url = `http://localhost:3000/api/assessments/form-seven/${docId}`;
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
          description: `Form Seven ${docId ? "updated" : "saved"} successfully!`,
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
        description: "An error occurred while saving Form Seven",
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
    navigate(`/process/${processId}/form-eight`);
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
    navigate(`/process/${processId}/form-six`);
  };

  // Delete Photo Handlers
  const handleDeleteWallInsulationImage = (index, previewUrl) => {
    const updatedFiles = wallInsulationFiles.filter((_, idx) => idx !== index);
    const updatedPreviews = wallInsulationPreviews.filter((_, idx) => idx !== index);
    setWallInsulationDeleted((prev) => {
      if (!prev.includes(previewUrl)) {
        return [...prev, previewUrl];
      }
      return prev;
    });
    setWallInsulationFiles(updatedFiles);
    setWallInsulationPreviews(updatedPreviews);
    setUnsavedChanges(true);
  };

  const handleDeleteAlternativeWallsImage = (index, previewUrl) => {
    const updatedFiles = alternativeWallsFiles.filter((_, idx) => idx !== index);
    const updatedPreviews = alternativeWallsPreviews.filter((_, idx) => idx !== index);
    setAlternativeWallsDeleted((prev) => {
      if (!prev.includes(previewUrl)) {
        return [...prev, previewUrl];
      }
      return prev;
    });
    setAlternativeWallsFiles(updatedFiles);
    setAlternativeWallsPreviews(updatedPreviews);
    setUnsavedChanges(true);
  };

  const handleWallThicknessImage = (index, previewUrl) => {
    const updatedFiles = wallThicknessFiles.filter((_, idx) => idx !== index);
    const updatedPreviews = wallThicknessPreviews.filter((_, idx) => idx !== index);
    setWallThicknessDeleted((prev) => {
      if (!prev.includes(previewUrl)) {
        return [...prev, previewUrl];
      }
      return prev;
    });
    setWallThicknessFiles(updatedFiles);
    setWallThicknessPreviews(updatedPreviews);
    setUnsavedChanges(true);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center px-4 py-6">
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white w-full max-w-4xl p-8 rounded-lg shadow"
      >
        <h1 className="text-2xl font-bold mb-6 text-center">Form Seven: Alternative Walls</h1>

        {/* Section: Has Alternative Walls */}
        <div className="mb-6">
          <Label>Alternative Walls (recommended):</Label>
          <div className="flex gap-4 mt-2">
            <label>
              <input
                type="radio"
                name="hasAlternativeWalls"
                value="yes"
                checked={formData.hasAlternativeWalls === "yes"}
                onChange={handleChange}
              />{" "}
              Yes
            </label>
            <label>
              <input
                type="radio"
                name="hasAlternativeWalls"
                value="no"
                checked={formData.hasAlternativeWalls === "no"}
                onChange={handleChange}
              />{" "}
              No
            </label>
          </div>
        </div>

        {/* Section: Wall Insulation Photos */}
        <div className="mb-6">
          <Label>Wall Insulation Photos</Label>
          <div className="flex flex-col gap-2 mt-2">
            <Button onClick={() => document.getElementById("wallInsulationInput").click()}>
              Choose Photos
            </Button>
            <input
              id="wallInsulationInput"
              type="file"
              accept="image/*"
              multiple
              name="wallInsulationPhotos"
              onChange={handleWallInsulationFileChange}
              className="hidden"
            />
          </div>
          {wallInsulationPreviews.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {wallInsulationPreviews.map((preview, index) => (
                <div key={index} className="relative">
                  <img src={preview} alt="Wall Insulation Preview" className="w-32 h-32 object-cover rounded" />
                  <button
                    onClick={() => handleDeleteWallInsulationImage(index, preview)}
                    className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section: Wall Area and Sheltered Wall */}
        <div className="mb-6 flex gap-4">
          <div className="flex-1">
            <Label>Wall Area (m²):</Label>
            <Input
              type="text"
              name="wallArea"
              value={formData.wallArea}
              onChange={handleChange}
              placeholder="Note: ensure area of any openings has been subtracted"
              className="mt-1"
            />
          </div>
          <div className="flex-1">
            <Label>Sheltered Wall (flats only):</Label>
            <div className="flex gap-4 mt-2">
              <label>
                <input
                  type="radio"
                  name="shelteredWall"
                  value="yes"
                  checked={formData.shelteredWall === "yes"}
                  onChange={handleChange}
                />{" "}
                Yes
              </label>
              <label>
                <input
                  type="radio"
                  name="shelteredWall"
                  value="no"
                  checked={formData.shelteredWall === "no"}
                  onChange={handleChange}
                />{" "}
                No
              </label>
            </div>
          </div>
        </div>

        {/* Section: Wall Type */}
        <div className="mb-6">
          <Label>Type:</Label>
          <select
            name="wallType"
            value={formData.wallType}
            onChange={handleChange}
            className="w-full mt-1 border rounded px-2 py-2"
          >
            <option value="">- Select -</option>
            <option value="granite or whinstone">Stone (Granite or Whinstone)</option>
            <option value="sandstone or limestone">Stone (Sandstone or Limestone)</option>
            <option value="Solid Brick">Solid Brick</option>
            <option value="Cob">Cob</option>
            <option value="Cavity">Cavity</option>
            <option value="Timber Frame">Timber Frame</option>
            <option value="System Build">System Build</option>
          </select>
        </div>

        {/* Section: Insulation */}
        <div className="mb-6">
          <Label>Insulation:</Label>
          <select
            name="insulation"
            value={formData.insulation}
            onChange={handleChange}
            className="w-full mt-1 border rounded px-2 py-2"
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
          </select>
        </div>

        {/* Section: Alternative Walls Photos */}
        <div className="mb-6">
          <Label>Alternative Walls Photos (recommended)</Label>
          <div className="flex flex-col gap-2 mt-2">
            <Button onClick={() => document.getElementById("alternativeWallsInput").click()}>
              Choose Photos
            </Button>
            <input
              id="alternativeWallsInput"
              type="file"
              accept="image/*"
              multiple
              name="alternativeWallsPhotos"
              onChange={handleAlternativeWallsFileChange}
              className="hidden"
            />
          </div>
          {alternativeWallsPreviews.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {alternativeWallsPreviews.map((preview, index) => (
                <div key={index} className="relative">
                  <img src={preview} alt="Alternative Walls Preview" className="w-32 h-32 object-cover rounded" />
                  <button
                    onClick={() => handleDeleteAlternativeWallsImage(index, preview)}
                    className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section: External Wall Thickness, Wall Thickness Unknown, Wall Thickness Photos */}
        <div className="mb-6 flex gap-4">
          <div className="flex-1">
            <Label>External Wall Thickness (mm):</Label>
            <Input
              type="text"
              name="externalWallThickness"
              value={formData.externalWallThickness}
              onChange={handleChange}
              className="mt-1"
            />
          </div>
          <div className="flex-1">
            <Label>Wall Thickness Unknown:</Label>
            <div className="flex gap-4 mt-2">
              <label>
                <input
                  type="radio"
                  name="wallThicknessUnknown"
                  value="yes"
                  checked={formData.wallThicknessUnknown === "yes"}
                  onChange={handleChange}
                />{" "}
                Yes
              </label>
              <label>
                <input
                  type="radio"
                  name="wallThicknessUnknown"
                  value="no"
                  checked={formData.wallThicknessUnknown === "no"}
                  onChange={handleChange}
                />{" "}
                No
              </label>
            </div>
          </div>
          <div className="flex-1">
            <Label>Wall Thickness Photos (recommended)</Label>
            <div className="flex flex-col gap-2 mt-2">
              <Button onClick={() => document.getElementById("wallThicknessInput").click()}>
                Choose Photos
              </Button>
              <input
                id="wallThicknessInput"
                type="file"
                accept="image/*"
                multiple
                name="wallThicknessPhotos"
                onChange={handleWallThicknessFileChange}
                className="hidden"
              />
            </div>
            {wallThicknessPreviews.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {wallThicknessPreviews.map((preview, index) => (
                  <div key={index} className="relative">
                    <img src={preview} alt="Wall Thickness Preview" className="w-32 h-32 object-cover rounded" />
                    <button
                      onClick={() => handleWallThicknessImage(index, preview)}
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

        {/* Section: Insulation Thickness */}
        <div className="mb-6">
          <Label>Insulation Thickness:</Label>
          <select
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