const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

// Create directory if it doesn't exist
const membersDir = path.join(__dirname, "..", "..", "uploads", "members");
if (!fs.existsSync(membersDir)) {
  fs.mkdirSync(membersDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/members"); 
  },
  filename: (req, file, cb) => { 
    const uniqueId = crypto.randomBytes(6).toString("hex");
    cb(null, uniqueId + path.extname(file.originalname));
  },
});

// File filter
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only images are allowed"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

module.exports = upload;