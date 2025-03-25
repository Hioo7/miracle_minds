// // routes/reportRoutes.js
// const express = require("express");
// const router = express.Router();
// const multer = require("multer");
// const multerS3 = require("multer-s3");
// const AWS = require("aws-sdk");
// const { authenticate, authorizeAdmin } = require("../middleware/authenticate");
// const Booking = require("../models/Booking");

// AWS.config.update({
//   accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//   secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
//   region: process.env.AWS_REGION,
// });

// const s3 = new AWS.S3();

// const upload = multer({
//   storage: multerS3({
//     s3: s3,
//     bucket: process.env.AWS_S3_BUCKET,
//     acl: "public-read",
//     key: function (req, file, cb) {
//       const bookingId = req.params.bookingId;
//       const fileName = `${bookingId}/${Date.now()}-${file.originalname}`;
//       cb(null, fileName);
//     },
//   }),
// });

// router.post(
//   "/:bookingId/upload-reports",
//   authenticate,
//   authorizeAdmin,
//   upload.array("reports", 10),
//   async (req, res) => {
//     try {
//       const bookingId = req.params.bookingId;
//       if (!req.files || req.files.length === 0) {
//         return res.status(400).json({ message: "No files uploaded." });
//       }
//       const reports = req.files.map((file) => ({
//         url: file.location,
//         key: file.key,
//       }));
//       const booking = await Booking.findByIdAndUpdate(
//         bookingId,
//         { $push: { reports: { $each: reports } } },
//         { new: true }
//       );
//       res.status(200).json({ message: "Reports uploaded successfully", booking });
//     } catch (error) {
//       console.error("Error uploading reports:", error);
//       res.status(500).json({ message: "Server error uploading reports" });
//     }
//   }
// );

// module.exports = router;
