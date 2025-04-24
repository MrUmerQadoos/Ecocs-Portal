import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/store/authStore";

export default function FormThree() {
  const navigate = useNavigate();
  const { processId: urlProcessId } = useParams();
  const location = useLocation();
  const { toast } = useToast();
  const { user } = useAuthStore();

  // State for form data and metadata
  const [formData, setFormData] = useState({
    mainPropertyDimensions: "", // "Internal" or "External"
    // Room/s in Roof
    roofFloorArea: "",
    roofRoomHeight: "",
    roofHeatLossPerimeter: "",
    roofPartyWallLength: "",
    // 5th Floor
    fifthFloorArea: "",
    fifthFloorHeight: "",
    fifthHeatLossPerimeter: "",
    fifthPartyWallLength: "",
    // 4th Floor
    fourthFloorArea: "",
    fourthFloorHeight: "",
    fourthHeatLossPerimeter: "",
    fourthPartyWallLength: "",
    // 3rd Floor
    thirdFloorArea: "",
    thirdFloorHeight: "",
    thirdHeatLossPerimeter: "",
    thirdPartyWallLength: "",
    // 2nd Floor
    secondFloorArea: "",
    secondFloorHeight: "",
    secondHeatLossPerimeter: "",
    secondPartyWallLength: "",
    // 1st Floor
    firstFloorArea: "",
    firstFloorHeight: "",
    firstHeatLossPerimeter: "",
    firstPartyWallLength: "",
    // Lowest Floor
    lowestFloorArea: "",
    lowestFloorHeight: "",
    lowestHeatLossPerimeter: "",
    lowestPartyWallLength: "",
    userId: user?._id || "",
    processId: urlProcessId || "",
  });

  const [formId, setFormId] = useState(null);
  const [taskId, setTaskId] = useState(null);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [isUpdate, setIsUpdate] = useState(false);
  const [isViewOnly, setIsViewOnly] = useState(false);
  const [savedProcessId, setSavedProcessId] = useState(null);

  // Determine mode (edit or view) and load existing data
  useEffect(() => {
    const isViewing = location.pathname.includes("/view-form");
    setIsViewOnly(isViewing || user.role !== "surveyor");
    const queryTaskId = new URLSearchParams(location.search).get("taskId");
    setTaskId(queryTaskId);

    if (urlProcessId && urlProcessId !== "new") {
      fetch(`http://localhost:3000/api/assessments/form-three?processId=${urlProcessId}`, {
        method: "GET",
        credentials: "include",
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data) {
            // Data exists, populate the form
            setFormData(data.data);
            setFormId(data.data._id);
            setIsUpdate(true);
            setSavedProcessId(data.data.processId);
          } else if (isViewing) {
            // In view mode, if no data exists, redirect to dashboard
            toast({
              variant: "destructive",
              title: "Error",
              description: "Form Three data not found.",
            });
            navigate("/dashboard");
          } else {
            // In edit mode, if no data exists, allow the surveyor to create a new form
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
            description: "Failed to load Form Three data.",
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

  // Save or update the form
  const saveForm = async () => {
    if (isViewOnly) return { success: false };

    try {
      const url = formId
        ? `http://localhost:3000/api/assessments/form-three/${formId}`
        : "http://localhost:3000/api/assessments/form-three";
      const method = formId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });
      const data = await response.json();

      if (data.success) {
        setFormId(data.data._id);
        setSavedProcessId(data.data.processId);
        setIsUpdate(true);
        setUnsavedChanges(false);
        toast({
          title: "Success",
          description: `Form Three ${formId ? "updated" : "saved"} successfully!`,
        });
        return { success: true, processId: data.data.processId };
      } else {
        throw new Error(data.error || "Failed to save Form Three");
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
        navigate(`/view-form/${result.processId}/form-three?taskId=${taskId}`);
      } else {
        navigate(`/process/${result.processId}/form-three?taskId=${taskId}`, { replace: true });
      }
    }
  };

  // Handle navigation to the next form
  const handleNext = async () => {
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

  // Handle navigation to the previous form
  const handlePrevious = async () => {
    if (!isViewOnly) {
      const result = await saveForm();
      if (result.success) {
        if (user.role === "surveyor") {
          navigate(`/process/${result.processId}/form-two?taskId=${taskId}`);
        } else {
          navigate(`/view-form/${result.processId}/form-two?taskId=${taskId}`);
        }
      }
    } else {
      navigate(`/view-form/${savedProcessId || urlProcessId}/form-two?taskId=${taskId}`);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gray-100 flex flex-col items-center justify-center px-4 py-6">
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white w-full max-w-5xl p-8 rounded-lg shadow"
      >
        <h1 className="text-2xl font-bold mb-6 text-center">
          {isViewOnly ? "View Form Three" : "2. Main Property Dimensions"}
        </h1>

        {/* Dropdown: Main Property Dimensions (Internal/External) */}
        <div className="mb-6">
          <Label htmlFor="mainPropertyDimensions">Main Property Dimensions</Label>
          <select
            id="mainPropertyDimensions"
            name="mainPropertyDimensions"
            value={formData.mainPropertyDimensions}
            onChange={handleChange}
            className="w-full mt-1 border rounded px-2 py-2"
            disabled={isViewOnly}
          >
            <option value="">- Select -</option>
            <option value="Internal">Internal</option>
            <option value="External">External</option>
          </select>
        </div>

        {/* Room/s in Roof */}
        <FloorRow
          title="Room/s in Roof"
          floorAreaName="roofFloorArea"
          floorAreaValue={formData.roofFloorArea}
          roomHeightName="roofRoomHeight"
          roomHeightValue={formData.roofRoomHeight}
          heatLossName="roofHeatLossPerimeter"
          heatLossValue={formData.roofHeatLossPerimeter}
          partyWallName="roofPartyWallLength"
          partyWallValue={formData.roofPartyWallLength}
          onChange={handleChange}
          disabled={isViewOnly}
        />

        {/* 5th Floor */}
        <FloorRow
          title="5th Floor"
          floorAreaName="fifthFloorArea"
          floorAreaValue={formData.fifthFloorArea}
          roomHeightName="fifthFloorHeight"
          roomHeightValue={formData.fifthFloorHeight}
          heatLossName="fifthHeatLossPerimeter"
          heatLossValue={formData.fifthHeatLossPerimeter}
          partyWallName="fifthPartyWallLength"
          partyWallValue={formData.fifthPartyWallLength}
          onChange={handleChange}
          disabled={isViewOnly}
        />

        {/* 4th Floor */}
        <FloorRow
          title="4th Floor"
          floorAreaName="fourthFloorArea"
          floorAreaValue={formData.fourthFloorArea}
          roomHeightName="fourthFloorHeight"
          roomHeightValue={formData.fourthFloorHeight}
          heatLossName="fourthHeatLossPerimeter"
          heatLossValue={formData.fourthHeatLossPerimeter}
          partyWallName="fourthPartyWallLength"
          partyWallValue={formData.fourthPartyWallLength}
          onChange={handleChange}
          disabled={isViewOnly}
        />

        {/* 3rd Floor */}
        <FloorRow
          title="3rd Floor"
          floorAreaName="thirdFloorArea"
          floorAreaValue={formData.thirdFloorArea}
          roomHeightName="thirdFloorHeight"
          roomHeightValue={formData.thirdFloorHeight}
          heatLossName="thirdHeatLossPerimeter"
          heatLossValue={formData.thirdHeatLossPerimeter}
          partyWallName="thirdPartyWallLength"
          partyWallValue={formData.thirdPartyWallLength}
          onChange={handleChange}
          disabled={isViewOnly}
        />

        {/* 2nd Floor */}
        <FloorRow
          title="2nd Floor"
          floorAreaName="secondFloorArea"
          floorAreaValue={formData.secondFloorArea}
          roomHeightName="secondFloorHeight"
          roomHeightValue={formData.secondFloorHeight}
          heatLossName="secondHeatLossPerimeter"
          heatLossValue={formData.secondHeatLossPerimeter}
          partyWallName="secondPartyWallLength"
          partyWallValue={formData.secondPartyWallLength}
          onChange={handleChange}
          disabled={isViewOnly}
        />

        {/* 1st Floor */}
        <FloorRow
          title="1st Floor"
          floorAreaName="firstFloorArea"
          floorAreaValue={formData.firstFloorArea}
          roomHeightName="firstFloorHeight"
          roomHeightValue={formData.firstFloorHeight}
          heatLossName="firstHeatLossPerimeter"
          heatLossValue={formData.firstHeatLossPerimeter}
          partyWallName="firstPartyWallLength"
          partyWallValue={formData.firstPartyWallLength}
          onChange={handleChange}
          disabled={isViewOnly}
        />

        {/* Lowest Floor */}
        <FloorRow
          title="Lowest Floor"
          floorAreaName="lowestFloorArea"
          floorAreaValue={formData.lowestFloorArea}
          roomHeightName="lowestFloorHeight"
          roomHeightValue={formData.lowestFloorHeight}
          heatLossName="lowestHeatLossPerimeter"
          heatLossValue={formData.lowestHeatLossPerimeter}
          partyWallName="lowestPartyWallLength"
          partyWallValue={formData.lowestPartyWallLength}
          onChange={handleChange}
          disabled={isViewOnly}
        />

        <p className="text-sm text-gray-600 mt-4">
          Note: If property has more than 5 floors, please detail the sum of these in the site
          inspection notes section.
        </p>

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
    </div>
  );
}

function FloorRow({
  title,
  floorAreaName,
  floorAreaValue,
  roomHeightName,
  roomHeightValue,
  heatLossName,
  heatLossValue,
  partyWallName,
  partyWallValue,
  onChange,
  disabled,
}) {
  return (
    <div className="grid grid-cols-5 gap-4 mb-4">
      <div className="col-span-1 flex items-center">
        <h2 className="font-semibold">{title}</h2>
      </div>
      <div className="col-span-1">
        <Label htmlFor={floorAreaName}>Floor Area(m²)</Label>
        <Input
          id={floorAreaName}
          name={floorAreaName}
          value={floorAreaValue}
          onChange={onChange}
          placeholder="e.g. 50"
          disabled={disabled}
        />
      </div>
      <div className="col-span-1">
        <Label htmlFor={roomHeightName}>Room Height (m)</Label>
        <Input
          id={roomHeightName}
          name={roomHeightName}
          value={roomHeightValue}
          onChange={onChange}
          placeholder="e.g. 2.4"
          disabled={disabled}
        />
      </div>
      <div className="col-span-1">
        <Label htmlFor={heatLossName}>Heat Loss Perimeter (m)</Label>
        <Input
          id={heatLossName}
          name={heatLossName}
          value={heatLossValue}
          onChange={onChange}
          placeholder="e.g. 30"
          disabled={disabled}
        />
      </div>
      <div className="col-span-1">
        <Label htmlFor={partyWallName}>Party Wall Length (m)</Label>
        <Input
          id={partyWallName}
          name={partyWallName}
          value={partyWallValue}
          onChange={onChange}
          placeholder="e.g. 10"
          disabled={disabled}
        />
      </div>
    </div>
  );
}