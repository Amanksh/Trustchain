const Product = require("../models/Product");
const crypto = require("crypto");

// Create a new product
exports.createProduct = async (req, res) => {
  try {
    const productData = req.body;

    const product = new Product({
      ...productData,
    });

    await product.save();
    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get product by hash
exports.getProductByHash = async (req, res) => {
  try {
    const product = await Product.findOne({ hash: req.params.hash });
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Add resale information
exports.addResale = async (req, res) => {
  try {
    const { hash } = req.params;
    const { distributorName, customerName, price } = req.body;

    const product = await Product.findOne({ hash });
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    product.resales.push({
      distributorName,
      customerName,
      price,
      date: new Date(),
    });

    await product.save();
    res.json(product);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get resale history
exports.getResaleHistory = async (req, res) => {
  try {
    const product = await Product.findOne({ hash: req.params.hash });
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json(product.resales);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
