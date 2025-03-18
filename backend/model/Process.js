import mongoose from "mongoose";

const processSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  // You can let users optionally name their process or assign a default name.
  name: {
    type: String,
    default: "New Process",
  },
  // A status field to help track whether the process is in progress or completed.
  status: {
    type: String,
    enum: ["in-progress", "completed"],
    default: "in-progress",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const Process = mongoose.model("Process", processSchema);
