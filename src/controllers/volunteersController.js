
const Volunteer = require("../models/Volunteers");
const Mission = require("../models/Missions");
const upload = require("../middleware/volIpload");
const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

exports.uploadImage = upload.single("volImage");

exports.createVolunteer = async (req, res) => {
  try {
    const volonteer = await Volunteer.create({
      name: req.body.volName,
      phone: req.body.volPhone,
      email: req.body.volEmail,
      image: req.file ? req.file.path : null,
      availibility: req.body.availibility,
      nationalId: req.body.nationalId,
    });
    await resend.emails.send({
      from: "Kobciye Foundation <info@kobciyefoundation.org>",
      to: process.env.ADMIN_EMAIL,
      subject: "📩 New Volunteer Application Received",
      html: `
        <h2>New Volunteer Request</h2>
    
        <p>A new volunteer has submitted an application to <strong>Kobciye Foundation</strong>.</p>
    
        <hr/>
    
        <h3>Volunteer Details:</h3>
        <ul>
          <li><strong>Name:</strong> ${volonteer.name}</li>
          <li><strong>Email:</strong> ${volonteer.email}</li>
          <li><strong>Phone:</strong> ${volonteer.phone}</li>
          <li><strong>Availability:</strong> ${volonteer.availibility}</li>
          <li><strong>National ID:</strong> ${volonteer.nationalId}</li>
        </ul>
    
        ${
          volonteer.image
            ? `<p><strong>Image:</strong><br/><img src="${volonteer.image}" width="200"/></p>`
            : ""
        }
    
        <hr/>
    
        <p>Please log in to the admin dashboard to review and take action.</p>
    
        <br/>
        <p><strong>Kobciye Foundation System</strong></p>
      `,
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

    const volunteer = await Volunteer.findByIdAndUpdate(
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

    const volunteer = await Volunteer.findByIdAndDelete(id);

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


exports.createVolunteer = async (req, res) => {
  try {
    const {
      volName,
      volPhone,
      volEmail,
      availibility,
      nationalId,
      type,
      missionId,
      projectId,
    } = req.body;

    if (type === "mission") {
      if (!missionId)
        return res
          .status(400)
          .json({ status: "fail", message: "Please select a mission" });

      const mission = await Mission.findById(missionId);
      if (!mission)
        return res
          .status(404)
          .json({ status: "fail", message: "Mission not found" });

      if (mission.volunteersJoined >= mission.volunteers)
        return res
          .status(400)
          .json({ status: "fail", message: "No spots left for this mission" });

      await Mission.findByIdAndUpdate(missionId, {
        $inc: { volunteersJoined: 1 },
      });
    }

    const volunteer = await Volunteer.create({
      name: volName,
      phone: volPhone,
      email: volEmail,
      availibility,
      nationalId,
      image: req.file?.path || "",
      type,
      mission: type === "mission" ? missionId : null,
      project: type === "project" ? projectId : null,
    });

    res.status(201).json({ status: "success", data: volunteer });
  } catch (err) {
    console.error("Failed to create volunteer:", err.message);
    if (err.code === 11000)
      return res
        .status(400)
        .json({
          status: "fail",
          message: "This email is already registered as a volunteer",
        });
    res.status(500).json({ status: "error", message: err.message });
  }
};
