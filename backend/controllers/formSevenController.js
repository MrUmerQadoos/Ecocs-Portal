import path from "path";
import fs from "fs"; // File system for deleting images
import { FormSeven } from "../model/formSeven.js";

// Create a new Form Seven
export const createFormSeven = async (req, res) => {
  try {
    const { userId, ...formData } = req.body;
    const filePaths = {
      wallInsulationPhotos: [],
      alternativeWallsPhotos: [],
      wallThicknessPhotos: [],
    };

    // Check if files are uploaded for each field
    if (req.files) {
      for (let field in req.files) {
        req.files[field].forEach((file) => {
          let filePath = path.join("uploads", `user-${userId}`, "form-seven", file.filename);
          filePath = filePath.replace(/\\/g, "/"); // Convert Windows paths to forward slashes

          // Map the file to the corresponding photo array
          if (field === "wallInsulationPhotos") {
            filePaths.wallInsulationPhotos.push(filePath);
          } else if (field === "alternativeWallsPhotos") {
            filePaths.alternativeWallsPhotos.push(filePath);
          } else if (field === "wallThicknessPhotos") {
            filePaths.wallThicknessPhotos.push(filePath);
          }
        });
      }
    }

    // Create and save the Form Seven document
    const newForm = new FormSeven({ ...formData, userId, ...filePaths });
    await newForm.save();

    return res.status(201).json({
      success: true,
      message: "Form Seven created successfully",
      data: newForm,
    });
  } catch (error) {
    console.error("Error creating Form Seven:", error);
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

// Get Form Seven data by userId and processId
export const getFormSevenByUser = async (req, res) => {
  try {
    const { userId, processId } = req.query;
    if (!userId) {
      return res.status(400).json({ success: false, error: "User ID is required" });
    }

    const query = { userId };
    if (processId) {
      query.processId = processId;
    }

    const forms = await FormSeven.find(query);
    return res.status(200).json({ success: true, data: forms });
  } catch (error) {
    console.error("Error fetching Form Seven data:", error);
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

// Update Form Seven with photo uploads and deletions
export const updateFormSeven = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, ...otherData } = req.body;

    // Parse deleted images arrays from the request
    const deletedImages = {
      wallInsulationPhotos: JSON.parse(req.body.deletedWallInsulation || "[]"),
      alternativeWallsPhotos: JSON.parse(req.body.deletedAlternativeWalls || "[]"),
      wallThicknessPhotos: JSON.parse(req.body.deletedWallThickness || "[]"),
    };

    // Fetch the existing Form Seven document
    const existingForm = await FormSeven.findById(id);
    if (!existingForm) {
      return res.status(404).json({ success: false, message: "Form Seven not found" });
    }

    // Convert absolute URLs to relative paths for comparison
    const relativeDeletedImages = {
      wallInsulationPhotos: deletedImages.wallInsulationPhotos.map(
        (url) => url.replace("http://localhost:3000/", "")
      ),
      alternativeWallsPhotos: deletedImages.alternativeWallsPhotos.map(
        (url) => url.replace("http://localhost:3000/", "")
      ),
      wallThicknessPhotos: deletedImages.wallThicknessPhotos.map(
        (url) => url.replace("http://localhost:3000/", "")
      ),
    };

    // Remove deleted images from the existing photos arrays
    const updatedPhotos = {
      wallInsulationPhotos: existingForm.wallInsulationPhotos.filter(
        (photo) => !relativeDeletedImages.wallInsulationPhotos.includes(photo)
      ),
      alternativeWallsPhotos: existingForm.alternativeWallsPhotos.filter(
        (photo) => !relativeDeletedImages.alternativeWallsPhotos.includes(photo)
      ),
      wallThicknessPhotos: existingForm.wallThicknessPhotos.filter(
        (photo) => !relativeDeletedImages.wallThicknessPhotos.includes(photo)
      ),
    };

    // Delete the physical files from the server
    const deleteImage = (imageUrl) => {
      const relativePath = imageUrl.replace("http://localhost:3000/", "");
      const filePath = path.join(process.cwd(), relativePath);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`Deleted file: ${filePath}`);
      } else {
        console.log(`File not found: ${filePath}`);
      }
    };

    relativeDeletedImages.wallInsulationPhotos.forEach(deleteImage);
    relativeDeletedImages.alternativeWallsPhotos.forEach(deleteImage);
    relativeDeletedImages.wallThicknessPhotos.forEach(deleteImage);

    // Handle new file uploads and add them to the arrays
    const newFilePaths = {
      wallInsulationPhotos: req.files?.wallInsulationPhotos?.map(
        (file) => path.join("uploads", `user-${userId}`, "form-seven", file.filename)
      ) || [],
      alternativeWallsPhotos: req.files?.alternativeWallsPhotos?.map(
        (file) => path.join("uploads", `user-${userId}`, "form-seven", file.filename)
      ) || [],
      wallThicknessPhotos: req.files?.wallThicknessPhotos?.map(
        (file) => path.join("uploads", `user-${userId}`, "form-seven", file.filename)
      ) || [],
    };

    // Merge new file paths with existing ones
    updatedPhotos.wallInsulationPhotos.push(...newFilePaths.wallInsulationPhotos);
    updatedPhotos.alternativeWallsPhotos.push(...newFilePaths.alternativeWallsPhotos);
    updatedPhotos.wallThicknessPhotos.push(...newFilePaths.wallThicknessPhotos);

    // Update the Form Seven document
    const updatedForm = await FormSeven.findByIdAndUpdate(
      id,
      {
        ...otherData,
        userId,
        wallInsulationPhotos: updatedPhotos.wallInsulationPhotos,
        alternativeWallsPhotos: updatedPhotos.alternativeWallsPhotos,
        wallThicknessPhotos: updatedPhotos.wallThicknessPhotos,
      },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: "Form Seven updated successfully",
      data: updatedForm,
    });
  } catch (error) {
    console.error("Error updating Form Seven:", error);
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};