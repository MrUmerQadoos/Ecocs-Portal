import mongoose from "mongoose";

const formNineSchema = new mongoose.Schema({
  hasMainRoomInRoof: { type: String, required: true }, // "yes" or "no"
  insulationType: { type: String, required: true }, // "Flat ceiling only", "All elements", etc.
  insulationThicknessCeiling: { type: String, required: true }, // "12mm", "25mm", etc.
  insulationOtherParts: { type: String, required: true }, // "None", "As Built", etc.
  mainRoomPhotos: [String], // Array of file paths for uploaded photos
  userId: { type: String, required: true }, // User ID
  processId: { type: String, required: true }, // Process ID
  createdAt: { type: Date, default: Date.now }, // Timestamp
});

export const FormNine = mongoose.model("FormNine", formNineSchema);