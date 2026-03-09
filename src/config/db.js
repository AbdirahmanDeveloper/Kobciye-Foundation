const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000,
    });
    console.log("database connected successfully!!");
  } catch (error) {
    console.error("Database connection failed", error.message);
    process.exit(1); //Stop app if DB fails
  }
};

module.exports = connectDB;