import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/store/authStore";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";

export default function FormFive() {
  const navigate = useNavigate();
  const { processId: urlProcessId } = useParams();
  const location = useLocation();
  const { toast } = useToast();
  const { user } = useAuthStore();

  // State for form data and metadata
  const [formData, setFormData] = useState({
    corridor: "",
    corridorPhotos: [],
    shelteredWallLength: "",
    positionInBlock: "",
    whichFloor: "",
    userId: user?._id || "",
    processId: urlProcessId || "",
  });

  const [formId, setFormId] = useState(null);
  const [taskId, setTaskId] = useState(null);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [isUpdate, setIsUpdate] = useState(false);
  const [isViewOnly, setIsViewOnly] = useState(false);
  const [savedProcessId, setSavedProcessId] = useState(null);

  // File upload state
  const [files, setFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [deletedImages, setDeletedImages] = useState([]);

  // State for image preview modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  // Determine mode (edit or view) and load existing data
  useEffect(() => {
    const isViewing = location.pathname.includes("/view-form");
    setIsViewOnly(isViewing || user.role !== "surveyor");
    const queryTaskId = new URLSearchParams(location.search).get("taskId");
    setTaskId(queryTaskId);

    if (urlProcessId && urlProcessId !== "new") {
      fetch(`http://localhost:3000/api/assessments/form-five?processId=${urlProcessId}`, {
        method: "GET",
        credentials: "include",
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data) {
            setFormData(data.data);
            setFormId(data.data._id);
            setIsUpdate(true);
            setSavedProcessId(data.data.processId);
            if (data.data.corridorPhotos && data.data.corridorPhotos.length > 0) {
              const previews = data.data.corridorPhotos.map(
                (photo) => `http://localhost:3000/${photo}`
              );
              setImagePreviews(previews);
            }
          } else if (isViewing) {
            toast({
              variant: "destructive",
              title: "Error",
              description: "Form Five data not found.",
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
            description: "Failed to load Form Five data.",
          });
          navigate("/dashboard");
          console.error("Fetch error:", error);
        });
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
  };

  // Handle file upload for corridor photos
  const handleFileChange = (e) => {
    if (isViewOnly) return;
    const selectedFiles = Array.from(e.target.files);
    setFiles((prevFiles) => [...prevFiles, ...selectedFiles]);
    const previewUrls = selectedFiles.map((file) => URL.createObjectURL(file));
    setImagePreviews((prevPreviews) => [...prevPreviews, ...previewUrls]);
    setUnsavedChanges(true);
  };

  // Delete an image
  const handleDeleteImage = (index, imageUrl) => {
    if (isViewOnly) return;
    const updatedPreviews = imagePreviews.filter((_, idx) => idx !== index);
    setImagePreviews(updatedPreviews);

    const isNewUpload = imageUrl.startsWith("blob:");
    if (isNewUpload) {
      const updatedFiles = files.filter((_, idx) => idx !== index - (imagePreviews.length - files.length));
      setFiles(updatedFiles);
    } else {
      setDeletedImages((prev) => [...prev, imageUrl]);
    }

    setUnsavedChanges(true);
  };

  // Open image preview modal
  const handleImageClick = (imageUrl) => {
    setSelectedImage(imageUrl);
    setIsModalOpen(true);
  };

  // Save or update the form
  const saveForm = async () => {
    if (isViewOnly) return { success: false };

    try {
      const formDataToSend = new FormData();

      for (const key in formData) {
        if (key !== "corridorPhotos") {
          formDataToSend.append(key, formData[key]);
        }
      }

      if (files.length > 0) {
        files.forEach((file) => {
          formDataToSend.append("corridorPhotos", file);
        });
      }

      if (deletedImages.length > 0) {
        formDataToSend.append("deletedImages", JSON.stringify(deletedImages));
      }

      const url = formId
        ? `http://localhost:3000/api/assessments/form-five/${formId}`
        : "http://localhost:3000/api/assessments/form-five";
      const method = formId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        credentials: "include",
        body: formDataToSend,
      });
      const data = await response.json();

      if (data.success) {
        setFormId(data.data._id);
        setSavedProcessId(data.data.processId);
        setIsUpdate(true);
        setUnsavedChanges(false);
        setFiles([]);
        setDeletedImages([]);
        setImagePreviews(
          data.data.corridorPhotos.map((photo) => `http://localhost:3000/${photo}`)
        );
        toast({
          title: "Success",
          description: `Form Five ${formId ? "updated" : "saved"} successfully!`,
        });
        return { success: true, processId: data.data.processId };
      } else {
        throw new Error(data.error || "Failed to save Form Five");
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
      console.error("Save error:", error);
      return { success: false, error: error.message };
    }
  };

  // Handle save button click
  const handleSave = async () => {
    const result = await saveForm();
    if (result.success) {
      if (user.role !== "surveyor") {
        navigate(`/view-form/${result.processId}/form-five?taskId=${taskId}`);
      } else {
        navigate(`/process/${result.processId}/form-five?taskId=${taskId}`, { replace: true });
      }
    }
  };

  // Handle navigation to the next form
  const handleNext = async () => {
    if (!isViewOnly) {
      const result = await saveForm();
      if (result.success) {
        if (user.role === "surveyor") {
          navigate(`/process/${result.processId}/form-six?taskId=${taskId}`);
        } else {
          navigate(`/view-form/${result.processId}/form-six?taskId=${taskId}`);
        }
      }
    } else {
      navigate(`/view-form/${savedProcessId || urlProcessId}/form-six?taskId=${taskId}`);
    }
  };

  // Handle navigation to the previous form
  const handlePrevious = async () => {
    if (!isViewOnly) {
      const result = await saveForm();
      if (result.success) {
        if (user.role === "surveyor") {
          navigate(`/process/${result.processId}/form-four?taskId=${taskId}`);
        } else {
          navigate(`/view-form/${result.processId}/form-four?taskId=${taskId}`);
        }
      }
    } else {
      navigate(`/view-form/${savedProcessId || urlProcessId}/form-four?taskId=${taskId}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center px-4 py-6">
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white w-full max-w-4xl p-8 rounded-lg shadow"
      >
        <h1 className="text-2xl font-bold mb-6 text-center">
          {isViewOnly ? "View Form Five" : "5. Flats/Maisonettes"}
        </h1>

        {/* Corridor */}
        <div className="mb-4">
          <Label htmlFor="corridor">Corridor</Label>
          <select
            id="corridor"
            name="corridor"
            value={formData.corridor}
            onChange={handleChange}
            className="w-full mt-1 border rounded px-2 py-2"
            disabled={isViewOnly}
          >
            <option value="">- Select -</option>
            <option value="None">None</option>
            <option value="Heated">Heated</option>
            <option value="Unheated">Unheated</option>
          </select>
        </div>

        {/* Photo of corridor/sheltered wall */}
        <div className="mb-4">
          <Label>Photo of corridor/sheltered wall (recommended)</Label>
          <div className="flex flex-col gap-2 mt-2">
            {!isViewOnly && (
              <Button onClick={() => document.getElementById("photoInput").click()}>
                Choose Photos
              </Button>
            )}
            <input
              id="photoInput"
              type="file"
              accept="image/*"
              multiple
              name="corridorPhotos"
              onChange={handleFileChange}
              className="hidden"
              disabled={isViewOnly}
            />
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {imagePreviews.map((preview, index) => (
              <div key={index} className="relative inline-block">
                <img
                  src={preview}
                  alt="Preview"
                  className="w-32 h-32 object-cover rounded cursor-pointer"
                  onClick={() => handleImageClick(preview)}
                />
                {!isViewOnly && (
                  <button
                    onClick={() => handleDeleteImage(index, preview)}
                    className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Length of Sheltered Wall (m) if unheated */}
        <div className="mb-4">
          <Label htmlFor="shelteredWallLength">Length of Sheltered Wall (m) if unheated</Label>
          <Input
            id="shelteredWallLength"
            name="shelteredWallLength"
            placeholder="e.g. 10"
            value={formData.shelteredWallLength}
            onChange={handleChange}
            disabled={isViewOnly}
          />
          <p className="text-sm text-gray-500 mt-1">
            Note: remember to include this measurement in the overall heat loss wall perimeter
          </p>
        </div>

        {/* Position + Which Floor */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="positionInBlock">Position of flat/maisonette in block</Label>
            <select
              id="positionInBlock"
              name="positionInBlock"
              value={formData.positionInBlock}
              onChange={handleChange}
              className="w-full mt-1 border rounded px-2 py-2"
              disabled={isViewOnly}
            >
              <option value="">- Select -</option>
              <option value="Basement">Basement</option>
              <option value="Ground Floor">Ground Floor</option>
              <option value="Mid Floor">Mid Floor</option>
              <option value="Top Floor">Top Floor</option>
            </select>
          </div>
          <div>
            <Label htmlFor="whichFloor">Which Floor?</Label>
            <Input
              id="whichFloor"
              name="whichFloor"
              placeholder="e.g. 2nd"
              value={formData.whichFloor}
              onChange={handleChange}
              disabled={isViewOnly}
            />
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6 space-x-2">
          <Button variant="outline" onClick={handlePrevious}>
            Previous
          </Button>
          {isViewOnly ? (
            <>
              <Button variant="outline" onClick={() => navigate("/dashboard")}>
                Back to Dashboard
              </Button>
              <Button variant="secondary" onClick={handleNext}>
                Next
              </Button>
            </>
          ) : (
            <>
              <Button onClick={handleSave}>{isUpdate ? "Update" : "Save"}</Button>
              <Button variant="secondary" onClick={handleNext}>
                Next
              </Button>
            </>
          )}
        </div>
      </motion.div>

      {/* Image Preview Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Image Preview</DialogTitle>
            <DialogDescription>
              Preview of the selected corridor or sheltered wall photo.
            </DialogDescription>
            <DialogClose />
          </DialogHeader>
          {selectedImage && (
            <div className="flex flex-col items-center">
              <img src={selectedImage} alt="Full Preview" className="max-w-full max-h-[70vh] object-contain" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}