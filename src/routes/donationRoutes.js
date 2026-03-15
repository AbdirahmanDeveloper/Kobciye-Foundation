const express = require("express");
const donationController = require("../controllers/donationController");
const { protect, restrictTo } = require("../middleware/authMiddlewares");

const router = express.Router();

// Paystack webhook (NO auth)
router.post("/paystack-webhook", donationController.handleWebhook);

router.use(protect);

router.post("/initialize-payment", donationController.initializePayment);
router.get("/verify/:reference", donationController.verifyPayment);
router.get("/me", donationController.getMyDonations);
router.get("/totalAmount", donationController.calculateTotalDonations);
router.post("/monthlyDonation", restrictTo("admin"), donationController.monthlyDonations);
router.get("/monthly-stats", restrictTo("admin"), donationController.getMonthlyStats);
router.post("/donate/:id", donationController.donateToProject);
router.get("/", restrictTo("admin"), donationController.getAllDonations);

module.exports = router;