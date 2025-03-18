import express from "express";
import { createFormOne, getFormOneByUser, updateFormOne } from "../controllers/formOneController.js";

const router = express.Router();

// Create a new Form One document
router.post("/", createFormOne);

// Get Form One documents for a given user (e.g., GET /api/assessments/form-one?userId=xxx&processId=yyy)
router.get("/", getFormOneByUser);

// Update a Form One document by its ID
router.put("/:id", updateFormOne);

export default router;
