const Project = require("../models/Project");

// Fetch all projects (public access)
exports.getAllProjects = async (req, res) => {
  try {
    const ongoingProjects = await Project.find({ status: "active" });
    const completedProjects = await Project.find({ status: "completed" });

    // Format projects with progressPercentage
    const formatProjects = (projects) =>
      projects.map((project) => {
        const p = project.toJSON(); // includes virtuals
        p.progressPercentage = Math.min(
          Math.round((p.raisedAmount / p.goalAmount) * 100),
          100
        );
        return p;
      });

    const formattedOngoing = formatProjects(ongoingProjects);
    const formattedCompleted = formatProjects(completedProjects);

    // If request wants HTML (browser), render the Pug view
    if (req.accepts("html")) {
      return res.render("projects", {
        ongoingProjects: formattedOngoing,
        completedProjects: formattedCompleted,
      });
    }

    // Otherwise return JSON (API)
    res.status(200).json({
      status: "success",
      results: {
        ongoing: formattedOngoing.length,
        completed: formattedCompleted.length,
      },
      data: {
        ongoingProjects: formattedOngoing,
        completedProjects: formattedCompleted,
      },
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
};

// Fetch single project (public access)
exports.getSingleProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      res.status(404).json({
        status: "fail",
        message: "Project not found",
      });
    }

    res.status(200).json({
      status: "success",
      data: project,
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
};

// Create project (admin access only)
exports.createProject = async (req, res) => {
  try {
    // Validate that file was uploaded
    if (!req.file) {
      return res.status(400).json({
        status: "fail",
        message: "Please upload a cover image",
      });
    }

    const projectData = {
      image: req.file.filename,
      title: req.body.title,
      description: req.body.description,
      goalAmount: req.body.goalAmount,
      createdBy: req.user.id,
    };

    const project = await Project.create(projectData);

    res.status(201).json({
      status: "success",
      message: "Project created successfully",
      data: project,
    });
  } catch (err) {
    console.error("Project creation error:", err); // Add logging
    res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
};

// Update project (admin access only)
exports.updateProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!project) {
      return res.status(404).json({
        status: "fail",
        message: "Project not found",
      });
    }

    res.status(200).json({
      status: "success",
      data: project,
    });
  } catch (err) {
    res.status(400).json({
      status: "error",
      message: err.message,
    });
  }
};

// Delete project (admin access only)
exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);

    if (!project) {
      return res.status(404).json({
        status: "fail",
        message: "Project not found",
      });
    }

    res.status(204).json({
      status: "success",
      data: null,
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
};

// count projects
exports.countProjects = async (req, res) => {
  try {
    const countCompleted = await Project.countDocuments({
      status: "completed",
    });
    const countActive = await Project.countDocuments({ status: "active" });

    res.status(200).json({
      status: "success",
      data: {
        countCompleted,
        countActive,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

