const express = require("express");
const missionsController = require("../controllers/missionsController");
const upload = require("../middleware/missionsUpload");
const { protect, restrictTo } = require("../middleware/authMiddlewares");

const router = express.Router();

router.get(
  "/",
  protect,
  restrictTo("admin"),
  missionsController.getAllMissions
);

router.get(
  "/:id",
  protect,
  restrictTo("admin"),
  missionsController.getSingleMission     
);

router.post(
  "/createMission",
  protect,
  upload.single("image"),
  restrictTo("admin"),
  missionsController.createMission
);

router.patch(
  "/:id",
  protect,
  upload.single("image"),
  restrictTo("admin"),
  missionsController.updateMission
);

router.delete(
  "/deleteMission/:id",
  protect,
  restrictTo("admin"),
  missionsController.deleteMission
);

module.exports = router;