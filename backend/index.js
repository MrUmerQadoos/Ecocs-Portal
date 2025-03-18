import express from "express";
import { connectToDatabase } from "./database/connectionToDatabase.js";
import dotenv from "dotenv";
import authRoutes from "./routes/auth-route.js";
import formOneRoutes from "./routes/formOneRoutes.js";
import formTwoRoutes from "./routes/formTwoRoutes.js";
import formThreeRoutes from "./routes/formThreeRoutes.js";
import formFourRoutes from "./routes/formFourRoutes.js";
import processRoutes from "./routes/processRoutes.js";
import formFiveRoutes from "./routes/formFiveRoutes.js";
import formSixRoutes from "./routes/formSixRoutes.js";
import formSevenRoutes from "./routes/formSevenRoutes.js";
import formEightRoutes from "./routes/formEightRoutes.js";
import formNineRoutes from "./routes/formNineRoutes.js";
import formTenRoutes from "./routes/formTenRoutes.js";





import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";

dotenv.config();

const app = express();

// Serve static files from the "uploads" folder
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(cookieParser());

connectToDatabase();

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/assessments/form-one", formOneRoutes);
app.use("/api/assessments/form-two", formTwoRoutes);
app.use("/api/assessments/form-three", formThreeRoutes);
app.use("/api/assessments/form-four", formFourRoutes);
app.use("/api/assessments/form-six", formSixRoutes);
app.use("/api/processes", processRoutes);
app.use("/api/assessments/form-five", formFiveRoutes);
app.use("/api/assessments/form-seven", formSevenRoutes);
app.use("/api/assessments/form-eight", formEightRoutes);
app.use("/api/assessments/form-nine", formNineRoutes);
app.use("/api/assessments/form-ten", formTenRoutes);



const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
