import path from "path";
import fs from "fs";
import { FormSixteen } from "../model/formSixteen.js";

// Create a new Form Sixteen
export const createFormSixteen = async (req, res) => {
  try {
    const { processId } = req.body;

    // Check if a FormSixteen document already exists for this processId
    const existingForm = await FormSixteen.findOne({ processId });
    if (existingForm) {
      return res.status(400).json({
        success: false,
        error: "A Form Sixteen document already exists for this process.",
      });
    }

    const formData = req.body;
    const filePaths = {
      wwhrsPhotos: [],
    };

    // Handle file uploads for wwhrsPhotos
    if (req.files && req.files.wwhrsPhotos) {
      const files = Array.isArray(req.files.wwhrsPhotos) ? req.files.wwhrsPhotos : [req.files.wwhrsPhotos];
      files.forEach((file) => {
        let filePath = path.join("uploads", `user-${formData.userId}`, "form-sixteen", file.filename);
        filePath = filePath.replace(/\\/g, "/");
        filePaths.wwhrsPhotos.push(filePath);
      });
    }

    const newForm = new FormSixteen({ ...formData, ...filePaths });
    await newForm.save();

    return res.status(201).json({
      success: true,
      message: "Form Sixteen created successfully",
      data: newForm,
    });
  } catch (error) {
    console.error("Error creating Form Sixteen:", error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: "A Form Sixteen document already exists for this process.",
      });
    }
    if (error.name === "ValidationError") {
      return res.status(400).json({ success: false, error: error.message });
    }
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

// Get Form Sixteen data by processId
export const getFormSixteenByProcess = async (req, res) => {
  try {
    const { processId } = req.query;
    if (!processId) {
      return res.status(400).json({ success: false, error: "Process ID is required" });
    }

    const form = await FormSixteen.findOne({ processId });
    return res.status(200).json({ success: true, data: form ? [form] : [] });
  } catch (error) {
    console.error("Error fetching Form Sixteen data:", error);
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

// Update Form Sixteen with photo uploads and deletions
export const updateFormSixteen = async (req, res) => {
  try {
    const { id } = req.params;
    const formData = req.body;

    // Parse deleted images
    let deletedWwhrsPhotos = [];
    if (req.body.deletedWwhrsPhotos) {
      deletedWwhrsPhotos =
        typeof req.body.deletedWwhrsPhotos === "string"
          ? JSON.parse(req.body.deletedWwhrsPhotos)
          : req.body.deletedWwhrsPhotos;
    }

    // Convert absolute URLs to relative paths for comparison
    const relativeDeletedWwhrsPhotos = deletedWwhrsPhotos.map((img) =>
      img.replace("http://localhost:3000/", "")
    );

    // Fetch the existing document
    const existingForm = await FormSixteen.findById(id);
    if (!existingForm) {
      return res.status(404).json({ success: false, message: "Form Sixteen not found" });
    }

    // Remove deleted images from existing array
    let updatedWwhrsPhotos = existingForm.wwhrsPhotos.filter(
      (photo) => !relativeDeletedWwhrsPhotos.includes(photo)
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

    relativeDeletedWwhrsPhotos.forEach(deleteImage);

    // Process new file uploads
    let newWwhrsPhotos = [];
    if (req.files && req.files.wwhrsPhotos) {
      const files = Array.isArray(req.files.wwhrsPhotos) ? req.files.wwhrsPhotos : [req.files.wwhrsPhotos];
      newWwhrsPhotos = files.map((file) => {
        let filePath = path.join("uploads", `user-${formData.userId}`, "form-sixteen", file.filename);
        return filePath.replace(/\\/g, "/");
      });
    }

    // Combine remaining images with new uploads
    updatedWwhrsPhotos = [...updatedWwhrsPhotos, ...newWwhrsPhotos];

    // Prepare the update object
    const updateData = {
      ...formData,
      wwhrsPhotos: updatedWwhrsPhotos,
    };

    // Update the document
    const updatedForm = await FormSixteen.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    return res.status(200).json({
      success: true,
      message: "Form Sixteen updated successfully",
      data: updatedForm,
    });
  } catch (error) {
    console.error("Error updating Form Sixteen:", error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: "A Form Sixteen document already exists for this process.",
      });
    }
    if (error.name === "ValidationError") {
      return res.status(400).json({ success: false, error: error.message });
    }
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};