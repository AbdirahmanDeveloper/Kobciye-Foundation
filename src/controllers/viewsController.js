const Project = require("../models/Project");
const News = require("../models/News");
const Users = require("../models/User");
const Donations = require("../models/Donation");
const Members = require("../models/members");

exports.getHomePage = async (req, res) => {
  try {
    const ongoingProjects = await Project.find({ status: "active" }).limit(6);
    const members = await Members.find().sort({ createdAt: -1 });
    const latestNews = await News.find().sort({ createdAt: -1 }).limit(3); // add this
    res.render("pages/index", {
      title: "Home page",
      activePage: "home",
      ongoingProjects,
      members,
      latestNews,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getLogin = async (req, res) => {
  try {
    res.render("pages/login", {
      title: "login page",
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

exports.getSignup = async (req, res) => {
  try {
    res.render("pages/signup", {
      title: "signup page",
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

exports.getAbout = async (req, res) => {
  try {
    const members = await Members.find().sort({ createdAt: -1 });
    res.render("pages/about", {
      title: "about page",
      activePage: "about",
      members,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

exports.getProjects = async (req, res) => {
  try {
    const ongoingProjects = await Project.find({ status: "active" }).populate(
      "createdBy"
    );
    const completedProjects = await Project.find({
      status: "completed",
    }).populate("createdBy");

    const formatProjects = (projects) =>
      projects.map((project) => {
        const p = project.toJSON();
        p.progressPercentage = Math.min(
          Math.round((p.raisedAmount / p.goalAmount) * 100),
          100
        );
        return p;
      });

    res.render("pages/projects", {
      title: "Projects page",
      activePage: "projects",
      ongoingProjects: formatProjects(ongoingProjects),
      completedProjects: formatProjects(completedProjects),
    });
  } catch (err) {
    console.error("❌ Error in getProjects:", err);
    res.status(500).json({ message: err.message });
  }
};

exports.getBlog = async (req, res) => {
  try {
    const news = await News.find();
    res.render("pages/blog", {
      title: "blog page",
      activePage: "blog",
      news,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

exports.getBlogModal = async (req, res) => {
  try {
    const news = await News.findById(req.params.id);

    if (!news) {
      return res.status(404).json({ message: "News not found" });
    }

    res.render("pages/blog-modal", {
      title: news.title,
      activePage: "blog",
      news,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getContacts = async (req, res) => {
  try {
    res.render("pages/contact", {
      title: "contact page",
      activePage: "contact",
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

exports.getAdmin = async (req, res) => {
  try {
    const news = await News.find();
    const projects = await Project.find().populate("createdBy");
    const users = await Users.find();
    const donations = await Donations.find().populate("donor", "name email");
    const members = await Members.find().sort({ createdAt: -1 });
    const dashDonations = await Donations.find()
      .sort({ createdAt: -1 })
      .limit(6)
      .populate("donor", "name email");
    res.render("pages/admin", {
      title: "Home page",
      news,
      projects,
      users,
      donations,
      members,
      dashDonations,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

exports.getPayment = async (req, res) => {
  try {
    const projects = await Project.find({ status: "active" });
    res.render("pages/payment", {
      title: "Payment Gateway",
      projects,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: err.message,
    });
  }
};

exports.getPaymentSuccess = async (req, res) => {
  try {
    const reference = req.query.reference;

    res.render("pages/payment-success", {
      title: "Payment Successful",
      reference: reference,
    });
  } catch (err) {
    console.error("Error loading payment success page:", err);

    res.status(500).json({
      message: err.message,
    });
  }
};

exports.getResetPassword = (req, res) => {
  res.render("pages/reset-password", {
    title: "Reset Password",
    activePage: "",
  });
};

exports.getOTP = (req, res) => {
  res.render("pages/otp", {
    title: "Verify OTP",
    activePage: "",
  });
};

exports.getResetEmail = (req, res) => {
  res.render("pages/reset-email", {
    title: "Reset Email",
    activePage: "",
  });
};
