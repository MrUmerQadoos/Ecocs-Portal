import mongoose from "mongoose";

const formSixSchema = new mongoose.Schema({
  wallType: { type: String, required: true },
  insulationType: { type: String, required: true },
  dryLining: { type: String, required: true },
  insulationThickness: { type: String, required: true },
  externalThickness: { type: String, required: true },
  uValue: { type: String },
  partyWallType: { type: String },
  constructionPhotos: [String],
  insulationPhotos: [String],
  thicknessPhotos: [String],
  wallThicknessUnknown: { type: String, required: true },
  userId: { type: String, required: true },
  processId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export const FormSix = mongoose.model("FormSix", formSixSchema);
