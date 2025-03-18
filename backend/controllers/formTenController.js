import { FormTen } from "../model/formTen.js";

// Create a new Form Ten
export const createFormTen = async (req, res) => {
  try {
    const { userId, processId, location, type, insulation, insulationThickness, additionalNotes } = req.body;

    // Validate required fields
    if (!userId || !processId || !location || !type || !insulation || !insulationThickness) {
      return res.status(400).json({ success: false, error: "All required fields must be provided" });
    }

    // Create and save the Form Ten document
    const newForm = new FormTen({
      userId,
      processId,
      location,
      type,
      insulation,
      insulationThickness,
      additionalNotes: additionalNotes || "", // Default to empty string if not provided
    });
    await newForm.save();

    return res.status(201).json({
      success: true,
      message: "Form Ten created successfully",
      data: newForm,
    });
  } catch (error) {
    console.error("Error creating Form Ten:", error);
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

// Get Form Ten data by userId and processId
export const getFormTenByUser = async (req, res) => {
  try {
    const { userId, processId } = req.query;
    if (!userId) {
      return res.status(400).json({ success: false, error: "User ID is required" });
    }

    const query = { userId };
    if (processId) {
      query.processId = processId;
    }

    const forms = await FormTen.find(query);
    return res.status(200).json({ success: true, data: forms });
  } catch (error) {
    console.error("Error fetching Form Ten data:", error);
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

// Update Form Ten
export const updateFormTen = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, processId, location, type, insulation, insulationThickness, additionalNotes } = req.body;

    // Validate required fields
    if (!userId || !processId || !location || !type || !insulation || !insulationThickness) {
      return res.status(400).json({ success: false, error: "All required fields must be provided" });
    }

    // Fetch the existing Form Ten document
    const existingForm = await FormTen.findById(id);
    if (!existingForm) {
      return res.status(404).json({ success: false, message: "Form Ten not found" });
    }

    // Update the Form Ten document
    const updatedForm = await FormTen.findByIdAndUpdate(
      id,
      {
        userId,
        processId,
        location,
        type,
        insulation,
        insulationThickness,
        additionalNotes: additionalNotes || "", // Default to empty string if not provided
      },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: "Form Ten updated successfully",
      data: updatedForm,
    });
  } catch (error) {
    console.error("Error updating Form Ten:", error);
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};