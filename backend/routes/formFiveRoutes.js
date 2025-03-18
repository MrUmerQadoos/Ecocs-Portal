import express from "express";
import {
  createFormFive,
  getFormFiveByUser,
  updateFormFive,
} from "../controllers/formFiveController.js";
import upload from "../utils/fileUpload.js";

const router = express.Router();

// Get Form Five by userId and optional processId
router.get("/", getFormFiveByUser);

// POST - create new Form Five, with multiple file uploads
router.post("/", upload.array("corridorPhotos"), createFormFive);  // Use array for multiple files

// PUT - update existing Form Five by ID, with file uploads
router.put("/:id", upload.array("corridorPhotos"), updateFormFive);  // Use array for multiple files

export default router;
