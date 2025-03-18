import multer from "multer";
import path from "path";
import fs from "fs";

// File filter to allow only images and PDFs
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "application/pdf"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only JPEG, PNG, JPG, and PDF are allowed."), false);
  }
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userId = req.body.userId; // Get userId from the request body
    if (!userId) {
      return cb(new Error("User ID is required"), false);
    }

    // 1) Create the user-specific folder if it doesn't exist
    const userDir = path.join(process.cwd(), "uploads", `user-${userId}`);
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }

    // 2) Determine which form folder to use based on the base URL of the request
    const baseUrl = req.baseUrl || ""; // e.g., "/api/assessments/form-five"
    let formFolder = ""; // default value

    // Dynamically map form folder based on the request URL path
    if (baseUrl.includes("form-one")) {
      formFolder = "form-one";
    } else if (baseUrl.includes("form-two")) {
      formFolder = "form-two";
    } else if (baseUrl.includes("form-three")) {
      formFolder = "form-three";
    } else if (baseUrl.includes("form-four")) {
      formFolder = "form-four";
    } else if (baseUrl.includes("form-five")) {
      formFolder = "form-five";
    } else if (baseUrl.includes("form-six")) {
      formFolder = "form-six";
    } else if (baseUrl.includes("form-seven")) {
      formFolder = "form-seven";
    } else if (baseUrl.includes("form-eight")) {
      formFolder = "form-eight";
    } else if (baseUrl.includes("form-nine")) {
      formFolder = "form-nine";
    }
    // Add more conditions for additional forms as needed

    // 3) Ensure the form folder exists or create it
    if (!formFolder) {
      return cb(new Error("Form folder not found or not specified"), false);
    }

    const formDir = path.join(userDir, formFolder);
    if (!fs.existsSync(formDir)) {
      fs.mkdirSync(formDir, { recursive: true });
    }

    // 4) Pass the final folder path to multer
    cb(null, formDir);
  },

  filename: (req, file, cb) => {
    // Create a unique filename for each file
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});

const upload = multer({ storage, fileFilter });

export default upload;
