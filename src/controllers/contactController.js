// controllers/contactController.js

const Contact      = require("../models/Contact");
const sendEmail    = require("../utils/sendEmail");

exports.submitContact = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    await Contact.create({ name, email, subject, message });

    await sendEmail({
      email,
      subject: "We received your message - Kobciye Foundation",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border:1px solid #e5e7eb; border-radius:10px; overflow:hidden;">
          <div style="background-color:#667eea; color:white; padding:20px; text-align:center;">
            <h1 style="margin:0; font-size:24px;">Kobciye Foundation</h1>
            <p style="margin:5px 0 0; font-size:14px;">We value your message</p>
          </div>
          <div style="padding:30px; color:#1f2937;">
            <h2 style="color:#667eea; margin-top:0;">Hello ${name},</h2>
            <p>Thank you for contacting us! We have received your message and will get back to you as soon as possible.</p>
            <div style="background:#f3f4f6; padding:20px; border-radius:10px; margin:20px 0;">
              <h3 style="margin-top:0;">Your Message Details</h3>
              <p><strong>Subject:</strong> ${subject}</p>
              <p><strong>Message:</strong><br>${message}</p>
            </div>
            <p>Best regards,<br><strong>Kobciye Foundation Team</strong></p>
          </div>
          <div style="background:#f9fafb; padding:20px; text-align:center; font-size:12px; color:#6b7280;">
            <p>Kobciye Foundation | 123 Street, Nairobi, Kenya</p>
            <p>Email: info@kobciye.org | Phone: +254 700 000 000</p>
          </div>
        </div>
      `,
    });

    await sendEmail({
      email: process.env.ADMIN_EMAIL,
      subject: `New Contact Form Submission: ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width:600px; margin:0 auto; padding:20px; color:#1f2937; border:1px solid #e5e7eb; border-radius:10px;">
          <h2 style="background-color:#667eea; color:white; padding:20px; text-align:center;">New Contact Form Submission</h2>
          <p><strong>From:</strong> ${name} (${email})</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <p><strong>Message:</strong><br>${message}</p>
          <p><strong>Submitted at:</strong> ${new Date().toLocaleString()}</p>
        </div>
      `,
    });

    res.status(200).json({ status: "success", message: "Message sent successfully" });
  } catch (error) {
    console.error("Contact form error:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
};

exports.getAllContacts = async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.status(200).json({ status: "success", results: contacts.length, data: contacts });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};
