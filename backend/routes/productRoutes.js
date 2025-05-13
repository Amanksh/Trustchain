const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");

// Create a new product
router.post("/", productController.createProduct);

// Get product by hash
router.get("/:hash", productController.getProductByHash);

// Add resale information
router.post("/:hash/resale", productController.addResale);

// Get resale history
router.get("/:hash/resales", productController.getResaleHistory);

module.exports = router;
