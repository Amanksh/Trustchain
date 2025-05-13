import React, { useState, useRef } from "react";
import jsQR from "jsqr";
import { ethers } from "ethers";
import axios from "axios";
import "../css/Authenticate.css";

const Authenticate = ({ account, contract }) => {
  const [auth, setAuth] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [scanResult, setScanResult] = useState(null);
  const [product, setProduct] = useState(null);
  const canvasRef = useRef(null);

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setError("");
      setMessage("");
      setScanResult(null);
      setProduct(null);

      const img = new Image();
      img.src = url;

      img.onload = () => {
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");

        canvas.width = img.width;
        canvas.height = img.height;
        context.drawImage(img, 0, 0, img.width, img.height);

        const imageData = context.getImageData(
          0,
          0,
          canvas.width,
          canvas.height
        );
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code) {
          console.log("QR Code detected:", code.data);
          try {
            const data = JSON.parse(code.data);
            setScanResult(data);
            if (data.hash) {
              verifyTransaction(data.hash);
            } else {
              setError("Invalid QR code format - missing transaction hash");
            }
          } catch (parseError) {
            console.error("Parse Error:", parseError);
            setError("Invalid QR code format - not a valid JSON");
          }
        } else {
          setError(
            "No QR code found in the image. Please try a different image."
          );
        }
      };

      img.onerror = () => {
        setError("Error loading image. Please try again.");
      };
    }
  };

  const verifyTransaction = async (hash) => {
    try {
      const provider = contract.provider;
      const receipt = await provider.getTransactionReceipt(hash);

      if (receipt) {
        if (receipt.status === 1) {
          const tx = await provider.getTransaction(hash);

          if (tx) {
            if (tx.to.toLowerCase() === contract.address.toLowerCase()) {
              setMessage("Product is Authenticated ✅");
              setAuth(true);

              // Get product details from database
              try {
                const response = await axios.get(
                  `http://127.0.0.1:3002/api/products/${hash}`
                );
                setProduct(response.data);
              } catch (err) {
                console.error("Error fetching product details:", err);
              }
            } else {
              setError("Transaction was not sent to the correct contract");
            }
          } else {
            setError("Transaction not found on blockchain");
          }
        } else {
          setError("Transaction failed on blockchain");
        }
      } else {
        setError("Transaction not found on blockchain");
      }
    } catch (error) {
      console.error("Verification Error:", error);
      setError("Error verifying transaction on blockchain");
    }
  };

  return (
    <div className="authenticate-container">
      <div className="header">
        <h2>Product Authentication</h2>
        <div className="wallet-info">
          <span>Wallet: </span>
          {account.substring(0, 4) +
            "..." +
            account.substring(account.length - 4)}
        </div>
      </div>

      <div className="upload-section">
        <div className="upload-box">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            id="file-input"
            className="file-input"
          />
          <label htmlFor="file-input" className="file-label">
            <div className="upload-icon">📁</div>
            <span>Upload QR Code Image</span>
          </label>
        </div>

        {previewUrl && (
          <div className="preview-section">
            <div className="preview-container">
              <img
                src={previewUrl}
                alt="QR Code Preview"
                className="preview-image"
              />
              <canvas ref={canvasRef} style={{ display: "none" }} />
            </div>
          </div>
        )}
      </div>

      <div className="results-section">
        {message && (
          <div className={`status-message ${auth ? "success" : "error"}`}>
            <h3>{message}</h3>
          </div>
        )}

        {error && (
          <div className="error-message">
            <p>{error}</p>
          </div>
        )}

        {scanResult && (
          <div className="scan-details">
            <h3>QR Code Details</h3>
            <div className="details-grid">
              {Object.entries(scanResult).map(([key, value]) => (
                <div key={key} className="detail-item">
                  <span className="detail-label">{key}:</span>
                  <span className="detail-value">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {product && (
          <div className="product-details">
            <h3>Product Details</h3>
            <div className="details-grid">
              <div className="detail-item">
                <span className="detail-label">Name:</span>
                <span className="detail-value">{product.name}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Description:</span>
                <span className="detail-value">{product.description}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Manufacturer:</span>
                <span className="detail-value">{product.manufacturer}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Distributor ID:</span>
                <span className="detail-value">{product.distributorId}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Cost:</span>
                <span className="detail-value">₹{product.cost}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Quantity:</span>
                <span className="detail-value">{product.quantity}</span>
              </div>
            </div>

            {product.resales && product.resales.length > 0 && (
              <div className="resale-history">
                <h3>Resale History</h3>
                <div className="resale-table">
                  <table>
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
                          <td>{new Date(resale.date).toLocaleDateString()}</td>
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

      <div className="footer-note">
        <p>
          Please wait for 15 seconds if Authentication message is not appearing.
          If no message appears, your product is not Authenticated.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="reload-button"
        >
          Scan Again
        </button>
      </div>
    </div>
  );
};

export default Authenticate;
