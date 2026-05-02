const express = require("express");
const monthlyDonorController = require("../controllers/monthlyDonorController");
const { protect, restrictTo } = require("../middleware/authMiddlewares");

const router = express.Router();

router.get(
  "/",
  protect,
  restrictTo("admin"),
  monthlyDonorController.getAllMonthlyDonors
);
router.post("/create", protect, monthlyDonorController.createMonthlyDonor);

/* === SPECIFIC ROUTES BEFORE PARAM ROUTES === */
router.get("/me", protect, monthlyDonorController.getMonthlyDonorByEmail);

router.get("/:id", protect, monthlyDonorController.getMonthlyDonor);
router.patch("/:id/checkin", protect, monthlyDonorController.checkInMonths);
router.delete("/:id", protect, monthlyDonorController.deleteMonthlyDonor);

module.exports = router;
