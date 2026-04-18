const mongoose = require("mongoose");

const monthlyDonorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [1, "Amount must be at least 1"],
    },
    startDate: {
      type: Date,
      required: [true, "Start date is required"],
    },
    paidMonths: {
      type: [Number],
      default: [],
    },
    monthsPaid: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["active", "completed", "inactive"],
      default: "active",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("MonthlyDonor", monthlyDonorSchema);