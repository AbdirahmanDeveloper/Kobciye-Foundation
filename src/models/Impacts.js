const mongoose = require("mongoose");

const impactsSchema = new mongoose.Schema({
  communities: { type: Number, default: 0 },
  projects: { type: Number, default: 0 },
  volunteers: { type: Number, default: 0 },
});

module.exports = mongoose.model("Impacts", impactsSchema);
