const Members = require("../models/members");

// Add member
exports.addMember = async (req, res) => {
  try {
    const memberData = {
      name: req.body.name,
      role: req.body.role,
      memberImage: req.file.filename,
    };

    const member = await Members.create(memberData);

    res.status(201).json({
      message: "member created succesfully",
      data: member,
    });
  } catch (error) {
    res.status(500).json({
      status: "fail",
      message: error.message,
    });
  }
};

// Get all members
exports.getAllMembers = async (req, res) => {
  try {
    const members = await Members.find().sort({ createdAt: -1 });

    res.status(200).json({
      status: "success",
      results: members.length,
      data: members,
    });
  } catch (error) {
    console.error(error);
  }
};

// Delete member
exports.deleteMember = async (req, res) => {
  try {
    const member = await Members.findByIdAndDelete(req.params.id);

    if (!member) {
      return res.status(404).json({
        status: "fail",
        message: "Member not found",
      });
    }

    res.status(204).json({
      status: "success",
      data: null,
    });
  } catch (error) {
    console.error("Delete member error:", error);
    res.status(500).json({
      status: "fail",
      message: error.message,
    });
  }
};

// Count total memebers
exports.countMembers = async (req, res) => {
  try {
    const totalMembers = await Members.countDocuments();
    res.status(200).json({
      status: "Suucess",
      data: {
        totalMembers,
      },
    });
  } catch (error) {
    console.error("Count members error:", error);
    res.status(500).json({
      status: "fail",
      message: error.message,
    });
  }
};
