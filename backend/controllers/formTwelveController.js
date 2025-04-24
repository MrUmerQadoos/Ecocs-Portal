import path from "path";
import fs from "fs";
import { FormTwelve } from "../model/formTwelve.js";

// Create a new Form Twelve
export const createFormTwelve = async (req, res) => {
  try {
    const { processId } = req.body;

    // Check if a FormTwelve document already exists for this processId
    const existingForm = await FormTwelve.findOne({ processId });
    if (existingForm) {
      return res.status(400).json({
        success: false,
        error: "A Form Twelve document already exists for this process.",
      });
    }

    const formData = req.body;
    const filePaths = {
      ventilationCoolingPhotos: [],
    };

    // Handle file uploads for ventilationCoolingPhotos
    if (req.files && req.files.ventilationCoolingPhotos) {
      const files = Array.isArray(req.files.ventilationCoolingPhotos)
        ? req.files.ventilationCoolingPhotos
        : [req.files.ventilationCoolingPhotos];
      files.forEach((file) => {
        let filePath = path.join("uploads", `user-${formData.userId}`, "form-twelve", file.filename);
        filePath = filePath.replace(/\\/g, "/");
        filePaths.ventilationCoolingPhotos.push(filePath);
      });
    }

    const newForm = new FormTwelve({ ...formData, ...filePaths });
    await newForm.save();

    return res.status(201).json({
      success: true,
      message: "Form Twelve created successfully",
      data: newForm,
    });
  } catch (error) {
    console.error("Error creating Form Twelve:", error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: "A Form Twelve document already exists for this process.",
      });
    }
    if (error.name === "ValidationError") {
      return res.status(400).json({ success: false, error: error.message });
    }
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

// Get Form Twelve data by processId
export const getFormTwelveByProcess = async (req, res) => {
  try {
    const { processId } = req.query;
    if (!processId) {
      return res.status(400).json({ success: false, error: "Process ID is required" });
    }

    const form = await FormTwelve.find({ processId });
    return res.status(200).json({ success: true, data: form });
  } catch (error) {
    console.error("Error fetching Form Twelve data:", error);
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

// Update Form Twelve with photo uploads and deletions
export const updateFormTwelve = async (req, res) => {
  try {
    const { id } = req.params;
    const formData = req.body;

    // Parse deleted images for ventilationCoolingPhotos
    let deletedVentilationCoolingPhotos = [];
    if (req.body.deletedVentilationCoolingPhotos) {
      deletedVentilationCoolingPhotos =
        typeof req.body.deletedVentilationCoolingPhotos === "string"
          ? JSON.parse(req.body.deletedVentilationCoolingPhotos)
          : req.body.deletedVentilationCoolingPhotos;
    }

    // Convert absolute URLs to relative paths for comparison
    const relativeDeletedVentilationCoolingPhotos = deletedVentilationCoolingPhotos.map((img) =>
      img.replace("http://localhost:3000/", "")
    );

    // Fetch the existing document
    const existingForm = await FormTwelve.findById(id);
    if (!existingForm) {
      return res.status(404).json({ success: false, message: "Form Twelve not found" });
    }

    // Remove deleted images from existing array
    let updatedVentilationCoolingPhotos = existingForm.ventilationCoolingPhotos.filter(
      (photo) => !relativeDeletedVentilationCoolingPhotos.includes(photo)
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

    relativeDeletedVentilationCoolingPhotos.forEach(deleteImage);

    // Process new file uploads for ventilationCoolingPhotos
    let newVentilationCoolingPhotos = [];
    if (req.files && req.files.ventilationCoolingPhotos) {
      const files = Array.isArray(req.files.ventilationCoolingPhotos)
        ? req.files.ventilationCoolingPhotos
        : [req.files.ventilationCoolingPhotos];
      newVentilationCoolingPhotos = files.map((file) => {
        let filePath = path.join("uploads", `user-${formData.userId}`, "form-twelve", file.filename);
        return filePath.replace(/\\/g, "/");
      });
    }

    // Combine remaining images with new uploads
    updatedVentilationCoolingPhotos = [...updatedVentilationCoolingPhotos, ...newVentilationCoolingPhotos];

    // Prepare the update object
    const updateData = {
      ...formData,
      ventilationCoolingPhotos: updatedVentilationCoolingPhotos,
    };

    // Update the document
    const updatedForm = await FormTwelve.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    return res.status(200).json({
      success: true,
      message: "Form Twelve updated successfully",
      data: updatedForm,
    });
  } catch (error) {
    console.error("Error updating Form Twelve:", error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: "A Form Twelve document already exists for this process.",
      });
    }
    if (error.name === "ValidationError") {
      return res.status(400).json({ success: false, error: error.message });
    }
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};