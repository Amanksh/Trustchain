const mongoose = require("mongoose");

const resaleSchema = new mongoose.Schema({
  distributorName: {
    type: String,
    required: true,
  },
  customerName: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

const productSchema = new mongoose.Schema({
  hash: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  manufacturer: {
    type: String,
    required: true,
  },
  cost: {
    type: Number,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  distributorId: {
    type: Number,
    required: true,
  },
  resales: [resaleSchema],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Product", productSchema);
