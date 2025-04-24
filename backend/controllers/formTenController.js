import path from "path";
import fs from "fs";
import { FormTen } from "../model/formTen.js";

// Create a new Form Ten
export const createFormTen = async (req, res) => {
  try {
    const { processId } = req.body;

    // Check if a FormTen document already exists for this processId
    const existingForm = await FormTen.findOne({ processId });
    if (existingForm) {
      return res.status(400).json({
        success: false,
        error: "A Form Ten document already exists for this process.",
      });
    }

    const formData = req.body;
    const filePaths = {
      floorPhotos: [],
    };

    // Handle file uploads for floorPhotos
    if (req.files && req.files.floorPhotos) {
      const files = Array.isArray(req.files.floorPhotos)
        ? req.files.floorPhotos
        : [req.files.floorPhotos];
      files.forEach((file) => {
        let filePath = path.join("uploads", `user-${formData.userId}`, "form-ten", file.filename);
        filePath = filePath.replace(/\\/g, "/");
        filePaths.floorPhotos.push(filePath);
      });
    }

    const newForm = new FormTen({ ...formData, ...filePaths });
    await newForm.save();

    return res.status(201).json({
      success: true,
      message: "Form Ten created successfully",
      data: newForm,
    });
  } catch (error) {
    console.error("Error creating Form Ten:", error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: "A Form Ten document already exists for this process.",
      });
    }
    if (error.name === "ValidationError") {
      return res.status(400).json({ success: false, error: error.message });
    }
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

// Get Form Ten data by processId
export const getFormTenByProcess = async (req, res) => {
  try {
    const { processId } = req.query;
    if (!processId) {
      return res.status(400).json({ success: false, error: "Process ID is required" });
    }

    const form = await FormTen.findOne({ processId });
    return res.status(200).json({ success: true, data: form ? [form] : [] });
  } catch (error) {
    console.error("Error fetching Form Ten data:", error);
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

// Update Form Ten with photo uploads and deletions
export const updateFormTen = async (req, res) => {
  try {
    const { id } = req.params;
    const formData = req.body;

    // Parse deleted images
    let deletedFloorPhotos = [];
    if (req.body.deletedFloorPhotos) {
      deletedFloorPhotos =
        typeof req.body.deletedFloorPhotos === "string"
          ? JSON.parse(req.body.deletedFloorPhotos)
          : req.body.deletedFloorPhotos;
    }

    // Convert absolute URLs to relative paths for comparison
    const relativeDeletedFloorPhotos = deletedFloorPhotos.map((img) =>
      img.replace("http://localhost:3000/", "")
    );

    // Fetch the existing document
    const existingForm = await FormTen.findById(id);
    if (!existingForm) {
      return res.status(404).json({ success: false, message: "Form Ten not found" });
    }

    // Remove deleted images from existing array
    let updatedFloorPhotos = existingForm.floorPhotos.filter(
      (photo) => !relativeDeletedFloorPhotos.includes(photo)
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

    relativeDeletedFloorPhotos.forEach(deleteImage);

    // Process new file uploads
    let newFloorPhotos = [];
    if (req.files && req.files.floorPhotos) {
      const files = Array.isArray(req.files.floorPhotos)
        ? req.files.floorPhotos
        : [req.files.floorPhotos];
      newFloorPhotos = files.map((file) => {
        let filePath = path.join("uploads", `user-${formData.userId}`, "form-ten", file.filename);
        return filePath.replace(/\\/g, "/");
      });
    }

    // Combine remaining images with new uploads
    updatedFloorPhotos = [...updatedFloorPhotos, ...newFloorPhotos];

    // Prepare the update object
    const updateData = {
      ...formData,
      floorPhotos: updatedFloorPhotos,
    };

    // Update the document
    const updatedForm = await FormTen.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    return res.status(200).json({
      success: true,
      message: "Form Ten updated successfully",
      data: updatedForm,
    });
  } catch (error) {
    console.error("Error updating Form Ten:", error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: "A Form Ten document already exists for this process.",
      });
    }
    if (error.name === "ValidationError") {
      return res.status(400).json({ success: false, error: error.message });
    }
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};