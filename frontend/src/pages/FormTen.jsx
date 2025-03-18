import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/store/authStore";

export default function FormTen() {
  const navigate = useNavigate();
  const { processId } = useParams(); // e.g., /process/:processId/form-ten
  const { toast } = useToast();
  const { user } = useAuthStore();

  const [docId, setDocId] = useState(null);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [isUpdate, setIsUpdate] = useState(false);

  const [formData, setFormData] = useState({
    location: "",
    type: "",
    insulation: "",
    insulationThickness: "",
    additionalNotes: "",
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

  // Fetch existing Form Ten data on mount
  useEffect(() => {
    if (user && user._id && processId) {
      fetch(`http://localhost:3000/api/assessments/form-ten?userId=${user._id}&processId=${processId}`)
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

      // Append non-file fields
      for (const key in formData) {
        formDataToSend.append(key, formData[key]);
      }

      let url = "http://localhost:3000/api/assessments/form-ten";
      let method = "POST";
      if (docId) {
        url = `http://localhost:3000/api/assessments/form-ten/${docId}`;
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
          description: `Form Ten ${docId ? "updated" : "saved"} successfully!`,
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
        description: "An error occurred while saving Form Ten",
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
    navigate(`/process/${processId}/form-eleven`); // Assuming Form Eleven follows
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
    navigate(`/process/${processId}/form-nine`); // Assuming Form Nine precedes
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center px-4 py-6">
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white w-full max-w-4xl p-8 rounded-lg shadow"
      >
        <h1 className="text-2xl font-bold mb-6 text-center">Form Ten: Floor Details</h1>

        {/* Section: Location */}
        <div className="mb-6">
          <Label>Location:</Label>
          <select
            name="location"
            value={formData.location}
            onChange={handleChange}
            className="w-full mt-1 border rounded px-2 py-2"
          >
            <option value="">- Select -</option>
            <option value="Ground floor">Ground floor</option>
            <option value="Above partially heated space">Above partially heated space</option>
            <option value="Above unheated space">Above unheated space</option>
            <option value="To external air">To external air</option>
            <option value="Same dwelling below">Same dwelling below</option>
            <option value="Another dwelling below">Another dwelling below</option>
          </select>
        </div>

        {/* Section: Type */}
        <div className="mb-6">
          <Label>Type:</Label>
          <select
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="w-full mt-1 border rounded px-2 py-2"
          >
            <option value="">- Select -</option>
            <option value="Solid">Solid</option>
            <option value="Suspended timber">Suspended timber</option>
            <option value="Suspended, not timber">Suspended, not timber</option>
            <option value="Unknown">Unknown</option>
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
            <option value="As Built">As Built</option>
            <option value="Retro-fitted">Retro-fitted</option>
            <option value="Unknown">Unknown</option>
          </select>
        </div>

        {/* Section: Insulation Thickness (if retro-fitted) */}
        <div className="mb-6">
          <Label>Insulation Thickness (if retro-fitted):</Label>
          <select
            name="insulationThickness"
            value={formData.insulationThickness}
            onChange={handleChange}
            className="w-full mt-1 border rounded px-2 py-2"
            disabled={formData.insulation !== "Retro-fitted"} // Disable unless insulation is Retro-fitted
          >
            <option value="">- Select -</option>
            <option value="50mm">50mm</option>
            <option value="100mm">100mm</option>
            <option value="150mm">150mm</option>
            <option value="Unknown">Unknown</option>
          </select>
        </div>

        {/* Section: Additional Notes */}
        <div className="mb-6">
          <Label>Additional Notes:</Label>
          <textarea
            name="additionalNotes"
            value={formData.additionalNotes}
            onChange={handleChange}
            className="w-full mt-1 border rounded px-2 py-2"
            rows="3"
            cols="2"
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