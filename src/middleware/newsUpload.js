const multer = require("multer");
const path = require("path");
const crypto = require("crypto");
const fs = require("fs");

const newsDir = "uploads/news"
if(!fs.existsSync(newsDir)){
  fs.mkdirSync(newsDir, {recursive: true});
}

// create storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/news");
  },
  filename: (req, file, cb) => {
    const uniqueId = crypto.randomBytes(6).toString("hex");
    cb(null, uniqueId + path.extname(file.originalname));
  },
});

// file filter
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
});

module.exports = upload;
