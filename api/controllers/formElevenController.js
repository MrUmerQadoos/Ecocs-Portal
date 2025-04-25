import path from "path";
import fs from "fs";
import { FormEleven } from "../model/formEleven.js";

// Create a new Form Eleven
export const createFormEleven = async (req, res) => {
  try {
    const { processId } = req.body;

    // Check if a FormEleven document already exists for this processId
    const existingForm = await FormEleven.findOne({ processId });
    if (existingForm) {
      return res.status(400).json({
        success: false,
        error: "A Form Eleven document already exists for this process.",
      });
    }

    const formData = req.body;
    const filePaths = {
      structurePhotos: [],
      insulationPhotos: [],
    };

    // Handle file uploads for structurePhotos
    if (req.files && req.files.structurePhotos) {
      const files = Array.isArray(req.files.structurePhotos)
        ? req.files.structurePhotos
        : [req.files.structurePhotos];
      files.forEach((file) => {
        let filePath = path.join("uploads", `user-${formData.userId}`, "form-eleven", file.filename);
        filePath = filePath.replace(/\\/g, "/");
        filePaths.structurePhotos.push(filePath);
      });
    }

    // Handle file uploads for insulationPhotos
    if (req.files && req.files.insulationPhotos) {
      const files = Array.isArray(req.files.insulationPhotos)
        ? req.files.insulationPhotos
        : [req.files.insulationPhotos];
      files.forEach((file) => {
        let filePath = path.join("uploads", `user-${formData.userId}`, "form-eleven", file.filename);
        filePath = filePath.replace(/\\/g, "/");
        filePaths.insulationPhotos.push(filePath);
      });
    }

    const newForm = new FormEleven({ ...formData, ...filePaths });
    await newForm.save();

    return res.status(201).json({
      success: true,
      message: "Form Eleven created successfully",
      data: newForm,
    });
  } catch (error) {
    console.error("Error creating Form Eleven:", error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: "A Form Eleven document already exists for this process.",
      });
    }
    if (error.name === "ValidationError") {
      return res.status(400).json({ success: false, error: error.message });
    }
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

// Get Form Eleven data by processId
export const getFormElevenByProcess = async (req, res) => {
  try {
    const { processId } = req.query;
    if (!processId) {
      return res.status(400).json({ success: false, error: "Process ID is required" });
    }

    const form = await FormEleven.find({ processId });
    return res.status(200).json({ success: true, data: form });
  } catch (error) {
    console.error("Error fetching Form Eleven data:", error);
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

// Update Form Eleven with photo uploads and deletions
export const updateFormEleven = async (req, res) => {
  try {
    const { id } = req.params;
    const formData = req.body;

    // Parse deleted images for structurePhotos
    let deletedStructurePhotos = [];
    if (req.body.deletedStructurePhotos) {
      deletedStructurePhotos =
        typeof req.body.deletedStructurePhotos === "string"
          ? JSON.parse(req.body.deletedStructurePhotos)
          : req.body.deletedStructurePhotos;
    }

    // Parse deleted images for insulationPhotos
    let deletedInsulationPhotos = [];
    if (req.body.deletedInsulationPhotos) {
      deletedInsulationPhotos =
        typeof req.body.deletedInsulationPhotos === "string"
          ? JSON.parse(req.body.deletedInsulationPhotos)
          : req.body.deletedInsulationPhotos;
    }

    // Convert absolute URLs to relative paths for comparison
    const relativeDeletedStructurePhotos = deletedStructurePhotos.map((img) =>
      img.replace("http://localhost:3000/", "")
    );
    const relativeDeletedInsulationPhotos = deletedInsulationPhotos.map((img) =>
      img.replace("http://localhost:3000/", "")
    );

    // Fetch the existing document
    const existingForm = await FormEleven.findById(id);
    if (!existingForm) {
      return res.status(404).json({ success: false, message: "Form Eleven not found" });
    }

    // Remove deleted images from existing arrays
    let updatedStructurePhotos = existingForm.structurePhotos.filter(
      (photo) => !relativeDeletedStructurePhotos.includes(photo)
    );
    let updatedInsulationPhotos = existingForm.insulationPhotos.filter(
      (photo) => !relativeDeletedInsulationPhotos.includes(photo)
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

    relativeDeletedStructurePhotos.forEach(deleteImage);
    relativeDeletedInsulationPhotos.forEach(deleteImage);

    // Process new file uploads for structurePhotos
    let newStructurePhotos = [];
    if (req.files && req.files.structurePhotos) {
      const files = Array.isArray(req.files.structurePhotos)
        ? req.files.structurePhotos
        : [req.files.structurePhotos];
      newStructurePhotos = files.map((file) => {
        let filePath = path.join("uploads", `user-${formData.userId}`, "form-eleven", file.filename);
        return filePath.replace(/\\/g, "/");
      });
    }

    // Process new file uploads for insulationPhotos
    let newInsulationPhotos = [];
    if (req.files && req.files.insulationPhotos) {
      const files = Array.isArray(req.files.insulationPhotos)
        ? req.files.insulationPhotos
        : [req.files.insulationPhotos];
      newInsulationPhotos = files.map((file) => {
        let filePath = path.join("uploads", `user-${formData.userId}`, "form-eleven", file.filename);
        return filePath.replace(/\\/g, "/");
      });
    }

    // Combine remaining images with new uploads
    updatedStructurePhotos = [...updatedStructurePhotos, ...newStructurePhotos];
    updatedInsulationPhotos = [...updatedInsulationPhotos, ...newInsulationPhotos];

    // Prepare the update object
    const updateData = {
      ...formData,
      structurePhotos: updatedStructurePhotos,
      insulationPhotos: updatedInsulationPhotos,
    };

    // Update the document
    const updatedForm = await FormEleven.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    return res.status(200).json({
      success: true,
      message: "Form Eleven updated successfully",
      data: updatedForm,
    });
  } catch (error) {
    console.error("Error updating Form Eleven:", error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: "A Form Eleven document already exists for this process.",
      });
    }
    if (error.name === "ValidationError") {
      return res.status(400).json({ success: false, error: error.message });
    }
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};