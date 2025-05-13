import React, { useEffect, useState } from "react";
import Title from "./Title";
import MainBar from "./MainBar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useNavigate } from "react-router-dom";

function TrackProducts({ contract, account }) {
  const navigate = useNavigate();
  const [assets, setAssets] = useState([]);

  const getAssets = async () => {
    try {
      let allAssets = await contract.getAllAssets();
      // Filter assets to only show those owned by the current account
      const ownedAssets = [];
      for (let i = 0; i < allAssets.length; i++) {
        const isOwner = await contract.isOwnerOf(account, i);
        if (isOwner) {
          ownedAssets.push(allAssets[i]);
        }
      }
      console.log("owned assets", ownedAssets);
      setAssets(ownedAssets);
    } catch (e) {
      console.log(e);
    }
  };

  useEffect(() => {
    if (contract && account) {
      getAssets();
    }
  }, [contract, account]); // Re-run when contract or account changes

  return (
    <MainBar pageTitle="Track Products">
      <br />
      <table className="styled-table">
        <thead>
          <tr>
            <th>Distributor Id</th>
            <th>Name</th>
            <th>Description</th>
            <th>Cost</th>
            <th>Quantity</th>
            <th>Vendor</th>
            <th>Consumer</th>
            <th>Address From</th>
            <th>Address To</th>
            <th>Intialized</th>
            <th>Arrived</th>
          </tr>
        </thead>
        <tbody>
          {assets.map((d, i) => (
            <tr key={i}>
              <td>{d[10].toString()}</td>
              <td>{d[0]}</td>
              <td>{d[1]}</td>
              <td>{d[2].toString()}</td>
              <td>{d[3].toString()}</td>
              <td>{d[4].toString()}</td>
              <td>{d[5].toString()}</td>
              <td>{d[6].toString()}</td>
              <td>{d[7].toString()}</td>
              <td>{d[8].toString()}</td>
              <td>{d[9].toString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </MainBar>
  );
}

export default TrackProducts;
