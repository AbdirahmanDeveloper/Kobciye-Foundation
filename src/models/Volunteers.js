const mongoose = require("mongoose");

const volunteersSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },

  phone: {
    type: String,
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
  nationalId: {
    type: String,
  },
  dateOfBirth: {
    type: Date,
    required: [true, "birth date is required"],
  },
  address: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ["permanent", "mission", "project"],
    default: "permanent",
    required: true,
  },
  mission: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Missions",
    default: null,
  },
  status: {
    type: String,
    enum: ["pending", "accepted", "rejected"],
    default: "pending",
  },
});

module.exports = mongoose.model("Volunteer", volunteersSchema);
