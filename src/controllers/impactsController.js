const Impacts = require("../models/Impacts");

exports.getImpacts = async (req, res) => {
  try {
    const impacts = await Impacts.findOne();
    res.status(200).json({ status: "success", data: impacts });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
    console.error(err.message);
  }
};

exports.updateImpacts = async (req, res) => {
  try {
    const { communities, projects, volunteers } = req.body;
    const impacts = await Impacts.findOneAndUpdate(
      {},
      { communities, projects, volunteers },
      { new: true, upsert: true, runValidators: true }
    );
    console.log(impacts);
    res.status(200).json({ status: "success", data: impacts });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
    console.error(err.message);
  }
};
