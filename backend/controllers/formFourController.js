import { FormFour } from "../model/FormFour.js";
import path from "path";
import fs from "fs";  // File system module for handling file deletion

// Create Form Four with multiple photos
export const createFormFour = async (req, res) => {
  try {
    const { userId, ...formData } = req.body;
    const filePaths = [];

    // If files are uploaded, store their paths in photoThermalSeparation array
    if (req.files) {
      req.files.forEach((file) => {
        let filePath = path.join("uploads", `user-${userId}`, "form-four", file.filename);
        filePath = filePath.replace(/\\/g, "/");  // Convert Windows backslashes to forward slashes
        filePaths.push(filePath);
      });
      formData.photoThermalSeparation = filePaths; // Assign the array of file paths
    }

    const newForm = new FormFour({ ...formData, userId });
    await newForm.save();

    return res.status(201).json({
      success: true,
      message: "Form Four created successfully",
      data: newForm,
    });
  } catch (error) {
    console.error("Error creating Form Four:", error);
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};


// Update Form Four with multiple photo uploads

// Update Form Four with multiple photo uploads
export const updateFormFour = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, ...formData } = req.body;

    // Parse deletedImages (it might be sent as a JSON string or an array)
    let deletedImages = [];
    if (req.body.deletedImages) {
      if (typeof req.body.deletedImages === "string") {
        try {
          deletedImages = JSON.parse(req.body.deletedImages);
        } catch (error) {
          deletedImages = [req.body.deletedImages];
        }
      } else {
        deletedImages = req.body.deletedImages;
      }
    }

    // Convert absolute URLs to relative paths for comparison
    const relativeDeletedImages = deletedImages.map(img => 
      img.replace("http://localhost:3000/", "")
    );

    // Fetch the existing document from the database
    const existingForm = await FormFour.findById(id);
    if (!existingForm) {
      return res.status(404).json({ success: false, message: "Form Four not found" });
    }

    // Remove images marked for deletion from the existing images array
    let updatedPhotos = existingForm.photoThermalSeparation.filter(photo => 
      !relativeDeletedImages.includes(photo)
    );

    // Delete physical files from the server for each deleted image
    relativeDeletedImages.forEach((relativeImg) => {
      if (relativeImg && relativeImg.trim()) {
        const filePath = path.join(process.cwd(), relativeImg);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`Deleted file: ${filePath}`);
        } else {
          console.log(`File not found: ${filePath}`);
        }
      }
    });

    // Process newly uploaded files (if any)
    let newPhotos = [];
    if (req.files && req.files.length > 0) {
      newPhotos = req.files.map((file) => {
        let filePath = path.join("uploads", `user-${userId}`, "form-four", file.filename);
        return filePath.replace(/\\/g, "/"); // Ensure forward slashes for consistency
      });
    }

    // Combine the remaining images with the newly uploaded ones
    updatedPhotos = [...updatedPhotos, ...newPhotos];

    // Prepare the update object; don't send deletedImages to the database
    const updateData = {
      ...formData,
      userId,
      photoThermalSeparation: updatedPhotos,
    };

    // Update the document and return the updated record
    const updatedForm = await FormFour.findByIdAndUpdate(id, updateData, { new: true });

    return res.status(200).json({
      success: true,
      message: "Form Four updated successfully",
      data: updatedForm,
    });
  } catch (error) {
    console.error("Error updating Form Four:", error);
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

// Get Form Four data for a given userId and optionally processId
export const getFormFourByUser = async (req, res) => {
  try {
    const { userId, processId } = req.query;
    if (!userId) {
      return res.status(400).json({ success: false, error: "User ID is required" });
    }

    const query = { userId };
    if (processId) {
      query.processId = processId;
    }

    const forms = await FormFour.find(query);
    return res.status(200).json({ success: true, data: forms });
  } catch (error) {
    console.error("Error fetching Form Four data:", error);
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};
