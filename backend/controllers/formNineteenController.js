import path from "path";
import fs from "fs";
import { FormNineteen } from "../model/formNineteen.js";

// Create a new Form Nineteen
export const createFormNineteen = async (req, res) => {
  try {
    const { processId } = req.body;

    // Check if a Form Nineteen document already exists for this processId
    const existingForm = await FormNineteen.findOne({ processId });
    if (existingForm) {
      return res.status(400).json({
        success: false,
        error: "A Form Nineteen document already exists for this process.",
      });
    }

    const formData = req.body;
    const filePaths = {
      otherDetailsPhotos: [],
    };

    // Handle file uploads for otherDetailsPhotos
    if (req.files && req.files.otherDetailsPhotos) {
      const files = Array.isArray(req.files.otherDetailsPhotos)
        ? req.files.otherDetailsPhotos
        : [req.files.otherDetailsPhotos];
      files.forEach((file) => {
        let filePath = path.join("uploads", `user-${formData.userId}`, "form-nineteen", file.filename);
        filePath = filePath.replace(/\\/g, "/");
        filePaths.otherDetailsPhotos.push(filePath);
      });
    }

    const newForm = new FormNineteen({ ...formData, ...filePaths });
    await newForm.save();

    return res.status(201).json({
      success: true,
      message: "Form Nineteen created successfully",
      data: newForm,
    });
  } catch (error) {
    console.error("Error creating Form Nineteen:", error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: "A Form Nineteen document already exists for this process.",
      });
    }
    if (error.name === "ValidationError") {
      return res.status(400).json({ success: false, error: error.message });
    }
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

// Get Form Nineteen data by processId
export const getFormNineteenByProcess = async (req, res) => {
  try {
    const { processId } = req.query;
    if (!processId) {
      return res.status(400).json({ success: false, error: "Process ID is required" });
    }

    const form = await FormNineteen.find({ processId });
    return res.status(200).json({ success: true, data: form });
  } catch (error) {
    console.error("Error fetching Form Nineteen data:", error);
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

// Update Form Nineteen with photo uploads and deletions
export const updateFormNineteen = async (req, res) => {
  try {
    const { id } = req.params;
    const formData = req.body;

    // Parse deleted images for otherDetailsPhotos
    let deletedOtherDetailsPhotos = [];
    if (req.body.deletedOtherDetailsPhotos) {
      deletedOtherDetailsPhotos =
        typeof req.body.deletedOtherDetailsPhotos === "string"
          ? JSON.parse(req.body.deletedOtherDetailsPhotos)
          : req.body.deletedOtherDetailsPhotos;
    }

    // Convert absolute URLs to relative paths for comparison
    const relativeDeletedPhotos = deletedOtherDetailsPhotos.map((img) =>
      img.replace("http://localhost:3000/", "")
    );

    // Fetch the existing document
    const existingForm = await FormNineteen.findById(id);
    if (!existingForm) {
      return res.status(404).json({ success: false, message: "Form Nineteen not found" });
    }

    // Remove deleted images from existing array
    let updatedOtherDetailsPhotos = existingForm.otherDetailsPhotos.filter(
      (photo) => !relativeDeletedPhotos.includes(photo)
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

    relativeDeletedPhotos.forEach(deleteImage);

    // Process new file uploads for otherDetailsPhotos
    let newOtherDetailsPhotos = [];
    if (req.files && req.files.otherDetailsPhotos) {
      const files = Array.isArray(req.files.otherDetailsPhotos)
        ? req.files.otherDetailsPhotos
        : [req.files.otherDetailsPhotos];
      newOtherDetailsPhotos = files.map((file) => {
        let filePath = path.join("uploads", `user-${formData.userId}`, "form-nineteen", file.filename);
        return filePath.replace(/\\/g, "/");
      });
    }

    // Combine remaining images with new uploads
    updatedOtherDetailsPhotos = [...updatedOtherDetailsPhotos, ...newOtherDetailsPhotos];

    // Prepare the update object
    const updateData = {
      ...formData,
      otherDetailsPhotos: updatedOtherDetailsPhotos,
    };

    // Update the document
    const updatedForm = await FormNineteen.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    return res.status(200).json({
      success: true,
      message: "Form Nineteen updated successfully",
      data: updatedForm,
    });
  } catch (error) {
    console.error("Error updating Form Nineteen:", error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: "A Form Nineteen document already exists for this process.",
      });
    }
    if (error.name === "ValidationError") {
      return res.status(400).json({ success: false, error: error.message });
    }
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};