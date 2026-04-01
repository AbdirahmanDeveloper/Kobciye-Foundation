const mongoose = require("mongoose");

const volunteersSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },

  phone: {
    type: Number,
    required: true,
  },

  email: {
    type: String,
    required: true,
    lowercase: true,
    unique: true,
  },
  image: {
    type: String,
    required: true,
  },
  availibility: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "accepted", "rejected"],
    default: "pending",
  },
});

module.exports = mongoose.model("Volenteer", volunteersSchema);
