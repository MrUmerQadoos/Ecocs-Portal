import { FormThree } from "../model/FormThree.js";

// Create a new Form Three document
export const createFormThree = async (req, res) => {
  try {
    const newForm = new FormThree(req.body);
    await newForm.save();

    return res.status(201).json({
      success: true,
      message: "Form Three created successfully",
      data: newForm,
    });
  } catch (error) {
    console.error("Error creating Form Three:", error);
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

// Get Form Three data for a given user + optional processId
export const getFormThreeByUser = async (req, res) => {
  try {
    const { userId, processId } = req.query;
    if (!userId) {
      return res
        .status(400)
        .json({ success: false, error: "User ID is required" });
    }

    // Build the query object
    const query = { userId };
    if (processId) {
      query.processId = processId;
    }

    const forms = await FormThree.find(query);
    return res.status(200).json({ success: true, data: forms });
  } catch (error) {
    console.error("Error fetching Form Three data:", error);
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

// Update Form Three by its ID
export const updateFormThree = async (req, res) => {
  try {
    const { id } = req.params;

    const updatedDoc = await FormThree.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    if (!updatedDoc) {
      return res
        .status(404)
        .json({ success: false, message: "Form Three not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Form Three updated successfully",
      data: updatedDoc,
    });
  } catch (error) {
    console.error("Error updating Form Three:", error);
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};
