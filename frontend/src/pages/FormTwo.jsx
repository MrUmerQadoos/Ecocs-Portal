import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/store/authStore";

export default function FormTwo() {
  const navigate = useNavigate();
  const { processId } = useParams(); // e.g. /process/:processId/form-two
  const { toast } = useToast();
  const { user } = useAuthStore();

  // Document ID and unsaved-changes tracking
  const [docId, setDocId] = useState(null);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [isUpdate, setIsUpdate] = useState(false);

  // File upload state for multiple images (elevation photos)
  const [files, setFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [deletedImages, setDeletedImages] = useState([]); // track images that are deleted

  // Form fields – note: imageUrl will store an array of file paths from backend.
  const [formData, setFormData] = useState({
    propertyTenure: "",
    transactionType: "",
    propertyType: "",
    numberOfStoreys: "",
    numberOfHabitableRooms: "",
    numberOfHeatedHabitableRooms: "",
    mainPropertyDateBand: "",
    mainPropertyRoomInRoofDateBand: "",
    elevationPhotos: "", // dropdown selection (e.g., "Front", "Rear", etc.)
    imageUrl: [],      // multiple uploaded image URLs will be stored here
    userId: "",
    processId: processId || "",
  });

  // 1) Set userId and processId when available
  useEffect(() => {
    if (user && user._id) {
      setFormData((prev) => ({
        ...prev,
        userId: user._id,
        processId,
      }));
    }
  }, [user, processId]);

  // 2) Fetch existing Form Two data on mount
  useEffect(() => {
    if (user && user._id && processId) {
      fetch(`http://localhost:3000/api/assessments/form-two?userId=${user._id}&processId=${processId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data && data.data.length > 0) {
            const existingForm = data.data[0];
            setFormData(existingForm);
            setDocId(existingForm._id);
            setIsUpdate(true);

            // If imageUrl is available, set the previews (convert relative paths to full URL)
            if (existingForm.imageUrl && existingForm.imageUrl.length > 0) {
              const previews = existingForm.imageUrl.map(
                (imgPath) => `http://localhost:3000/${imgPath}`
              );
              setImagePreviews(previews);
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

  // 3) Warn user about unsaved changes on page unload
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

  // 4) Handle input changes for text and select fields
  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
      userId: user ? user._id : "",
      processId,
    }));
    setUnsavedChanges(true);
  };

  // 5) Handle file upload for multiple images
  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles((prevFiles) => [...prevFiles, ...selectedFiles]);

    // Create preview URLs for each selected file
    const previewUrls = selectedFiles.map((file) => URL.createObjectURL(file));
    setImagePreviews((prevPreviews) => [...prevPreviews, ...previewUrls]);

    setUnsavedChanges(true);
  };

  // 6) Handle deletion of a specific image from previews and files
  const handleDeleteImage = (index, previewUrl) => {
    const updatedFiles = files.filter((_, idx) => idx !== index);
    const updatedPreviews = imagePreviews.filter((_, idx) => idx !== index);

    // Also, if this preview URL corresponds to an already saved image (i.e. exists in formData.imageUrl),
    // add its full URL to deletedImages array.
    if (formData.imageUrl && formData.imageUrl.length > 0) {
      // Convert each saved image URL to full URL for comparison
      const fullUrls = formData.imageUrl.map(img => `http://localhost:3000/${img}`);
      if (fullUrls.includes(previewUrl)) {
        setDeletedImages((prev) => {
          if (!prev.includes(previewUrl)) {
            return [...prev, previewUrl];
          }
          return prev;
        });
      }
    }

    setFiles(updatedFiles);
    setImagePreviews(updatedPreviews);
    setUnsavedChanges(true);
  };

  // 7) Save or Update Form Two
  const handleSave = async () => {
    try {
      const formDataToSend = new FormData();
      // Append all form fields except the imageUrl field if no new files are added
      for (const key in formData) {
        if (key === "imageUrl" && files.length === 0) continue;
        formDataToSend.append(key, formData[key]);
      }
      // Append new files under "imageUrl"
      if (files.length > 0) {
        files.forEach((file) => {
          formDataToSend.append("imageUrl", file);
        });
      }
      // Include deleted images in the request (as JSON)
      if (deletedImages.length > 0) {
        formDataToSend.append("deletedImages", JSON.stringify(deletedImages));
      }

      let url = "http://localhost:3000/api/assessments/form-two";
      let method = "POST";
      if (docId) {
        url = `http://localhost:3000/api/assessments/form-two/${docId}`;
        method = "PUT";
      }

      const response = await fetch(url, { method, body: formDataToSend });
      const data = await response.json();
      if (data.success) {
        if (!docId && data.data && data.data._id) {
          setDocId(data.data._id);
        }
        setIsUpdate(true);
        setUnsavedChanges(false);
        toast({
          title: "Success",
          description: `Form Two ${docId ? "updated" : "saved"} successfully!`,
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
        description: "An error occurred while saving Form Two",
      });
      console.error("Save error:", error);
    }
  };

  // 8) Navigation: Next and Previous
  const handleNext = () => {
    if (unsavedChanges) {
      toast({
        variant: "warning",
        title: "Unsaved changes",
        description: "Please save before proceeding.",
      });
      return;
    }
    // Navigate to Form Three (adjust the route as needed)
    navigate(`/process/${processId}/form-three`);
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
    // Navigate to Form One (adjust the route as needed)
    navigate(`/process/${processId}/form-one`);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center px-4 py-6">
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white w-full max-w-4xl p-8 rounded-lg shadow"
      >
        <h1 className="text-2xl font-bold mb-6 text-center">Form Two: Property Details</h1>
        
        {/* Form Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {/* Property Tenure */}
          <div>
            <Label htmlFor="propertyTenure">Property Tenure</Label>
            <select
              id="propertyTenure"
              name="propertyTenure"
              value={formData.propertyTenure}
              onChange={handleChange}
              className="w-full mt-1 border rounded px-2 py-2"
            >
              <option value="">- Select -</option>
              <option value="Owner-occupied">Owner-occupied</option>
              <option value="Rented(social)">Rented(social)</option>
              <option value="Rented(private)">Rented(private)</option>
            </select>
          </div>
          {/* Transaction Type */}
          <div>
            <Label htmlFor="transactionType">Transaction Type</Label>
            <select
              id="transactionType"
              name="transactionType"
              value={formData.transactionType}
              onChange={handleChange}
              className="w-full mt-1 border rounded px-2 py-2"
            >
              <option value="">- Select -</option>
              <option value="Marketed Sale">Marketed Sale</option>
              <option value="Non-Marketed Sale">Non-Marketed Sale</option>
              <option value="Rental">Rental</option>
              <option value="Assessment for Green Deal">Assessment for Green Deal</option>
              <option value="Following Green Deal">Following Green Deal</option>
              <option value="FiT application">FiT application</option>
              <option value="RHI application">RHI application</option>
              <option value="ECO assessment">ECO assessment</option>
              <option value="None of the above">None of the above</option>
            </select>
          </div>
          {/* Property Type */}
          <div>
            <Label htmlFor="propertyType">Property Type</Label>
            <select
              id="propertyType"
              name="propertyType"
              value={formData.propertyType}
              onChange={handleChange}
              className="w-full mt-1 border rounded px-2 py-2"
            >
              <option value="">- Select -</option>
              <option value="House">House</option>
              <option value="Flat">Flat</option>
              <option value="Maisonette">Maisonette</option>
              <option value="Bungalow">Bungalow</option>
              <option value="Park Home">Park Home</option>
              <option value="Detached">Detached</option>
              <option value="Semi-Detached">Semi-Detached</option>
              <option value="Mid-Terrace">Mid-Terrace</option>
              <option value="End-Terrace">End-Terrace</option>
              <option value="Enclosed Mid-Terrace">Enclosed Mid-Terrace</option>
              <option value="Enclosed End-Terrace">Enclosed End-Terrace</option>
            </select>
          </div>
          {/* Number of Storeys */}
          <div>
            <Label htmlFor="numberOfStoreys">Number of Storeys</Label>
            <Input
              id="numberOfStoreys"
              name="numberOfStoreys"
              type="number"
              value={formData.numberOfStoreys}
              onChange={handleChange}
            />
          </div>
          {/* Number of Habitable Rooms */}
          <div>
            <Label htmlFor="numberOfHabitableRooms">Number of Habitable Rooms</Label>
            <Input
              id="numberOfHabitableRooms"
              name="numberOfHabitableRooms"
              type="number"
              value={formData.numberOfHabitableRooms}
              onChange={handleChange}
            />
          </div>
          {/* Number of Heated Habitable Rooms */}
          <div>
            <Label htmlFor="numberOfHeatedHabitableRooms">Number of Heated Habitable Rooms</Label>
            <Input
              id="numberOfHeatedHabitableRooms"
              name="numberOfHeatedHabitableRooms"
              type="number"
              value={formData.numberOfHeatedHabitableRooms}
              onChange={handleChange}
            />
          </div>
          {/* Main Property Date Band */}
          <div>
            <Label htmlFor="mainPropertyDateBand">Main Property Date Band</Label>
            <select
              id="mainPropertyDateBand"
              name="mainPropertyDateBand"
              value={formData.mainPropertyDateBand}
              onChange={handleChange}
              className="w-full mt-1 border rounded px-2 py-2"
            >
              <option value="">- Select -</option>
              <option value="(A) before 1900">(A) before 1900</option>
              <option value="(B) 1900-1929">(B) 1900-1929</option>
              <option value="(C) 1930-1949">(C) 1930-1949</option>
              <option value="(D) 1950-1966">(D) 1950-1966</option>
              <option value="(E) 1967-1975">(E) 1967-1975</option>
              <option value="(F) 1976-1982">(F) 1976-1982</option>
              <option value="(G) 1983-1990">(G) 1983-1990</option>
              <option value="(H) 1991-1995">(H) 1991-1995</option>
              <option value="(I) 1996-2002">(I) 1996-2002</option>
              <option value="(J) 2003-2006">(J) 2003-2006</option>
              <option value="(K) 2007-2011">(K) 2007-2011</option>
              <option value="(L) 2012 onwards">(L) 2012 onwards</option>
            </select>
          </div>
          {/* Main Property Room/s in Roof Date Band */}
          <div>
            <Label htmlFor="mainPropertyRoomInRoofDateBand">
              Main Property Room/s in Roof Date Band
            </Label>
            <Input
              id="mainPropertyRoomInRoofDateBand"
              name="mainPropertyRoomInRoofDateBand"
              placeholder="e.g. 1900-1929"
              value={formData.mainPropertyRoomInRoofDateBand}
              onChange={handleChange}
            />
          </div>
          {/* Elevation Photos Dropdown */}
          <div>
            <Label htmlFor="elevationPhotos">Select Elevation Photos (recommended)</Label>
            <select
              id="elevationPhotos"
              name="elevationPhotos"
              value={formData.elevationPhotos}
              onChange={handleChange}
              className="w-full mt-1 border rounded px-2 py-2"
            >
              <option value="">- Select -</option>
              <option value="Front">Front</option>
              <option value="Rear">Rear</option>
              <option value="Side (if applicable)">Side (if applicable)</option>
            </select>
          </div>
          {/* Upload Elevation Photos */}
          <div>
            <Label>Upload Elevation Photos</Label>
            <div className="flex flex-col gap-2">
              <Button onClick={() => document.getElementById("fileInput").click()}>
                Upload Photo(s)
              </Button>
              <input
                id="fileInput"
                type="file"
                accept="image/*, application/pdf"
                multiple
                name="imageUrl" // This field will hold multiple images
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
            {/* Render multiple image previews */}
            {imagePreviews.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative">
                    <img src={preview} alt="Preview" className="w-32 h-32 object-cover rounded" />
                    <button
                      onClick={() => handleDeleteImage(index, preview)}
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
