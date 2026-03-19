const Contact = require("../models/Contact");
const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

exports.submitContact = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    await Contact.create({ name, email, subject, message });

    // Email 1 — confirmation
    const { error: err1 } = await resend.emails.send({
      from: "Kobciye Foundation <onboarding@resend.dev>",
      to: process.env.ADMIN_EMAIL,
      subject: `Message Received: ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border:1px solid #e5e7eb; border-radius:10px; overflow:hidden;">
          <div style="background-color:#c0873f; color:white; padding:20px; text-align:center;">
            <h1 style="margin:0; font-size:24px;">Kobciye Foundation</h1>
            <p style="margin:5px 0 0; font-size:14px;">We value your message</p>
          </div>
          <div style="padding:30px; color:#1f2937;">
            <h2 style="color:#c0873f; margin-top:0;">Hello ${name},</h2>
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

    if (err1) console.error("Resend confirmation error:", err1);

    // Email 2 — admin notification
    const { error: err2 } = await resend.emails.send({
      from: "Kobciye Foundation <onboarding@resend.dev>",
      to: process.env.ADMIN_EMAIL,
      subject: `New Contact Form Submission from ${name}: ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width:600px; margin:0 auto; padding:20px; color:#1f2937; border:1px solid #e5e7eb; border-radius:10px;">
          <h2 style="background-color:#c0873f; color:white; padding:20px; text-align:center; margin:0 0 20px;">New Contact Form Submission</h2>
          <p><strong>From:</strong> ${name} (${email})</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <p><strong>Message:</strong><br>${message}</p>
          <p><strong>Submitted at:</strong> ${new Date().toLocaleString()}</p>
        </div>
      `,
    });

    if (err2) console.error("Resend admin notification error:", err2);

    res
      .status(200)
      .json({ status: "success", message: "Message sent successfully" });
  } catch (error) {
    console.error("Contact form error:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
};

exports.getAllContacts = async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res
      .status(200)
      .json({ status: "success", results: contacts.length, data: contacts });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};
