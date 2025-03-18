import mongoose from "mongoose";

const formTenSchema = new mongoose.Schema({
  location: { type: String, required: true },
  type: { type: String, required: true },
  insulation: { type: String, required: true },
  insulationThickness: { type: String, required: true },
  additionalNotes: { type: String, default: "" }, // Optional field
  userId: { type: String, required: true },
  processId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export const FormTen = mongoose.model("FormTen", formTenSchema);