import path from "path";
import fs from "fs";
import { FormThirteen } from "../model/formThirteen.js";

// Create a new Form Thirteen
export const createFormThirteen = async (req, res) => {
  try {
    const { processId, mainHeating1, mainHeating2, secondaryHeating } = req.body;

    // Check if a FormThirteen document already exists for this processId
    const existingForm = await FormThirteen.findOne({ processId });
    if (existingForm) {
      return res.status(400).json({
        success: false,
        error: "A Form Thirteen document already exists for this process.",
      });
    }

    const formData = {
      ...req.body,
      mainHeating1: JSON.parse(mainHeating1),
      mainHeating2: JSON.parse(mainHeating2),
      secondaryHeating,
    };

    const filePaths = {
      mainHeating1Photos: [],
      mainHeating2Photos: [],
      secondaryHeatingPhotos: [],
    };

    // Handle file uploads for mainHeating1Photos
    if (req.files && req.files.mainHeating1Photos) {
      const files = Array.isArray(req.files.mainHeating1Photos)
        ? req.files.mainHeating1Photos
        : [req.files.mainHeating1Photos];
      files.forEach((file) => {
        let filePath = path.join("uploads", `user-${formData.userId}`, "form-thirteen", file.filename);
        filePath = filePath.replace(/\\/g, "/");
        filePaths.mainHeating1Photos.push(filePath);
      });
    }

    // Handle file uploads for mainHeating2Photos
    if (req.files && req.files.mainHeating2Photos) {
      const files = Array.isArray(req.files.mainHeating2Photos)
        ? req.files.mainHeating2Photos
        : [req.files.mainHeating2Photos];
      files.forEach((file) => {
        let filePath = path.join("uploads", `user-${formData.userId}`, "form-thirteen", file.filename);
        filePath = filePath.replace(/\\/g, "/");
        filePaths.mainHeating2Photos.push(filePath);
      });
    }

    // Handle file uploads for secondaryHeatingPhotos
    if (req.files && req.files.secondaryHeatingPhotos) {
      const files = Array.isArray(req.files.secondaryHeatingPhotos)
        ? req.files.secondaryHeatingPhotos
        : [req.files.secondaryHeatingPhotos];
      files.forEach((file) => {
        let filePath = path.join("uploads", `user-${formData.userId}`, "form-thirteen", file.filename);
        filePath = filePath.replace(/\\/g, "/");
        filePaths.secondaryHeatingPhotos.push(filePath);
      });
    }

    const newForm = new FormThirteen({ ...formData, ...filePaths });
    await newForm.save();

    return res.status(201).json({
      success: true,
      message: "Form Thirteen created successfully",
      data: newForm,
    });
  } catch (error) {
    console.error("Error creating Form Thirteen:", error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: "A Form Thirteen document already exists for this process.",
      });
    }
    if (error.name === "ValidationError") {
      return res.status(400).json({ success: false, error: error.message });
    }
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

// Get Form Thirteen data by processId
export const getFormThirteenByProcess = async (req, res) => {
  try {
    const { processId } = req.query;
    if (!processId) {
      return res.status(400).json({ success: false, error: "Process ID is required" });
    }

    const form = await FormThirteen.find({ processId });
    return res.status(200).json({ success: true, data: form });
  } catch (error) {
    console.error("Error fetching Form Thirteen data:", error);
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

// Update Form Thirteen with photo uploads and deletions
export const updateFormThirteen = async (req, res) => {
  try {
    const { id } = req.params;
    const { mainHeating1, mainHeating2, secondaryHeating } = req.body;

    const formData = {
      ...req.body,
      mainHeating1: JSON.parse(mainHeating1),
      mainHeating2: JSON.parse(mainHeating2),
      secondaryHeating,
    };

    // Parse deleted images
    let deletedMainHeating1Photos = [];
    if (req.body.deletedMainHeating1Photos) {
      deletedMainHeating1Photos =
        typeof req.body.deletedMainHeating1Photos === "string"
          ? JSON.parse(req.body.deletedMainHeating1Photos)
          : req.body.deletedMainHeating1Photos;
    }

    let deletedMainHeating2Photos = [];
    if (req.body.deletedMainHeating2Photos) {
      deletedMainHeating2Photos =
        typeof req.body.deletedMainHeating2Photos === "string"
          ? JSON.parse(req.body.deletedMainHeating2Photos)
          : req.body.deletedMainHeating2Photos;
    }

    let deletedSecondaryHeatingPhotos = [];
    if (req.body.deletedSecondaryHeatingPhotos) {
      deletedSecondaryHeatingPhotos =
        typeof req.body.deletedSecondaryHeatingPhotos === "string"
          ? JSON.parse(req.body.deletedSecondaryHeatingPhotos)
          : req.body.deletedSecondaryHeatingPhotos;
    }

    // Convert absolute URLs to relative paths for comparison
    const relativeDeletedMainHeating1Photos = deletedMainHeating1Photos.map((img) =>
      img.replace("http://localhost:3000/", "")
    );
    const relativeDeletedMainHeating2Photos = deletedMainHeating2Photos.map((img) =>
      img.replace("http://localhost:3000/", "")
    );
    const relativeDeletedSecondaryHeatingPhotos = deletedSecondaryHeatingPhotos.map((img) =>
      img.replace("http://localhost:3000/", "")
    );

    // Fetch the existing document
    const existingForm = await FormThirteen.findById(id);
    if (!existingForm) {
      return res.status(404).json({ success: false, message: "Form Thirteen not found" });
    }

    // Remove deleted images from existing arrays
    let updatedMainHeating1Photos = existingForm.mainHeating1Photos.filter(
      (photo) => !relativeDeletedMainHeating1Photos.includes(photo)
    );
    let updatedMainHeating2Photos = existingForm.mainHeating2Photos.filter(
      (photo) => !relativeDeletedMainHeating2Photos.includes(photo)
    );
    let updatedSecondaryHeatingPhotos = existingForm.secondaryHeatingPhotos.filter(
      (photo) => !relativeDeletedSecondaryHeatingPhotos.includes(photo)
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

    relativeDeletedMainHeating1Photos.forEach(deleteImage);
    relativeDeletedMainHeating2Photos.forEach(deleteImage);
    relativeDeletedSecondaryHeatingPhotos.forEach(deleteImage);

    // Process new file uploads
    let newMainHeating1Photos = [];
    if (req.files && req.files.mainHeating1Photos) {
      const files = Array.isArray(req.files.mainHeating1Photos)
        ? req.files.mainHeating1Photos
        : [req.files.mainHeating1Photos];
      newMainHeating1Photos = files.map((file) => {
        let filePath = path.join("uploads", `user-${formData.userId}`, "form-thirteen", file.filename);
        return filePath.replace(/\\/g, "/");
      });
    }

    let newMainHeating2Photos = [];
    if (req.files && req.files.mainHeating2Photos) {
      const files = Array.isArray(req.files.mainHeating2Photos)
        ? req.files.mainHeating2Photos
        : [req.files.mainHeating2Photos];
      newMainHeating2Photos = files.map((file) => {
        let filePath = path.join("uploads", `user-${formData.userId}`, "form-thirteen", file.filename);
        return filePath.replace(/\\/g, "/");
      });
    }

    let newSecondaryHeatingPhotos = [];
    if (req.files && req.files.secondaryHeatingPhotos) {
      const files = Array.isArray(req.files.secondaryHeatingPhotos)
        ? req.files.secondaryHeatingPhotos
        : [req.files.secondaryHeatingPhotos];
      newSecondaryHeatingPhotos = files.map((file) => {
        let filePath = path.join("uploads", `user-${formData.userId}`, "form-thirteen", file.filename);
        return filePath.replace(/\\/g, "/");
      });
    }

    // Combine remaining images with new uploads
    updatedMainHeating1Photos = [...updatedMainHeating1Photos, ...newMainHeating1Photos];
    updatedMainHeating2Photos = [...updatedMainHeating2Photos, ...newMainHeating2Photos];
    updatedSecondaryHeatingPhotos = [...updatedSecondaryHeatingPhotos, ...newSecondaryHeatingPhotos];

    // Prepare the update object
    const updateData = {
      ...formData,
      mainHeating1Photos: updatedMainHeating1Photos,
      mainHeating2Photos: updatedMainHeating2Photos,
      secondaryHeatingPhotos: updatedSecondaryHeatingPhotos,
    };

    // Update the document
    const updatedForm = await FormThirteen.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    return res.status(200).json({
      success: true,
      message: "Form Thirteen updated successfully",
      data: updatedForm,
    });
  } catch (error) {
    console.error("Error updating Form Thirteen:", error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: "A Form Thirteen document already exists for this process.",
      });
    }
    if (error.name === "ValidationError") {
      return res.status(400).json({ success: false, error: error.message });
    }
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};