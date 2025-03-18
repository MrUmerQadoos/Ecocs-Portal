import path from "path";
import fs from "fs"; // File system for deleting images
import { FormSix } from "../model/formSix.js";

// Create a new Form Six
export const createFormSix = async (req, res) => {
    try {
      const { userId, ...formData } = req.body;
      const filePaths = {
        constructionPhotos: [],
        insulationPhotos: [],
        thicknessPhotos: [],
      };
  
      // Check if files are uploaded for each field
      if (req.files) {
        // For each field (constructionPhotos, insulationPhotos, thicknessPhotos)
        for (let field in req.files) {
          req.files[field].forEach((file) => {
            let filePath = path.join("uploads", `user-${userId}`, "form-six", file.filename);
            filePath = filePath.replace(/\\/g, "/"); // Convert Windows paths to forward slashes
            
            // Map the file to the corresponding photo array
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
  
      // Create and save the Form Six document
      const newForm = new FormSix({ ...formData, userId, ...filePaths });
      await newForm.save();
  
      return res.status(201).json({
        success: true,
        message: "Form Six created successfully",
        data: newForm,
      });
    } catch (error) {
      console.error("Error creating Form Six:", error);
      return res.status(500).json({ success: false, error: "Internal Server Error" });
    }
  };
  
  
// Get Form Six data by userId and processId
export const getFormSixByUser = async (req, res) => {
  try {
    const { userId, processId } = req.query;
    if (!userId) {
      return res.status(400).json({ success: false, error: "User ID is required" });
    }

    const query = { userId };
    if (processId) {
      query.processId = processId;
    }

    const forms = await FormSix.find(query);
    return res.status(200).json({ success: true, data: forms });
  } catch (error) {
    console.error("Error fetching Form Six data:", error);
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};


// Update Form Six with photo uploads and deletions
export const updateFormSix = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, ...otherData } = req.body;

    // Parse deleted images arrays from the request
    const deletedImages = {
      constructionPhotos: JSON.parse(req.body.deletedConstruction || "[]"),
      insulationPhotos: JSON.parse(req.body.deletedInsulation || "[]"),
      thicknessPhotos: JSON.parse(req.body.deletedThickness || "[]"),
    };

    // Log the deleted images to ensure we are receiving them correctly
    // console.log("Deleted Images: ", deletedImages);

    // Fetch the existing Form Six document
    const existingForm = await FormSix.findById(id);
    if (!existingForm) {
      return res.status(404).json({ success: false, message: "Form Six not found" });
    }

    // Log the existing form data
    // console.log("Existing Form: ", existingForm);

    // Ensure that the URLs in `deletedImages` match the database values
    // We need to convert the absolute URL to the relative path for comparison
    const relativeDeletedImages = {
      constructionPhotos: deletedImages.constructionPhotos.map(
        (url) => url.replace("http://localhost:3000/", "")
      ),
      insulationPhotos: deletedImages.insulationPhotos.map(
        (url) => url.replace("http://localhost:3000/", "")
      ),
      thicknessPhotos: deletedImages.thicknessPhotos.map(
        (url) => url.replace("http://localhost:3000/", "")
      ),
    };

    // Log the relative deleted images
    // console.log("Relative Deleted Images: ", relativeDeletedImages);

    // Remove deleted images from the existing photos arrays
    const updatedPhotos = {
      constructionPhotos: existingForm.constructionPhotos.filter(
        (photo) => !relativeDeletedImages.constructionPhotos.includes(photo)
      ),
      insulationPhotos: existingForm.insulationPhotos.filter(
        (photo) => !relativeDeletedImages.insulationPhotos.includes(photo)
      ),
      thicknessPhotos: existingForm.thicknessPhotos.filter(
        (photo) => !relativeDeletedImages.thicknessPhotos.includes(photo)
      ),
    };

    // Log the updated photos to see if they are correctly filtered
    console.log("Updated Photos After Filtering: ", updatedPhotos);

    // Delete the physical files from the server (if they exist)
    const deleteImage = (imageUrl) => {
      // Convert the absolute URL to the relative file path
      const relativePath = imageUrl.replace("http://localhost:3000/", "");
      const filePath = path.join(process.cwd(), relativePath);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath); // Delete the file from disk
        console.log(`Deleted file: ${filePath}`);
      } else {
        console.log(`File not found: ${filePath}`);
      }
    };

    // Delete each image in the deleted images array
    relativeDeletedImages.constructionPhotos.forEach(deleteImage);
    relativeDeletedImages.insulationPhotos.forEach(deleteImage);
    relativeDeletedImages.thicknessPhotos.forEach(deleteImage);

    // Handle new file uploads and add them to the arrays
    const newFilePaths = {
      constructionPhotos: req.files?.constructionPhotos?.map(
        (file) => path.join("uploads", `user-${userId}`, "form-six", file.filename)
      ) || [],
      insulationPhotos: req.files?.insulationPhotos?.map(
        (file) => path.join("uploads", `user-${userId}`, "form-six", file.filename)
      ) || [],
      thicknessPhotos: req.files?.thicknessPhotos?.map(
        (file) => path.join("uploads", `user-${userId}`, "form-six", file.filename)
      ) || [],
    };

    // Merge the new file paths with the existing ones
    updatedPhotos.constructionPhotos.push(...newFilePaths.constructionPhotos);
    updatedPhotos.insulationPhotos.push(...newFilePaths.insulationPhotos);
    updatedPhotos.thicknessPhotos.push(...newFilePaths.thicknessPhotos);

    // Log the final updated arrays
    console.log("Final Updated Photos: ", updatedPhotos);

    // Update the Form Six document with the new data and updated image arrays
    const updatedForm = await FormSix.findByIdAndUpdate(
      id,
      {
        ...otherData,
        userId,
        constructionPhotos: updatedPhotos.constructionPhotos,
        insulationPhotos: updatedPhotos.insulationPhotos,
        thicknessPhotos: updatedPhotos.thicknessPhotos,
      },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: "Form Six updated successfully",
      data: updatedForm,
    });
  } catch (error) {
    console.error("Error updating Form Six:", error);
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};
