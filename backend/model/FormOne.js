// models/FormOne.js
import mongoose from "mongoose";

const formOneSchema = new mongoose.Schema({
  propertyAddress: { type: String, required: true },
  postcode: { type: String, required: true },
  inspectionDate: { type: Date, required: true },
  surveyorName: { type: String, required: true },
  surveyorID: { type: String, required: true },
  epcRRN: { type: String, required: true },
  userId: { type: String, required: true },
  processId:{ type: String, required: true },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Transform the inspectionDate when converting document to JSON
formOneSchema.set("toJSON", {
  transform: (doc, ret) => {
    if (ret.inspectionDate) {
      ret.inspectionDate = ret.inspectionDate.toISOString().split("T")[0];
    }
    return ret;
  },
});

export const FormOne = mongoose.model("FormOne", formOneSchema);
