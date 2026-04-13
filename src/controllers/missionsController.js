const Mission = require("../models/Missions");
const Volunteer = require("../models/Volunteers");
const { Resend } = require("resend");
const { upload, uploadToCloudinary } = require("../middleware/upload");

const resend = new Resend(process.env.RESEND_API_KEY);
// ─── CREATE ───────────────────────────────────────────────────
exports.createMission = async (req, res) => {
  try {
    const imageUrl = req.file
      ? await uploadToCloudinary(req.file.buffer, "kobciye-foundation/missions")
      : "";
    const mission = await Mission.create({
      title: req.body.title,
      description: req.body.description,
      image: imageUrl,
      duration: req.body.duration,
      volunteers: req.body.volunteers,
      location: req.body.location,
      status: req.body.status,
    });

    res.status(201).json({ status: "success", data: mission });
  } catch (err) {
    console.error("Failed to create mission:", err.message);
    res.status(500).json({ status: "error", message: err.message });
  }
};

// ─── GET ALL ──────────────────────────────────────────────────
exports.getAllMissions = async (req, res) => {
  try {
    const missions = await Mission.find();
    res.status(200).json({ status: "success", data: missions });
  } catch (err) {
    console.error("Failed to get missions:", err.message);
    res.status(500).json({ status: "error", message: err.message });
  }
};

// ─── GET SINGLE MISSION ──────────────────────────────────────────────────
exports.getSingleMission = async (req, res) => {
  try {
    const mission = await Mission.findById(req.params.id);
    if (!mission)
      return res
        .status(404)
        .json({ status: "fail", message: "Mission not found" });
    res.status(200).json({ status: "success", data: mission });
  } catch (err) {
    console.error("Failed to get mission:", err.message);
    res.status(500).json({ status: "error", message: err.message });
  }
};

// ─── UPDATE ───────────────────────────────────────────────────
exports.updateMission = async (req, res) => {
  try {
    const mission = await Mission.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!mission)
      return res
        .status(404)
        .json({ status: "fail", message: "Mission not found" });

    if (mission.status === "completed") {
      const volunteers = await Volunteer.find({ mission: mission._id });

      await Promise.all(
        volunteers.map((volunteer) =>
          resend.emails.send({
            from: `Kobciye Foundation <info@kobciyefoundation.org>`,
            to: volunteer.email,
            subject: `Thank You for Your Service — ${mission.title}`,
            html: `
              <h2>Dear ${volunteer.name},</h2>
              <p>On behalf of everyone at <strong>Kobciye Foundation</strong>, we want to express our deepest gratitude for your dedication and hard work on the <strong>${mission.title}</strong> mission.</p>
              <p>Your commitment to making a difference in the lives of others is truly inspiring. Because of volunteers like you, we are able to create real, lasting change in communities across Kenya.</p>
              <p>This mission has now been successfully completed, and you played a key part in that achievement. We hope this experience has been as meaningful for you as it has been for us.</p>
              <p>We look forward to having you on future missions. Together, we can continue to build a better world.</p>
              <br/>
              <p>With gratitude,</p>
              <p><strong>Kobciye Foundation Team</strong></p>
            `,
          })
        )
      );

      await Volunteer.deleteMany({ mission: mission._id });
    }

    res.status(200).json({ status: "success", data: mission });
  } catch (err) {
    console.error("Failed to update mission:", err.message);
    res.status(500).json({ status: "error", message: err.message });
  }
};

// ─── DELETE ───────────────────────────────────────────────────
exports.deleteMission = async (req, res) => {
  try {
    await Mission.findByIdAndDelete(req.params.id);
    res.status(204).json({ status: "success", data: null });
  } catch (err) {
    console.error("Failed to delete mission:", err.message);
    res.status(500).json({ status: "error", message: err.message });
  }
};
