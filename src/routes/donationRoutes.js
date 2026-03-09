const express = require("express");
const donationController = require("../controllers/donationController");
const { protect, restrictTo } = require("../middleware/authMiddlewares");

const router = express.Router();

// ── M-Pesa callback (NO auth — called by Safaricom) ──────────
router.post("/mpesa-callback", donationController.handleWebhook);

// ── All routes below require authentication ───────────────────
router.use(protect);

// Initialize STK Push payment
router.post("/initialize-payment", donationController.initializePayment);

// Poll payment status (was verify-payment, now verify/:reference)
router.get("/verify/:reference", donationController.verifyPayment);

// Get my donations
router.get("/me", donationController.getMyDonations);

// Get total donated amount
router.get("/totalAmount", donationController.calculateTotalDonations);

// Add monthly donations (admin)
router.post("/monthlyDonation", restrictTo("admin"), donationController.monthlyDonations);

// Monthly stats (admin)
router.get("/monthly-stats", restrictTo("admin"), donationController.getMonthlyStats);

// Donate directly to project
router.post("/donate/:id", donationController.donateToProject);

// Get all donations (admin)
router.get("/", restrictTo("admin"), donationController.getAllDonations);

module.exports = router;