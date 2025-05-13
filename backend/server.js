const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const productRoutes = require("./routes/productRoutes");

dotenv.config();

const app = express();

// CORS Configuration
app.use(cors());

app.use(express.json());

// Mongo'B Connection
mongoose
  .connect(
    process.env.MONGODB_URI || "mongodb://localhost:27017/product-tracking"
  )
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Routes
app.use("/api/products", productRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
