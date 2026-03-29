const Project = require("../models/Project");
const News = require("../models/News");
const Users = require("../models/User");
const Donations = require("../models/Donation");
const Members = require("../models/members");
const Contacts = require("../models/Contact");
const Impacts = require("../models/Impacts");

// ─── HELPERS ──────────────────────────────────────────────────

const formatProjects = (projects) =>
  projects.map((project) => {
    const p = project.toJSON();
    p.progressPercentage = Math.min(
      Math.round((p.raisedAmount / p.goalAmount) * 100),
      100
    );
    return p;
  });

// ─── VIEWS ────────────────────────────────────────────────────

exports.getHomePage = async (req, res) => {
  try {
    const ongoingProjects = await Project.find({ status: "active" }).limit(6);
    const members = await Members.find().sort({ createdAt: -1 });
    const latestNews = await News.find().sort({ createdAt: -1 }).limit(1);
    const impacts = await Impacts.findOne();

    res.render("pages/index", {
      title: "Home page",
      activePage: "home",
      ongoingProjects,
      members,
      latestNews,
      impacts,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getLogin = (req, res) => res.render("pages/login", { title: "Login" });
exports.getSignup = (req, res) =>
  res.render("pages/signup", { title: "Signup" });
exports.getResetPassword = (req, res) =>
  res.render("pages/reset-password", { title: "Reset Password" });
exports.getOTP = (req, res) => res.render("pages/otp", { title: "Verify OTP" });

exports.getAbout = async (req, res) => {
  try {
    const impacts = await Impacts.findOne();
    const members = await Members.find().sort({ createdAt: -1 });
    res.render("pages/about", {
      title: "About",
      activePage: "about",
      members,
      impacts,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getProjects = async (req, res) => {
  try {
    const impacts = await Impacts.findOne();
    const ongoingProjects = await Project.find({ status: "active" }).populate(
      "createdBy"
    );
    const completedProjects = await Project.find({
      status: "completed",
    }).populate("createdBy");

    res.render("pages/projects", {
      title: "Projects",
      activePage: "projects",
      ongoingProjects: formatProjects(ongoingProjects),
      completedProjects: formatProjects(completedProjects),
      impacts,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getProjectModal = async (req, res) => {
  try {
    const impacts = await Impacts.findOne();
    const project = await Project.findById(req.params.id);
    if (!project)
      return res
        .status(404)
        .json({ status: "fail", message: "Project not found" });

    res.render("pages/project-modal", { title: "Project", project, impacts });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getBlog = async (req, res) => {
  try {
    const impacts = await Impacts.findOne();
    const news = await News.find();
    res.render("pages/blog", {
      title: "Blog",
      activePage: "blog",
      news,
      impacts,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getBlogModal = async (req, res) => {
  try {
    const impacts = await Impacts.findOne();
    const news = await News.findById(req.params.id);
    if (!news) return res.status(404).json({ message: "News not found" });

    res.render("pages/blog-modal", { title: news.title, news, impacts });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getContacts = async (req, res) => {
  try {
    const impacts = await Impacts.findOne().lean();

    res.render("pages/contact", {
      title: "Contact",
      activePage: "contact",
      impacts,
    });
  } catch (err) {
    console.error("getContacts error:", err);
    res.status(500).json({ message: err.message });
  }
};

exports.getAdmin = async (req, res) => {
  try {
    const [
      news,
      projects,
      users,
      donations,
      members,
      dashDonations,
      contacts,
      impacts,
    ] = await Promise.all([
      News.find(),
      Project.find().populate("createdBy"),
      Users.find(),
      Donations.find()
        .populate("donor", "name email phone country donationType")
        .populate("project", "title")
        .sort({ createdAt: -1 }),
      Members.find().sort({ createdAt: -1 }),
      Donations.find()
        .sort({ createdAt: -1 })
        .limit(6)
        .populate("donor", "name email phone country donationType")
        .populate("project", "title"),

      Contacts.find(),
      Impacts.findOne(),
    ]);

    res.render("pages/admin", {
      title: "Admin",
      news,
      projects,
      users,
      donations,
      members,
      dashDonations,
      contacts,
      impacts,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getPayment = async (req, res) => {
  try {
    const projects = await Project.find({ status: "active" });
    res.render("pages/payment", { title: "Payment Gateway", projects });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
