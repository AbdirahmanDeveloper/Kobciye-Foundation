// controllers/donationController.js

const axios = require("axios");
const Donation = require("../models/Donation");
const Project = require("../models/Project");
require("dotenv").config();

/* ============================================================
   HELPER — GET MPESA ACCESS TOKEN
============================================================ */

async function getMpesaToken() {
  const auth = Buffer.from(
    `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
  ).toString("base64");

  const response = await axios.get(
    "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
    {
      headers: { Authorization: `Basic ${auth}` },
      timeout: 15000,
    }
  );

  return response.data.access_token;
}

/* ============================================================
   HELPER — FORMAT PHONE NUMBER
   07xxxxxxxx or +2547xxxxxxxx → 2547xxxxxxxx
============================================================ */

function formatPhone(phone) {
  phone = phone.toString().trim().replace(/\s+/g, "");
  if (phone.startsWith("+254")) return phone.slice(1);
  if (phone.startsWith("0")) return "254" + phone.slice(1);
  if (phone.startsWith("254")) return phone;
  return "254" + phone;
}

/* ============================================================
   HELPER — GENERATE MPESA PASSWORD + TIMESTAMP
============================================================ */

function getMpesaPassword() {
  const shortcode = process.env.MPESA_SHORTCODE;
  const passkey = process.env.MPESA_PASSKEY;
  const timestamp = new Date()
    .toISOString()
    .replace(/[^0-9]/g, "")
    .slice(0, 14);
  const password = Buffer.from(shortcode + passkey + timestamp).toString(
    "base64"
  );
  return { password, timestamp };
}

/* ============================================================
   STK PUSH — INITIALIZE PAYMENT
============================================================ */

exports.initializePayment = async (req, res) => {
  try {
    const { project, amount, phone } = req.body;

    // ── Validation ──────────────────────────────────────────
    if (!project || !amount || !phone) {
      return res.status(400).json({
        status: "fail",
        message: "Please provide project, amount and phone number",
      });
    }

    if (Number(amount) < 10) {
      return res.status(400).json({
        status: "fail",
        message: "Minimum donation amount is KES 10",
      });
    }

    // ── Check project ────────────────────────────────────────
    const projectDoc = await Project.findById(project);
    if (!projectDoc || projectDoc.status !== "active") {
      return res.status(404).json({
        status: "fail",
        message: "Project not available for donation",
      });
    }

    // ── Get M-Pesa token ─────────────────────────────────────
    console.log("🔑 Getting M-Pesa token...");
    const token = await getMpesaToken();
    console.log("✅ Token received:", token.slice(0, 10) + "...");

    // ── Build STK Push payload ───────────────────────────────
    const { password, timestamp } = getMpesaPassword();
    const formattedPhone = formatPhone(phone);

    const payload = {
      BusinessShortCode: process.env.MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: Math.round(Number(amount)),
      PartyA: formattedPhone,
      PartyB: process.env.MPESA_SHORTCODE,
      PhoneNumber: formattedPhone,
      CallBackURL: `${process.env.MPESA_CALLBACK_URL}/api/donations/mpesa-callback`,
      AccountReference: "KobciyeFoundation",
      TransactionDesc: `Donation to ${projectDoc.title}`,
    };

    console.log("📤 STK Push payload:", JSON.stringify(payload, null, 2));

    // ── Save donation BEFORE STK Push ────────────────────────
    // This ensures the callback always finds the donation record
    const tempRef = `PENDING_${req.user.id}_${Date.now()}`;
    const donation = await Donation.create({
      donor: req.user.id,
      project: project,
      amount: Number(amount),
      paymentMethod: "mpesa",
      reference: tempRef,
      status: "pending",
    });

    // ── Send STK Push ────────────────────────────────────────
    const stkResponse = await axios.post(
      "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        timeout: 30000,
      }
    );

    console.log(
      "📥 STK Push response:",
      JSON.stringify(stkResponse.data, null, 2)
    );

    const { CheckoutRequestID, ResponseCode, CustomerMessage } =
      stkResponse.data;

    if (ResponseCode !== "0") {
      // STK Push rejected — remove the pending donation
      await Donation.findByIdAndDelete(donation._id);
      return res.status(400).json({
        status: "fail",
        message: CustomerMessage || "STK Push failed",
      });
    }

    // ── Update donation with real CheckoutRequestID ──────────
    donation.reference = CheckoutRequestID;
    await donation.save();

    res.status(200).json({
      status: "success",
      message: CustomerMessage || "Check your phone and enter M-Pesa PIN",
      data: { checkoutRequestId: CheckoutRequestID },
    });
  } catch (error) {
    console.error("❌ STK Push error:");
    console.error("  Message:", error.message);
    console.error("  Code:", error.code);
    console.error("  Response:", JSON.stringify(error.response?.data, null, 2));

    if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
      return res.status(503).json({
        status: "error",
        message: "M-Pesa service is temporarily unavailable. Please try again.",
      });
    }

    res.status(500).json({
      status: "error",
      message: error.response?.data?.errorMessage || error.message,
    });
  }
};

/* ============================================================
   MPESA CALLBACK — CALLED BY SAFARICOM AFTER PAYMENT
============================================================ */

exports.handleWebhook = async (req, res) => {
  try {
    console.log(
      "📩 M-Pesa callback received:",
      JSON.stringify(req.body, null, 2)
    );

    const callback = req.body?.Body?.stkCallback;
    if (!callback) return res.status(400).json({ message: "Invalid callback" });

    const { CheckoutRequestID, ResultCode, ResultDesc } = callback;

    const donation = await Donation.findOne({ reference: CheckoutRequestID });

    if (!donation) {
      console.error("❌ Callback: donation not found for", CheckoutRequestID);
      return res.status(200).json({ message: "Received" }); // always 200 to Safaricom
    }

    if (ResultCode === 0) {
      // ── Payment successful ──────────────────────────────
      donation.status = "success";
      await donation.save();

      const projectDoc = await Project.findById(donation.project);
      if (projectDoc) {
        projectDoc.raisedAmount += donation.amount;
        if (projectDoc.raisedAmount >= projectDoc.goalAmount) {
          projectDoc.status = "completed";
        }
        await projectDoc.save();
      }
      console.log("✅ Payment successful:", CheckoutRequestID);
    } else {
      // ── Payment failed or cancelled ───────────────────────
      donation.status = "failed";
      await donation.save();
      console.log("❌ Payment failed:", ResultDesc);
    }

    res.status(200).json({ message: "Callback received" });
  } catch (error) {
    console.error("Callback error:", error);
    res.status(200).json({ message: "Received" });
  }
};

/* ============================================================
   POLL PAYMENT STATUS
============================================================ */

exports.verifyPayment = async (req, res) => {
  try {
    const donation = await Donation.findOne({
      reference: req.params.reference,
    });

    if (!donation) {
      return res
        .status(404)
        .json({ status: "fail", message: "Donation not found" });
    }

    res.status(200).json({
      status: "success",
      data: { paymentStatus: donation.status },
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

/* ============================================================
   GET MY DONATIONS
============================================================ */

exports.getMyDonations = async (req, res) => {
  try {
    const donations = await Donation.find({ donor: req.user.id })
      .populate("project", "title goalAmount image")
      .sort({ createdAt: -1 });

    res
      .status(200)
      .json({ status: "success", results: donations.length, data: donations });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

/* ============================================================
   GET ALL DONATIONS (ADMIN)
============================================================ */

exports.getAllDonations = async (req, res) => {
  try {
    const donations = await Donation.find()
      .populate("donor", "name email")
      .populate("project", "title")
      .sort({ createdAt: -1 });

    res
      .status(200)
      .json({ status: "success", results: donations.length, data: donations });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

/* ============================================================
   CALCULATE TOTAL DONATIONS
============================================================ */

exports.calculateTotalDonations = async (req, res) => {
  try {
    const result = await Donation.aggregate([
      { $match: { status: "success" } },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$amount" },
          totalCount: { $sum: 1 },
        },
      },
    ]);

    const data =
      result.length > 0
        ? {
            totalAmount: result[0].totalAmount,
            totalCount: result[0].totalCount,
          }
        : { totalAmount: 0, totalCount: 0 };

    res
      .status(200)
      .json({ status: "success", data: { ...data, currency: "KES" } });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

/* ============================================================
   MONTHLY DONATIONS (ADMIN MANUAL ENTRY)
============================================================ */

exports.monthlyDonations = async (req, res) => {
  try {
    const { donor, amount, paymentMethod, project } = req.body;

    if (!donor || !amount || !paymentMethod || !project) {
      return res.status(400).json({
        status: "fail",
        message:
          "Please provide donor name, amount, payment method and project",
      });
    }

    const projectDoc = await Project.findById(project);
    if (!projectDoc) {
      return res
        .status(404)
        .json({ status: "fail", message: "Project not found" });
    }

    const donation = await Donation.create({
      donor,
      amount,
      paymentMethod,
      project,
      status: "success",
    });

    projectDoc.raisedAmount += Number(amount);
    if (projectDoc.raisedAmount >= projectDoc.goalAmount)
      projectDoc.status = "completed";
    await projectDoc.save();

    await donation.populate("donor", "name email");
    await donation.populate("project", "title");

    res.status(201).json({ status: "success", data: donation });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

/* ============================================================
   MONTHLY STATS (ADMIN CHART)
============================================================ */

exports.getMonthlyStats = async (req, res) => {
  try {
    const stats = await Donation.aggregate([
      { $match: { status: "success" } },
      {
        $group: {
          _id: { $month: "$createdAt" },
          totalAmount: { $sum: "$amount" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const formatted = stats.map((i) => ({
      month: months[i._id - 1],
      totalAmount: i.totalAmount,
    }));

    res.status(200).json(formatted);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

/* ============================================================
   DONATE TO PROJECT (DIRECT)
============================================================ */

exports.donateToProject = async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || isNaN(amount) || Number(amount) < 1) {
      return res
        .status(400)
        .json({ status: "fail", message: "Please provide a valid amount" });
    }

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res
        .status(404)
        .json({ status: "fail", message: "Project not found" });
    }
    if (project.status === "completed") {
      return res
        .status(400)
        .json({
          status: "fail",
          message: "This project has already reached its goal",
        });
    }

    project.raisedAmount += Number(amount);
    const completed = project.raisedAmount >= project.goalAmount;
    if (completed) {
      project.status = "completed";
      project.raisedAmount = project.goalAmount;
    }
    await project.save();

    res.status(200).json({
      status: "success",
      message: completed
        ? "Goal reached! Project completed 🎉"
        : "Donation successful",
      data: {
        project: {
          _id: project._id,
          raisedAmount: project.raisedAmount,
          goalAmount: project.goalAmount,
          progressPercentage: Math.min(
            Math.round((project.raisedAmount / project.goalAmount) * 100),
            100
          ),
          status: project.status,
        },
      },
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};
