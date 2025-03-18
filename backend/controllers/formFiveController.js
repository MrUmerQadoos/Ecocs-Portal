// controllers/formFiveController.js

import { FormFive } from "../model/FormFive.js";
import path from "path";
import fs from 'fs'; // Add this import for file system operations
// Create Form Five with multiple photos
export const createFormFive = async (req, res) => {
  try {
    const { userId, ...formData } = req.body;
    const filePaths = [];

    // If files are uploaded, store their paths in corridorPhotos array
    if (req.files) {
      req.files.forEach((file) => {
        let filePath = path.join("uploads", `user-${userId}`, "form-five", file.filename);
        filePath = filePath.replace(/\\/g, "/"); // Convert Windows backslashes to forward slashes
        filePaths.push(filePath);
      });
      formData.corridorPhotos = filePaths; // Assign the array of file paths
    }

    const newForm = new FormFive({ ...formData, userId });
    await newForm.save();

    return res.status(201).json({
      success: true,
      message: "Form Five created successfully",
      data: newForm,
    });
  } catch (error) {
    console.error("Error creating Form Five:", error);
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};


// Update Form Five with multiple photo uploads
export const updateFormFive = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, ...otherData } = req.body;

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

    // Fetch the existing document from the database
    const existingForm = await FormFive.findById(id);
    if (!existingForm) {
      return res.status(404).json({ success: false, message: "Form Five not found" });
    }

    // Remove images marked for deletion from the existing images array
    let updatedPhotos = existingForm.corridorPhotos.filter(photo => !deletedImages.includes(photo));

    // Optionally delete physical files from the server
    deletedImages.forEach((image) => {
      // Only process if image is a valid non-empty string
      if (typeof image === "string" && image.trim()) {
        const filePath = path.join(process.cwd(), image);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    });

    // Process newly uploaded files (if any)
    let newPhotos = [];
    if (req.files && req.files.length > 0) {
      newPhotos = req.files.map((file) => {
        let filePath = path.join("uploads", `user-${userId}`, "form-five", file.filename);
        return filePath.replace(/\\/g, "/"); // Ensure forward slashes for consistency
      });
    }

    // Combine the remaining images with the newly uploaded ones
    updatedPhotos = [...updatedPhotos, ...newPhotos];

    // Prepare the update object; don't send deletedImages to the database
    const updateData = {
      ...otherData,
      userId,
      corridorPhotos: updatedPhotos,
    };

    // Update the document and return the updated record
    const updatedForm = await FormFive.findByIdAndUpdate(id, updateData, { new: true });

    return res.status(200).json({
      success: true,
      message: "Form Five updated successfully",
      data: updatedForm,
    });
  } catch (error) {
    console.error("Error updating Form Five:", error);
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};


// Get Form Five data for a given userId and optionally processId
export const getFormFiveByUser = async (req, res) => {
  try {
    const { userId, processId } = req.query;
    if (!userId) {
      return res.status(400).json({ success: false, error: "User ID is required" });
    }

    const query = { userId };
    if (processId) {
      query.processId = processId;
    }

    const forms = await FormFive.find(query);
    return res.status(200).json({ success: true, data: forms });
  } catch (error) {
    console.error("Error fetching Form Five data:", error);
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};
