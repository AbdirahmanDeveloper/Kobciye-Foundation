require("dotenv").config();
const app = require("./src/app");
const connectDB = require("./src/config/db");

// connect to database
connectDB();

const PORT = process.env.PORT || 3000;

// Start the server
app.listen(PORT, () => {
  console.log(`server is running on http://localhost:${PORT} .........`);
});