const express = require("express");
const cors = require("cors");
const path = require("path");
const xss = require("xss");
const helmet = require("helmet");
const hpp = require("hpp");
const slowDown = require("express-slow-down");

// ── Route imports ──────────────────────────────────────────
const userRoutes = require("./routes/userRoutes");
const projectRoutes = require("./routes/projectRoutes");
const newsRoutes = require("./routes/newsRoutes");
const donationRoutes = require("./routes/donationRoutes");
const viewsRoutes = require("./routes/viewsRoutes");
const contactRoutes = require("./routes/contactRoutes");
const membersRoutes = require("./routes/membersRoutes");
const impactsRoutes = require("./routes/impactsRoutes");
const volonteerRoutes = require("./routes/volunteerroutes");
const missionsRoutes = require("./routes/missionsRoutes");
const supportRoutes = require("./routes/supportRoute");
const monthlyDonorroutes = require("./routes/monthlyDonationRoutes");

// ============================================================
// APP INIT
// ============================================================
const app = express();

app.set("trust proxy", 1);

// ============================================================
// VIEW ENGINE — pug templates
// ============================================================
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "views/public")));

// ============================================================
// SECURITY MIDDLEWARES — order matters
// ============================================================

// 1. CORS
app.use(cors());

// 2. Helmet — sets secure HTTP response headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],

        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://cdn.jsdelivr.net",
          "https://cdnjs.cloudflare.com",
          "https://unpkg.com",
        ],

        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://fonts.googleapis.com",
          "https://cdnjs.cloudflare.com",
          "https://unpkg.com",
          "https://cdn.jsdelivr.net",
        ],

        fontSrc: [
          "'self'",
          "https://fonts.gstatic.com",
          "https://cdnjs.cloudflare.com",
        ],

        imgSrc: [
          "'self'",
          "data:",
          "blob:",
          "https://res.cloudinary.com",
          "https://images.unsplash.com",
        ],

        connectSrc: [
          "'self'",
          "https://api.paystack.co",
          "https://cdn.jsdelivr.net",
          "https://restcountries.com",
        ],

        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
      },
    },

    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: { policy: "same-origin" },
    crossOriginResourcePolicy: { policy: "cross-origin" },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  })
);

// 3. Body parser
app.use(express.json({ limit: "10mb" }));

// 4. NoSQL injection protection
app.use((req, res, next) => {
  const sanitize = (obj) => {
    if (obj && typeof obj === "object") {
      Object.keys(obj).forEach((key) => {
        if (key.startsWith("$") || key.includes(".")) {
          delete obj[key];
        } else {
          sanitize(obj[key]);
        }
      });
    }
  };
  if (req.body) sanitize(req.body);
  if (req.params) sanitize(req.params);
  next();
});

// 5. XSS protection
app.use((req, res, next) => {
  const sanitize = (obj) => {
    if (obj && typeof obj === "object") {
      Object.keys(obj).forEach((key) => {
        if (typeof obj[key] === "string") {
          obj[key] = xss(obj[key]);
        } else if (typeof obj[key] === "object") {
          sanitize(obj[key]);
        }
      });
    }
  };
  if (req.body) sanitize(req.body);
  if (req.params) sanitize(req.params);
  next();
});

// 6. HPP
app.use(hpp());

// 7. Speed limiter
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000,
  delayAfter: 30,
  delayMs: (used) => (used - 30) * 100,
});
app.use("/api", speedLimiter);

// ── Serve uploaded files ───────────────────────────────────
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

// ============================================================
// ROUTES
// ============================================================
app.use("/api/users", userRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/news", newsRoutes);
app.use("/api/donations", donationRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/members", membersRoutes);
app.use("/", viewsRoutes);
app.use("/api/impacts", impactsRoutes);
app.use("/api/volunteers", volonteerRoutes);
app.use("/api/missions", missionsRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/monthly-donors", monthlyDonorroutes);

// ============================================================
// GLOBAL ERROR HANDLER
// ============================================================
app.use((err, req, res, next) => {
  console.error("Global error:", err);
  res.status(err.statusCode || 500).json({
    status: "error",
    message:
      process.env.NODE_ENV === "production"
        ? "Something went wrong"
        : err.message,
  });
});

module.exports = app;
