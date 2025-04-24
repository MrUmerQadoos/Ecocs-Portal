import path from "path";
import fs from "fs";
import { FormTwentyFour } from "../model/formTwentyFour.js";

// Create a new Form Twenty-Four
export const createFormTwentyFour = async (req, res) => {
  try {
    const { processId, userId } = req.body;

    // Check if a FormTwentyFour document already exists for this processId
    const existingForm = await FormTwentyFour.findOne({ processId });
    if (existingForm) {
      return res.status(400).json({
        success: false,
        error: "A Form Twenty-Four document already exists for this process.",
      });
    }

    const formData = req.body;
    const filePaths = {
      constructionPhotos: [],
      wallInsulationPhotos: [],
    };

    // Handle file uploads
    if (req.files) {
      if (req.files.constructionPhotos) {
        const files = Array.isArray(req.files.constructionPhotos)
          ? req.files.constructionPhotos
          : [req.files.constructionPhotos];
        files.forEach((file) => {
          let filePath = path.join("uploads", `user-${userId}`, "form-twenty-four", file.filename);
          filePath = filePath.replace(/\\/g, "/");
          filePaths.constructionPhotos.push(filePath);
        });
      }
      if (req.files.wallInsulationPhotos) {
        const files = Array.isArray(req.files.wallInsulationPhotos)
          ? req.files.wallInsulationPhotos
          : [req.files.wallInsulationPhotos];
        files.forEach((file) => {
          let filePath = path.join("uploads", `user-${userId}`, "form-twenty-four", file.filename);
          filePath = filePath.replace(/\\/g, "/");
          filePaths.wallInsulationPhotos.push(filePath);
        });
      }
    }

    const newForm = new FormTwentyFour({ ...formData, ...filePaths });
    await newForm.save();

    return res.status(201).json({
      success: true,
      message: "Form Twenty-Four created successfully",
      data: newForm,
    });
  } catch (error) {
    console.error("Error creating Form Twenty-Four:", error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: "A Form Twenty-Four document already exists for this process.",
      });
    }
    if (error.name === "ValidationError") {
      return res.status(400).json({ success: false, error: error.message });
    }
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

// Get Form Twenty-Four data by processId
export const getFormTwentyFourByProcess = async (req, res) => {
  try {
    const { processId } = req.query;
    if (!processId) {
      return res.status(400).json({ success: false, error: "Process ID is required" });
    }

    const form = await FormTwentyFour.findOne({ processId });
    return res.status(200).json({ success: true, data: form ? [form] : [] });
  } catch (error) {
    console.error("Error fetching Form Twenty-Four data:", error);
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

// Update Form Twenty-Four with photo uploads and deletions
export const updateFormTwentyFour = async (req, res) => {
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
    let deletedWallInsulationPhotos = [];
    if (req.body.deletedWallInsulationPhotos) {
      deletedWallInsulationPhotos =
        typeof req.body.deletedWallInsulationPhotos === "string"
          ? JSON.parse(req.body.deletedWallInsulationPhotos)
          : req.body.deletedWallInsulationPhotos;
    }

    // Convert absolute URLs to relative paths
    const relativeDeletedConstructionPhotos = deletedConstructionPhotos.map((img) =>
      img.replace("http://localhost:3000/", "")
    );
    const relativeDeletedWallInsulationPhotos = deletedWallInsulationPhotos.map((img) =>
      img.replace("http://localhost:3000/", "")
    );

    // Fetch the existing document
    const existingForm = await FormTwentyFour.findById(id);
    if (!existingForm) {
      return res.status(404).json({ success: false, message: "Form Twenty-Four not found" });
    }

    // Remove deleted images from existing arrays
    let updatedConstructionPhotos = existingForm.constructionPhotos.filter(
      (photo) => !relativeDeletedConstructionPhotos.includes(photo)
    );
    let updatedWallInsulationPhotos = existingForm.wallInsulationPhotos.filter(
      (photo) => !relativeDeletedWallInsulationPhotos.includes(photo)
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
    relativeDeletedWallInsulationPhotos.forEach(deleteImage);

    // Process new file uploads
    let newConstructionPhotos = [];
    if (req.files && req.files.constructionPhotos) {
      const files = Array.isArray(req.files.constructionPhotos)
        ? req.files.constructionPhotos
        : [req.files.constructionPhotos];
      newConstructionPhotos = files.map((file) => {
        let filePath = path.join("uploads", `user-${userId}`, "form-twenty-four", file.filename);
        return filePath.replace(/\\/g, "/");
      });
    }
    let newWallInsulationPhotos = [];
    if (req.files && req.files.wallInsulationPhotos) {
      const files = Array.isArray(req.files.wallInsulationPhotos)
        ? req.files.wallInsulationPhotos
        : [req.files.wallInsulationPhotos];
      newWallInsulationPhotos = files.map((file) => {
        let filePath = path.join("uploads", `user-${userId}`, "form-twenty-four", file.filename);
        return filePath.replace(/\\/g, "/");
      });
    }

    // Combine remaining images with new uploads
    updatedConstructionPhotos = [...updatedConstructionPhotos, ...newConstructionPhotos];
    updatedWallInsulationPhotos = [...updatedWallInsulationPhotos, ...newWallInsulationPhotos];

    // Prepare the update object
    const updateData = {
      ...req.body,
      constructionPhotos: updatedConstructionPhotos,
      wallInsulationPhotos: updatedWallInsulationPhotos,
    };

    // Update the document
    const updatedForm = await FormTwentyFour.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    return res.status(200).json({
      success: true,
      message: "Form Twenty-Four updated successfully",
      data: updatedForm,
    });
  } catch (error) {
    console.error("Error updating Form Twenty-Four:", error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: "A Form Twenty-Four document already exists for this process.",
      });
    }
    if (error.name === "ValidationError") {
      return res.status(400).json({ success: false, error: error.message });
    }
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};