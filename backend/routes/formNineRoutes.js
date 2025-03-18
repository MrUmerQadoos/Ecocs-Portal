import express from "express";
import { createFormNine, updateFormNine, getFormNineByUser } from "../controllers/formNineController.js";
import upload from "../utils/fileUpload.js"; // Import the file upload middleware

const router = express.Router();

// Route to create Form Nine
router.post("/", upload.fields([
  { name: "mainRoomPhotos", maxCount: 5 }, // Allow up to 5 photos
]), createFormNine);

// Route to update Form Nine
router.put("/:id", upload.fields([
  { name: "mainRoomPhotos", maxCount: 5 },
]), updateFormNine);

// Route to get Form Nine by userId and processId
router.get("/", getFormNineByUser);

export default router;