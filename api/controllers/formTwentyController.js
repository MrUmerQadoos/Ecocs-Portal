import path from "path";
import fs from "fs";
import { FormTwenty } from "../model/formTwenty.js";

// Create a new Form Twenty
export const createFormTwenty = async (req, res) => {
  try {
    const { processId } = req.body;

    // Check if a FormTwenty document already exists for this processId
    const existingForm = await FormTwenty.findOne({ processId });
    if (existingForm) {
      return res.status(400).json({
        success: false,
        error: "A Form Twenty document already exists for this process.",
      });
    }

    const formData = req.body;
    const filePaths = {
      checklistPhotos: [],
    };

    // Handle file uploads for checklistPhotos
    if (req.files && req.files.checklistPhotos) {
      const files = Array.isArray(req.files.checklistPhotos)
        ? req.files.checklistPhotos
        : [req.files.checklistPhotos];
      files.forEach((file) => {
        let filePath = path.join("uploads", `user-${formData.userId}`, "form-twenty", file.filename);
        filePath = filePath.replace(/\\/g, "/");
        filePaths.checklistPhotos.push(filePath);
      });
    }

    const newForm = new FormTwenty({ ...formData, ...filePaths });
    await newForm.save();

    return res.status(201).json({
      success: true,
      message: "Form Twenty created successfully",
      data: newForm,
    });
  } catch (error) {
    console.error("Error creating Form Twenty:", error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: "A Form Twenty document already exists for this process.",
      });
    }
    if (error.name === "ValidationError") {
      return res.status(400).json({ success: false, error: error.message });
    }
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

// Get Form Twenty data by processId
export const getFormTwentyByProcess = async (req, res) => {
  try {
    const { processId } = req.query;
    if (!processId) {
      return res.status(400).json({ success: false, error: "Process ID is required" });
    }

    const form = await FormTwenty.findOne({ processId });
    return res.status(200).json({ success: true, data: form ? [form] : [] });
  } catch (error) {
    console.error("Error fetching Form Twenty data:", error);
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

// Update Form Twenty with photo uploads and deletions
export const updateFormTwenty = async (req, res) => {
  try {
    const { id } = req.params;
    const formData = req.body;

    // Parse deleted images
    let deletedChecklistPhotos = [];
    if (req.body.deletedChecklistPhotos) {
      deletedChecklistPhotos =
        typeof req.body.deletedChecklistPhotos === "string"
          ? JSON.parse(req.body.deletedChecklistPhotos)
          : req.body.deletedChecklistPhotos;
    }

    // Convert absolute URLs to relative paths for comparison
    const relativeDeletedChecklistPhotos = deletedChecklistPhotos.map((img) =>
      img.replace("http://localhost:3000/", "")
    );

    // Fetch the existing document
    const existingForm = await FormTwenty.findById(id);
    if (!existingForm) {
      return res.status(404).json({ success: false, message: "Form Twenty not found" });
    }

    // Remove deleted images from existing array
    let updatedChecklistPhotos = existingForm.checklistPhotos.filter(
      (photo) => !relativeDeletedChecklistPhotos.includes(photo)
    );

    // Delete physical files from the server
    const deleteImage = (relativeImg) => {
      if (relativeImg && relativeImg.trim()) {
        const filePath = path.join(process.cwd(), relativeImg);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`Deleted file: ${filePath}`);
        } else {
          console.log(`File not found: ${filePath}`);
        }
      }
    };

    relativeDeletedChecklistPhotos.forEach(deleteImage);

    // Process new file uploads
    let newChecklistPhotos = [];
    if (req.files && req.files.checklistPhotos) {
      const files = Array.isArray(req.files.checklistPhotos)
        ? req.files.checklistPhotos
        : [req.files.checklistPhotos];
      newChecklistPhotos = files.map((file) => {
        let filePath = path.join("uploads", `user-${formData.userId}`, "form-twenty", file.filename);
        return filePath.replace(/\\/g, "/");
      });
    }

    // Combine remaining images with new uploads
    updatedChecklistPhotos = [...updatedChecklistPhotos, ...newChecklistPhotos];

    // Prepare the update object
    const updateData = {
      ...formData,
      checklistPhotos: updatedChecklistPhotos,
    };

    // Update the document
    const updatedForm = await FormTwenty.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    return res.status(200).json({
      success: true,
      message: "Form Twenty updated successfully",
      data: updatedForm,
    });
  } catch (error) {
    console.error("Error updating Form Twenty:", error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: "A Form Twenty document already exists for this process.",
      });
    }
    if (error.name === "ValidationError") {
      return res.status(400).json({ success: false, error: error.message });
    }
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};