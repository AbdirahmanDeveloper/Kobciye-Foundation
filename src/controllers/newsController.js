const News = require("../models/News");

// Get all News (Public access)
exports.getAllNews = async (req, res) => {
  try {
    const news = await News.find()
      .sort({ createdAt: -1 })
      .populate("project", "name")
      .populate("publishedBy", "name");

    res.status(200).json({
      status: "success",
      result: news.length,
      data: news,
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
};

// Get single News (Public access)
exports.getSingleNews = async (req, res) => {
  try {
    const news = await News.findById(req.params.id)
      .populate("project", "name")
      .populate("publishedBy", "name");

    if (!news) {
      return res.status(404).json({
        status: "fail",
        message: "News not found",
      });
    }

    res.status(200).json({
      status: "success",
      data: news,
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
};

// Create News (Admin access only)
exports.createNews = async (req, res) => {
  try {
    // Validate that file was uploaded
    if (!req.file) {
      return res.status(400).json({
        status: "fail",
        message: "Please upload a cover image",
      });
    }

    const newsData = {
      title: req.body.title,
      content: req.body.content,
      project: req.body.project,
      image: req.file.filename,
      publishedBy: req.user.id,
    };

    const news = await News.create(newsData);

    res.status(201).json({
      status: "success",
      message: "News created successfully",
      data: news,
    });
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err.message,
    });
  }
};

// Update News (Admin access only)
exports.updateNews = async (req, res) => {
  try {
    const news = await News.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!news) {
      return res.status(404).json({
        status: "fail",
        message: "News not found",
      });
    }

    res.status(200).json({
      status: "success",
      data: news,
    });
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err.message,
    });
  }
};

// Delete News (Admin access only)
exports.deleteNews = async (req, res) => {
  try {
    const news = await News.findByIdAndDelete(req.params.id);

    if (!news) {
      return res.status(404).json({
        status: "fail",
        message: "News not found",
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
