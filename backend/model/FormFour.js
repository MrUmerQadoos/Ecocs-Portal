import mongoose from "mongoose";
const formFourSchema = new mongoose.Schema({
  // Fields for "Is there a Conservatory?" section
  isConservatory: String,          // "yes" or "no"
  isThermallySeparated: String,    // "yes" or "no"
  photoThermalSeparation: [String],  // Array to store multiple file paths
  isFixedHeaters: String,          // "yes" or "no"

  // Floor Area, Double Glazed, Glazed Perimeter, etc.
  floorArea: String,
  doubleGlazed: String,            // "yes" or "no"
  glazedPerimeter: String,
  roomHeight: String,              // e.g. "1 Storey", "2 Storey", etc.

  userId: String,
  processId: String,

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const FormFour = mongoose.model("FormFour", formFourSchema);
