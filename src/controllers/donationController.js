const axios = require("axios");
const Donation = require("../models/Donation");
const Project = require("../models/Project");
require("dotenv").config();

// ─── HELPERS ──────────────────────────────────────────────────

const updateProjectProgress = async (projectId, amount) => {
  const proj = await Project.findById(projectId);
  if (!proj) return;

  proj.raisedAmount += amount;
  if (proj.raisedAmount >= proj.goalAmount) {
    proj.status = "completed";
    proj.raisedAmount = proj.goalAmount;
  }
  await proj.save();
};

// ─── PAYSTACK ─────────────────────────────────────────────────

exports.initializePayment = async (req, res) => {
  try {
    const { project, donationType, amount, phone, paymentMethod } = req.body;

    if (!amount)
      return res
        .status(400)
        .json({ status: "fail", message: "Please provide amount" });

    if (Number(amount) < 10)
      return res
        .status(400)
        .json({ status: "fail", message: "Minimum donation is KES 10" });

    if (paymentMethod === "mpesa" && !phone)
      return res.status(400).json({
        status: "fail",
        message: "Please provide phone number for M-Pesa",
      });

    let projectDoc = null;
    if (project && project !== "custom" && project !== "monthly") {
      projectDoc = await Project.findById(project);
      if (!projectDoc || projectDoc.status !== "active")
        return res.status(404).json({
          status: "fail",
          message: "Project not available for donation",
        });
    }

    const reference = `KOB_${req.user.id}_${Date.now()}`;

    await Donation.create({
      donor: req.user.id,
      project: projectDoc ? project : null,
      donationType,
      amount: Number(amount),
      paymentMethod: paymentMethod === "mpesa" ? "mpesa" : "card",
      reference,
      status: "pending",
    });

    const paystackPayload = {
      email: req.user.email,
      amount: Number(amount) * 100,
      currency: "KES",
      reference,
      callback_url: `${process.env.FRONTEND_URL}/projects`,
      metadata: {
        project_id: project || "custom",
        project_title: projectDoc ? projectDoc.title : "Custom Donation",
        donor_id: req.user.id,
        phone: phone || "",
        payment_method: paymentMethod || "card",
      },
    };

    if (paymentMethod === "mpesa") {
      paystackPayload.channels = ["mobile_money"];
      paystackPayload.mobile_money = { phone, provider: "mpesa" };
    } else {
      paystackPayload.channels = ["card"];
    }

    const response = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      paystackPayload,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const { authorization_url } = response.data.data;
    res.status(200).json({
      status: "success",
      data: { redirectUrl: authorization_url, reference },
    });
  } catch (err) {
    console.error("Paystack error:", err.response?.data || err.message);
    res.status(500).json({
      status: "error",
      message: err.response?.data?.message || err.message,
    });
  }
};

exports.handleWebhook = async (req, res) => {
  try {
    const { event, data } = req.body;

    if (event === "charge.success") {
      const donation = await Donation.findOne({ reference: data.reference });
      if (!donation) return res.status(200).json({ message: "Received" });

      if (donation.status !== "success") {
        donation.status = "success";
        await donation.save();
        if (donation.project)
          await updateProjectProgress(donation.project, donation.amount);
      }
    }

    res.status(200).json({ message: "Received" });
  } catch (err) {
    console.error("Webhook error:", err.message);
    res.status(200).json({ message: "Received" });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const paystackRes = await axios.get(
      `https://api.paystack.co/transaction/verify/${req.params.reference}`,
      {
        headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
      }
    );

    const { status } = paystackRes.data.data;

    if (status === "success") {
      const donation = await Donation.findOne({
        reference: req.params.reference,
      });
      if (donation && donation.status !== "success") {
        donation.status = "success";
        await donation.save();
        if (donation.project)
          await updateProjectProgress(donation.project, donation.amount);
      }
    }

    res.status(200).json({
      status: "success",
      data: { paymentStatus: status === "success" ? "success" : "pending" },
    });
  } catch (err) {
    try {
      const donation = await Donation.findOne({
        reference: req.params.reference,
      });
      if (!donation)
        return res
          .status(404)
          .json({ status: "fail", message: "Donation not found" });
      res
        .status(200)
        .json({ status: "success", data: { paymentStatus: donation.status } });
    } catch (fallbackErr) {
      res.status(500).json({ status: "error", message: fallbackErr.message });
    }
  }
};

// ─── DONATIONS CRUD ───────────────────────────────────────────

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

exports.getAllDonations = async (req, res) => {
  try {
    const donations = await Donation.find()
      .populate("donor", "name email phone donationType")
      .populate("project", "title")
      .sort({ createdAt: -1 });

    res
      .status(200)
      .json({ status: "success", results: donations.length, data: donations });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

exports.monthlyDonations = async (req, res) => {
  try {
    const { donor, amount, paymentMethod, project } = req.body;

    if (!donor || !amount || !paymentMethod)
      return res.status(400).json({
        status: "fail",
        message: "Please provide donor, amount and payment method",
      });

    let projectDoc = null;
    if (project && project !== "custom" && project !== "") {
      projectDoc = await Project.findById(project);
      if (!projectDoc)
        return res
          .status(404)
          .json({ status: "fail", message: "Project not found" });
    }

    const donation = await Donation.create({
      donor,
      amount,
      paymentMethod,
      project: projectDoc ? project : null,
      status: "success",
    });

    if (projectDoc) await updateProjectProgress(projectDoc._id, Number(amount));

    await donation.populate("donor", "name email");
    if (projectDoc) await donation.populate("project", "title");

    res.status(201).json({ status: "success", data: donation });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

exports.donateToProject = async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || isNaN(amount) || Number(amount) < 1)
      return res
        .status(400)
        .json({ status: "fail", message: "Please provide a valid amount" });

    const project = await Project.findById(req.params.id);
    if (!project)
      return res
        .status(404)
        .json({ status: "fail", message: "Project not found" });

    if (project.status === "completed")
      return res.status(400).json({
        status: "fail",
        message: "This project has already reached its goal",
      });

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

// ─── STATS ────────────────────────────────────────────────────

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
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

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
    res.status(200).json(
      stats.map((i) => ({
        month: months[i._id - 1],
        totalAmount: i.totalAmount,
      }))
    );
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
exports.getRecentDonations = async (req, res) => {
  try {
    const since = req.query.since
      ? new Date(req.query.since)
      : new Date(Date.now() - 60000);

    const donations = await Donation.find({
      createdAt: { $gt: since },
    })
      .populate("donor", "name")
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    res.status(200).json({
      status: "success",
      data: donations,
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
};
