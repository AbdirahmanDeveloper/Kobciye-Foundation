const express = require("express");
const router = express.Router();
const upload = require("../middleware/memberUpload");
const membersController = require("../controllers/membersController");
const { protect, restrictTo } = require("../middleware/authMiddlewares");

// Get all members (public or protected - your choice)
router.get("/", membersController.getAllMembers);

// Add member (admin only)
router.post(
  "/add",
  protect,
  restrictTo("admin"),
  upload.single("memberImage"),
  membersController.addMember
);

// Delete member (admin only)
router.delete(
  "/:id",
  protect,
  restrictTo("admin"),
  membersController.deleteMember
);

// Get all members
router.get(
  "/totalMembers",
  protect,
  restrictTo("admin"),
  membersController.countMembers
);

module.exports = router;
