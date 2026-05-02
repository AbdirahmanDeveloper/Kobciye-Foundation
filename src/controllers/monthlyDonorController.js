const MonthlyDonor = require("../models/MonthlyDonor");
const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

// ─── EMAIL HELPER ─────────────────────────────────────────────

async function sendThankYouEmail(donor, paidMonths) {
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const monthList = paidMonths
    .map((m) => `<li style="margin-bottom:6px;">${monthNames[m]}</li>`)
    .join("");

  await resend.emails.send({
    from: "Kobciye Foundation <info@kobciyefoundation.org>",
    to: donor.email,
    subject: "💙 Thank You for Your Monthly Donation",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        </head>
        <body style="margin:0;padding:0;background-color:#f4f4f5;font-family:Arial,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 0;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">

                  <!-- Header -->
                  <tr>
                    <td style="background-color:#16a34a;padding:36px 40px;text-align:center;">
                      <div style="display:inline-block;">
                        <div style="background-color:#ffffff;color:#16a34a;font-weight:900;font-size:20px;width:44px;height:44px;border-radius:8px;display:inline-block;line-height:44px;text-align:center;">KF</div>
                        <div style="text-align:left;display:inline-block;margin-left:10px;vertical-align:middle;">
                          <div style="color:#ffffff;font-size:20px;font-weight:700;">Kobciye</div>
                          <div style="color:#bbf7d0;font-size:13px;letter-spacing:1px;text-transform:uppercase;">Foundation</div>
                        </div>
                      </div>
                    </td>
                  </tr>

                  <!-- Hero -->
                  <tr>
                    <td style="padding:48px 40px 24px;text-align:center;">
                      <div style="font-size:48px;margin-bottom:16px;">💙</div>
                      <h1 style="margin:0 0 12px;font-size:28px;color:#111827;font-weight:800;">Thank You, ${
                        donor.name
                      }!</h1>
                      <p style="margin:0;font-size:16px;color:#6b7280;line-height:1.6;">
                        We truly appreciate your continued support of <strong style="color:#16a34a;">Kobciye Foundation</strong>.
                      </p>
                    </td>
                  </tr>

                  <tr><td style="padding:0 40px;"><hr style="border:none;border-top:1px solid #e5e7eb;" /></td></tr>

                  <!-- Donation details -->
                  <tr>
                    <td style="padding:32px 40px;">
                      <h2 style="margin:0 0 16px;font-size:17px;color:#374151;font-weight:700;">Donation Recorded For:</h2>
                      <div style="background:#f9fafb;padding:20px;border-radius:8px;border:1px solid #e5e7eb;">
                        <p style="margin:0 0 10px;font-size:14px;color:#374151;">
                          <strong>Amount:</strong> KES ${donor.amount.toLocaleString()} / month
                        </p>
                        <p style="margin:0 0 10px;font-size:14px;color:#374151;"><strong>Month(s):</strong></p>
                        <ul style="margin:0;padding-left:20px;font-size:14px;color:#6b7280;">
                          ${monthList}
                        </ul>
                      </div>
                      <p style="margin-top:24px;font-size:14px;color:#6b7280;line-height:1.7;">
                        Your generosity helps us make a real difference in the communities we serve. Together, we are building a better future.
                      </p>
                    </td>
                  </tr>

                  <!-- CTA -->
                  <tr>
                    <td style="padding:0 40px 40px;text-align:center;">
                      <a href="${
                        process.env.FRONTEND_URL
                      }" style="display:inline-block;background-color:#16a34a;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:700;">
                        Visit Our Website →
                      </a>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background-color:#f9fafb;padding:24px 40px;text-align:center;border-top:1px solid #e5e7eb;">
                      <p style="margin:0 0 4px;font-size:12px;color:#9ca3af;">© ${new Date().getFullYear()} Kobciye Foundation. All rights reserved.</p>
                      <p style="margin:0;font-size:12px;color:#9ca3af;">With gratitude — Kobciye Foundation Team</p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
  });
}

// ─── CREATE ───────────────────────────────────────────────────

exports.createMonthlyDonor = async (req, res) => {
  try {
    const { name, email, phone, shopCenter, shopNo, amount, startDate } =
      req.body;

    const donor = await MonthlyDonor.create({
      name,
      email,
      phone,
      shopCenter,
      shopNo,
      amount,
      startDate,
    });

    // Notify donor
    await resend.emails.send({
      from: "Kobciye Foundation <info@kobciyefoundation.org>",
      to: email,
      subject: "💙 Welcome to Our Monthly Donors Family",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
          </head>
          <body style="margin:0;padding:0;background-color:#f4f4f5;font-family:Arial,sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 0;">
              <tr>
                <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">

                    <!-- Header -->
                    <tr>
                      <td style="background-color:#16a34a;padding:36px 40px;text-align:center;">
                        <div style="display:inline-block;">
                          <div style="background-color:#ffffff;color:#16a34a;font-weight:900;font-size:20px;width:44px;height:44px;border-radius:8px;display:inline-block;line-height:44px;text-align:center;">KF</div>
                          <div style="text-align:left;display:inline-block;margin-left:10px;vertical-align:middle;">
                            <div style="color:#ffffff;font-size:20px;font-weight:700;">Kobciye</div>
                            <div style="color:#bbf7d0;font-size:13px;letter-spacing:1px;text-transform:uppercase;">Foundation</div>
                          </div>
                        </div>
                      </td>
                    </tr>

                    <!-- Hero -->
                    <tr>
                      <td style="padding:48px 40px 24px;text-align:center;">
                        <div style="font-size:48px;margin-bottom:16px;">🎉</div>
                        <h1 style="margin:0 0 12px;font-size:28px;color:#111827;font-weight:800;">Welcome, ${
                          donor.name
                        }!</h1>
                        <p style="margin:0;font-size:16px;color:#6b7280;line-height:1.6;">
                          Thank you for becoming a monthly donor with <strong style="color:#16a34a;">Kobciye Foundation</strong>.<br/>
                          Your commitment means the world to us.
                        </p>
                      </td>
                    </tr>

                    <tr><td style="padding:0 40px;"><hr style="border:none;border-top:1px solid #e5e7eb;" /></td></tr>

                    <!-- Details -->
                    <tr>
                      <td style="padding:32px 40px;">
                        <h2 style="margin:0 0 16px;font-size:17px;color:#374151;font-weight:700;">Your Donation Details:</h2>
                        <div style="background:#f9fafb;padding:20px;border-radius:8px;border:1px solid #e5e7eb;">
                          <p style="margin:0 0 10px;font-size:14px;color:#374151;">
                            <strong>Amount:</strong> KES ${donor.amount.toLocaleString()} / month
                          </p>
                          <p style="margin:0;font-size:14px;color:#374151;">
                            <strong>Start Date:</strong> ${new Date(
                              donor.startDate
                            ).toDateString()}
                          </p>
                        </div>

                        <h2 style="margin:28px 0 20px;font-size:17px;color:#374151;font-weight:700;">What happens next:</h2>
                        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
                          <tr>
                            <td width="40" valign="top"><div style="background-color:#dcfce7;width:32px;height:32px;border-radius:50%;text-align:center;line-height:32px;font-size:16px;">📅</div></td>
                            <td style="padding-left:12px;"><strong style="color:#111827;font-size:14px;">Monthly Confirmation</strong><p style="margin:2px 0 0;font-size:13px;color:#6b7280;">You'll receive an email each time your donation is recorded.</p></td>
                          </tr>
                        </table>
                        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
                          <tr>
                            <td width="40" valign="top"><div style="background-color:#dcfce7;width:32px;height:32px;border-radius:50%;text-align:center;line-height:32px;font-size:16px;">🌍</div></td>
                            <td style="padding-left:12px;"><strong style="color:#111827;font-size:14px;">Real Impact</strong><p style="margin:2px 0 0;font-size:13px;color:#6b7280;">Your monthly gift directly supports communities across Kenya.</p></td>
                          </tr>
                        </table>
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td width="40" valign="top"><div style="background-color:#dcfce7;width:32px;height:32px;border-radius:50%;text-align:center;line-height:32px;font-size:16px;">🤝</div></td>
                            <td style="padding-left:12px;"><strong style="color:#111827;font-size:14px;">Stay Connected</strong><p style="margin:2px 0 0;font-size:13px;color:#6b7280;">Follow our work and see the difference you're making.</p></td>
                          </tr>
                        </table>
                      </td>
                    </tr>

                    <!-- CTA -->
                    <tr>
                      <td style="padding:0 40px 40px;text-align:center;">
                        <a href="${
                          process.env.FRONTEND_URL
                        }" style="display:inline-block;background-color:#16a34a;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:700;">
                          Explore Our Work →
                        </a>
                      </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                      <td style="background-color:#f9fafb;padding:24px 40px;text-align:center;border-top:1px solid #e5e7eb;">
                        <p style="margin:0 0 4px;font-size:12px;color:#9ca3af;">© ${new Date().getFullYear()} Kobciye Foundation. All rights reserved.</p>
                        <p style="margin:0;font-size:12px;color:#9ca3af;">You received this because you signed up as a monthly donor at kobciyefoundation.org</p>
                      </td>
                    </tr>

                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
    });

    // Notify admin
    await resend.emails.send({
      from: "Kobciye Foundation <info@kobciyefoundation.org>",
      to: process.env.ADMIN_EMAIL,
      subject: "📩 New Monthly Donor Added",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
          </head>
          <body style="margin:0;padding:0;background-color:#f4f4f5;font-family:Arial,sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 0;">
              <tr>
                <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">

                    <!-- Header -->
                    <tr>
                      <td style="background-color:#16a34a;padding:30px 40px;text-align:center;color:#ffffff;">
                        <h2 style="margin:0;font-size:22px;">Kobciye Foundation</h2>
                        <p style="margin:5px 0 0;font-size:13px;color:#bbf7d0;">Admin Notification</p>
                      </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                      <td style="padding:40px;">
                        <h2 style="margin:0 0 10px;font-size:22px;color:#111827;">💝 New Monthly Donor</h2>
                        <p style="margin:0 0 24px;color:#6b7280;font-size:14px;">
                          A new monthly donor has been added to the system.
                        </p>
                        <div style="background:#f9fafb;padding:20px;border-radius:8px;border:1px solid #e5e7eb;">
                          <p style="margin:0 0 10px;font-size:14px;color:#374151;"><strong>Name:</strong> ${
                            donor.name
                          }</p>
                          <p style="margin:0 0 10px;font-size:14px;color:#374151;"><strong>Email:</strong> ${
                            donor.email
                          }</p>
                          <p style="margin:0 0 10px;font-size:14px;color:#374151;"><strong>Phone:</strong> ${
                            donor.phone || "N/A"
                          }</p>
                          <p style="margin:0 0 10px;font-size:14px;color:#374151;"><strong>Amount:</strong> KES ${donor.amount.toLocaleString()} / month</p>
                          <p style="margin:0;font-size:14px;color:#374151;"><strong>Start Date:</strong> ${new Date(
                            donor.startDate
                          ).toDateString()}</p>
                        </div>
                        <p style="margin-top:20px;font-size:13px;color:#6b7280;">
                          You can manage monthly donors from your admin dashboard.
                        </p>
                      </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                      <td style="background-color:#f9fafb;padding:20px;text-align:center;border-top:1px solid #e5e7eb;">
                        <p style="margin:0;font-size:12px;color:#9ca3af;">© ${new Date().getFullYear()} Kobciye Foundation</p>
                      </td>
                    </tr>

                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
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
      return res
        .status(404)
        .json({ status: "fail", message: "Donor not found" });
    res.status(200).json({ status: "success", data: donor });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

// ─── CHECK IN MONTHS ──────────────────────────────────────────

exports.checkInMonths = async (req, res) => {
  try {
    const months = Array.isArray(req.body.months)
      ? req.body.months.map(Number)
      : [Number(req.body.months)];

    const donor = await MonthlyDonor.findById(req.params.id);
    if (!donor)
      return res
        .status(404)
        .json({ status: "fail", message: "Donor not found" });

    const newMonths = [...new Set([...donor.paidMonths, ...months])];
    donor.paidMonths = newMonths;
    donor.monthsPaid = newMonths.length;
    donor.status = newMonths.length >= 12 ? "completed" : "active";
    await donor.save();

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
      return res
        .status(404)
        .json({ status: "fail", message: "Donor not found" });
    res.status(200).json({ status: "success", message: "Donor deleted" });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

// ─── GET BY EMAIL ─────────────────────────────────────────────

exports.getMonthlyDonorByEmail = async (req, res) => {
  try {
    const email = req.user.email;

    const donor = await MonthlyDonor.findOne({
      email: email.toLowerCase().trim(),
    });

    if (!donor)
      return res
        .status(404)
        .json({ status: "fail", message: "No donor found with that email" });

    res.status(200).json({ status: "success", data: donor });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

// Update single donor details
exports.updateMonthlyDonor = async (req, res) => {
  try {
    const news = await MonthlyDonor.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!news)
      return res
        .status(404)
        .json({ status: "fail", message: "Donor not found" });

    res.status(200).json({ status: "success", data: news });
  } catch (err) {
    res.status(400).json({ status: "fail", message: err.message });
  }
};
