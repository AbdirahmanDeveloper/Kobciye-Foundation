const Project = require("../models/Project");
const Newsletter = require("../models/NewsLetter");
const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

// ─── NEWSLETTER ───────────────────────────────────────────────

const sendProjectUpdateToSubscribers = async (project) => {
  try {
    const subscribers = await Newsletter.find({}, "email");
    if (!subscribers.length) return;

    const emails = subscribers.map((s) => s.email);
    const projectUrl = `${process.env.FRONTEND_URL}/projects/${project._id}`;

    await resend.emails.send({
      from: "Kobciye Foundation <info@kobciyefoundation.org>",
      to: emails,
      subject: `🚀 New Project: ${project.title}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
          <h1 style="color:#333;">New Project Just Started!</h1>
          ${project.image ? `<img src="${project.image}" alt="Cover Image" style="width:100%;border-radius:8px;margin-bottom:16px;" />` : ""}
          <h2 style="color:#444;">${project.title}</h2>
          <p style="color:#666;font-size:15px;line-height:1.6;">${project.description.substring(0, 200)}...</p>
          <a href="${projectUrl}" style="display:inline-block;margin-top:20px;padding:12px 24px;background-color:#4F46E5;color:white;text-decoration:none;border-radius:6px;font-size:15px;">
            View Project →
          </a>
          <hr style="margin-top:40px;border:none;border-top:1px solid #eee;" />
          <p style="color:#aaa;font-size:12px;">You're receiving this because you subscribed to our newsletter.</p>
        </div>
      `,
    });

    console.log(`Project update sent to ${emails.length} subscribers`);
  } catch (err) {
    console.error("Failed to send project update:", err.message);
  }
};

// ─── PROJECTS CRUD ────────────────────────────────────────────

exports.getAllProjects = async (req, res) => {
  try {
    const ongoingProjects = await Project.find({ status: "active" });
    const completedProjects = await Project.find({ status: "completed" });

    const formatProjects = (projects) =>
      projects.map((project) => {
        const p = project.toJSON();
        p.progressPercentage = Math.min(
          Math.round((p.raisedAmount / p.goalAmount) * 100),
          100
        );
        return p;
      });

    const formattedOngoing = formatProjects(ongoingProjects);
    const formattedCompleted = formatProjects(completedProjects);

    if (req.accepts("html")) {
      return res.render("projects", {
        ongoingProjects: formattedOngoing,
        completedProjects: formattedCompleted,
      });
    }

    res.status(200).json({
      status: "success",
      results: { ongoing: formattedOngoing.length, completed: formattedCompleted.length },
      data: { ongoingProjects: formattedOngoing, completedProjects: formattedCompleted },
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

exports.getSingleProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project)
      return res.status(404).json({ status: "fail", message: "Project not found" });

    res.status(200).json({ status: "success", data: project });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

exports.createProject = async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ status: "fail", message: "Please upload a cover image" });

    const project = await Project.create({
      image: req.file.path,
      title: req.body.title,
      description: req.body.description,
      goalAmount: req.body.goalAmount,
      createdBy: req.user.id,
    });

    sendProjectUpdateToSubscribers(project);

    res.status(201).json({ status: "success", message: "Project created successfully", data: project });
  } catch (err) {
    console.error("Project creation error:", err);
    res.status(500).json({ status: "error", message: err.message });
  }
};

exports.updateProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!project)
      return res.status(404).json({ status: "fail", message: "Project not found" });

    res.status(200).json({ status: "success", data: project });
  } catch (err) {
    res.status(400).json({ status: "error", message: err.message });
  }
};

exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);

    if (!project)
      return res.status(404).json({ status: "fail", message: "Project not found" });

    res.status(204).json({ status: "success", data: null });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

exports.countProjects = async (req, res) => {
  try {
    const countCompleted = await Project.countDocuments({ status: "completed" });
    const countActive = await Project.countDocuments({ status: "active" });

    res.status(200).json({ status: "success", data: { countCompleted, countActive } });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};