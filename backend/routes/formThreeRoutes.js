import express from "express";
import {
  createFormThree,
  getFormThreeByUser,
  updateFormThree,
} from "../controllers/formThreeController.js";

const router = express.Router();

// Create a new Form Three
router.post("/", createFormThree);

// Get Form Three by userId (and optional processId)
router.get("/", getFormThreeByUser);

// Update Form Three by ID
router.put("/:id", updateFormThree);

export default router;
