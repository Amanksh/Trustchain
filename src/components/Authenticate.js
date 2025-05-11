import React, { useState, useRef } from "react";
import jsQR from "jsqr";
import axios from "axios";
import { ethers } from "ethers";
import "../css/Authenticate.css";

const Authenticate = ({ account, contract }) => {
  const [auth, setAuth] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const canvasRef = useRef(null);

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setError("");
      setMessage("");

      // Create an image element
      const img = new Image();
      img.src = url;

      img.onload = () => {
        // Create canvas and get context
        const canvas = canvasRef.current;
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
          console.log("QR Code detected:", code.data);
          try {
            const data = JSON.parse(code.data);
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
      // Get the provider from the contract
      const provider = contract.provider;

      // Get transaction receipt
      const receipt = await provider.getTransactionReceipt(hash);

      if (receipt) {
        // Check if transaction was successful
        if (receipt.status === 1) {
          // Get transaction details
          const tx = await provider.getTransaction(hash);

          if (tx) {
            // Verify the transaction was sent to our contract
            if (tx.to.toLowerCase() === contract.address.toLowerCase()) {
              setMessage("Product is Authenticated ✅");
              setAuth(true);
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
    <div className="cam">
      <h4 style={{ color: "#000", position: "fixed", right: 8, top: 2 }}>
        Wallet Address:{" "}
        {account.substring(0, 4) +
          "..." +
          account.substring(account.length - 4, account.length)}
      </h4>
      <br />
      <h2 style={{ position: "absolute", top: 20 }}>
        Upload QR Code Image to Scan
      </h2>

      <div
        style={{
          width: "100%",
          maxWidth: "500px",
          margin: "100px auto",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "20px",
        }}
      >
        <input
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          style={{
            padding: "10px",
            border: "2px dashed #ccc",
            borderRadius: "5px",
            width: "100%",
            textAlign: "center",
          }}
        />

        {previewUrl && (
          <div style={{ width: "100%", maxWidth: "300px" }}>
            <img
              src={previewUrl}
              alt="QR Code Preview"
              style={{ width: "100%", height: "auto" }}
            />
            <canvas ref={canvasRef} style={{ display: "none" }} />
          </div>
        )}
      </div>

      <div
        style={{
          position: "absolute",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          top: "50%",
        }}
      >
        <div>
          <h1>{message}</h1>
          {error && (
            <p
              style={{
                color: "red",
                backgroundColor: "#ffebee",
                padding: "10px",
                borderRadius: "5px",
                margin: "10px 0",
              }}
            >
              {error}
            </p>
          )}
        </div>
      </div>

      <div style={{ position: "absolute", bottom: 90 }}>
        <h3>
          Please wait for 15 sec if Authentication message is not appearing on
          the screen then your product is not Authenticated.
        </h3>
        <br />
        <span>Please reload the page to Scan again.</span>
      </div>
    </div>
  );
};

export default Authenticate;
