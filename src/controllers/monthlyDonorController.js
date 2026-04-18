const MonthlyDonor = require("../models/MonthlyDonor");
const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

// ─── EMAIL HELPER ─────────────────────────────────────────────

async function sendThankYouEmail(donor, paidMonths) {
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  const monthList = paidMonths
    .map((m) => `<li>${monthNames[m]}</li>`)
    .join("");

  await resend.emails.send({
    from: "Kobciye Foundation <info@kobciyefoundation.org>",
    to: donor.email,
    subject: "💙 Thank You for Your Monthly Donation",
    html: `
      <h2>Thank You, ${donor.name}!</h2>
      <p>We truly appreciate your continued support of <strong>Kobciye Foundation</strong>.</p>
      <p>Your donation of <strong>KES ${donor.amount.toLocaleString()}</strong> has been recorded for the following month(s):</p>
      <ul>${monthList}</ul>
      <p>Your generosity helps us make a real difference in the communities we serve. Together, we are building a better future.</p>
      <br/>
      <p>With gratitude,</p>
      <p><strong>Kobciye Foundation Team</strong></p>
    `,
  });
}

// ─── CREATE ───────────────────────────────────────────────────

exports.createMonthlyDonor = async (req, res) => {
  try {
    const { name, email, phone, amount, startDate } = req.body;

    const donor = await MonthlyDonor.create({
      name,
      email,
      phone,
      amount,
      startDate,
    });

    // Notify admin
    await resend.emails.send({
      from: "Kobciye Foundation <info@kobciyefoundation.org>",
      to: process.env.ADMIN_EMAIL,
      subject: "📩 New Monthly Donor Added",
      html: `
        <h2>New Monthly Donor</h2>
        <ul>
          <li><strong>Name:</strong> ${donor.name}</li>
          <li><strong>Email:</strong> ${donor.email}</li>
          <li><strong>Phone:</strong> ${donor.phone || "N/A"}</li>
          <li><strong>Amount:</strong> KES ${donor.amount.toLocaleString()}</li>
          <li><strong>Start Date:</strong> ${new Date(donor.startDate).toDateString()}</li>
        </ul>
        <p><strong>Kobciye Foundation System</strong></p>
      `,
    });

    res.status(201).json({ status: "success", data: donor });
  } catch (err) {
    console.error("Failed to create monthly donor:", err.message);
    if (err.code === 11000)
      return res.status(400).json({
        status: "fail",
        message: "This email is already registered as a monthly donor",
      });
    res.status(500).json({ status: "error", message: err.message });
  }
};

// ─── GET ALL ──────────────────────────────────────────────────

exports.getAllMonthlyDonors = async (req, res) => {
  try {
    const donors = await MonthlyDonor.find().sort({ createdAt: -1 });
    res.status(200).json({ status: "success", data: donors });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

// ─── GET ONE ──────────────────────────────────────────────────

exports.getMonthlyDonor = async (req, res) => {
  try {
    const donor = await MonthlyDonor.findById(req.params.id);
    if (!donor)
      return res.status(404).json({ status: "fail", message: "Donor not found" });
    res.status(200).json({ status: "success", data: donor });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

// ─── CHECK IN MONTHS ──────────────────────────────────────────

exports.checkInMonths = async (req, res) => {
  try {
    // months is an array of month indexes (0=Jan … 11=Dec)
    const months = Array.isArray(req.body.months)
      ? req.body.months.map(Number)
      : [Number(req.body.months)];

    const donor = await MonthlyDonor.findById(req.params.id);
    if (!donor)
      return res.status(404).json({ status: "fail", message: "Donor not found" });

    // Merge new months without duplicating
    const newMonths = [...new Set([...donor.paidMonths, ...months])];
    donor.paidMonths = newMonths;
    donor.monthsPaid = newMonths.length;
    donor.status = newMonths.length >= 12 ? "completed" : "active";
    await donor.save();

    // Send thank-you email only for newly checked months
    const addedMonths = months.filter((m) => !donor.paidMonths.includes(m));
    if (addedMonths.length > 0) {
      await sendThankYouEmail(donor, addedMonths.length ? addedMonths : months);
    } else {
      await sendThankYouEmail(donor, months);
    }

    res.status(200).json({ status: "success", data: donor });
  } catch (err) {
    console.error("Check-in failed:", err.message);
    res.status(500).json({ status: "error", message: err.message });
  }
};

// ─── DELETE ───────────────────────────────────────────────────

exports.deleteMonthlyDonor = async (req, res) => {
  try {
    const donor = await MonthlyDonor.findByIdAndDelete(req.params.id);
    if (!donor)
      return res.status(404).json({ status: "fail", message: "Donor not found" });
    res.status(200).json({ status: "success", message: "Donor deleted" });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};