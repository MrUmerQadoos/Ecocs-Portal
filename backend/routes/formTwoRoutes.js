import express from "express";
import { createFormTwo, getFormTwoByUser, updateFormTwo } from "../controllers/formTwoController.js";
import upload from "../utils/fileUpload.js"; // Your multer configuration file

const router = express.Router();

// GET: Fetch Form Two data by userId and processId (if provided)
router.get("/", getFormTwoByUser);

// POST: Create new Form Two with multiple file uploads
router.post("/", upload.array("imageUrl"), createFormTwo);

// PUT: Update existing Form Two with multiple file uploads and deletion functionality
router.put("/:id", upload.array("imageUrl"), updateFormTwo);

export default router;
