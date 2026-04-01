const Volenteers = require("../models/Volunteers");
const upload = require("../middleware/volIpload");

exports.uploadImage = upload.single("volImage");

exports.createVolunteer = async (req, res) => {
  try {
    const volonteer = await Volenteers.create({
      name: req.body.volName,
      phone: req.body.volPhone,
      email: req.body.volEmail,
      image: req.file ? req.file.path : null,
      availibility: req.body.availibility,
    });

    res.status(200).json({
      status: "success",
      data: volonteer,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "failed" });
  }
};

exports.updateVolunteer = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["pending", "accepted", "rejected"].includes(status)) {
      return res.status(400).json({
        status: "failed",
        message: "Invalid status. Must be pending, accepted, or rejected",
      });
    }

    const volunteer = await Volenteers.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );

    if (!volunteer) {
      return res.status(404).json({
        status: "failed",
        message: "Volunteer not found",
      });
    }

    res.status(200).json({
      status: "success",
      data: volunteer,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "failed" });
  }
};

exports.deleteVolunteer = async (req, res) => {
  try {
    const { id } = req.params;

    const volunteer = await Volenteers.findByIdAndDelete(id);

    if (!volunteer) {
      return res.status(404).json({
        status: "failed",
        message: "Volunteer not found",
      });
    }

    res.status(204).json({ status: "success", data: null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "failed" });
  }
};
