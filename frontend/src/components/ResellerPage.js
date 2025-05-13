import React, { useState, useRef } from "react";
import { QrReader } from "react-qr-reader";
import MainBar from "./MainBar";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUpload, faQrcode } from "@fortawesome/free-solid-svg-icons";
import jsQR from "jsqr";

function ResellerPage() {
  const [scanResult, setScanResult] = useState(null);
  const [product, setProduct] = useState(null);
  const [error, setError] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const canvasRef = useRef(null);

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setSelectedImage(imageUrl);
      setIsLoading(true);

      // Create an image element to load the file
      const img = new Image();
      img.onload = () => {
        // Create a canvas element
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");

        // Set canvas dimensions to match image
        canvas.width = img.width;
        canvas.height = img.height;

        // Draw image on canvas
        context.drawImage(img, 0, 0, img.width, img.height);

        // Get image data
        const imageData = context.getImageData(
          0,
          0,
          canvas.width,
          canvas.height
        );

        // Scan for QR code
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code) {
          try {
            // Try to parse the QR code data as JSON
            const qrData = JSON.parse(code.data);
            if (qrData.hash) {
              handleScanResult(qrData.hash);
            } else {
              setError("Invalid QR code format - hash not found");
            }
          } catch (e) {
            setError("Invalid QR code format - not a valid JSON");
          }
        } else {
          setError("No QR code found in image");
        }
        setIsLoading(false);
      };

      img.onerror = () => {
        setError("Error loading image");
        setIsLoading(false);
      };

      img.src = imageUrl;
    }
  };

  const handleScanResult = async (hash) => {
    try {
      const response = await axios.get(
        `http://127.0.0.1:3002/api/products/${hash}`
      );
      setProduct(response.data);
      setError("");
    } catch (err) {
      setError("Product not found or invalid QR code");
      setProduct(null);
    }
  };

  return (
    <MainBar pageTitle="Authenticate Product">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-8">
            <div className="card">
              <div className="card-body">
                <h3 className="text-center mb-4">
                  <FontAwesomeIcon icon={faQrcode} className="me-2" />
                  Product Authentication
                </h3>

                <div className="text-center mb-4">
                  <div className="upload-area p-4 border rounded">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      style={{ display: "none" }}
                      id="imageUpload"
                    />
                    <label
                      htmlFor="imageUpload"
                      className="btn btn-primary btn-lg"
                    >
                      <FontAwesomeIcon icon={faUpload} className="me-2" />
                      Upload QR Code Image
                    </label>
                    {selectedImage && (
                      <div className="mt-3">
                        <img
                          src={selectedImage}
                          alt="Selected QR Code"
                          style={{ maxWidth: "200px" }}
                          className="img-fluid"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {isLoading && (
                  <div className="text-center">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-2">Scanning QR Code...</p>
                  </div>
                )}

                {error && (
                  <div className="alert alert-danger text-center">{error}</div>
                )}

                {product && (
                  <div className="product-info mt-4">
                    <h4 className="text-center mb-3">Product Details</h4>
                    <div className="table-responsive">
                      <table className="table table-bordered">
                        <tbody>
                          <tr>
                            <th>Name</th>
                            <td>{product.name}</td>
                          </tr>
                          <tr>
                            <th>Description</th>
                            <td>{product.description}</td>
                          </tr>
                          <tr>
                            <th>Manufacturer</th>
                            <td>{product.manufacturer}</td>
                          </tr>
                          <tr>
                            <th>Distributor ID</th>
                            <td>{product.distributorId}</td>
                          </tr>
                          <tr>
                            <th>Cost</th>
                            <td>₹{product.cost}</td>
                          </tr>
                          <tr>
                            <th>Quantity</th>
                            <td>{product.quantity}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {product.resales && product.resales.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-center mb-3">Resale History</h4>
                        <div className="table-responsive">
                          <table className="table table-bordered">
                            <thead>
                              <tr>
                                <th>Distributor</th>
                                <th>Customer</th>
                                <th>Price</th>
                                <th>Date</th>
                              </tr>
                            </thead>
                            <tbody>
                              {product.resales.map((resale, index) => (
                                <tr key={index}>
                                  <td>{resale.distributorName}</td>
                                  <td>{resale.customerName}</td>
                                  <td>₹{resale.price}</td>
                                  <td>
                                    {new Date(resale.date).toLocaleDateString()}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainBar>
  );
}

export default ResellerPage;
