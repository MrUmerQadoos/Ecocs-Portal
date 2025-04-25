import path from "path";
import fs from "fs";
import { FormFourteen } from "../model/formFourteen.js";

// Create a new Form Fourteen
export const createFormFourteen = async (req, res) => {
  try {
    const { processId } = req.body;

    // Check if a FormFourteen document already exists for this processId
    const existingForm = await FormFourteen.findOne({ processId });
    if (existingForm) {
      return res.status(400).json({
        success: false,
        error: "A Form Fourteen document already exists for this process.",
      });
    }

    const formData = req.body;
    const filePaths = {
      waterHeatingPhotos: [],
    };

    // Handle file uploads for waterHeatingPhotos
    if (req.files && req.files.waterHeatingPhotos) {
      const files = Array.isArray(req.files.waterHeatingPhotos)
        ? req.files.waterHeatingPhotos
        : [req.files.waterHeatingPhotos];
      files.forEach((file) => {
        let filePath = path.join("uploads", `user-${formData.userId}`, "form-fourteen", file.filename);
        filePath = filePath.replace(/\\/g, "/");
        filePaths.waterHeatingPhotos.push(filePath);
      });
    }

    const newForm = new FormFourteen({ ...formData, ...filePaths });
    await newForm.save();

    return res.status(201).json({
      success: true,
      message: "Form Fourteen created successfully",
      data: newForm,
    });
  } catch (error) {
    console.error("Error creating Form Fourteen:", error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: "A Form Fourteen document already exists for this process.",
      });
    }
    if (error.name === "ValidationError") {
      return res.status(400).json({ success: false, error: error.message });
    }
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

// Get Form Fourteen data by processId
export const getFormFourteenByProcess = async (req, res) => {
  try {
    const { processId } = req.query;
    if (!processId) {
      return res.status(400).json({ success: false, error: "Process ID is required" });
    }

    const form = await FormFourteen.find({ processId });
    return res.status(200).json({ success: true, data: form });
  } catch (error) {
    console.error("Error fetching Form Fourteen data:", error);
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

// Update Form Fourteen with photo uploads and deletions
export const updateFormFourteen = async (req, res) => {
  try {
    const { id } = req.params;
    const formData = req.body;

    // Parse deleted images for waterHeatingPhotos
    let deletedWaterHeatingPhotos = [];
    if (req.body.deletedWaterHeatingPhotos) {
      deletedWaterHeatingPhotos =
        typeof req.body.deletedWaterHeatingPhotos === "string"
          ? JSON.parse(req.body.deletedWaterHeatingPhotos)
          : req.body.deletedWaterHeatingPhotos;
    }

    // Convert absolute URLs to relative paths for comparison
    const relativeDeletedWaterHeatingPhotos = deletedWaterHeatingPhotos.map((img) =>
      img.replace("http://localhost:3000/", "")
    );

    // Fetch the existing document
    const existingForm = await FormFourteen.findById(id);
    if (!existingForm) {
      return res.status(404).json({ success: false, message: "Form Fourteen not found" });
    }

    // Remove deleted images from existing array
    let updatedWaterHeatingPhotos = existingForm.waterHeatingPhotos.filter(
      (photo) => !relativeDeletedWaterHeatingPhotos.includes(photo)
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

    relativeDeletedWaterHeatingPhotos.forEach(deleteImage);

    // Process new file uploads for waterHeatingPhotos
    let newWaterHeatingPhotos = [];
    if (req.files && req.files.waterHeatingPhotos) {
      const files = Array.isArray(req.files.waterHeatingPhotos)
        ? req.files.waterHeatingPhotos
        : [req.files.waterHeatingPhotos];
      newWaterHeatingPhotos = files.map((file) => {
        let filePath = path.join("uploads", `user-${formData.userId}`, "form-fourteen", file.filename);
        return filePath.replace(/\\/g, "/");
      });
    }

    // Combine remaining images with new uploads
    updatedWaterHeatingPhotos = [...updatedWaterHeatingPhotos, ...newWaterHeatingPhotos];

    // Prepare the update object
    const updateData = {
      ...formData,
      waterHeatingPhotos: updatedWaterHeatingPhotos,
    };

    // Update the document
    const updatedForm = await FormFourteen.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    return res.status(200).json({
      success: true,
      message: "Form Fourteen updated successfully",
      data: updatedForm,
    });
  } catch (error) {
    console.error("Error updating Form Fourteen:", error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: "A Form Fourteen document already exists for this process.",
      });
    }
    if (error.name === "ValidationError") {
      return res.status(400).json({ success: false, error: error.message });
    }
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};