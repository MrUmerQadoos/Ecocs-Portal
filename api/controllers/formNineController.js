import path from "path";
import fs from "fs";
import { FormNine } from "../model/formNine.js";

// Create a new Form Nine
export const createFormNine = async (req, res) => {
  try {
    const { processId } = req.body;

    // Check if a FormNine document already exists for this processId
    const existingForm = await FormNine.findOne({ processId });
    if (existingForm) {
      return res.status(400).json({
        success: false,
        error: "A Form Nine document already exists for this process.",
      });
    }

    const formData = req.body;
    const filePaths = {
      mainRoomPhotos: [],
    };

    // Handle file uploads for mainRoomPhotos
    if (req.files && req.files.mainRoomPhotos) {
      req.files.mainRoomPhotos.forEach((file) => {
        let filePath = path.join("uploads", `user-${formData.userId}`, "form-nine", file.filename);
        filePath = filePath.replace(/\\/g, "/");
        filePaths.mainRoomPhotos.push(filePath);
      });
    }

    const newForm = new FormNine({ ...formData, ...filePaths });
    await newForm.save();

    return res.status(201).json({
      success: true,
      message: "Form Nine created successfully",
      data: newForm,
    });
  } catch (error) {
    console.error("Error creating Form Nine:", error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: "A Form Nine document already exists for this process.",
      });
    }
    if (error.name === "ValidationError") {
      return res.status(400).json({ success: false, error: error.message });
    }
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

// Get Form Nine data by processId
export const getFormNineByProcess = async (req, res) => {
  try {
    const { processId } = req.query;
    if (!processId) {
      return res.status(400).json({ success: false, error: "Process ID is required" });
    }

    const form = await FormNine.findOne({ processId });
    return res.status(200).json({ success: true, data: form ? [form] : [] });
  } catch (error) {
    console.error("Error fetching Form Nine data:", error);
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

// Update Form Nine with photo uploads and deletions
export const updateFormNine = async (req, res) => {
  try {
    const { id } = req.params;
    const formData = req.body;

    // Parse deleted images
    let deletedMainRoomPhotos = [];
    if (req.body.deletedMainRoomPhotos) {
      deletedMainRoomPhotos =
        typeof req.body.deletedMainRoomPhotos === "string"
          ? JSON.parse(req.body.deletedMainRoomPhotos)
          : req.body.deletedMainRoomPhotos;
    }

    // Convert absolute URLs to relative paths for comparison
    const relativeDeletedMainRoomPhotos = deletedMainRoomPhotos.map((img) =>
      img.replace("http://localhost:3000/", "")
    );

    // Fetch the existing document
    const existingForm = await FormNine.findById(id);
    if (!existingForm) {
      return res.status(404).json({ success: false, message: "Form Nine not found" });
    }

    // Remove deleted images from existing array
    let updatedMainRoomPhotos = existingForm.mainRoomPhotos.filter(
      (photo) => !relativeDeletedMainRoomPhotos.includes(photo)
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

    relativeDeletedMainRoomPhotos.forEach(deleteImage);

    // Process new file uploads
    let newMainRoomPhotos = [];
    if (req.files && req.files.mainRoomPhotos) {
      newMainRoomPhotos = req.files.mainRoomPhotos.map((file) => {
        let filePath = path.join("uploads", `user-${formData.userId}`, "form-nine", file.filename);
        return filePath.replace(/\\/g, "/");
      });
    }

    // Combine remaining images with new uploads
    updatedMainRoomPhotos = [...updatedMainRoomPhotos, ...newMainRoomPhotos];

    // Prepare the update object
    const updateData = {
      ...formData,
      mainRoomPhotos: updatedMainRoomPhotos,
    };

    // Update the document
    const updatedForm = await FormNine.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    return res.status(200).json({
      success: true,
      message: "Form Nine updated successfully",
      data: updatedForm,
    });
  } catch (error) {
    console.error("Error updating Form Nine:", error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: "A Form Nine document already exists for this process.",
      });
    }
    if (error.name === "ValidationError") {
      return res.status(400).json({ success: false, error: error.message });
    }
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};