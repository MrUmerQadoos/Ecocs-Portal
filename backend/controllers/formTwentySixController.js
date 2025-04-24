import path from "path";
import fs from "fs";
import { FormTwentySix } from "../model/formTwentySix.js";

// Create a new Form Twenty-Six
export const createFormTwentySix = async (req, res) => {
  try {
    const { processId, userId } = req.body;

    // Check if a FormTwentySix document already exists for this processId
    const existingForm = await FormTwentySix.findOne({ processId });
    if (existingForm) {
      return res.status(400).json({
        success: false,
        error: "A Form Twenty-Six document already exists for this process.",
      });
    }

    const formData = req.body;
    const filePaths = {
      constructionPhotos: [],
      loftInsulationDepthPhotos: [],
      extensionRoomInRoofPhotos: [],
    };

    // Handle file uploads
    if (req.files) {
      if (req.files.constructionPhotos) {
        const files = Array.isArray(req.files.constructionPhotos)
          ? req.files.constructionPhotos
          : [req.files.constructionPhotos];
        files.forEach((file) => {
          let filePath = path.join("uploads", `user-${userId}`, "form-twenty-six", file.filename);
          filePath = filePath.replace(/\\/g, "/");
          filePaths.constructionPhotos.push(filePath);
        });
      }
      if (req.files.loftInsulationDepthPhotos) {
        const files = Array.isArray(req.files.loftInsulationDepthPhotos)
          ? req.files.loftInsulationDepthPhotos
          : [req.files.loftInsulationDepthPhotos];
        files.forEach((file) => {
          let filePath = path.join("uploads", `user-${userId}`, "form-twenty-six", file.filename);
          filePath = filePath.replace(/\\/g, "/");
          filePaths.loftInsulationDepthPhotos.push(filePath);
        });
      }
      if (req.files.extensionRoomInRoofPhotos) {
        const files = Array.isArray(req.files.extensionRoomInRoofPhotos)
          ? req.files.extensionRoomInRoofPhotos
          : [req.files.extensionRoomInRoofPhotos];
        files.forEach((file) => {
          let filePath = path.join("uploads", `user-${userId}`, "form-twenty-six", file.filename);
          filePath = filePath.replace(/\\/g, "/");
          filePaths.extensionRoomInRoofPhotos.push(filePath);
        });
      }
    }

    const newForm = new FormTwentySix({ ...formData, ...filePaths });
    await newForm.save();

    return res.status(201).json({
      success: true,
      message: "Form Twenty-Six created successfully",
      data: newForm,
    });
  } catch (error) {
    console.error("Error creating Form Twenty-Six:", error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: "A Form Twenty-Six document already exists for this process.",
      });
    }
    if (error.name === "ValidationError") {
      return res.status(400).json({ success: false, error: error.message });
    }
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

// Get Form Twenty-Six data by processId
export const getFormTwentySixByProcess = async (req, res) => {
  try {
    const { processId } = req.query;
    if (!processId) {
      return res.status(400).json({ success: false, error: "Process ID is required" });
    }

    const form = await FormTwentySix.findOne({ processId });
    return res.status(200).json({ success: true, data: form ? [form] : [] });
  } catch (error) {
    console.error("Error fetching Form Twenty-Six data:", error);
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

// Update Form Twenty-Six with photo uploads and deletions
export const updateFormTwentySix = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    // Parse deleted images
    let deletedConstructionPhotos = [];
    if (req.body.deletedConstructionPhotos) {
      deletedConstructionPhotos =
        typeof req.body.deletedConstructionPhotos === "string"
          ? JSON.parse(req.body.deletedConstructionPhotos)
          : req.body.deletedConstructionPhotos;
    }
    let deletedLoftInsulationDepthPhotos = [];
    if (req.body.deletedLoftInsulationDepthPhotos) {
      deletedLoftInsulationDepthPhotos =
        typeof req.body.deletedLoftInsulationDepthPhotos === "string"
          ? JSON.parse(req.body.deletedLoftInsulationDepthPhotos)
          : req.body.deletedLoftInsulationDepthPhotos;
    }
    let deletedExtensionRoomInRoofPhotos = [];
    if (req.body.deletedExtensionRoomInRoofPhotos) {
      deletedExtensionRoomInRoofPhotos =
        typeof req.body.deletedExtensionRoomInRoofPhotos === "string"
          ? JSON.parse(req.body.deletedExtensionRoomInRoofPhotos)
          : req.body.deletedExtensionRoomInRoofPhotos;
    }

    // Convert absolute URLs to relative paths
    const relativeDeletedConstructionPhotos = deletedConstructionPhotos.map((img) =>
      img.replace("http://localhost:3000/", "")
    );
    const relativeDeletedLoftInsulationPhotos = deletedLoftInsulationDepthPhotos.map((img) =>
      img.replace("http://localhost:3000/", "")
    );
    const relativeDeletedRoomInRoofPhotos = deletedExtensionRoomInRoofPhotos.map((img) =>
      img.replace("http://localhost:3000/", "")
    );

    // Fetch the existing document
    const existingForm = await FormTwentySix.findById(id);
    if (!existingForm) {
      return res.status(404).json({ success: false, message: "Form Twenty-Six not found" });
    }

    // Remove deleted images from existing arrays
    let updatedConstructionPhotos = existingForm.constructionPhotos.filter(
      (photo) => !relativeDeletedConstructionPhotos.includes(photo)
    );
    let updatedLoftInsulationDepthPhotos = existingForm.loftInsulationDepthPhotos.filter(
      (photo) => !relativeDeletedLoftInsulationPhotos.includes(photo)
    );
    let updatedExtensionRoomInRoofPhotos = existingForm.extensionRoomInRoofPhotos.filter(
      (photo) => !relativeDeletedRoomInRoofPhotos.includes(photo)
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

    relativeDeletedConstructionPhotos.forEach(deleteImage);
    relativeDeletedLoftInsulationPhotos.forEach(deleteImage);
    relativeDeletedRoomInRoofPhotos.forEach(deleteImage);

    // Process new file uploads
    let newConstructionPhotos = [];
    if (req.files && req.files.constructionPhotos) {
      const files = Array.isArray(req.files.constructionPhotos)
        ? req.files.constructionPhotos
        : [req.files.constructionPhotos];
      newConstructionPhotos = files.map((file) => {
        let filePath = path.join("uploads", `user-${userId}`, "form-twenty-six", file.filename);
        return filePath.replace(/\\/g, "/");
      });
    }
    let newLoftInsulationDepthPhotos = [];
    if (req.files && req.files.loftInsulationDepthPhotos) {
      const files = Array.isArray(req.files.loftInsulationDepthPhotos)
        ? req.files.loftInsulationDepthPhotos
        : [req.files.loftInsulationDepthPhotos];
      newLoftInsulationDepthPhotos = files.map((file) => {
        let filePath = path.join("uploads", `user-${userId}`, "form-twenty-six", file.filename);
        return filePath.replace(/\\/g, "/");
      });
    }
    let newExtensionRoomInRoofPhotos = [];
    if (req.files && req.files.extensionRoomInRoofPhotos) {
      const files = Array.isArray(req.files.extensionRoomInRoofPhotos)
        ? req.files.extensionRoomInRoofPhotos
        : [req.files.extensionRoomInRoofPhotos];
      newExtensionRoomInRoofPhotos = files.map((file) => {
        let filePath = path.join("uploads", `user-${userId}`, "form-twenty-six", file.filename);
        return filePath.replace(/\\/g, "/");
      });
    }

    // Combine remaining images with new uploads
    updatedConstructionPhotos = [...updatedConstructionPhotos, ...newConstructionPhotos];
    updatedLoftInsulationDepthPhotos = [...updatedLoftInsulationDepthPhotos, ...newLoftInsulationDepthPhotos];
    updatedExtensionRoomInRoofPhotos = [...updatedExtensionRoomInRoofPhotos, ...newExtensionRoomInRoofPhotos];

    // Prepare the update object
    const updateData = {
      ...req.body,
      constructionPhotos: updatedConstructionPhotos,
      loftInsulationDepthPhotos: updatedLoftInsulationDepthPhotos,
      extensionRoomInRoofPhotos: updatedExtensionRoomInRoofPhotos,
    };

    // Update the document
    const updatedForm = await FormTwentySix.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    return res.status(200).json({
      success: true,
      message: "Form Twenty-Six updated successfully",
      data: updatedForm,
    });
  } catch (error) {
    console.error("Error updating Form Twenty-Six:", error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: "A Form Twenty-Six document already exists for this process.",
      });
    }
    if (error.name === "ValidationError") {
      return res.status(400).json({ success: false, error: error.message });
    }
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};