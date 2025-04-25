import multer from "multer";
import path from "path";
import fs from "fs";

// File filter to allow only images and PDFs
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "application/pdf"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    console.error("File filter error: Invalid file type:", file.mimetype);
    cb(new Error("Invalid file type. Only JPEG, PNG, JPG, and PDF are allowed."), false);
  }
};

// Map of form routes to folder names (exact matches preferred)
const formFolderMap = {
  "/api/assessments/form-one": "form-one",
  "/api/assessments/form-two": "form-two",
  "/api/assessments/form-three": "form-three",
  "/api/assessments/form-four": "form-four",
  "/api/assessments/form-five": "form-five",
  "/api/assessments/form-six": "form-six",
  "/api/assessments/form-seven": "form-seven",
  "/api/assessments/form-eight": "form-eight",
  "/api/assessments/form-nine": "form-nine",
  "/api/assessments/form-ten": "form-ten",
  "/api/assessments/form-eleven": "form-eleven",
  "/api/assessments/form-twelve": "form-twelve",
  "/api/assessments/form-thirteen": "form-thirteen",
  "/api/assessments/form-fourteen": "form-fourteen",
  "/api/assessments/form-fifteen": "form-fifteen",
  "/api/assessments/form-sixteen": "form-sixteen",
  "/api/assessments/form-seventeen": "form-seventeen",
  "/api/assessments/form-eighteen": "form-eighteen",
  "/api/assessments/form-nineteen": "form-nineteen",
  "/api/assessments/form-twenty": "form-twenty",
  "/api/assessments/form-twenty-one": "form-twenty-one",
  "/api/assessments/form-twenty-two": "form-twenty-two",
  "/api/assessments/form-twenty-three": "form-twenty-three",
  "/api/assessments/form-twenty-four": "form-twenty-four",
  "/api/assessments/form-twenty-five": "form-twenty-five",
  "/api/assessments/form-twenty-six": "form-twenty-six",
};
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Extensive logging for debugging
    console.log("Multer destination - req.method:", req.method);
    console.log("Multer destination - req.baseUrl:", req.baseUrl);
    console.log("Multer destination - req.originalUrl:", req.originalUrl);
    console.log("Multer destination - req.path:", req.path);
    console.log("Multer destination - req.body:", req.body);

    const userId = req.body.userId;
    if (!userId) {
      console.error("User ID is missing in request body");
      return cb(new Error("User ID is required"), null);
    }

    const baseDir = path.join(process.cwd(), "uploads");
    const userDir = path.join(baseDir, `user-${userId}`);

    // Determine form folder from baseUrl
    const baseUrl = req.baseUrl || "";
    let formFolder = formFolderMap[baseUrl];

    // Fallback: Check originalUrl if baseUrl doesn’t match
    if (!formFolder && req.originalUrl) {
      for (const key in formFolderMap) {
        if (req.originalUrl.includes(key)) {
          formFolder = formFolderMap[key];
          console.log(`Fallback match from originalUrl: ${formFolder}`);
          break;
        }
      }
    }

    if (!formFolder) {
      console.error("Form folder could not be determined:", { baseUrl, originalUrl: req.originalUrl });
      return cb(new Error("Form folder not found or not specified"), null);
    }

    const formDir = path.join(userDir, formFolder);

    // Ensure directories exist
    try {
      if (!fs.existsSync(baseDir)) {
        fs.mkdirSync(baseDir, { recursive: true });
        console.log(`Created base directory: ${baseDir}`);
      }
      if (!fs.existsSync(userDir)) {
        fs.mkdirSync(userDir, { recursive: true });
        console.log(`Created user directory: ${userDir}`);
      }
      if (!fs.existsSync(formDir)) {
        fs.mkdirSync(formDir, { recursive: true });
        console.log(`Created form directory: ${formDir}`);
      }
    } catch (error) {
      console.error("Error creating directories:", error);
      return cb(new Error(`Failed to create directory: ${error.message}`), null);
    }

    console.log(`Uploading to directory: ${formDir}`);
    cb(null, formDir);
  },

  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const filename = `${file.fieldname}-${uniqueSuffix}${ext}`;
    console.log(`Generated filename: ${filename}`);
    cb(null, filename);
  },
});

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

export default upload;