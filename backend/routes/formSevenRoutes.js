import express from "express";
import { createFormSeven, updateFormSeven, getFormSevenByUser } from "../controllers/formSevenController.js";
import upload from "../utils/fileUpload.js"; // Import the file upload middleware

const router = express.Router();

// Route to create Form Seven
router.post(
  "/",
  upload.fields([
    { name: "wallInsulationPhotos", maxCount: 5 },
    { name: "alternativeWallsPhotos", maxCount: 5 },
    { name: "wallThicknessPhotos", maxCount: 5 },
  ]),
  createFormSeven
);

// Route to update Form Seven
router.put(
  "/:id",
  upload.fields([
    { name: "wallInsulationPhotos", maxCount: 5 },
    { name: "alternativeWallsPhotos", maxCount: 5 },
    { name: "wallThicknessPhotos", maxCount: 5 },
  ]),
  updateFormSeven
);

// Route to get Form Seven by userId and processId
router.get("/", getFormSevenByUser);

export default router;