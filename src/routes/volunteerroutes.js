const express = require("express");
const volonteerController = require("../controllers/volunteersController.js");
const { upload } = require("../middleware/upload");

const router = express.Router();

router.post(
  "/apply",
  upload.single("volImage"),
  volonteerController.createVolunteer
);
router.patch("/:id/accept", volonteerController.acceptVolunteer);
router.patch("/:id/reject", volonteerController.rejectVolunteer);
router.patch("/:id", volonteerController.updateVolunteer);
router.delete("/:id", volonteerController.deleteVolunteer);

module.exports = router;
