const express = require("express");
const volonteerController = require("../controllers/volunteersController.js");
const { upload } = require("../middleware/upload");

const router = express.Router();

router.post(
  "/apply",
  upload.fields([
    { name: "volImage", maxCount: 1 },
    { name: "nationalIdDoc", maxCount: 1 },
  ]),
  volonteerController.createVolunteer
);
router.patch("/:id/accept", volonteerController.acceptVolunteer);
router.patch("/:id/reject", volonteerController.rejectVolunteer);
router.patch("/:id", volonteerController.updateVolunteer);
router.delete("/:id", volonteerController.deleteVolunteer);

module.exports = router;
