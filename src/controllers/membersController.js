const Members = require("../models/members");
const { upload, uploadToCloudinary } = require("../middleware/upload");

// ─── MEMBERS CRUD ─────────────────────────────────────────────

exports.addMember = async (req, res) => {
  try {
    const imageUrl = req.file
      ? await uploadToCloudinary(req.file.buffer, "kobciye-foundation/members")
      : "";
    const member = await Members.create({
      name: req.body.name,
      role: req.body.role,
      memberImage: imageUrl,
    });

    res.status(201).json({
      status: "success",
      message: "Member created successfully",
      data: member,
    });
  } catch (err) {
    res.status(500).json({ status: "fail", message: err.message });
  }
};

exports.getAllMembers = async (req, res) => {
  try {
    const members = await Members.find().sort({ createdAt: -1 });
    res
      .status(200)
      .json({ status: "success", results: members.length, data: members });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

exports.deleteMember = async (req, res) => {
  try {
    const member = await Members.findByIdAndDelete(req.params.id);
    if (!member)
      return res
        .status(404)
        .json({ status: "fail", message: "Member not found" });

    res.status(204).json({ status: "success", data: null });
  } catch (err) {
    res.status(500).json({ status: "fail", message: err.message });
  }
};

exports.countMembers = async (req, res) => {
  try {
    const totalMembers = await Members.countDocuments();
    res.status(200).json({ status: "success", data: { totalMembers } });
  } catch (err) {
    res.status(500).json({ status: "fail", message: err.message });
  }
};
