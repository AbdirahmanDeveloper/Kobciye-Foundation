const mongoose = require("mongoose");
const missionsSchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "completed"],
      default: "active",
      required: true,
    },
    duration: {
      type: String,
      required: true,
    },
    volunteers: {
      type: Number,
      required: true,
    },
    volunteersJoined: {
      type: Number,
      default: 0,
    },
    location: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Mission", missionsSchema);
