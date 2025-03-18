import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/store/authStore";

export default function FormFifteen() {
  const navigate = useNavigate();
  const { processId } = useParams(); // e.g., /process/:processId/form-fifteen
  const { toast } = useToast();
  const { user } = useAuthStore();

  const [docId, setDocId] = useState(null);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [isUpdate, setIsUpdate] = useState(false);

  const [formData, setFormData] = useState({
    hasSolarWaterHeating: "",
    areDetailsKnown: "",
    collectorElevation: "",
    overshading: "",
    solarPump: "",
    solarCollectorDetailsKnown: "",
    userId: "",
    processId: processId || "",
  });

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

  // Fetch existing Form Fifteen data on mount
  useEffect(() => {
    if (user && user._id && processId) {
      fetch(`http://localhost:3000/api/assessments/form-fifteen?userId=${user._id}&processId=${processId}`)
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

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setUnsavedChanges(true);
  };

  // Save/Update Handler
  const handleSave = async () => {
    try {
      const formDataToSend = new FormData();

      // Append all form fields
      Object.keys(formData).forEach((key) => {
        formDataToSend.append(key, formData[key]);
      });

      let url = "http://localhost:3000/api/assessments/form-fifteen";
      let method = "POST";
      if (docId) {
        url = `http://localhost:3000/api/assessments/form-fifteen/${docId}`;
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
          description: `Form Fifteen ${docId ? "updated" : "saved"} successfully!`,
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
        description: "An error occurred while saving Form Fifteen",
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
    navigate(`/process/${processId}/form-sixteen`); // Assuming Form Sixteen follows
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
    navigate(`/process/${processId}/form-fourteen`);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center px-4 py-6">
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white w-full max-w-2xl p-8 rounded-lg shadow"
      >
        <h1 className="text-2xl font-bold mb-6 text-center">Form Fifteen: Solar Water Heating</h1>

        {/* Solar Water Heating */}
        <div className="mb-6">
          <Label>Solar Water Heating</Label>
          <div className="flex gap-4 mt-2">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="hasSolarWaterHeating"
                value="yes"
                checked={formData.hasSolarWaterHeating === "yes"}
                onChange={handleChange}
                className="form-radio"
              />
              <span>Yes</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="hasSolarWaterHeating"
                value="no"
                checked={formData.hasSolarWaterHeating === "no"}
                onChange={handleChange}
                className="form-radio"
              />
              <span>No</span>
            </label>
          </div>
        </div>

        {/* Are Details Known? */}
        <div className="mb-6">
          <Label>Are Details Known?</Label>
          <div className="flex gap-4 mt-2">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="areDetailsKnown"
                value="yes"
                checked={formData.areDetailsKnown === "yes"}
                onChange={handleChange}
                className="form-radio"
              />
              <span>Yes</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="areDetailsKnown"
                value="no"
                checked={formData.areDetailsKnown === "no"}
                onChange={handleChange}
                className="form-radio"
              />
              <span>No</span>
            </label>
          </div>
        </div>

        {/* Collector Elevation */}
        <div className="mb-6">
          <Label>Collector Elevation</Label>
          <select
            name="collectorElevation"
            value={formData.collectorElevation}
            onChange={handleChange}
            className="w-full mt-1 border rounded px-2 py-2"
          >
            <option value="">- Select -</option>
            <option value="Horizontal">Horizontal</option>
            <option value="30°">30°</option>
            <option value="45°">45°</option>
            <option value="60°">60°</option>
            <option value="Vertical">Vertical</option>
          </select>
        </div>

        {/* Overshading */}
        <div className="mb-6">
          <Label>Overshading</Label>
          <select
            name="overshading"
            value={formData.overshading}
            onChange={handleChange}
            className="w-full mt-1 border rounded px-2 py-2"
          >
            <option value="">- Select -</option>
            <option value="Heavy">Heavy</option>
            <option value="Significant">Significant</option>
            <option value="Modest">Modest</option>
            <option value="None or Little">None or Little</option>
          </select>
        </div>

        {/* Solar Pump */}
        <div className="mb-6">
          <Label>Solar Pump</Label>
          <select
            name="solarPump"
            value={formData.solarPump}
            onChange={handleChange}
            className="w-full mt-1 border rounded px-2 py-2"
          >
            <option value="">- Select -</option>
            <option value="Unknown">Unknown</option>
            <option value="Electrically powered">Electrically powered</option>
            <option value="PV powered">PV powered</option>
          </select>
        </div>

        {/* Solar Collector Details Known */}
        <div className="mb-6">
          <Label>Solar Collector Details Known</Label>
          <div className="flex items-center gap-2">
            <div className="flex gap-4 mt-2">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="solarCollectorDetailsKnown"
                  value="yes"
                  checked={formData.solarCollectorDetailsKnown === "yes"}
                  onChange={handleChange}
                  className="form-radio"
                />
                <span>Yes</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="solarCollectorDetailsKnown"
                  value="no"
                  checked={formData.solarCollectorDetailsKnown === "no"}
                  onChange={handleChange}
                  className="form-radio"
                />
                <span>No</span>
              </label>
            </div>
            <div className="relative group">
              <svg
                width="16"
                height="16"
                viewBox="0 0 25 25"
                className="text-gray-500 cursor-pointer"
              >
                <path
                  d="m329 393l0-46c0-2-1-4-2-6-2-2-4-3-7-3l-27 0 0-146c0-3-1-5-3-7-2-1-4-2-7-2l-91 0c-3 0-5 1-7 2-1 2-2 4-2 7l0 46c0 2 1 5 2 6 2 2 4 3 7 3l27 0 0 91-27 0c-3 0-5 1-7 3-1 2-2 4-2 6l0 46c0 3 1 5 2 7 2 1 4 2 7 2l128 0c3 0 5-1 7-2 1-2 2-4 2-7z m-36-256l0-46c0-2-1-4-3-6-2-2-4-3-7-3l-54 0c-3 0-5 1-7 3-2 2-3 4-3 6l0 46c0 3 1 5 3 7 2 1 4 2 7 2l54 0c3 0 5-1 7-2 2-2 3-4 3-7z m182 119c0 40-9 77-29 110-20 34-46 60-80 80-33 20-70 29-110 29-40 0-77-9-110-29-34-20-60-46-80-80-20-33-29-70-29-110 0-40 9-77 29-110 20-34 46-60 80-80 33-20 70-29 110-29 40 0 77 9 110 29 34 20 60 46 80 80 20 33 29 70 29 110z"
                  transform="scale(0.046875 0.046875)"
                />
              </svg>
              <div className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 -top-10 left-0">
                If known, please see page 7 for further details
              </div>
            </div>
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