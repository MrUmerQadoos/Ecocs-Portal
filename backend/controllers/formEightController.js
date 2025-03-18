import path from "path";
import fs from "fs"; // File system for deleting images
import { FormEight } from "../model/FormEight.js";

// Create a new Form Eight
export const createFormEight = async (req, res) => {
  try {
    const { userId, ...formData } = req.body;
    const filePaths = {
      constructionPhotos: [],
      loftInsulationPhotos: [],
    };

    // Check if files are uploaded for each field
    if (req.files) {
      for (let field in req.files) {
        req.files[field].forEach((file) => {
          let filePath = path.join("uploads", `user-${userId}`, "form-eight", file.filename);
          filePath = filePath.replace(/\\/g, "/"); // Convert Windows paths to forward slashes

          // Map the file to the corresponding photo array
          if (field === "constructionPhotos") {
            filePaths.constructionPhotos.push(filePath);
          } else if (field === "loftInsulationPhotos") {
            filePaths.loftInsulationPhotos.push(filePath);
          }
        });
      }
    }

    // Create and save the Form Eight document
    const newForm = new FormEight({ ...formData, userId, ...filePaths });
    await newForm.save();

    return res.status(201).json({
      success: true,
      message: "Form Eight created successfully",
      data: newForm,
    });
  } catch (error) {
    console.error("Error creating Form Eight:", error);
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

// Get Form Eight data by userId and processId
export const getFormEightByUser = async (req, res) => {
  try {
    const { userId, processId } = req.query;
    if (!userId) {
      return res.status(400).json({ success: false, error: "User ID is required" });
    }

    const query = { userId };
    if (processId) {
      query.processId = processId;
    }

    const forms = await FormEight.find(query);
    return res.status(200).json({ success: true, data: forms });
  } catch (error) {
    console.error("Error fetching Form Eight data:", error);
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

// Update Form Eight with photo uploads and deletions
export const updateFormEight = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, ...otherData } = req.body;

    // Parse deleted images arrays from the request
    const deletedImages = {
      constructionPhotos: JSON.parse(req.body.deletedConstruction || "[]"),
      loftInsulationPhotos: JSON.parse(req.body.deletedLoftInsulation || "[]"),
    };

    // Fetch the existing Form Eight document
    const existingForm = await FormEight.findById(id);
    if (!existingForm) {
      return res.status(404).json({ success: false, message: "Form Eight not found" });
    }

    // Convert absolute URLs to relative paths for comparison
    const relativeDeletedImages = {
      constructionPhotos: deletedImages.constructionPhotos.map(
        (url) => url.replace("http://localhost:3000/", "")
      ),
      loftInsulationPhotos: deletedImages.loftInsulationPhotos.map(
        (url) => url.replace("http://localhost:3000/", "")
      ),
    };

    // Remove deleted images from the existing photos arrays
    const updatedPhotos = {
      constructionPhotos: existingForm.constructionPhotos.filter(
        (photo) => !relativeDeletedImages.constructionPhotos.includes(photo)
      ),
      loftInsulationPhotos: existingForm.loftInsulationPhotos.filter(
        (photo) => !relativeDeletedImages.loftInsulationPhotos.includes(photo)
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

    relativeDeletedImages.constructionPhotos.forEach(deleteImage);
    relativeDeletedImages.loftInsulationPhotos.forEach(deleteImage);

    // Handle new file uploads and add them to the arrays
    const newFilePaths = {
      constructionPhotos: req.files?.constructionPhotos?.map(
        (file) => path.join("uploads", `user-${userId}`, "form-eight", file.filename)
      ) || [],
      loftInsulationPhotos: req.files?.loftInsulationPhotos?.map(
        (file) => path.join("uploads", `user-${userId}`, "form-eight", file.filename)
      ) || [],
    };

    // Merge new file paths with existing ones
    updatedPhotos.constructionPhotos.push(...newFilePaths.constructionPhotos);
    updatedPhotos.loftInsulationPhotos.push(...newFilePaths.loftInsulationPhotos);

    // Update the Form Eight document
    const updatedForm = await FormEight.findByIdAndUpdate(
      id,
      {
        ...otherData,
        userId,
        constructionPhotos: updatedPhotos.constructionPhotos,
        loftInsulationPhotos: updatedPhotos.loftInsulationPhotos,
      },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: "Form Eight updated successfully",
      data: updatedForm,
    });
  } catch (error) {
    console.error("Error updating Form Eight:", error);
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};