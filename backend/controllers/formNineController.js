import path from "path";
import fs from "fs"; // File system for deleting images
import { FormNine } from "../model/formNine.js";

// Create a new Form Nine
export const createFormNine = async (req, res) => {
  try {
    const { userId, ...formData } = req.body;
    const filePaths = {
      mainRoomPhotos: [],
    };

    // Handle file uploads
    if (req.files && req.files.mainRoomPhotos) {
      req.files.mainRoomPhotos.forEach((file) => {
        const filePath = path.join("uploads", `user-${userId}`, "form-nine", file.filename);
        filePaths.mainRoomPhotos.push(filePath.replace(/\\/g, "/")); // Convert paths to forward slashes
      });
    }

    // Create and save the Form Nine document
    const newForm = new FormNine({ ...formData, userId, ...filePaths });
    await newForm.save();

    return res.status(201).json({
      success: true,
      message: "Form Nine created successfully",
      data: newForm,
    });
  } catch (error) {
    console.error("Error creating Form Nine:", error);
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

// Get Form Nine data by userId and processId
export const getFormNineByUser = async (req, res) => {
  try {
    const { userId, processId } = req.query;
    if (!userId) {
      return res.status(400).json({ success: false, error: "User ID is required" });
    }

    const query = { userId };
    if (processId) {
      query.processId = processId;
    }

    const forms = await FormNine.find(query);
    return res.status(200).json({ success: true, data: forms });
  } catch (error) {
    console.error("Error fetching Form Nine data:", error);
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

// Update Form Nine with photo uploads and deletions
export const updateFormNine = async (req, res) => {
    try {
      const { id } = req.params;
      const { userId, ...otherData } = req.body;
  
      // Parse deleted images array from the request
      const deletedImages = JSON.parse(req.body.deletedMainRoomPhotos || "[]");
  
      // Fetch the existing Form Nine document
      const existingForm = await FormNine.findById(id);
      if (!existingForm) {
        return res.status(404).json({ success: false, message: "Form Nine not found" });
      }
  
      // Normalize deleted image URLs to match the database format
      const normalizedDeletedImages = deletedImages.map((url) =>
        url.replace("http://localhost:3000/", "")
      );
  
      // Remove deleted images from the existing photos array
      const updatedPhotos = existingForm.mainRoomPhotos.filter(
        (photo) => !normalizedDeletedImages.includes(photo)
      );
  
      // Delete the physical files from the server
      const deleteImage = (imageUrl) => {
        const relativePath = imageUrl.replace("http://localhost:3000/", "");
        const filePath = path.join(process.cwd(), relativePath);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath); // Delete the file from disk
          console.log(`Deleted file: ${filePath}`);
        } else {
          console.log(`File not found: ${filePath}`);
        }
      };
  
      deletedImages.forEach(deleteImage);
  
      // Handle new file uploads
      const newFilePaths = req.files?.mainRoomPhotos?.map(
        (file) => path.join("uploads", `user-${userId}`, "form-nine", file.filename)
      ) || [];
  
      // Merge the new file paths with the existing ones
      updatedPhotos.push(...newFilePaths);
  
      // Update the Form Nine document with the new data and updated image array
      const updatedForm = await FormNine.findByIdAndUpdate(
        id,
        {
          ...otherData,
          userId,
          mainRoomPhotos: updatedPhotos, // Update the mainRoomPhotos array
        },
        { new: true } // Return the updated document
      );
  
      return res.status(200).json({
        success: true,
        message: "Form Nine updated successfully",
        data: updatedForm,
      });
    } catch (error) {
      console.error("Error updating Form Nine:", error);
      return res.status(500).json({ success: false, error: "Internal Server Error" });
    }
  };