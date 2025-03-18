import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/store/authStore";

export default function FormThree() {
  const navigate = useNavigate();
  const { processId } = useParams(); // read processId from the URL
  const { toast } = useToast();
  const { user } = useAuthStore();

  // Document ID and unsaved-changes tracking
  const [docId, setDocId] = useState(null);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [isUpdate, setIsUpdate] = useState(false);

  // All fields for Main Property Dimensions
  const [formData, setFormData] = useState({
    // Dropdown
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

    userId: "",
    processId: processId || "",
  });

  // 1) Assign userId/processId when user or processId changes
  useEffect(() => {
    if (user && user._id) {
      setFormData((prev) => ({
        ...prev,
        userId: user._id,
        processId,
      }));
    }
  }, [user, processId]);

  // 2) Fetch existing Form Three data for this user + process
  useEffect(() => {
    if (user && user._id && processId) {
      fetch(`http://localhost:3000/api/assessments/form-three?userId=${user._id}&processId=${processId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data && data.data.length > 0) {
            const existingForm = data.data[0];
            setFormData(existingForm);
            setDocId(existingForm._id);
            setIsUpdate(true);
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

  // 3) Warn user about unsaved changes when leaving the page
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

  // 4) Handle input changes
  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
      userId: user ? user._id : "",
      processId,
    }));
    setUnsavedChanges(true);
  };

  // 5) Save or Update the form
  const handleSave = async () => {
    try {
      let url = "http://localhost:3000/api/assessments/form-three";
      let method = "POST";
      if (docId) {
        url = `http://localhost:3000/api/assessments/form-three/${docId}`;
        method = "PUT";
      }
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
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
          description: `Form Three ${docId ? "updated" : "saved"} successfully!`,
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
        description: "An error occurred while saving Form Three",
      });
      console.error("Save error:", error);
    }
  };

  // 6) Navigation
  const handleNext = () => {
    if (unsavedChanges) {
      toast({
        variant: "warning",
        title: "Unsaved changes",
        description: "Please save before proceeding.",
      });
      return;
    }
    // Go to Form Four for the same process
    navigate(`/process/${processId}/form-four`);
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
    // Go back to Form Two
    navigate(`/process/${processId}/form-two`);
  };

  return (
    <div className="min-h-screen w-full bg-gray-100 flex flex-col items-center justify-center px-4 py-6">
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white w-full max-w-5xl p-8 rounded-lg shadow"
      >
        <h1 className="text-2xl font-bold mb-6 text-center">2. Main Property Dimensions</h1>

        {/* Dropdown: Main Property Dimensions (Internal/External) */}
        <div className="mb-6">
          <Label htmlFor="mainPropertyDimensions">Main Property Dimensions</Label>
          <select
            id="mainPropertyDimensions"
            name="mainPropertyDimensions"
            value={formData.mainPropertyDimensions}
            onChange={handleChange}
            className="w-full mt-1 border rounded px-2 py-2"
          >
            <option value="">- Select -</option>
            <option value="Internal">Internal</option>
            <option value="External">External</option>
          </select>
        </div>

        {/* We'll create a re-usable row layout for each "floor" */}
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
        />

        <p className="text-sm text-gray-600 mt-4">
          Note: If property has more than 5 floors, please detail the sum of these in the site
          inspection notes section.
        </p>

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

/**
 * A small helper component to render a row of floor fields.
 * title: string (e.g., "Room/s in Roof")
 * floorAreaName: string (state key)
 * floorAreaValue: string (state value)
 * ... etc.
 * onChange: function
 */
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
        />
      </div>
    </div>
  );
}
