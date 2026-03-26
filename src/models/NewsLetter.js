const mongoose = require("mongoose");

const NewsletterSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, "Email is required"],
    lowercase: true,
    trim: true,
  },
});

module.exports = mongoose.model("Newsletter", NewsletterSchema);
