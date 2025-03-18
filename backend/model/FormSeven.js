import mongoose from "mongoose";

const formSevenSchema = new mongoose.Schema({
  hasAlternativeWalls: { type: String, required: true },
  wallArea: { type: String, required: true },
  shelteredWall: { type: String, required: true },
  wallType: { type: String, required: true },
  insulation: { type: String, required: true },
  externalWallThickness: { type: String, required: true },
  wallThicknessUnknown: { type: String, required: true },
  insulationThickness: { type: String, required: true },
  wallInsulationPhotos: [String], // Array of file paths
  alternativeWallsPhotos: [String], // Array of file paths
  wallThicknessPhotos: [String], // Array of file paths
  userId: { type: String, required: true },
  processId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export const FormSeven = mongoose.model("FormSeven", formSevenSchema);