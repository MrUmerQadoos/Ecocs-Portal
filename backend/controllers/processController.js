import { Process } from "../model/Process.js";

// Create a new process for the logged-in user.
export const createProcess = async (req, res) => {
  try {
    const { userId, name } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, error: "User ID is required" });
    }
    const newProcess = new Process({ userId, name });
    await newProcess.save();

    return res.status(201).json({
      success: true,
      message: "Process created successfully",
      data: newProcess,
    });
  } catch (error) {
    console.error("Error creating process:", error);
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

// Get all processes for a given user.
export const getProcessesByUser = async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ success: false, error: "User ID is required" });
    }
    const processes = await Process.find({ userId });
    return res.status(200).json({ success: true, data: processes });
  } catch (error) {
    console.error("Error fetching processes:", error);
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};
