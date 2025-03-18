import { FormTwo } from "../model/FormTwo.js";
import path from "path";
import fs from "fs";

// Create Form Two with multiple image uploads
export const createFormTwo = async (req, res) => {
  try {
    const { userId, ...formData } = req.body;
    const filePaths = [];

    // If files are uploaded, store their paths in imageUrl array
    if (req.files) {
      req.files.forEach((file) => {
        let filePath = path.join("uploads", `user-${userId}`, "form-two", file.filename);
        filePath = filePath.replace(/\\/g, "/");
        filePaths.push(filePath);
      });
      formData.imageUrl = filePaths;
    }

    const newForm = new FormTwo({ ...formData, userId });
    await newForm.save();

    return res.status(201).json({
      success: true,
      message: "Form Two created successfully",
      data: newForm,
    });
  } catch (error) {
    console.error("Error creating Form Two:", error);
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

// Update Form Two with multiple image uploads and deletion functionalities
export const updateFormTwo = async (req, res) => {
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

    // Convert absolute URLs to relative paths (remove base URL)
    const relativeDeletedImages = deletedImages.map(img => 
      img.replace("http://localhost:3000/", "")
    );

    // Fetch the existing document from the database
    const existingForm = await FormTwo.findById(id);
    if (!existingForm) {
      return res.status(404).json({ success: false, message: "Form Two not found" });
    }

    // Remove images marked for deletion from the existing imageUrl array
    let updatedImages = existingForm.imageUrl.filter(image => 
      !relativeDeletedImages.includes(image)
    );

    // Delete physical files from the server for each deleted image
    relativeDeletedImages.forEach((imgPath) => {
      if (imgPath && imgPath.trim()) {
        const filePath = path.join(process.cwd(), imgPath);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`Deleted file: ${filePath}`);
        } else {
          console.log(`File not found: ${filePath}`);
        }
      }
    });

    // Process newly uploaded files (if any)
    let newImages = [];
    if (req.files && req.files.length > 0) {
      newImages = req.files.map((file) => {
        let filePath = path.join("uploads", `user-${userId}`, "form-two", file.filename);
        return filePath.replace(/\\/g, "/");
      });
    }

    // Combine the remaining images with the newly uploaded ones
    updatedImages = [...updatedImages, ...newImages];

    // Prepare the update object (do not store deletedImages in database)
    const updateData = {
      ...formData,
      userId,
      imageUrl: updatedImages,
    };

    // Update the document and return the updated record
    const updatedForm = await FormTwo.findByIdAndUpdate(id, updateData, { new: true });

    return res.status(200).json({
      success: true,
      message: "Form Two updated successfully",
      data: updatedForm,
    });
  } catch (error) {
    console.error("Error updating Form Two:", error);
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

// Get Form Two data for a given userId and optionally processId
export const getFormTwoByUser = async (req, res) => {
  try {
    const { userId, processId } = req.query;
    if (!userId) {
      return res.status(400).json({ success: false, error: "User ID is required" });
    }

    const query = { userId };
    if (processId) {
      query.processId = processId;
    }

    const forms = await FormTwo.find(query);
    return res.status(200).json({ success: true, data: forms });
  } catch (error) {
    console.error("Error fetching Form Two data:", error);
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};
