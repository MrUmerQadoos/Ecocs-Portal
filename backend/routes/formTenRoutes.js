import express from "express";
import { createFormTen, getFormTenByUser, updateFormTen } from "../controllers/formTenController.js";

const router = express.Router();

// Route to create Form Ten
router.post("/", createFormTen);

// Route to update Form Ten
router.put("/:id", updateFormTen);

// Route to get Form Ten by userId and processId
router.get("/", getFormTenByUser);

export default router;