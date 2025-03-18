import express from "express";
import { createFormSix, updateFormSix, getFormSixByUser } from "../controllers/formSixController.js";
import upload from "../utils/fileUpload.js"; // Import the file upload middleware

const router = express.Router();

// Route to create Form Six
router.post("/", upload.fields([
  { name: "constructionPhotos", maxCount: 5 },
  { name: "insulationPhotos", maxCount: 5 },
  { name: "thicknessPhotos", maxCount: 5 },
]), createFormSix);

// Route to update Form Six
router.put("/:id", upload.fields([
  { name: "constructionPhotos", maxCount: 5 },
  { name: "insulationPhotos", maxCount: 5 },
  { name: "thicknessPhotos", maxCount: 5 },
]), updateFormSix);

// Route to get Form Six by userId and processId
router.get("/", getFormSixByUser);

export default router;
