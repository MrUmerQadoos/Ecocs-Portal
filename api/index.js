import express from "express";
import { connectToDatabase } from "./database/connectionToDatabase.js";
import dotenv from "dotenv";
import authRoutes from "./routes/auth-route.js";
import taskRoutes from "./routes/task-route.js";
import processRoutes from "./routes/processRoutes.js";
import formOneRoutes from "./routes/formOneRoutes.js";
import formTwoRoutes from "./routes/formTwoRoutes.js";
import formThreeRoutes from "./routes/formThreeRoutes.js";
import formFourRoutes from "./routes/formFourRoutes.js";
import formFiveRoutes from "./routes/formFiveRoutes.js";
import formSixRoutes from "./routes/formSixRoutes.js";
import formSevenRoutes from "./routes/formSevenRoutes.js";
import formEightRoutes from "./routes/formEightRoutes.js";
import formNineRoutes from "./routes/formNineRoutes.js";
import formTenRoutes from "./routes/formTenRoutes.js";
import formElevenRoutes from "./routes/formElevenRoutes.js";
import formTwelveRoutes from "./routes/formTwelveRoutes.js";
import formThirteenRoutes from "./routes/formThirteenRoutes.js";
import formFourteenRoutes from "./routes/formFourteenRoutes.js";
import formFifteenRoutes from "./routes/formFifteenRoutes.js";
import formSixteenRoutes from "./routes/formSixteenRoutes.js";
import formSeventeenRoutes from "./routes/formSeventeenRoutes.js";
import formEighteenRoutes from "./routes/formEighteenRoutes.js";
import formNineteenRoutes from "./routes/formNineteenRoutes.js";
import formTwentyRoutes from "./routes/formTwentyRoutes.js";
import formTwentyOneRoutes from "./routes/formTwentyOneRoutes.js";
import formTwentyTwoRoutes from "./routes/formTwentyTwoRoutes.js";
import formTwentyThreeRoutes from "./routes/formTwentyThreeRoutes.js";
import formTwentyFourRoutes from "./routes/formTwentyFourRoutes.js";
import formTwentyFiveRoutes from "./routes/formTwentyFiveRoutes.js";
import formTwentySixRoutes from "./routes/formTwentySixRoutes.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

// For ES modules, define __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();

// Middleware
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(cookieParser()); // Parse cookies

// CORS configuration
const allowedOrigins = [
  "http://localhost:5173", // Development
  "https://ecocs-portal.vercel.app", // Production
];
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true, // Allow cookies and credentials
  })
);

// Serve static files from the "uploads" folder
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Connect to MongoDB
connectToDatabase();

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/processes", processRoutes);
app.use("/api/assessments/form-one", formOneRoutes);
app.use("/api/assessments/form-two", formTwoRoutes);
app.use("/api/assessments/form-three", formThreeRoutes);
app.use("/api/assessments/form-four", formFourRoutes);
app.use("/api/assessments/form-five", formFiveRoutes);
app.use("/api/assessments/form-six", formSixRoutes);
app.use("/api/assessments/form-seven", formSevenRoutes);
app.use("/api/assessments/form-eight", formEightRoutes);
app.use("/api/assessments/form-nine", formNineRoutes);
app.use("/api/assessments/form-ten", formTenRoutes);
app.use("/api/assessments/form-eleven", formElevenRoutes);
app.use("/api/assessments/form-twelve", formTwelveRoutes);
app.use("/api/assessments/form-thirteen", formThirteenRoutes);
app.use("/api/assessments/form-fourteen", formFourteenRoutes);
app.use("/api/assessments/form-fifteen", formFifteenRoutes);
app.use("/api/assessments/form-sixteen", formSixteenRoutes);
app.use("/api/assessments/form-seventeen", formSeventeenRoutes);
app.use("/api/assessments/form-eighteen", formEighteenRoutes);
app.use("/api/assessments/form-nineteen", formNineteenRoutes);
app.use("/api/assessments/form-twenty", formTwentyRoutes);
app.use("/api/assessments/form-twenty-one", formTwentyOneRoutes);
app.use("/api/assessments/form-twenty-two", formTwentyTwoRoutes);
app.use("/api/assessments/form-twenty-three", formTwentyThreeRoutes);
app.use("/api/assessments/form-twenty-four", formTwentyFourRoutes);
app.use("/api/assessments/form-twenty-five", formTwentyFiveRoutes);
app.use("/api/assessments/form-twenty-six", formTwentySixRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Express error:", err.stack);
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ success: false, error: err.message });
  }
  res.status(500).json({ success: false, error: "Internal Server Error" });
});

// Export the app for Vercel serverless functions
export default app;