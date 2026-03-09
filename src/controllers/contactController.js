// controllers/contactController.js

const Newsletter   = require("../models/Newsletter");
const Contact      = require("../models/ContactModel");
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

async function sendWelcomeEmail(email) {
  await sendEmail({
    email,
    subject: "Welcome to Kobciye Foundation Newsletter",
    html: `
      <div style="font-family: Arial, sans-serif; max-width:600px; margin:0 auto; border:1px solid #e5e7eb; border-radius:10px; overflow:hidden;">
        <div style="background-color:#667eea; color:white; padding:20px; text-align:center;">
          <h1 style="margin:0; font-size:24px;">Welcome!</h1>
          <p style="margin:5px 0 0; font-size:14px;">Kobciye Foundation Newsletter</p>
        </div>
        <div style="padding:30px; color:#1f2937;">
          <h2 style="color:#667eea; margin-top:0;">Hello!</h2>
          <p>Thank you for subscribing to our newsletter. Here's what you can expect:</p>
          <ul>
            <li>Latest projects and initiatives</li>
            <li>Community success stories</li>
            <li>Ways to get involved and make a difference</li>
            <li>Upcoming events and opportunities</li>
          </ul>
          <div style="background:linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding:30px; border-radius:10px; margin:30px 0; text-align:center; color:white;">
            <h3 style="margin:0 0 15px 0;">Together We Make a Difference</h3>
            <a href="${process.env.FRONTEND_URL}/projects" style="display:inline-block; background:white; color:#667eea; padding:12px 30px; border-radius:25px; text-decoration:none; font-weight:bold; margin-top:10px;">View Our Projects</a>
          </div>
          <p>Best regards,<br><strong>Kobciye Foundation Team</strong></p>
        </div>
        <div style="background:#f9fafb; padding:20px; text-align:center; font-size:12px; color:#6b7280;">
          <p>You can unsubscribe at any time by clicking the link in our emails.</p>
          <p>Kobciye Foundation | 123 Street, Nairobi, Kenya</p>
        </div>
      </div>
    `,
  });
}

exports.subscribeNewsletter = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ status: "fail", message: "Email is required" });
    }

    const existingSubscriber = await Newsletter.findOne({ email });

    if (existingSubscriber) {
      if (existingSubscriber.isActive) {
        return res.status(400).json({
          status: "fail",
          message: "This email is already subscribed",
        });
      }

      existingSubscriber.isActive = true;
      await existingSubscriber.save();
      await sendWelcomeEmail(email);

      return res.status(200).json({ status: "success", message: "Subscribed successfully" });
    }

    await Newsletter.create({ email });
    await sendWelcomeEmail(email);

    return res.status(200).json({ status: "success", message: "Subscribed successfully" });
  } catch (error) {
    console.error("Newsletter subscription error:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        status: "fail",
        message: "This email is already subscribed",
      });
    }

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

exports.getAllSubscribers = async (req, res) => {
  try {
    const subscribers = await Newsletter.find({ isActive: true }).sort({ subscribedAt: -1 });
    res.status(200).json({
      status: "success",
      results: subscribers.length,
      data: subscribers,
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};