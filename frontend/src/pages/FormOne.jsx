import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/store/authStore";

export default function FormOne() {
  const navigate = useNavigate();
  const { processId: urlProcessId } = useParams();
  const location = useLocation();
  const { toast } = useToast();
  const { user } = useAuthStore();

  const [formData, setFormData] = useState({
    propertyAddress: "",
    postcode: "",
    inspectionDate: "",
    surveyorName: user?.name || "",
    surveyorID: user?._id || "",
    epcRRN: "",
  });
  const [formId, setFormId] = useState(null);
  const [taskId, setTaskId] = useState(null);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [isViewOnly, setIsViewOnly] = useState(false);
  const [savedProcessId, setSavedProcessId] = useState(null);

  // Determine mode (edit or view) and load existing data
  useEffect(() => {
    const isViewing = location.pathname.includes("/view-form");
    setIsViewOnly(isViewing || user.role !== "surveyor");
    const queryTaskId = new URLSearchParams(location.search).get("taskId");
    setTaskId(queryTaskId);

    if (urlProcessId && urlProcessId !== "new") {
      fetch(`http://localhost:3000/api/assessments/form-one?processId=${urlProcessId}`, {
        method: "GET",
        credentials: "include",
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data) {
            setFormData(data.data);
            setFormId(data.data._id);
            setSavedProcessId(data.data.processId);
          }
        })
        .catch((error) => {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to load Form One data.",
          });
          console.error("Fetch error:", error);
        });
    }
  }, [urlProcessId, user, location, toast]);

  // Warn about unsaved changes
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
    }));
    setUnsavedChanges(true);
  };

  const saveForm = async () => {
    if (isViewOnly) return { success: false };

    try {
      if (!taskId) {
        throw new Error("Task ID is required");
      }

      const url = formId
        ? `http://localhost:3000/api/assessments/form-one/${formId}`
        : "http://localhost:3000/api/assessments/form-one";
      const method = formId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ taskId, ...formData }),
      });
      const data = await response.json();

      if (data.success) {
        setFormId(data.data._id);
        setSavedProcessId(data.data.processId);
        setUnsavedChanges(false);
        toast({
          title: "Success",
          description: `Form One ${formId ? "updated" : "saved"} successfully!`,
        });
        return { success: true, processId: data.data.processId };
      } else {
        throw new Error(data.error || "Failed to save Form One");
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
        // For admin, manager, viewer: redirect to view page
        navigate(`/view-form/${result.processId}`);
      } else {
        // For surveyor: stay on the form page, update the URL
        navigate(`/process/${result.processId}/form-one?taskId=${taskId}`, { replace: true });
      }
    }
  };

  const handleNext = async () => {
    if (!isViewOnly) {
      const result = await saveForm();
      if (result.success) {
        if (user.role === "surveyor") {
          // For surveyor: navigate to FormTwo
          navigate(`/process/${result.processId}/form-two?taskId=${taskId}`);
        } else {
          // For admin, manager, viewer: redirect to view page
          navigate(`/view-form/${result.processId}/form-two?taskId=${taskId}`);
        }
      }
    } else {
      // In view mode, navigate to FormTwo
      navigate(`/view-form/${savedProcessId || urlProcessId}/form-two?taskId=${taskId}`);
    }
  };

  const handlePrevious = () => {
    // Since this is FormOne, "Previous" goes back to the dashboard
    navigate("/dashboard");
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
          {isViewOnly ? "View Form One" : "RdSAP Assessment Form England & Wales v9.94"}
        </h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="propertyAddress">Property Address</Label>
            <Input
              id="propertyAddress"
              name="propertyAddress"
              placeholder="Enter property address"
              value={formData.propertyAddress}
              onChange={handleChange}
              disabled={isViewOnly}
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
              disabled={isViewOnly}
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
              disabled={isViewOnly}
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
              disabled={isViewOnly}
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
              disabled={isViewOnly}
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
              disabled={isViewOnly}
            />
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
              <Button onClick={handleSave}>{formId ? "Update" : "Save"}</Button>
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