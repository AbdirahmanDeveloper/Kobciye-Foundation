const mongoose = require("mongoose");

const donationSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: true,
      min: 1,
    },

    donor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: false,
    },
    donationType: {
      type: String,
      enum: ["monthly", "custom", "project"],
      required: false,
    },

    paymentMethod: {
      type: String,
      enum: ["mpesa", "card", "cash", "paystack"],
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "success", "failed"],
      default: "pending",
    },
    reference: {
      type: String,
      unique: true,
      sparse: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Donation", donationSchema);
