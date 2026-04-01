const Volenteers = require("../models/Volunteers");
const upload = require("../middleware/volIpload");
const { Resend } = require("resend");


exports.uploadImage = upload.single("volImage");

exports.createVolunteer = async (req, res) => {
  try {
    const volonteer = await Volenteers.create({
      name: req.body.volName,
      phone: req.body.volPhone,
      email: req.body.volEmail,
      image: req.file ? req.file.path : null,
      availibility: req.body.availibility,
      nationalId: req.body.nationalId,
    });

    res.status(200).json({
      status: "success",
      data: volonteer,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "failed" });
  }
};

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendVolunteerEmail(volunteer, status) {
  const isAccepted = status === "accepted";

  await resend.emails.send({
    from: "Kobciye Foundation <info@kobciyefoundation.org>",
    to: volunteer.email,
    subject: isAccepted
      ? "🎉 Your Volunteer Application Has Been Accepted"
      : "Your Volunteer Application Update",
    html: isAccepted
      ? `
        <h2>Welcome to the Team, ${volunteer.name}!</h2>
        <p>We are thrilled to let you know that your volunteer application to <strong>Kobciye Foundation</strong> has been <strong style="color: green;">accepted</strong>.</p>
        <p>We will be in touch soon with next steps. Thank you for your willingness to make a difference!</p>
        <br/>
        <p>Warm regards,</p>
        <p><strong>Kobciye Foundation Team</strong></p>
      `
      : `
        <h2>Application Update, ${volunteer.name}</h2>
        <p>Thank you for applying to volunteer with <strong>Kobciye Foundation</strong>.</p>
        <p>After careful consideration, we regret to inform you that your application has been <strong style="color: red;">rejected</strong> at this time.</p>
        <p>We encourage you to apply again in the future. Thank you for your interest in supporting our mission.</p>
        <br/>
        <p>Warm regards,</p>
        <p><strong>Kobciye Foundation Team</strong></p>
      `,
  });
}

exports.updateVolunteer = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["pending", "accepted", "rejected"].includes(status)) {
      return res.status(400).json({
        status: "failed",
        message: "Invalid status. Must be pending, accepted, or rejected",
      });
    }

    const volunteer = await Volenteers.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );

    if (!volunteer) {
      return res.status(404).json({
        status: "failed",
        message: "Volunteer not found",
      });
    }

    if (status === "accepted" || status === "rejected") {
      await sendVolunteerEmail(volunteer, status);
    }

    res.status(200).json({
      status: "success",
      data: volunteer,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "failed" });
  }
};
exports.deleteVolunteer = async (req, res) => {
  try {
    const { id } = req.params;

    const volunteer = await Volenteers.findByIdAndDelete(id);

    if (!volunteer) {
      return res.status(404).json({
        status: "failed",
        message: "Volunteer not found",
      });
    }

    res.status(204).json({ status: "success", data: null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "failed" });
  }
};
