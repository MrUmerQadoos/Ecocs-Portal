import path from "path";
import fs from "fs";
import { FormTwentyFive } from "../model/formTwentyFive.js";

// Create a new Form Twenty-Five
export const createFormTwentyFive = async (req, res) => {
  try {
    const { processId, userId } = req.body;

    // Check if a FormTwentyFive document already exists for this processId
    const existingForm = await FormTwentyFive.findOne({ processId });
    if (existingForm) {
      return res.status(400).json({
        success: false,
        error: "A Form Twenty-Five document already exists for this process.",
      });
    }

    const formData = req.body;
    const filePaths = {
      alternativeWallsPhotos: [],
      wallInsulationPhotos: [],
    };

    // Handle file uploads
    if (req.files) {
      if (req.files.alternativeWallsPhotos) {
        const files = Array.isArray(req.files.alternativeWallsPhotos)
          ? req.files.alternativeWallsPhotos
          : [req.files.alternativeWallsPhotos];
        files.forEach((file) => {
          let filePath = path.join("uploads", `user-${userId}`, "form-twenty-five", file.filename);
          filePath = filePath.replace(/\\/g, "/");
          filePaths.alternativeWallsPhotos.push(filePath);
        });
      }
      if (req.files.wallInsulationPhotos) {
        const files = Array.isArray(req.files.wallInsulationPhotos)
          ? req.files.wallInsulationPhotos
          : [req.files.wallInsulationPhotos];
        files.forEach((file) => {
          let filePath = path.join("uploads", `user-${userId}`, "form-twenty-five", file.filename);
          filePath = filePath.replace(/\\/g, "/");
          filePaths.wallInsulationPhotos.push(filePath);
        });
      }
    }

    const newForm = new FormTwentyFive({ ...formData, ...filePaths });
    await newForm.save();

    return res.status(201).json({
      success: true,
      message: "Form Twenty-Five created successfully",
      data: newForm,
    });
  } catch (error) {
    console.error("Error creating Form Twenty-Five:", error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: "A Form Twenty-Five document already exists for this process.",
      });
    }
    if (error.name === "ValidationError") {
      return res.status(400).json({ success: false, error: error.message });
    }
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

// Get Form Twenty-Five data by processId
export const getFormTwentyFiveByProcess = async (req, res) => {
  try {
    const { processId } = req.query;
    if (!processId) {
      return res.status(400).json({ success: false, error: "Process ID is required" });
    }

    const form = await FormTwentyFive.findOne({ processId });
    return res.status(200).json({ success: true, data: form ? [form] : [] });
  } catch (error) {
    console.error("Error fetching Form Twenty-Five data:", error);
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

// Update Form Twenty-Five with photo uploads and deletions
export const updateFormTwentyFive = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    // Parse deleted images
    let deletedAlternativeWallsPhotos = [];
    if (req.body.deletedAlternativeWallsPhotos) {
      deletedAlternativeWallsPhotos =
        typeof req.body.deletedAlternativeWallsPhotos === "string"
          ? JSON.parse(req.body.deletedAlternativeWallsPhotos)
          : req.body.deletedAlternativeWallsPhotos;
    }
    let deletedWallInsulationPhotos = [];
    if (req.body.deletedWallInsulationPhotos) {
      deletedWallInsulationPhotos =
        typeof req.body.deletedWallInsulationPhotos === "string"
          ? JSON.parse(req.body.deletedWallInsulationPhotos)
          : req.body.deletedWallInsulationPhotos;
    }

    // Convert absolute URLs to relative paths
    const relativeDeletedAlternativePhotos = deletedAlternativeWallsPhotos.map((img) =>
      img.replace("http://localhost:3000/", "")
    );
    const relativeDeletedInsulationPhotos = deletedWallInsulationPhotos.map((img) =>
      img.replace("http://localhost:3000/", "")
    );

    // Fetch the existing document
    const existingForm = await FormTwentyFive.findById(id);
    if (!existingForm) {
      return res.status(404).json({ success: false, message: "Form Twenty-Five not found" });
    }

    // Remove deleted images from existing arrays
    let updatedAlternativeWallsPhotos = existingForm.alternativeWallsPhotos.filter(
      (photo) => !relativeDeletedAlternativePhotos.includes(photo)
    );
    let updatedWallInsulationPhotos = existingForm.wallInsulationPhotos.filter(
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

    relativeDeletedAlternativePhotos.forEach(deleteImage);
    relativeDeletedInsulationPhotos.forEach(deleteImage);

    // Process new file uploads
    let newAlternativeWallsPhotos = [];
    if (req.files && req.files.alternativeWallsPhotos) {
      const files = Array.isArray(req.files.alternativeWallsPhotos)
        ? req.files.alternativeWallsPhotos
        : [req.files.alternativeWallsPhotos];
      newAlternativeWallsPhotos = files.map((file) => {
        let filePath = path.join("uploads", `user-${userId}`, "form-twenty-five", file.filename);
        return filePath.replace(/\\/g, "/");
      });
    }
    let newWallInsulationPhotos = [];
    if (req.files && req.files.wallInsulationPhotos) {
      const files = Array.isArray(req.files.wallInsulationPhotos)
        ? req.files.wallInsulationPhotos
        : [req.files.wallInsulationPhotos];
      newWallInsulationPhotos = files.map((file) => {
        let filePath = path.join("uploads", `user-${userId}`, "form-twenty-five", file.filename);
        return filePath.replace(/\\/g, "/");
      });
    }

    // Combine remaining images with new uploads
    updatedAlternativeWallsPhotos = [...updatedAlternativeWallsPhotos, ...newAlternativeWallsPhotos];
    updatedWallInsulationPhotos = [...updatedWallInsulationPhotos, ...newWallInsulationPhotos];

    // Prepare the update object
    const updateData = {
      ...req.body,
      alternativeWallsPhotos: updatedAlternativeWallsPhotos,
      wallInsulationPhotos: updatedWallInsulationPhotos,
    };

    // Update the document
    const updatedForm = await FormTwentyFive.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    return res.status(200).json({
      success: true,
      message: "Form Twenty-Five updated successfully",
      data: updatedForm,
    });
  } catch (error) {
    console.error("Error updating Form Twenty-Five:", error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: "A Form Twenty-Five document already exists for this process.",
      });
    }
    if (error.name === "ValidationError") {
      return res.status(400).json({ success: false, error: error.message });
    }
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};