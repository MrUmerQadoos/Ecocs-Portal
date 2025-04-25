import path from "path";
import fs from "fs";
import { FormFifteen } from "../model/formfifteen.js";

// Create a new Form Fifteen
export const createFormFifteen = async (req, res) => {
  try {
    const { processId } = req.body;

    // Check if a FormFifteen document already exists for this processId
    const existingForm = await FormFifteen.findOne({ processId });
    if (existingForm) {
      return res.status(400).json({
        success: false,
        error: "A Form Fifteen document already exists for this process.",
      });
    }

    const formData = req.body;
    const filePaths = {
      solarPhotos: [],
    };

    // Handle file uploads for solarPhotos (optional)
    if (req.files && req.files.solarPhotos) {
      const files = Array.isArray(req.files.solarPhotos) ? req.files.solarPhotos : [req.files.solarPhotos];
      files.forEach((file) => {
        let filePath = path.join("uploads", `user-${formData.userId}`, "form-fifteen", file.filename);
        filePath = filePath.replace(/\\/g, "/");
        filePaths.solarPhotos.push(filePath);
      });
    }

    const newForm = new FormFifteen({ ...formData, ...filePaths });
    await newForm.save();

    return res.status(201).json({
      success: true,
      message: "Form Fifteen created successfully",
      data: newForm,
    });
  } catch (error) {
    console.error("Error creating Form Fifteen:", error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: "A Form Fifteen document already exists for this process.",
      });
    }
    if (error.name === "ValidationError") {
      return res.status(400).json({ success: false, error: error.message });
    }
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

// Get Form Fifteen data by processId
export const getFormFifteenByProcess = async (req, res) => {
  try {
    const { processId } = req.query;
    if (!processId) {
      return res.status(400).json({ success: false, error: "Process ID is required" });
    }

    const form = await FormFifteen.findOne({ processId });
    return res.status(200).json({ success: true, data: form ? [form] : [] });
  } catch (error) {
    console.error("Error fetching Form Fifteen data:", error);
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

// Update Form Fifteen with photo uploads and deletions
export const updateFormFifteen = async (req, res) => {
  try {
    const { id } = req.params;
    const formData = req.body;

    // Parse deleted images (optional)
    let deletedSolarPhotos = [];
    if (req.body.deletedSolarPhotos) {
      deletedSolarPhotos =
        typeof req.body.deletedSolarPhotos === "string"
          ? JSON.parse(req.body.deletedSolarPhotos)
          : req.body.deletedSolarPhotos;
    }

    // Convert absolute URLs to relative paths for comparison
    const relativeDeletedSolarPhotos = deletedSolarPhotos.map((img) =>
      img.replace("http://localhost:3000/", "")
    );

    // Fetch the existing document
    const existingForm = await FormFifteen.findById(id);
    if (!existingForm) {
      return res.status(404).json({ success: false, message: "Form Fifteen not found" });
    }

    // Remove deleted images from existing array (optional)
    let updatedSolarPhotos = existingForm.solarPhotos.filter(
      (photo) => !relativeDeletedSolarPhotos.includes(photo)
    );

    // Delete physical files from the server (optional)
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

    relativeDeletedSolarPhotos.forEach(deleteImage);

    // Process new file uploads (optional)
    let newSolarPhotos = [];
    if (req.files && req.files.solarPhotos) {
      const files = Array.isArray(req.files.solarPhotos) ? req.files.solarPhotos : [req.files.solarPhotos];
      newSolarPhotos = files.map((file) => {
        let filePath = path.join("uploads", `user-${formData.userId}`, "form-fifteen", file.filename);
        return filePath.replace(/\\/g, "/");
      });
    }

    // Combine remaining images with new uploads (optional)
    updatedSolarPhotos = [...updatedSolarPhotos, ...newSolarPhotos];

    // Prepare the update object
    const updateData = {
      ...formData,
      solarPhotos: updatedSolarPhotos,
    };

    // Update the document
    const updatedForm = await FormFifteen.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    return res.status(200).json({
      success: true,
      message: "Form Fifteen updated successfully",
      data: updatedForm,
    });
  } catch (error) {
    console.error("Error updating Form Fifteen:", error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: "A Form Fifteen document already exists for this process.",
      });
    }
    if (error.name === "ValidationError") {
      return res.status(400).json({ success: false, error: error.message });
    }
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};