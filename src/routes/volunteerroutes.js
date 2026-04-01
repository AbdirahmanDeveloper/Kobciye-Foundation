const express = require("express");
const volonteerController = require("../controllers/volunteersController.js");

const router = express.Router();

router.post(
  "/createVolunteer",
  volonteerController.uploadImage,
  volonteerController.createVolunteer
);
router.patch("/updateVolunteer/:id", volonteerController.updateVolunteer);
router.delete("/deleteVolunteer/:id", volonteerController.deleteVolunteer);

module.exports = router;
