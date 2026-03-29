const express = require("express");
const donationController = require("../controllers/donationController");
const { protect, restrictTo } = require("../middleware/authMiddlewares");

const router = express.Router();

// Paystack webhook (NO auth — must be public)
router.post("/paystack-webhook", donationController.handleWebhook);

router.use(protect);

// User routes
router.post("/initialize-payment", donationController.initializePayment);
router.get("/verify/:reference", donationController.verifyPayment);
router.get("/me", donationController.getMyDonations);
router.post("/donate/:id", donationController.donateToProject);

// Admin only routes
router.get(
  "/totalAmount",
  restrictTo("admin"),
  donationController.calculateTotalDonations
);
router.post(
  "/monthlyDonation",
  restrictTo("admin"),
  donationController.monthlyDonations
);
router.get(
  "/monthly-stats",
  restrictTo("admin"),
  donationController.getMonthlyStats
);
router.get("/", restrictTo("admin"), donationController.getAllDonations);

router.get(
  "/recent",
  protect,
  restrictTo("admin"),
  donationController.getRecentDonations
);
module.exports = router;
