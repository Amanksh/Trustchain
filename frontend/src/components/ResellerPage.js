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
  faStore,
  faUser,
  faTag,
} from "@fortawesome/free-solid-svg-icons";
import jsQR from "jsqr";
import styled from "styled-components";

const PageContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: flex-start;
  min-height: 100vh;
  padding: 2rem;
  background: #f8f9fa;
`;

const ContentWrapper = styled.div`
  width: 100%;
  max-width: 1000px;
`;

const Card = styled.div`
  background: white;
  border-radius: 20px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
  padding: 2.5rem;
  margin-bottom: 2rem;
  transition: transform 0.2s ease;

  &:hover {
    transform: translateY(-2px);
  }
`;

const UploadArea = styled.div`
  border: 2px dashed #007bff;
  border-radius: 15px;
  padding: 3rem 2rem;
  text-align: center;
  transition: all 0.3s ease;
  cursor: pointer;
  background: #f8f9fa;
  margin: 2rem 0;

  &:hover {
    border-color: #0056b3;
    background: #e9ecef;
    transform: scale(1.01);
  }

  .upload-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.5rem;

    svg {
      font-size: 3rem;
      color: #007bff;
    }

    span {
      font-size: 1.2rem;
      color: #495057;
      font-weight: 500;
    }
  }

  img {
    border-radius: 12px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    transition: transform 0.3s ease;

    &:hover {
      transform: scale(1.05);
    }
  }
`;

const StatusBadge = styled.div`
  padding: 1rem 2rem;
  border-radius: 30px;
  font-weight: bold;
  text-align: center;
  margin: 1.5rem 0;
  background: ${(props) => (props.authentic ? "#28a745" : "#dc3545")};
  color: white;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-size: 1.1rem;
`;

const ResaleForm = styled.form`
  background: #ffffff;
  padding: 2rem;
  border-radius: 15px;
  margin-top: 2rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);

  .form-group {
    margin-bottom: 1.5rem;
  }

  .form-control {
    border-radius: 10px;
    padding: 0.8rem 1rem;
    border: 1px solid #dee2e6;
    transition: all 0.3s ease;

    &:focus {
      border-color: #007bff;
      box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
    }
  }

  .btn-primary {
    padding: 0.8rem 2rem;
    border-radius: 10px;
    font-weight: 600;
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    }
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  margin: 1.5rem 0;
  border-radius: 15px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);

  th,
  td {
    padding: 1.2rem;
    border: 1px solid #dee2e6;
  }

  th {
    background: #f8f9fa;
    font-weight: 600;
    color: #495057;
  }

  tr:nth-child(even) {
    background: #f8f9fa;
  }

  tr:hover {
    background: #e9ecef;
  }
`;

const SectionTitle = styled.h4`
  color: #2c3e50;
  font-weight: 600;
  margin-bottom: 1.5rem;
  text-align: center;
  position: relative;
  padding-bottom: 0.5rem;

  &:after {
    content: "";
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 50px;
    height: 3px;
    background: #007bff;
    border-radius: 3px;
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
      <PageContainer>
        <ContentWrapper>
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
                    style={{ maxWidth: "250px" }}
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
                <SectionTitle>Origin Details</SectionTitle>
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
                  <SectionTitle>Add Resale Information</SectionTitle>
                  <div className="row">
                    <div className="col-md-4 form-group">
                      <div className="input-group">
                        <span className="input-group-text">
                          <FontAwesomeIcon icon={faStore} />
                        </span>
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
                    </div>
                    <div className="col-md-4 form-group">
                      <div className="input-group">
                        <span className="input-group-text">
                          <FontAwesomeIcon icon={faUser} />
                        </span>
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
                    </div>
                    <div className="col-md-4 form-group">
                      <div className="input-group">
                        <span className="input-group-text">
                          <FontAwesomeIcon icon={faTag} />
                        </span>
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
                  </div>
                  <div className="text-center mt-4">
                    <button type="submit" className="btn btn-primary btn-lg">
                      Add Resale
                    </button>
                  </div>
                </ResaleForm>

                {product.resales && product.resales.length > 0 && (
                  <div className="mt-5">
                    <SectionTitle>Resale History</SectionTitle>
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
        </ContentWrapper>
      </PageContainer>
    </MainBar>
  );
}

export default ResellerPage;
