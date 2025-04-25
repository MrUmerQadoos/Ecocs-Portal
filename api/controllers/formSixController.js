import path from "path";
import fs from "fs";
import { FormSix } from "../model/formSix.js";

// Create a new Form Six
export const createFormSix = async (req, res) => {
  try {
    const { processId } = req.body;

    // Check if a FormSix document already exists for this processId
    const existingForm = await FormSix.findOne({ processId });
    if (existingForm) {
      return res.status(400).json({
        success: false,
        error: "A Form Six document already exists for this process.",
      });
    }

    const formData = req.body;
    const filePaths = {
      constructionPhotos: [],
      insulationPhotos: [],
      thicknessPhotos: [],
    };

    // Handle file uploads for each group
    if (req.files) {
      for (let field in req.files) {
        req.files[field].forEach((file) => {
          let filePath = path.join("uploads", `user-${formData.userId}`, "form-six", file.filename);
          filePath = filePath.replace(/\\/g, "/");
          if (field === "constructionPhotos") {
            filePaths.constructionPhotos.push(filePath);
          } else if (field === "insulationPhotos") {
            filePaths.insulationPhotos.push(filePath);
          } else if (field === "thicknessPhotos") {
            filePaths.thicknessPhotos.push(filePath);
          }
        });
      }
    }

    const newForm = new FormSix({ ...formData, ...filePaths });
    await newForm.save();

    return res.status(201).json({
      success: true,
      message: "Form Six created successfully",
      data: newForm,
    });
  } catch (error) {
    console.error("Error creating Form Six:", error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: "A Form Six document already exists for this process.",
      });
    }
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

// Get Form Six data by processId
export const getFormSixByProcess = async (req, res) => {
  try {
    const { processId } = req.query;
    if (!processId) {
      return res.status(400).json({ success: false, error: "Process ID is required" });
    }

    const form = await FormSix.findOne({ processId });
    return res.status(200).json({ success: true, data: form });
  } catch (error) {
    console.error("Error fetching Form Six data:", error);
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

// Update Form Six with photo uploads and deletions
export const updateFormSix = async (req, res) => {
  try {
    const { id } = req.params;
    const formData = req.body;

    // Parse deleted images for each group
    let deletedConstruction = [];
    let deletedInsulation = [];
    let deletedThickness = [];

    if (req.body.deletedConstruction) {
      deletedConstruction =
        typeof req.body.deletedConstruction === "string"
          ? JSON.parse(req.body.deletedConstruction)
          : req.body.deletedConstruction;
    }
    if (req.body.deletedInsulation) {
      deletedInsulation =
        typeof req.body.deletedInsulation === "string"
          ? JSON.parse(req.body.deletedInsulation)
          : req.body.deletedInsulation;
    }
    if (req.body.deletedThickness) {
      deletedThickness =
        typeof req.body.deletedThickness === "string"
          ? JSON.parse(req.body.deletedThickness)
          : req.body.deletedThickness;
    }

    // Convert absolute URLs to relative paths for comparison
    const relativeDeletedConstruction = deletedConstruction.map((img) =>
      img.replace("http://localhost:3000/", "")
    );
    const relativeDeletedInsulation = deletedInsulation.map((img) =>
      img.replace("http://localhost:3000/", "")
    );
    const relativeDeletedThickness = deletedThickness.map((img) =>
      img.replace("http://localhost:3000/", "")
    );

    // Fetch the existing document
    const existingForm = await FormSix.findById(id);
    if (!existingForm) {
      return res.status(404).json({ success: false, message: "Form Six not found" });
    }

    // Remove deleted images from existing arrays
    let updatedConstructionPhotos = existingForm.constructionPhotos.filter(
      (photo) => !relativeDeletedConstruction.includes(photo)
    );
    let updatedInsulationPhotos = existingForm.insulationPhotos.filter(
      (photo) => !relativeDeletedInsulation.includes(photo)
    );
    let updatedThicknessPhotos = existingForm.thicknessPhotos.filter(
      (photo) => !relativeDeletedThickness.includes(photo)
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
    relativeDeletedInsulation.forEach(deleteImage);
    relativeDeletedThickness.forEach(deleteImage);

    // Process new file uploads
    let newConstructionPhotos = [];
    let newInsulationPhotos = [];
    let newThicknessPhotos = [];

    if (req.files) {
      if (req.files.constructionPhotos) {
        newConstructionPhotos = req.files.constructionPhotos.map((file) => {
          let filePath = path.join("uploads", `user-${formData.userId}`, "form-six", file.filename);
          return filePath.replace(/\\/g, "/");
        });
      }
      if (req.files.insulationPhotos) {
        newInsulationPhotos = req.files.insulationPhotos.map((file) => {
          let filePath = path.join("uploads", `user-${formData.userId}`, "form-six", file.filename);
          return filePath.replace(/\\/g, "/");
        });
      }
      if (req.files.thicknessPhotos) {
        newThicknessPhotos = req.files.thicknessPhotos.map((file) => {
          let filePath = path.join("uploads", `user-${formData.userId}`, "form-six", file.filename);
          return filePath.replace(/\\/g, "/");
        });
      }
    }

    // Combine remaining images with new uploads
    updatedConstructionPhotos = [...updatedConstructionPhotos, ...newConstructionPhotos];
    updatedInsulationPhotos = [...updatedInsulationPhotos, ...newInsulationPhotos];
    updatedThicknessPhotos = [...updatedThicknessPhotos, ...newThicknessPhotos];

    // Prepare the update object
    const updateData = {
      ...formData,
      constructionPhotos: updatedConstructionPhotos,
      insulationPhotos: updatedInsulationPhotos,
      thicknessPhotos: updatedThicknessPhotos,
    };

    // Update the document
    const updatedForm = await FormSix.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    return res.status(200).json({
      success: true,
      message: "Form Six updated successfully",
      data: updatedForm,
    });
  } catch (error) {
    console.error("Error updating Form Six:", error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: "A Form Six document already exists for this process.",
      });
    }
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};