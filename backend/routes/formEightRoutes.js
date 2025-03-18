import express from "express";
import { createFormEight, updateFormEight, getFormEightByUser } from "../controllers/formEightController.js";
import upload from "../utils/fileUpload.js"; // Import the file upload middleware

const router = express.Router();

// Route to create Form Eight
router.post(
  "/",
  upload.fields([
    { name: "constructionPhotos", maxCount: 5 },
    { name: "loftInsulationPhotos", maxCount: 5 },
  ]),
  createFormEight
);

// Route to update Form Eight
router.put(
  "/:id",
  upload.fields([
    { name: "constructionPhotos", maxCount: 5 },
    { name: "loftInsulationPhotos", maxCount: 5 },
  ]),
  updateFormEight
);

// Route to get Form Eight by userId and processId
router.get("/", getFormEightByUser);

export default router;