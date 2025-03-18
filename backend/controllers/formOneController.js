import { FormOne } from "../model/FormOne.js";

// Create a new Form One document
export const createFormOne = async (req, res) => {
  try {
    // req.body should include all form fields plus userId and processId
    const newForm = new FormOne(req.body);
    await newForm.save();
    return res.status(201).json({
      success: true,
      message: "Form One created successfully",
      data: newForm,
    });
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
};

// Get Form One data for a given user via query parameters (e.g., ?userId=xxx&processId=yyy)
export const getFormOneByUser = async (req, res) => {
  try {
    const { userId, processId } = req.query;
    // Build the query object based on the parameters provided.
    const query = { userId };
    if (processId) {
      query.processId = processId;
    }
    const forms = await FormOne.find(query);
    return res.status(200).json({ success: true, data: forms });
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
};

// Update Form One by its ID
export const updateFormOne = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedDoc = await FormOne.findByIdAndUpdate(id, req.body, { new: true });
    if (!updatedDoc) {
      return res.status(404).json({ success: false, message: "Form One not found" });
    }
    return res.status(200).json({
      success: true,
      message: "Form One updated successfully",
      data: updatedDoc,
    });
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
};
