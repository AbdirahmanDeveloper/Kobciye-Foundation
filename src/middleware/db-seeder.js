require("dotenv").config();
const fs = require("fs");
const path = require("path");
const connectDB = require("../config/db");
const Donation = require("../models/Donation");
const News = require("../models/News");
const Project = require("../models/Project");
const User = require("../models/User");

connectDB();

const donations = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, "../../dev-data/donations.json"),
    "utf-8",
  ),
);
const news = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../../dev-data/news.json"), "utf-8"),
);
const projects = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, "../../dev-data/projects.json"),
    "utf-8",
  ),
);
const users = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../../dev-data/users.json"), "utf-8"),
);

// Seed the dev-data into the database
const importData = async () => {
  try {
    await Donation.create(donations);
    await News.create(news);
    await Project.create(projects);
    await User.create(users, { validateBeforeSave: false });
    console.log("Data successfully loaded!!!");
  } catch (err) {
    console.log(err);
  }

  process.exit();
};

// Delete data from the database
const deleteData = async () => {
  try {
    await Donation.deleteMany();
    await News.deleteMany();
    await Project.deleteMany();
    await User.deleteMany();
    console.log("Data deleted successfully!!!!");
  } catch (err) {
    console.log(err);
  }

  process.exit();
};

if (process.argv[2] === "--import") {
  importData();
} else if (process.argv[2] === "--delete") {
  deleteData();
}

console.log(process.argv);
