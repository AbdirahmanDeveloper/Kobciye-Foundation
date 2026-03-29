const express = require("express");
const router = express.Router();
const impactsController = require("../controllers/impactsController");
const { protect, restrictTo } = require("../middleware/authMiddlewares");

router.get("/", impactsController.getImpacts);
router.patch("/", protect, restrictTo("admin"), impactsController.updateImpacts);

module.exports = router;
