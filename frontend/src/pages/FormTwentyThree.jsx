import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/store/authStore";

export default function FormTwentyThree() {
  const navigate = useNavigate();
  const { processId: urlProcessId } = useParams();
  const location = useLocation();
  const { toast } = useToast();
  const { user } = useAuthStore();

  // State for form data and metadata
  const [formData, setFormData] = useState({
    extensionDimensions: "",
    fifthFloor: { floorArea: "", roomHeight: "", heatLossPerimeter: "", partyWallLength: "" },
    fourthFloor: { floorArea: "", roomHeight: "", heatLossPerimeter: "", partyWallLength: "" },
    thirdFloor: { floorArea: "", roomHeight: "", heatLossPerimeter: "", partyWallLength: "" },
    secondFloor: { floorArea: "", roomHeight: "", heatLossPerimeter: "", partyWallLength: "" },
    lowestFloor: { floorArea: "", roomHeight: "", heatLossPerimeter: "", partyWallLength: "" },
    userId: user?._id || "",
    processId: urlProcessId || "",
  });

  const [docId, setDocId] = useState(null);
  const [taskId, setTaskId] = useState(null);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [isUpdate, setIsUpdate] = useState(false);
  const [isViewOnly, setIsViewOnly] = useState(false);
  const [savedProcessId, setSavedProcessId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Determine mode (edit or view) and load existing data
  useEffect(() => {
    const isViewing = location.pathname.includes("/view-form");
    setIsViewOnly(isViewing || user.role !== "surveyor");
    const queryTaskId = new URLSearchParams(location.search).get("taskId");
    setTaskId(queryTaskId);

    if (urlProcessId && urlProcessId !== "new") {
      setLoading(true);
      fetch(`http://localhost:3000/api/assessments/form-twenty-three?processId=${urlProcessId}`, {
        method: "GET",
        credentials: "include",
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data && data.data.length > 0) {
            const existingForm = data.data[0];
            setFormData(existingForm);
            setDocId(existingForm._id);
            setIsUpdate(true);
            setSavedProcessId(existingForm.processId);
          } else if (isViewing) {
            toast({
              variant: "destructive",
              title: "Error",
              description: "Form Twenty-Three data not found.",
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
            description: "Error fetching Form Twenty-Three data.",
          });
          navigate("/dashboard");
          console.error("Fetch error:", error);
        })
        .finally(() => setLoading(false));
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
  const handleChange = (e, floor) => {
    const { name, value } = e.target;
    if (floor) {
      setFormData((prev) => ({
        ...prev,
        [floor]: { ...prev[floor], [name]: value },
        userId: user ? user._id : "",
        processId: urlProcessId,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        userId: user ? user._id : "",
        processId: urlProcessId,
      }));
    }
    setUnsavedChanges(true);
    setErrors((prev) => ({ ...prev, [floor ? `${floor}.${name}` : name]: "" }));
  };

  // Form validation
  const validateForm = () => {
    const newErrors = {};

    if (!formData.extensionDimensions) {
      newErrors.extensionDimensions = "Extension Dimensions is required.";
    }
    ["fifthFloor", "fourthFloor", "thirdFloor", "secondFloor", "lowestFloor"].forEach((floor) => {
      if (!formData[floor].floorArea) newErrors[`${floor}.floorArea`] = "Floor Area is required.";
      if (!formData[floor].roomHeight) newErrors[`${floor}.roomHeight`] = "Room Height is required.";
      if (!formData[floor].heatLossPerimeter) newErrors[`${floor}.heatLossPerimeter`] = "Heat Loss Perimeter is required.";
      if (!formData[floor].partyWallLength) newErrors[`${floor}.partyWallLength`] = "Party Wall Length is required.";
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Save or update the form
  const saveForm = async () => {
    if (isViewOnly) return { success: false };

    if (!validateForm()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please fill in all required fields correctly.",
      });
      return { success: false };
    }

    setLoading(true);
    try {
      const url = docId
        ? `http://localhost:3000/api/assessments/form-twenty-three/${docId}`
        : "http://localhost:3000/api/assessments/form-twenty-three";
      const method = docId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await response.json();

      if (data.success) {
        setDocId(data.data._id);
        setSavedProcessId(data.data.processId);
        setIsUpdate(true);
        setUnsavedChanges(false);
        toast({
          title: "Success",
          description: `Form Twenty-Three ${docId ? "updated" : "saved"} successfully!`,
        });
        return { success: true, processId: data.data.processId };
      } else {
        throw new Error(data.error || "Failed to save Form Twenty-Three");
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
      console.error("Save error:", error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Handle save button click
  const handleSave = async () => {
    const result = await saveForm();
    if (result.success) {
      if (user.role !== "surveyor") {
        navigate(`/view-form/${result.processId}/form-twenty-three?taskId=${taskId}`);
      } else {
        navigate(`/process/${result.processId}/form-twenty-three?taskId=${taskId}`, { replace: true });
      }
    }
  };

  // Handle navigation to the next form
  const handleNext = async () => {
    if (!isViewOnly) {
      const result = await saveForm();
      if (result.success) {
        if (user.role === "surveyor") {
          navigate(`/process/${result.processId}/form-twenty-four?taskId=${taskId}`);
        } else {
          navigate(`/view-form/${result.processId}/form-twenty-four?taskId=${taskId}`);
        }
      }
    } else {
      navigate(`/view-form/${savedProcessId || urlProcessId}/form-twenty-four?taskId=${taskId}`);
    }
  };

  // Handle navigation to the previous form
  const handlePrevious = async () => {
    if (!isViewOnly) {
      const result = await saveForm();
      if (result.success) {
        if (user.role === "surveyor") {
          navigate(`/process/${result.processId}/form-twenty-two?taskId=${taskId}`);
        } else {
          navigate(`/view-form/${result.processId}/form-twenty-two?taskId=${taskId}`);
        }
      }
    } else {
      navigate(`/view-form/${savedProcessId || urlProcessId}/form-twenty-two?taskId=${taskId}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center px-4 py-6">
      {loading ? (
        <div className="text-center">
          <p>Loading...</p>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white w-full max-w-4xl p-8 rounded-lg shadow"
        >
          <h1 className="text-2xl font-bold mb-6 text-center">
            {isViewOnly ? "View Form Twenty-Three" : "23. Extension Dimensions"}
          </h1>

          {/* Section Break */}
          <div className="ff-el-group ff-el-section-break ff_center" data-name="section_break-3_31">
            <h3 className="ff-el-section-title">2. Extension Dimensions</h3>
            <div className="ff-section_break_desk"></div>
            <hr />
          </div>

          {/* Section: Extension Dimensions */}
          <div className="ff-el-group">
            <div className="ff-el-input--label asterisk-right">
              <Label htmlFor="ff_3_dropdown_67">Extension Dimensions:</Label>
            </div>
            <div className="ff-el-input--content">
              <select
                name="extensionDimensions"
                id="ff_3_dropdown_67"
                value={formData.extensionDimensions}
                onChange={handleChange}
                className={`ff-el-form-control w-full mt-1 border rounded px-2 py-2 ${errors.extensionDimensions ? "border-red-500" : ""}`}
                aria-required="true"
                disabled={isViewOnly}
              >
                <option value="">- Select -</option>
                <option value="Internal">Internal</option>
                <option value="External">External</option>
              </select>
              {errors.extensionDimensions && (
                <p className="text-red-500 text-sm mt-1">{errors.extensionDimensions}</p>
              )}
            </div>
          </div>

          {/* Floor Sections */}
          {[
            { floor: "fifthFloor", title: "5th Floor", idPrefix: "ff_3_input_text_84", cnId: "ff_cn_id_25" },
            { floor: "fourthFloor", title: "4th Floor", idPrefix: "ff_3_input_text_88", cnId: "ff_cn_id_26" },
            { floor: "thirdFloor", title: "3rd Floor", idPrefix: "ff_3_input_text_92", cnId: "ff_cn_id_27" },
            { floor: "secondFloor", title: "2nd Floor", idPrefix: "ff_3_input_text_96", cnId: "ff_cn_id_28" },
            { floor: "lowestFloor", title: "Lowest Floor", idPrefix: "ff_3_input_text_104", cnId: "ff_cn_id_30" },
          ].map(({ floor, title, idPrefix, cnId }, index) => (
            <div key={floor} data-name={cnId} className="ff-t-container ff-column-container ff_columns_total_5">
              <div className="ff-t-cell ff-t-column-1" style={{ flexBasis: "20%" }}>
                <div className="ff-el-group ff-custom_html" data-name={`custom_html-3_${33 + index}`}>
                  <h1>
                    <span style={{ color: "#339966", fontSize: "24px", lineHeight: 1.4 }}>{title}</span>
                  </h1>
                </div>
              </div>
              {[
                { label: "Floor Area(m²)", name: "floorArea", id: `${idPrefix}` },
                { label: "Room Height (m)", name: "roomHeight", id: `${idPrefix + 1}` },
                { label: "Heat Loss Perimeter (m)", name: "heatLossPerimeter", id: `${idPrefix + 2}` },
                { label: "Party Wall Length (m)", name: "partyWallLength", id: `${idPrefix + 3}` },
              ].map(({ label, name, id }, colIndex) => (
                <div key={name} className={`ff-t-cell ff-t-column-${colIndex + 2}`} style={{ flexBasis: "20%" }}>
                  <div className="ff-el-group">
                    <div className="ff-el-input--label asterisk-right">
                      <Label htmlFor={id}>{label}</Label>
                    </div>
                    <div className="ff-el-input--content">
                      <input
                        type="text"
                        name={name}
                        id={id}
                        value={formData[floor][name]}
                        onChange={(e) => handleChange(e, floor)}
                        className={`ff-el-form-control w-full mt-1 border rounded px-2 py-2 ${errors[`${floor}.${name}`] ? "border-red-500" : ""}`}
                        aria-required="true"
                        disabled={isViewOnly}
                      />
                      {errors[`${floor}.${name}`] && (
                        <p className="text-red-500 text-sm mt-1">{errors[`${floor}.${name}`]}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-6 space-x-2">
            <Button variant="outline" onClick={handlePrevious} disabled={loading}>
              Previous
            </Button>
            {isViewOnly ? (
              <>
                <Button variant="outline" onClick={() => navigate("/dashboard")} disabled={loading}>
                  Back to Dashboard
                </Button>
                <Button variant="secondary" onClick={handleNext} disabled={loading}>
                  Next
                </Button>
              </>
            ) : (
              <>
                <Button onClick={handleSave} disabled={loading}>
                  {loading ? "Saving..." : isUpdate ? "Update" : "Save"}
                </Button>
                <Button variant="secondary" onClick={handleNext} disabled={loading}>
                  Next
                </Button>
              </>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}