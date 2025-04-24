import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/store/authStore";

export default function FormTwo() {
  const navigate = useNavigate();
  const { processId: urlProcessId } = useParams();
  const location = useLocation();
  const { toast } = useToast();
  const { user } = useAuthStore();

  const [docId, setDocId] = useState(null);
  const [taskId, setTaskId] = useState(null);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [isUpdate, setIsUpdate] = useState(false);
  const [isViewOnly, setIsViewOnly] = useState(false);
  const [savedProcessId, setSavedProcessId] = useState(null);

  const [formData, setFormData] = useState({
    propertyTenure: "",
    transactionType: "",
    propertyType: "",
    numberOfStoreys: "",
    numberOfHabitableRooms: "",
    numberOfHeatedHabitableRooms: "",
    mainPropertyDateBand: "",
    mainPropertyRoomInRoofDateBand: "",
    elevationPhotoSelection: "", // Updated from elevationPhotos
    userId: user?._id || "",
    processId: urlProcessId || "",
  });

  const [elevationFiles, setElevationFiles] = useState([]);
  const [elevationPreviews, setElevationPreviews] = useState([]);
  const [elevationDeleted, setElevationDeleted] = useState([]);

  const [additionalFiles, setAdditionalFiles] = useState([]);
  const [additionalPreviews, setAdditionalPreviews] = useState([]);
  const [additionalDeleted, setAdditionalDeleted] = useState([]);

  useEffect(() => {
    const isViewing = location.pathname.includes("/view-form");
    setIsViewOnly(isViewing || user.role !== "surveyor");
    const queryTaskId = new URLSearchParams(location.search).get("taskId");
    setTaskId(queryTaskId);

    if (urlProcessId && urlProcessId !== "new") {
      fetch(`http://localhost:3000/api/assessments/form-two?processId=${urlProcessId}`, {
        method: "GET",
        credentials: "include",
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data) {
            setFormData({
              ...data.data,
              elevationPhotoSelection: data.data.elevationPhotoSelection, // Updated from elevationPhotos
            });
            setDocId(data.data._id);
            setIsUpdate(true);
            setSavedProcessId(data.data.processId);

            if (data.data.elevationPhotos && data.data.elevationPhotos.length > 0) {
              const previews = data.data.elevationPhotos.map(
                (img) => `http://localhost:3000/${img}`
              );
              setElevationPreviews(previews);
            }

            if (data.data.additionalPhotos && data.data.additionalPhotos.length > 0) {
              const previews = data.data.additionalPhotos.map(
                (img) => `http://localhost:3000/${img}`
              );
              setAdditionalPreviews(previews);
            }
          }
        })
        .catch((error) => {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to load Form Two data.",
          });
          console.error("Fetch error:", error);
        });
    }
  }, [urlProcessId, user, location, toast]);

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

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
      userId: user ? user._id : "",
      processId: urlProcessId,
    }));
    setUnsavedChanges(true);
  };

  const handleElevationFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setElevationFiles((prev) => [...prev, ...selectedFiles]);
    const previewUrls = selectedFiles.map((file) => URL.createObjectURL(file));
    setElevationPreviews((prev) => [...prev, ...previewUrls]);
    setUnsavedChanges(true);
  };

  const handleDeleteElevationImage = (index, previewUrl) => {
    const updatedFiles = elevationFiles.filter((_, idx) => idx !== index);
    const updatedPreviews = elevationPreviews.filter((_, idx) => idx !== index);
    setElevationDeleted((prev) => {
      if (!prev.includes(previewUrl)) {
        return [...prev, previewUrl];
      }
      return prev;
    });
    setElevationFiles(updatedFiles);
    setElevationPreviews(updatedPreviews);
    setUnsavedChanges(true);
  };

  const handleAdditionalFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setAdditionalFiles((prev) => [...prev, ...selectedFiles]);
    const previewUrls = selectedFiles.map((file) => URL.createObjectURL(file));
    setAdditionalPreviews((prev) => [...prev, ...previewUrls]);
    setUnsavedChanges(true);
  };

  const handleDeleteAdditionalImage = (index, previewUrl) => {
    const updatedFiles = additionalFiles.filter((_, idx) => idx !== index);
    const updatedPreviews = additionalPreviews.filter((_, idx) => idx !== index);
    setAdditionalDeleted((prev) => {
      if (!prev.includes(previewUrl)) {
        return [...prev, previewUrl];
      }
      return prev;
    });
    setAdditionalFiles(updatedFiles);
    setAdditionalPreviews(updatedPreviews);
    setUnsavedChanges(true);
  };

  const saveForm = async () => {
    if (isViewOnly) return { success: false };

    try {
      if (!taskId) {
        throw new Error("Task ID is required");
      }

      const formDataToSend = new FormData();
      for (const key in formData) {
        formDataToSend.append(key, formData[key]);
      }

      formDataToSend.append("taskId", taskId);
      formDataToSend.append("userId", user._id);

      if (elevationFiles.length > 0) {
        elevationFiles.forEach((file) => {
          formDataToSend.append("elevationPhotos", file);
        });
      }
      if (additionalFiles.length > 0) {
        additionalFiles.forEach((file) => {
          formDataToSend.append("additionalPhotos", file);
        });
      }

      if (elevationDeleted.length > 0) {
        formDataToSend.append("deletedElevation", JSON.stringify(elevationDeleted));
      }
      if (additionalDeleted.length > 0) {
        formDataToSend.append("deletedAdditional", JSON.stringify(additionalDeleted));
      }

      const url = docId
        ? `http://localhost:3000/api/assessments/form-two/${docId}`
        : "http://localhost:3000/api/assessments/form-two";
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
        toast({
          title: "Success",
          description: `Form Two ${docId ? "updated" : "saved"} successfully!`,
        });
        return { success: true, processId: data.data.processId };
      } else {
        throw new Error(data.error || "Failed to save Form Two");
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

  const handleSave = async () => {
    const result = await saveForm();
    if (result.success) {
      if (user.role !== "surveyor") {
        navigate(`/view-form/${result.processId}`);
      } else {
        navigate(`/process/${result.processId}/form-two?taskId=${taskId}`, { replace: true });
      }
    }
  };

  const handleNext = async () => {
    if (!isViewOnly) {
      const result = await saveForm();
      if (result.success) {
        if (user.role === "surveyor") {
          navigate(`/process/${result.processId}/form-three?taskId=${taskId}`);
        } else {
          navigate(`/view-form/${result.processId}/form-three?taskId=${taskId}`);
        }
      }
    } else {
      // In view mode, navigate to FormThree
      navigate(`/view-form/${savedProcessId || urlProcessId}/form-three?taskId=${taskId}`);
    }
  };

  const handlePrevious = async () => {
    if (!isViewOnly) {
      const result = await saveForm();
      if (result.success) {
        if (user.role === "surveyor") {
          navigate(`/process/${result.processId}/form-one?taskId=${taskId}`);
        } else {
          navigate(`/view-form/${result.processId}/form-one?taskId=${taskId}`);
        }
      }
    } else {
      // In view mode, navigate to FormOne
      navigate(`/view-form/${savedProcessId || urlProcessId}/form-one?taskId=${taskId}`);
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
          {isViewOnly ? "View Form Two" : "Form Two: Property Details"}
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="propertyTenure">Property Tenure</Label>
            <select
              id="propertyTenure"
              name="propertyTenure"
              value={formData.propertyTenure}
              onChange={handleChange}
              className="w-full mt-1 border rounded px-2 py-2"
              disabled={isViewOnly}
            >
              <option value="">- Select -</option>
              <option value="Owner-occupied">Owner-occupied</option>
              <option value="Rented(social)">Rented(social)</option>
              <option value="Rented(private)">Rented(private)</option>
            </select>
          </div>
          <div>
            <Label htmlFor="transactionType">Transaction Type</Label>
            <select
              id="transactionType"
              name="transactionType"
              value={formData.transactionType}
              onChange={handleChange}
              className="w-full mt-1 border rounded px-2 py-2"
              disabled={isViewOnly}
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
          <div>
            <Label htmlFor="propertyType">Property Type</Label>
            <select
              id="propertyType"
              name="propertyType"
              value={formData.propertyType}
              onChange={handleChange}
              className="w-full mt-1 border rounded px-2 py-2"
              disabled={isViewOnly}
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
          <div>
            <Label htmlFor="numberOfStoreys">Number of Storeys</Label>
            <Input
              id="numberOfStoreys"
              name="numberOfStoreys"
              type="number"
              value={formData.numberOfStoreys}
              onChange={handleChange}
              disabled={isViewOnly}
            />
          </div>
          <div>
            <Label htmlFor="numberOfHabitableRooms">Number of Habitable Rooms</Label>
            <Input
              id="numberOfHabitableRooms"
              name="numberOfHabitableRooms"
              type="number"
              value={formData.numberOfHabitableRooms}
              onChange={handleChange}
              disabled={isViewOnly}
            />
          </div>
          <div>
            <Label htmlFor="numberOfHeatedHabitableRooms">Number of Heated Habitable Rooms</Label>
            <Input
              id="numberOfHeatedHabitableRooms"
              name="numberOfHeatedHabitableRooms"
              type="number"
              value={formData.numberOfHeatedHabitableRooms}
              onChange={handleChange}
              disabled={isViewOnly}
            />
          </div>
          <div>
            <Label htmlFor="mainPropertyDateBand">Main Property Date Band</Label>
            <select
              id="mainPropertyDateBand"
              name="mainPropertyDateBand"
              value={formData.mainPropertyDateBand}
              onChange={handleChange}
              className="w-full mt-1 border rounded px-2 py-2"
              disabled={isViewOnly}
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
              disabled={isViewOnly}
            />
          </div>
          <div>
            <Label htmlFor="elevationPhotoSelection">Select Elevation Photos (recommended)</Label>
            <select
              id="elevationPhotoSelection"
              name="elevationPhotoSelection"
              value={formData.elevationPhotoSelection}
              onChange={handleChange}
              className="w-full mt-1 border rounded px-2 py-2"
              disabled={isViewOnly}
            >
              <option value="">- Select -</option>
              <option value="Front">Front</option>
              <option value="Rear">Rear</option>
              <option value="Side (if applicable)">Side (if applicable)</option>
            </select>
          </div>
          <div className="mb-6">
            <Label>Upload Elevation Photos</Label>
            <div className="flex flex-col gap-2 mt-2">
              <Button
                onClick={() => document.getElementById("elevationInput").click()}
                disabled={isViewOnly}
              >
                Choose Photos
              </Button>
              <input
                id="elevationInput"
                type="file"
                accept="image/*, application/pdf"
                multiple
                name="elevationPhotos"
                onChange={handleElevationFileChange}
                className="hidden"
              />
            </div>
            {elevationPreviews.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {elevationPreviews.map((preview, index) => (
                  <div key={index} className="relative">
                    <img src={preview} alt="Elevation Preview" className="w-32 h-32 object-cover rounded" />
                    {!isViewOnly && (
                      <button
                        onClick={() => handleDeleteElevationImage(index, preview)}
                        className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="mb-6">
            <Label>Additional Photos (optional)</Label>
            <div className="flex flex-col gap-2 mt-2">
              <Button
                onClick={() => document.getElementById("additionalInput").click()}
                disabled={isViewOnly}
              >
                Choose Photos
              </Button>
              <input
                id="additionalInput"
                type="file"
                accept="image/*, application/pdf"
                multiple
                name="additionalPhotos"
                onChange={handleAdditionalFileChange}
                className="hidden"
              />
            </div>
            {additionalPreviews.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {additionalPreviews.map((preview, index) => (
                  <div key={index} className="relative">
                    <img src={preview} alt="Additional Preview" className="w-32 h-32 object-cover rounded" />
                    {!isViewOnly && (
                      <button
                        onClick={() => handleDeleteAdditionalImage(index, preview)}
                        className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

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
    </div>
  );
}