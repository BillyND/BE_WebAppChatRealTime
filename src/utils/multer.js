const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({});

const fileFilter = (req, file, cb) => {
  const allowedExtensions = [".jpg", ".jpeg", ".png"];
  const ext = path.extname(file.originalname);

  if (!allowedExtensions.includes(ext)) {
    cb(new Error("File type is not supported"), false);
    return;
  }

  cb(null, true);
};

module.exports = multer({ storage, fileFilter });
