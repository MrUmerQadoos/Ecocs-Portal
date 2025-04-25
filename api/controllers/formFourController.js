import { FormFour } from "../model/FormFour.js";
import path from "path";
import fs from "fs";

// Create a new Form Four document
export const createFormFour = async (req, res) => {
  try {
    const { processId } = req.body;

    // Check if a FormFour document already exists for this processId
    const existingForm = await FormFour.findOne({ processId });
    if (existingForm) {
      return res.status(400).json({
        success: false,
        error: "A Form Four document already exists for this process.",
      });
    }

    const formData = req.body;
    const filePaths = [];

    // If files are uploaded, store their paths in photoThermalSeparation array
    if (req.files && req.files.length > 0) {
      req.files.forEach((file) => {
        let filePath = path.join("uploads", `user-${formData.userId}`, "form-four", file.filename);
        filePath = filePath.replace(/\\/g, "/"); // Convert Windows backslashes to forward slashes
        filePaths.push(filePath);
      });
      formData.photoThermalSeparation = filePaths;
    }

    const newForm = new FormFour(formData);
    await newForm.save();

    return res.status(201).json({
      success: true,
      message: "Form Four created successfully",
      data: newForm,
    });
  } catch (error) {
    console.error("Error creating Form Four:", error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: "A Form Four document already exists for this process.",
      });
    }
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

// Update Form Four with multiple photo uploads
export const updateFormFour = async (req, res) => {
  try {
    const { id } = req.params;
    const formData = req.body;

    // Parse deletedImages (it might be sent as a JSON string or an array)
    let deletedImages = [];
    if (req.body.deletedImages) {
      if (typeof req.body.deletedImages === "string") {
        try {
          deletedImages = JSON.parse(req.body.deletedImages);
        } catch (error) {
          deletedImages = [req.body.deletedImages];
        }
      } else {
        deletedImages = req.body.deletedImages;
      }
    }

    // Convert absolute URLs to relative paths for comparison
    const relativeDeletedImages = deletedImages.map((img) =>
      img.replace("http://localhost:3000/", "")
    );

    // Fetch the existing document from the database
    const existingForm = await FormFour.findById(id);
    if (!existingForm) {
      return res.status(404).json({ success: false, message: "Form Four not found" });
    }

    // Remove images marked for deletion from the existing images array
    let updatedPhotos = existingForm.photoThermalSeparation.filter(
      (photo) => !relativeDeletedImages.includes(photo)
    );

    // Delete physical files from the server for each deleted image
    relativeDeletedImages.forEach((relativeImg) => {
      if (relativeImg && relativeImg.trim()) {
        const filePath = path.join(process.cwd(), relativeImg);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`Deleted file: ${filePath}`);
        } else {
          console.log(`File not found: ${filePath}`);
        }
      }
    });

    // Process newly uploaded files (if any)
    let newPhotos = [];
    if (req.files && req.files.length > 0) {
      newPhotos = req.files.map((file) => {
        let filePath = path.join("uploads", `user-${formData.userId}`, "form-four", file.filename);
        return filePath.replace(/\\/g, "/");
      });
    }

    // Combine the remaining images with the newly uploaded ones
    updatedPhotos = [...updatedPhotos, ...newPhotos];

    // Prepare the update object
    const updateData = {
      ...formData,
      photoThermalSeparation: updatedPhotos,
    };

    // Update the document and return the updated record
    const updatedForm = await FormFour.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });

    return res.status(200).json({
      success: true,
      message: "Form Four updated successfully",
      data: updatedForm,
    });
  } catch (error) {
    console.error("Error updating Form Four:", error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: "A Form Four document already exists for this process.",
      });
    }
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

// Get Form Four data for a given processId
export const getFormFourByProcess = async (req, res) => {
  try {
    const { processId } = req.query;
    if (!processId) {
      return res.status(400).json({ success: false, error: "Process ID is required" });
    }

    const form = await FormFour.findOne({ processId });
    return res.status(200).json({ success: true, data: form });
  } catch (error) {
    console.error("Error fetching Form Four data:", error);
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};