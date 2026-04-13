const Support = require("../models/Support");
const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

exports.createSupport = async (req, res) => {
  try {
    const support = await Support.create({
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      location: req.body.location,
      nationalId: req.body.nationalId,
      subject: req.body.subject,
      message: req.body.message,
      image: req.file.path,
    });

    res.status(201).json({ status: "success", data: support });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ status: "error", message: err.message });
  }
};

exports.updateSupport = async (req, res) => {
  try {
    const support = await Support.findByIdAndUpdate(
      req.params.id,
      { ...req.body },
      { new: true, runValidators: true }
    );

    if (!support)
      return res
        .status(404)
        .json({ status: "fail", message: "Support request not found" });

    res.status(200).json({ status: "success", data: support });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ status: "error", message: err.message });
  }
};

exports.acceptSupport = async (req, res) => {
  try {
    const support = await Support.findByIdAndUpdate(
      req.params.id,
      { status: "accepted" },
      { new: true }
    );

    if (!support)
      return res
        .status(404)
        .json({ status: "fail", message: "Support request not found" });

    await resend.emails.send({
      from: "Kobciye Foundation <no-reply@kobciyefoundation.org>",
      to: support.email,
      subject: "Your Support Request Has Been Accepted",
      html: `
        <h2>Dear ${support.name},</h2>
        <p>We are pleased to inform you that your support request regarding <strong>${support.subject}</strong> has been <strong>accepted</strong>.</p>
        <p>Our team will be in touch with you shortly to discuss the next steps.</p>
        <br/>
        <p>Warm regards,<br/>Kobciye Foundation</p>
      `,
    });

    res.status(200).json({ status: "success", data: support });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ status: "error", message: err.message });
  }
};

exports.rejectSupport = async (req, res) => {
  try {
    const support = await Support.findByIdAndUpdate(
      req.params.id,
      { status: "rejected" },
      { new: true }
    );

    if (!support)
      return res
        .status(404)
        .json({ status: "fail", message: "Support request not found" });

    await resend.emails.send({
      from: "Kobciye Foundation <no-reply@kobciyefoundation.org>",
      to: support.email,
      subject: "Update on Your Support Request",
      html: `
        <h2>Dear ${support.name},</h2>
        <p>Thank you for reaching out to us regarding <strong>${support.subject}</strong>.</p>
        <p>After careful review, we regret to inform you that we are unable to accommodate your request at this time.</p>
        <p>We encourage you to reach out again if your circumstances change.</p>
        <br/>
        <p>Warm regards,<br/>Kobciye Foundation</p>
      `,
    });

    res.status(200).json({ status: "success", data: support });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ status: "error", message: err.message });
  }
};

exports.deleteSupport = async (req, res) => {
  try {
    const support = await Support.findByIdAndDelete(req.params.id);

    if (!support)
      return res
        .status(404)
        .json({ status: "fail", message: "Support request not found" });

    res
      .status(200)
      .json({ status: "success", message: "Support request deleted" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ status: "error", message: err.message });
  }
};
