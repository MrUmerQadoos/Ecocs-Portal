import path from "path";
import fs from "fs";
import { FormEight } from "../model/formEight.js";

// Create a new Form Eight
export const createFormEight = async (req, res) => {
  try {
    const { processId } = req.body;

    // Check if a FormEight document already exists for this processId
    const existingForm = await FormEight.findOne({ processId });
    if (existingForm) {
      return res.status(400).json({
        success: false,
        error: "A Form Eight document already exists for this process.",
      });
    }

    const formData = req.body;
    const filePaths = {
      constructionPhotos: [],
      loftInsulationPhotos: [],
    };

    // Handle file uploads for each group
    if (req.files) {
      for (let field in req.files) {
        req.files[field].forEach((file) => {
          let filePath = path.join("uploads", `user-${formData.userId}`, "form-eight", file.filename);
          filePath = filePath.replace(/\\/g, "/");
          if (field === "constructionPhotos") {
            filePaths.constructionPhotos.push(filePath);
          } else if (field === "loftInsulationPhotos") {
            filePaths.loftInsulationPhotos.push(filePath);
          }
        });
      }
    }

    const newForm = new FormEight({ ...formData, ...filePaths });
    await newForm.save();

    return res.status(201).json({
      success: true,
      message: "Form Eight created successfully",
      data: newForm,
    });
  } catch (error) {
    console.error("Error creating Form Eight:", error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: "A Form Eight document already exists for this process.",
      });
    }
    if (error.name === "ValidationError") {
      return res.status(400).json({ success: false, error: error.message });
    }
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

// Get Form Eight data by processId
export const getFormEightByProcess = async (req, res) => {
  try {
    const { processId } = req.query;
    if (!processId) {
      return res.status(400).json({ success: false, error: "Process ID is required" });
    }

    const form = await FormEight.findOne({ processId });
    return res.status(200).json({ success: true, data: form ? [form] : [] });
  } catch (error) {
    console.error("Error fetching Form Eight data:", error);
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

// Update Form Eight with photo uploads and deletions
export const updateFormEight = async (req, res) => {
  try {
    const { id } = req.params;
    const formData = req.body;

    // Parse deleted images for each group
    let deletedConstruction = [];
    let deletedLoftInsulation = [];

    if (req.body.deletedConstruction) {
      deletedConstruction =
        typeof req.body.deletedConstruction === "string"
          ? JSON.parse(req.body.deletedConstruction)
          : req.body.deletedConstruction;
    }
    if (req.body.deletedLoftInsulation) {
      deletedLoftInsulation =
        typeof req.body.deletedLoftInsulation === "string"
          ? JSON.parse(req.body.deletedLoftInsulation)
          : req.body.deletedLoftInsulation;
    }

    // Convert absolute URLs to relative paths for comparison
    const relativeDeletedConstruction = deletedConstruction.map((img) =>
      img.replace("http://localhost:3000/", "")
    );
    const relativeDeletedLoftInsulation = deletedLoftInsulation.map((img) =>
      img.replace("http://localhost:3000/", "")
    );

    // Fetch the existing document
    const existingForm = await FormEight.findById(id);
    if (!existingForm) {
      return res.status(404).json({ success: false, message: "Form Eight not found" });
    }

    // Remove deleted images from existing arrays
    let updatedConstructionPhotos = existingForm.constructionPhotos.filter(
      (photo) => !relativeDeletedConstruction.includes(photo)
    );
    let updatedLoftInsulationPhotos = existingForm.loftInsulationPhotos.filter(
      (photo) => !relativeDeletedLoftInsulation.includes(photo)
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

    relativeDeletedConstruction.forEach(deleteImage);
    relativeDeletedLoftInsulation.forEach(deleteImage);

    // Process new file uploads
    let newConstructionPhotos = [];
    let newLoftInsulationPhotos = [];

    if (req.files) {
      if (req.files.constructionPhotos) {
        newConstructionPhotos = req.files.constructionPhotos.map((file) => {
          let filePath = path.join("uploads", `user-${formData.userId}`, "form-eight", file.filename);
          return filePath.replace(/\\/g, "/");
        });
      }
      if (req.files.loftInsulationPhotos) {
        newLoftInsulationPhotos = req.files.loftInsulationPhotos.map((file) => {
          let filePath = path.join("uploads", `user-${formData.userId}`, "form-eight", file.filename);
          return filePath.replace(/\\/g, "/");
        });
      }
    }

    // Combine remaining images with new uploads
    updatedConstructionPhotos = [...updatedConstructionPhotos, ...newConstructionPhotos];
    updatedLoftInsulationPhotos = [...updatedLoftInsulationPhotos, ...newLoftInsulationPhotos];

    // Prepare the update object
    const updateData = {
      ...formData,
      constructionPhotos: updatedConstructionPhotos,
      loftInsulationPhotos: updatedLoftInsulationPhotos,
    };

    // Update the document
    const updatedForm = await FormEight.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    return res.status(200).json({
      success: true,
      message: "Form Eight updated successfully",
      data: updatedForm,
    });
  } catch (error) {
    console.error("Error updating Form Eight:", error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: "A Form Eight document already exists for this process.",
      });
    }
    if (error.name === "ValidationError") {
      return res.status(400).json({ success: false, error: error.message });
    }
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};