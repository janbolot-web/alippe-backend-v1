import multer from "multer";
import multerS3 from "multer-s3-transform";
import AWS from "aws-sdk";
// import config from "../config/s3.config.js";

const S3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const upload = multer({
  storage: multerS3({
    s3: S3,
    bucket: process.env.AWS_BUCKET_NAME,
    key: function (req, file, cb) {
      if (file.fieldname === "logo") {
        cb(null, `stores/${Date.now().toString()}-${file.originalname}`);
      } else if (file.fieldname === "images") {
        cb(null, `products/${Date.now().toString()}-${file.originalname}`);
      }
    },
  }),
});

export default upload.fields([
  { name: "logo", maxCount: 1 },
  { name: "images", maxCount: 8 },
]);
