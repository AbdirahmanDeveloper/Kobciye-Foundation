const mongoose = require("mongoose");

const memebrsSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  role: {
    type: String,
    required: true,
    trim: true,
  },
  memberImage: {
    type:String,
  },
}, { timestamps: true });

module.exports = mongoose.model("Members", memebrsSchema);
