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

// ============================================================
// APP INIT
// ============================================================
const app = express();

app.set('trust proxy', 1);

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
//    CSP allows trusted external CDNs only (no wildcards)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      // Default: only self
      defaultSrc: ["'self'"],

      // Scripts: self + trusted CDNs
      // - jsdelivr: Chart.js, Alpine.js, etc.
      // - cdnjs: Font Awesome JS, other libs
      // - unpkg: package CDN
      scriptSrc: [
        "'self'",
        "https://cdn.jsdelivr.net",
        "https://cdnjs.cloudflare.com",
        "https://unpkg.com",
      ],

      // Styles: self + Google Fonts + CDNs
      styleSrc: [
        "'self'",
        "'unsafe-inline'",              // needed for inline styles in pug/html
        "https://fonts.googleapis.com", // Google Fonts CSS
        "https://cdnjs.cloudflare.com", // Font Awesome CSS
        "https://unpkg.com",
      ],

      // Fonts: self + Google Fonts files + Font Awesome files
      fontSrc: [
        "'self'",
        "https://fonts.gstatic.com",    // Google Fonts actual font files
        "https://cdnjs.cloudflare.com", // Font Awesome font files
      ],

      // Images: self + data URIs + blob + common image CDNs
      imgSrc: [
        "'self'",
        "data:",                        // base64 inline images
        "blob:",                        // canvas/generated images
        "https://res.cloudinary.com",   // Cloudinary (if you use it)
        "https://images.unsplash.com",  // Unsplash (if you use it)
      ],

      // Fetch/XHR: self + Paystack API
      connectSrc: [
        "'self'",
        "https://api.paystack.co",      // Paystack payment API
      ],

      // Frames: block everything (clickjacking protection)
      frameSrc: ["'none'"],

      // Objects: block Flash, Java applets etc.
      objectSrc: ["'none'"],

      // Base URI: only self (prevents base tag hijacking)
      baseUri: ["'self'"],

      // Form submissions: only self
      formAction: ["'self'"],
    },
  },

  // Additional helmet protections
  crossOriginEmbedderPolicy: false,   // set true if you need SharedArrayBuffer
  crossOriginOpenerPolicy: { policy: "same-origin" },
  crossOriginResourcePolicy: { policy: "cross-origin" }, // allow CDN resources
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
}));

// 3. Body parser — limit 10kb prevents payload DoS attacks
app.use(express.json({ limit: "10kb" }));

// 4. NoSQL injection protection — Express 5 compatible
//    Strips keys starting with $ or containing . from req.body/params
//    Blocks: { "email": { "$gt": "" } } login bypass attacks
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
  // skip req.query — read-only in Express 5
  next();
});

// 5. XSS protection — Express 5 compatible
//    Sanitizes HTML tags from string values in req.body/params
//    Blocks: <script>steal(document.cookie)</script> saved to DB
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
  // skip req.query — read-only in Express 5
  next();
});

// 6. HPP — blocks HTTP parameter pollution
//    Blocks: ?role=user&role=admin crashing your string methods
app.use(hpp());

// 7. Speed limiter — applies to all /api routes
//    After 30 requests in 15 min, each extra request delayed +100ms
//    Legitimate users won't notice, attack scripts crawl to a halt
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000,
  delayAfter: 30,
  delayMs: (used) => (used - 30) * 100,
});
app.use("/api", speedLimiter);

// ── Serve uploaded files (images etc.) ────────────────────
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
app.use("/", viewsRoutes); // views last — catches all unmatched GET routes

// ============================================================
// GLOBAL ERROR HANDLER
// Catches any error passed via next(err) from any route
// Never leaks stack traces in production
// ============================================================
app.use((err, req, res, next) => {
  console.error("Global error:", err);
  res.status(err.statusCode || 500).json({
    status: "error",
    message: process.env.NODE_ENV === "production"
      ? "Something went wrong"
      : err.message,
  });
});

module.exports = app;