import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/store/authStore";

export default function FormOne() {
  const navigate = useNavigate();
  const { processId } = useParams(); // extract processId from URL (e.g., /process/:processId/form-one)
  const { toast } = useToast();
  const { user } = useAuthStore(); // the logged-in user from your auth store

  // State for document ID, unsaved changes, and update flag.
  const [docId, setDocId] = useState(null);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [isUpdate, setIsUpdate] = useState(false);

  // Form state includes processId along with userId and other fields.
  const [formData, setFormData] = useState({
    propertyAddress: "",
    postcode: "",
    inspectionDate: "",
    surveyorName: "",
    surveyorID: "",
    epcRRN: "",
    userId: "",
    processId: processId || "", // processId from URL
  });

  // Update formData with userId and processId when available.
  useEffect(() => {
    if (user && user._id) {
      setFormData(prev => ({ ...prev, userId: user._id, processId }));
    }
  }, [user, processId]);

  // On component mount, if a user is logged in, fetch saved Form One data for this process.
  useEffect(() => {
    if (user && user._id && processId) {
      // Adjust endpoint to also filter by processId if your backend supports it.
      fetch(`http://localhost:3000/api/assessments/form-one?userId=${user._id}&processId=${processId}`)
        .then((res) => res.json())
        .then((data) => {
          // Assuming your endpoint returns an array of documents for this process.
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

  // Warn user before leaving the page if there are unsaved changes.
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

  // Handle input changes.
  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
      userId: user ? user._id : "",
      processId, // always include processId
    }));
    setUnsavedChanges(true);
  };

  // Save the form: POST if new, PUT if updating.
  const handleSave = async () => {
    try {
      let url = "http://localhost:3000/api/assessments/form-one";
      let method = "POST";
      if (docId) {
        url = `http://localhost:3000/api/assessments/form-one/${docId}`;
        method = "PUT";
      }
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (data.success) {
        // On creation, update docId from response.
        if (!docId && data.data && data.data._id) {
          setDocId(data.data._id);
        }
        setIsUpdate(true);
        setUnsavedChanges(false);
        toast({
          title: "Success",
          description: `Form One ${docId ? "updated" : "saved"} successfully!`,
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
        description: "An error occurred while saving Form One",
      });
      console.error("Save error:", error);
    }
  };

  // Next button: if unsaved changes exist, warn; otherwise, navigate to Form Two with the same processId.
  const handleNext = () => {
    if (unsavedChanges) {
      toast({
        variant: "warning",
        title: "Unsaved changes",
        description: "Please save before proceeding.",
      });
      return;
    }
    navigate(`/process/${processId}/form-two`);
  };

  return (
    <div className="min-h-screen w-full bg-gray-100 flex flex-col items-center justify-center px-4 py-6">
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white w-full max-w-3xl p-8 rounded-lg shadow"
      >
        <h1 className="text-2xl font-bold mb-6 text-center">
          RdSAP Assessment Form England &amp; Wales v9.94
        </h1>
        {/* Responsive Grid for the Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="propertyAddress">Property Address</Label>
            <Input
              id="propertyAddress"
              name="propertyAddress"
              placeholder="Enter property address"
              value={formData.propertyAddress}
              onChange={handleChange}
            />
          </div>
          <div>
            <Label htmlFor="postcode">Postcode</Label>
            <Input
              id="postcode"
              name="postcode"
              placeholder="Enter postcode"
              value={formData.postcode}
              onChange={handleChange}
            />
          </div>
          <div>
            <Label htmlFor="inspectionDate">Inspection Date</Label>
            <Input
              id="inspectionDate"
              name="inspectionDate"
              type="date"
              value={formData.inspectionDate}
              onChange={handleChange}
            />
          </div>
          <div>
            <Label htmlFor="surveyorName">Surveyor Name</Label>
            <Input
              id="surveyorName"
              name="surveyorName"
              placeholder="Enter surveyor name"
              value={formData.surveyorName}
              onChange={handleChange}
            />
          </div>
          <div>
            <Label htmlFor="surveyorID">Surveyor ID</Label>
            <Input
              id="surveyorID"
              name="surveyorID"
              placeholder="Enter surveyor ID"
              value={formData.surveyorID}
              onChange={handleChange}
            />
          </div>
          <div>
            <Label htmlFor="epcRRN">EPC RRN</Label>
            <Input
              id="epcRRN"
              name="epcRRN"
              placeholder="Enter EPC RRN"
              value={formData.epcRRN}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-between mt-6">
          <Button onClick={handleSave}>
            {isUpdate ? "Update" : "Save"}
          </Button>
          <Button variant="outline" onClick={handleNext}>
            Next
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
