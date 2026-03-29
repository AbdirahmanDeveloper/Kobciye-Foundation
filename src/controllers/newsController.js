const News = require("../models/News");
const Newsletter = require("../models/NewsLetter");
const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

// ─── NEWSLETTER ───────────────────────────────────────────────

exports.saveSubscribers = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email)
      return res
        .status(400)
        .json({ status: "fail", message: "Email is required" });

    const existing = await Newsletter.findOne({ email });
    if (existing)
      return res
        .status(400)
        .json({ status: "fail", message: "Email already subscribed" });

    const subscriber = await Newsletter.create({ email });

    await resend.emails.send({
      from: "Kobciye Foundation <info@kobciyefoundation.org>",
      to: email,
      subject: "Welcome to Kobciye Foundation Newsletter 🎉",
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
                    <tr>
                      <td style="padding:48px 40px 24px;text-align:center;">
                        <div style="font-size:48px;margin-bottom:16px;">🎉</div>
                        <h1 style="margin:0 0 12px;font-size:28px;color:#111827;font-weight:800;">You're In!</h1>
                        <p style="margin:0;font-size:16px;color:#6b7280;line-height:1.6;">
                          Welcome to the <strong style="color:#16a34a;">Kobciye Foundation</strong> newsletter.<br/>
                          We're glad to have you with us.
                        </p>
                      </td>
                    </tr>
                    <tr><td style="padding:0 40px;"><hr style="border:none;border-top:1px solid #e5e7eb;" /></td></tr>
                    <tr>
                      <td style="padding:32px 40px;">
                        <h2 style="margin:0 0 20px;font-size:17px;color:#374151;font-weight:700;">What to expect from us:</h2>
                        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
                          <tr>
                            <td width="40" valign="top"><div style="background-color:#dcfce7;width:32px;height:32px;border-radius:50%;text-align:center;line-height:32px;font-size:16px;">📰</div></td>
                            <td style="padding-left:12px;"><strong style="color:#111827;font-size:14px;">Latest News</strong><p style="margin:2px 0 0;font-size:13px;color:#6b7280;">Stay updated on our newest stories and announcements.</p></td>
                          </tr>
                        </table>
                        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
                          <tr>
                            <td width="40" valign="top"><div style="background-color:#dcfce7;width:32px;height:32px;border-radius:50%;text-align:center;line-height:32px;font-size:16px;">🌍</div></td>
                            <td style="padding-left:12px;"><strong style="color:#111827;font-size:14px;">Project Updates</strong><p style="margin:2px 0 0;font-size:13px;color:#6b7280;">Follow the real impact of our work across communities in Kenya.</p></td>
                          </tr>
                        </table>
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td width="40" valign="top"><div style="background-color:#dcfce7;width:32px;height:32px;border-radius:50%;text-align:center;line-height:32px;font-size:16px;">🤝</div></td>
                            <td style="padding-left:12px;"><strong style="color:#111827;font-size:14px;">Ways to Get Involved</strong><p style="margin:2px 0 0;font-size:13px;color:#6b7280;">Discover how you can volunteer, donate, or partner with us.</p></td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:0 40px 40px;text-align:center;">
                        <a href="${
                          process.env.FRONTEND_URL
                        }" style="display:inline-block;background-color:#16a34a;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:700;">
                          Explore Our Work →
                        </a>
                      </td>
                    </tr>
                    <tr>
                      <td style="background-color:#f9fafb;padding:24px 40px;text-align:center;border-top:1px solid #e5e7eb;">
                        <p style="margin:0 0 4px;font-size:12px;color:#9ca3af;">© ${new Date().getFullYear()} Kobciye Foundation. All rights reserved.</p>
                        <p style="margin:0;font-size:12px;color:#9ca3af;">You received this because you subscribed at kobciyefoundation.org</p>
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

    res.status(201).json({ status: "success", data: subscriber });
  } catch (err) {
    console.error("Subscribe error:", err);
    res.status(500).json({ status: "error", message: err.message });
  }
};

const sendNewsletterToSubscribers = async (news) => {
  try {
    const subscribers = await Newsletter.find({}, "email");
    if (!subscribers.length) return;

    const emails = subscribers.map((s) => s.email);
    const newsUrl = `${process.env.FRONTEND_URL}/news/${news._id}`;

    await resend.emails.send({
      from: "Kobciye Foundation <info@kobciyefoundation.org>",
      to: emails,
      subject: `📰 New Post: ${news.title}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
          <h1 style="color:#333;">New News Just Posted!</h1>
          ${
            news.image
              ? `<img src="${news.image}" alt="Cover Image" style="width:100%;border-radius:8px;margin-bottom:16px;" />`
              : ""
          }
          <h2 style="color:#444;">${news.title}</h2>
          <p style="color:#666;font-size:15px;line-height:1.6;">${news.content.substring(
            0,
            200
          )}...</p>
          <a href="${newsUrl}" style="display:inline-block;margin-top:20px;padding:12px 24px;background-color:#4F46E5;color:white;text-decoration:none;border-radius:6px;font-size:15px;">
            Read Full Article →
          </a>
          <hr style="margin-top:40px;border:none;border-top:1px solid #eee;" />
          <p style="color:#aaa;font-size:12px;">You're receiving this because you subscribed to our newsletter.</p>
        </div>
      `,
    });

    console.log(`Newsletter sent to ${emails.length} subscribers`);
  } catch (err) {
    console.error("Failed to send newsletter:", err.message);
  }
};

// ─── NEWS CRUD ────────────────────────────────────────────────

exports.getAllNews = async (req, res) => {
  try {
    const news = await News.find()
      .sort({ createdAt: -1 })
      .populate("project", "name")
      .populate("publishedBy", "name");

    res
      .status(200)
      .json({ status: "success", result: news.length, data: news });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

exports.getSingleNews = async (req, res) => {
  try {
    const news = await News.findById(req.params.id)
      .populate("project", "name")
      .populate("publishedBy", "name");

    if (!news)
      return res
        .status(404)
        .json({ status: "fail", message: "News not found" });

    res.status(200).json({ status: "success", data: news });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

exports.createNews = async (req, res) => {
  try {
    if (!req.file)
      return res
        .status(400)
        .json({ status: "fail", message: "Please upload a cover image" });

    const news = await News.create({
      title: req.body.title,
      content: req.body.content,
      project: req.body.project,
      image: req.file.path,
      publishedBy: req.user.id,
    });

    sendNewsletterToSubscribers(news);

    res.status(201).json({
      status: "success",
      message: "News created successfully",
      data: news,
    });
  } catch (err) {
    res.status(400).json({ status: "fail", message: err.message });
  }
};

exports.updateNews = async (req, res) => {
  try {
    const news = await News.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!news)
      return res
        .status(404)
        .json({ status: "fail", message: "News not found" });

    res.status(200).json({ status: "success", data: news });
  } catch (err) {
    res.status(400).json({ status: "fail", message: err.message });
  }
};

exports.deleteNews = async (req, res) => {
  try {
    const news = await News.findByIdAndDelete(req.params.id);

    if (!news)
      return res
        .status(404)
        .json({ status: "fail", message: "News not found" });

    res.status(204).json({ status: "success", data: null });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};
