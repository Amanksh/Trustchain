import React, { useState, useRef } from "react";
import { QrReader } from "react-qr-reader";
import MainBar from "./MainBar";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUpload,
  faQrcode,
  faCheckCircle,
  faTimesCircle,
} from "@fortawesome/free-solid-svg-icons";
import jsQR from "jsqr";
import styled from "styled-components";

const Card = styled.div`
  background: white;
  border-radius: 15px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  padding: 2rem;
  margin-bottom: 2rem;
`;

const UploadArea = styled.div`
  border: 2px dashed #ccc;
  border-radius: 10px;
  padding: 2rem;
  text-align: center;
  transition: all 0.3s ease;
  cursor: pointer;
  background: #f8f9fa;

  &:hover {
    border-color: #007bff;
    background: #e9ecef;
  }

  .upload-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;

    svg {
      font-size: 2rem;
      color: #007bff;
    }

    span {
      font-size: 1.1rem;
      color: #495057;
    }
  }

  img {
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
`;

const StatusBadge = styled.div`
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-weight: bold;
  text-align: center;
  margin: 1rem 0;
  background: ${(props) => (props.authentic ? "#28a745" : "#dc3545")};
  color: white;
`;

const ResaleForm = styled.form`
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 10px;
  margin-top: 2rem;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  margin: 1rem 0;

  th,
  td {
    padding: 1rem;
    border: 1px solid #dee2e6;
  }

  th {
    background: #f8f9fa;
    font-weight: 600;
  }

  tr:nth-child(even) {
    background: #f8f9fa;
  }
`;

function ResellerPage({ contract, account }) {
  const [scanResult, setScanResult] = useState(null);
  const [product, setProduct] = useState(null);
  const [error, setError] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthentic, setIsAuthentic] = useState(null);
  const [resaleForm, setResaleForm] = useState({
    distributorName: "",
    customerName: "",
    price: "",
  });

  const handleImageUpload = (event) => {
    console.log("File selected:", event.target.files[0]);
    const file = event.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      console.log("Image URL created:", imageUrl);
      setSelectedImage(imageUrl);
      setIsLoading(true);

      const img = new Image();
      img.onload = () => {
        console.log("Image loaded successfully");
        const canvas = document.createElement("canvas");
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
        console.log("Scanning for QR code...");
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code) {
          console.log("QR code found:", code.data);
          try {
            const qrData = JSON.parse(code.data);
            console.log("Parsed QR data:", qrData);
            if (qrData.hash) {
              handleScanResult(qrData.hash);
            } else {
              console.log("No hash found in QR data");
              setError("Invalid QR code format - hash not found");
            }
          } catch (e) {
            console.error("Error parsing QR data:", e);
            setError("Invalid QR code format - not a valid JSON");
          }
        } else {
          console.log("No QR code found in image");
          setError("No QR code found in image");
        }
        setIsLoading(false);
      };

      img.onerror = (error) => {
        console.error("Error loading image:", error);
        setError("Error loading image");
        setIsLoading(false);
      };

      img.src = imageUrl;
    } else {
      console.log("No file selected");
    }
  };

  const handleScanResult = async (hash) => {
    try {
      console.log("hash", hash);
      const provider = contract.provider;
      const receipt = await provider.getTransactionReceipt(hash);

      if (receipt) {
        if (receipt.status === 1) {
          const tx = await provider.getTransaction(hash);

          if (tx) {
            if (tx.to.toLowerCase() === contract.address.toLowerCase()) {
              setIsAuthentic(true);
              setError("");

              // Get product details from database
              const response = await axios.get(
                `http://127.0.0.1:3002/api/products/${hash}`
              );
              setProduct(response.data);
            } else {
              setError("Transaction was not sent to the correct contract");
              setIsAuthentic(false);
              setProduct(null);
            }
          } else {
            setError("Transaction not found on blockchain");
            setIsAuthentic(false);
            setProduct(null);
          }
        } else {
          setError("Transaction failed on blockchain");
          setIsAuthentic(false);
          setProduct(null);
        }
      } else {
        setError("Transaction not found on blockchain");
        setIsAuthentic(false);
        setProduct(null);
      }
    } catch (err) {
      console.error("Verification Error:", err);
      setError("Error verifying transaction on blockchain");
      setIsAuthentic(false);
      setProduct(null);
    }
  };

  const handleResaleSubmit = async (e) => {
    e.preventDefault();
    if (!product || !product.hash) return;

    try {
      const response = await axios.post(
        `http://127.0.0.1:3002/api/products/${product.hash}/resale`,
        {
          distributorName: resaleForm.distributorName,
          customerName: resaleForm.customerName,
          price: parseFloat(resaleForm.price),
        }
      );

      // Update product with new resale information
      setProduct(response.data);

      // Reset form
      setResaleForm({
        distributorName: "",
        customerName: "",
        price: "",
      });

      setError("");
    } catch (err) {
      setError("Error adding resale information");
    }
  };

  const handleResaleInputChange = (e) => {
    setResaleForm({
      ...resaleForm,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <MainBar pageTitle="Resell Product">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-8">
            <Card>
              <h3 className="text-center mb-4">
                <FontAwesomeIcon icon={faQrcode} className="me-2" />
                Product Authentication
              </h3>

              <UploadArea
                onClick={() => document.getElementById("imageUpload").click()}
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ display: "none" }}
                  id="imageUpload"
                />
                <div className="upload-content">
                  <FontAwesomeIcon icon={faUpload} className="me-2" />
                  <span>Click to Upload QR Code Image</span>
                </div>
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
              </UploadArea>

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

              {isAuthentic !== null && (
                <StatusBadge authentic={isAuthentic}>
                  <FontAwesomeIcon
                    icon={isAuthentic ? faCheckCircle : faTimesCircle}
                    className="me-2"
                  />
                  {isAuthentic
                    ? "Product is Authentic"
                    : "Product is Not Authentic"}
                </StatusBadge>
              )}

              {product && (
                <div className="product-info mt-4">
                  <h4 className="text-center mb-3">Origin Details</h4>
                  <Table>
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
                  </Table>

                  <ResaleForm onSubmit={handleResaleSubmit}>
                    <h4 className="text-center mb-3">Add Resale Information</h4>
                    <div className="row">
                      <div className="col-md-4 mb-3">
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Distributor Name"
                          name="distributorName"
                          value={resaleForm.distributorName}
                          onChange={handleResaleInputChange}
                          required
                        />
                      </div>
                      <div className="col-md-4 mb-3">
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Customer Name"
                          name="customerName"
                          value={resaleForm.customerName}
                          onChange={handleResaleInputChange}
                          required
                        />
                      </div>
                      <div className="col-md-4 mb-3">
                        <input
                          type="number"
                          className="form-control"
                          placeholder="Price"
                          name="price"
                          value={resaleForm.price}
                          onChange={handleResaleInputChange}
                          required
                        />
                      </div>
                    </div>
                    <div className="text-center">
                      <button type="submit" className="btn btn-primary">
                        Add Resale
                      </button>
                    </div>
                  </ResaleForm>

                  {product.resales && product.resales.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-center mb-3">Resale History</h4>
                      <Table>
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
                      </Table>
                    </div>
                  )}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </MainBar>
  );
}

export default ResellerPage;
