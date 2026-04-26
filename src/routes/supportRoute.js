const express = require("express");
const supportController = require("../controllers/supportController.js");
const { protect, restrictTo } = require("../middleware/authMiddlewares");
const { upload } = require("../middleware/upload");

const router = express.Router();

// Public — submit a support request
router.post(
  "/",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "nationalIdDoc", maxCount: 1 },
    { name: "supportDocuments", maxCount: 1 },
  ]),
  supportController.createSupport
);

// Admin only
router.patch(
  "/:id",
  protect,
  restrictTo("admin"),
  supportController.updateSupport
);
router.patch(
  "/:id/accept",
  protect,
  restrictTo("admin"),
  supportController.acceptSupport
);
router.patch(
  "/:id/reject",
  protect,
  restrictTo("admin"),
  supportController.rejectSupport
);
router.delete(
  "/:id",
  protect,
  restrictTo("admin"),
  supportController.deleteSupport
);

module.exports = router;
