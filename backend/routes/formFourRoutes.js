// routes/formFourRoutes.js

import express from "express";
import {
  createFormFour,
  getFormFourByUser,
  updateFormFour,
} from "../controllers/formFourController.js";
import upload from "../utils/fileUpload.js";

const router = express.Router();

// Get Form Four data (by userId & optional processId)
router.get("/", getFormFourByUser);

// Create a new Form Four (with file upload)
router.post("/", upload.array("photoThermalSeparation"), createFormFour);

// Update Form Four (with file upload)
router.put("/:id", upload.array("photoThermalSeparation"), updateFormFour);

export default router;
