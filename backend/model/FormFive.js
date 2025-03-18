import mongoose from "mongoose";

const formFiveSchema = new mongoose.Schema({
  corridor: String,            // "None", "Heated", "Unheated"
  corridorPhotos: [String],    // Store an array of file paths for the images
  shelteredWallLength: String, // Length of Sheltered Wall (m)
  positionInBlock: String,     // e.g., "Basement", "Ground Floor", etc.
  whichFloor: String,          // e.g., "2nd"
  userId: String,
  processId: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const FormFive = mongoose.model("FormFive", formFiveSchema);
