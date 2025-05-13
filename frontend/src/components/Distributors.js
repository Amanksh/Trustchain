import React, { useEffect, useState } from "react";
import "../css/distributors.css";
import Title from "./Title";
import MainBar from "./MainBar";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

function Distributors({ contract, account }) {
  const navigate = useNavigate();
  const [distributors, setDistributors] = useState([]);

  const getDistributor = async () => {
    try {
      // Get all assets first
      const allAssets = await contract.getAllAssets();
      console.log("All assets:", allAssets);

      // Get all distributors
      const allDistributors = await contract.getAlldistributors();
      console.log("All distributors:", allDistributors);

      // Create a Set to store unique distributor IDs associated with the account's assets
      const relevantDistributorIds = new Set();

      // Check each asset to see if it's owned by the current account
      for (let i = 0; i < allAssets.length; i++) {
        const isOwner = await contract.isOwnerOf(account, i);
        console.log(`Asset ${i} is owned by ${account}:`, isOwner);

        if (isOwner) {
          // The distributorId is the last element in the asset array (index 10)
          const distributorId = allAssets[i][10].toString();
          console.log(`Adding distributor ID ${distributorId} for asset ${i}`);
          relevantDistributorIds.add(distributorId);
        }
      }

      console.log(
        "Relevant distributor IDs:",
        Array.from(relevantDistributorIds)
      );

      // Filter distributors to only include those in our set
      const filteredDistributors = allDistributors.filter(
        (distributor, index) => {
          const isRelevant = relevantDistributorIds.has(index.toString());
          console.log(`Distributor ${index} is relevant:`, isRelevant);
          return isRelevant;
        }
      );

      console.log("Filtered distributors:", filteredDistributors);
      setDistributors(filteredDistributors);
    } catch (e) {
      console.log("Error in getDistributor:", e);
    }
  };

  useEffect(() => {
    if (contract && account) {
      getDistributor();
    }
  }, [contract, account]); // Re-run when contract or account changes

  return (
    distributors && (
      <MainBar pageTitle="Welcome to manufacturer dashboard">
        <table className="styled-table">
          <thead>
            <tr>
              <th>id</th>
              <th>Name</th>
              <th>Address</th>
              <th>Email</th>
              <th>Phone</th>
            </tr>
          </thead>
          <tbody>
            {distributors.map((d, i) => (
              <tr key={i}>
                <td>{i}</td>
                <td>{d.name}</td>
                <td>{d.add}</td>
                <td>{d.email}</td>
                <td>{d.phone}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </MainBar>
    )
  );
}

export default Distributors;
