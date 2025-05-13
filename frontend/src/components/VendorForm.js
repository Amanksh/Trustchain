import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import styled, { createGlobalStyle } from "styled-components";
import { useForm, useField, splitFormProps } from "react-form";
import { useTable } from "react-table";
import QRCode from "qrcode.react";
import Modal from "react-modal";
import "./VendorForm.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const TableInput = (props) => {
  const { column, row, cell, updateData } = props;
  const onChange = (e) => updateData(row.index, column.id, e.target.value);
  return (
    <input
      type="number"
      value={cell.value}
      onChange={onChange}
      className="cell-input"
    />
  );
};

const ItemName = (props) => {
  const { column, row, cell, updateData } = props;
  const onChange = (e) => updateData(row.index, column.id, e.target.value);
  return (
    <input
      type="text"
      value={cell.value}
      onChange={onChange}
      className="cell-input"
    />
  );
};

const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  th,
  td {
    width: 25%;
    text-align: center;
    border: 1px solid lightgray;
    padding: 5px;
  }
`;
const ReactTable = React.memo((props) => {
  const {
    setAmountDue,
    setQrcode,
    setAssetMessage,
    setIsOpen,
    assetMessage,
    isOpen,
    qrcode,
  } = props;

  // State declarations
  const [modalIsOpen, setModalIsOpen] = React.useState(false);
  const [hash, setHash] = React.useState(null);
  const [assetModalIsOpen, setAssetModalIsOpen] = React.useState(false);
  const [assetDetails, setAssetDetails] = React.useState([]);
  const [data, setData] = React.useState([
    {
      item: "Vaccine",
      description: "Medicine",
      cost: 1,
      quantity: 2,
    },
  ]);

  const columns = React.useMemo(
    () => [
      {
        Header: "Item",
        accessor: "item",
        Cell: ItemName,
      },
      {
        Header: "Item Description",
        accessor: "description",
        Cell: ItemName,
      },
      {
        Header: "Cost (INR)",
        accessor: "cost",
        Cell: TableInput,
      },
      {
        Header: "Quantity",
        accessor: "quantity",
        Cell: TableInput,
      },
      {
        Header: "Total (INR)",
        accessor: (row) => row.cost * row.quantity,
        id: "total",
      },
    ],
    []
  );

  const resetData = () =>
    setData([
      {
        item: "Vaccine",
        description: "Medicine",
        cost: 1,
        quantity: 2,
      },
    ]);

  const updateData = (rowIndex, columnID, value) => {
    setData((oldData) =>
      oldData.map((row, index) => {
        if (index === rowIndex) {
          return {
            ...oldData[rowIndex],
            [columnID]: value,
          };
        }
        return row;
      })
    );
  };

  const table = useTable({ columns, data, updateData });
  const { getTableProps, headerGroups, rows, prepareRow } = table;
  const tableSum = rows.reduce((sum, row) => sum + row.values.total, 0);
  setAmountDue(tableSum);

  const closeModal = () => {
    setQrcode(null);
    setModalIsOpen(false);
  };

  const assetcloseModal = () => {
    setAssetModalIsOpen(false);
  };

  const customStyles = {
    content: {
      top: "50%",
      left: "50%",
      right: "auto",
      bottom: "auto",
      marginRight: "-50%",
      transform: "translate(-50%, -50%)",
      width: "600px",
      height: "580px",
      borderRadius: "20px",
      backgroundClip: "text",
    },
  };

  const assetModalStyles = {
    content: {
      top: "50%",
      left: "50%",
      right: "auto",
      bottom: "auto",
      marginRight: "-50%",
      transform: "translate(-50%, -50%)",
      width: "600px",
      height: "400px",
      borderRadius: "20px",
      backgroundClip: "text",
    },
  };

  const handleSubmit = async (e) => {
    if (
      !data[0].item ||
      !data[0].description ||
      !data[0].cost ||
      !data[0].quantity ||
      !props.vendorName ||
      !props.consumerName ||
      !props.vendorAdd ||
      !props.consumerAdd ||
      props.distributorId === ""
    ) {
      setAssetMessage("Please fill all the fields");
    } else {
      setAssetMessage("Creating...");
      e.preventDefault();
      try {
        // Create asset in smart contract
        let asset = await props.contract.createAsset(
          data[0].item,
          data[0].description,
          props.distributorId,
          data[0].cost,
          data[0].quantity,
          props.vendorName,
          props.consumerName,
          props.vendorAdd,
          props.consumerAdd
        );
        await asset.wait();
        setHash(asset.hash);

        if (asset.hash) {
          // Prepare product data for MongoDB
          const productData = {
            name: data[0].item,
            description: data[0].description,
            distributorId: props.distributorId,
            cost: data[0].cost,
            quantity: data[0].quantity,
            manufacturer: props.vendorName,
            hash: asset.hash,
            createdAt: new Date(),
          };

          // Save to MongoDB with error handling
          try {
            const response = await axios.post(
              "http://127.0.0.1:3002/api/products",
              productData
            );
            console.log("Product saved to database:", response.data);

            // Generate QR code
            const info = {
              name: data[0].item,
              description: data[0].description,
              distributorId: props.distributorId,
              cost: data[0].cost,
              quantity: data[0].quantity,
              vendorName: props.vendorName,
              consumerName: props.consumerName,
              vendorAdd: props.vendorAdd,
              consumerAdd: props.consumerAdd,
              hash: asset.hash,
            };
            let strData = JSON.stringify(info);
            setQrcode(strData);
            setModalIsOpen(true); // Use local state for modal
            setAssetMessage("Create");
          } catch (dbError) {
            console.error("Error saving to database:", dbError);
            setAssetMessage("Error saving to database");
            return;
          }
        } else {
          setAssetMessage("Error creating asset");
        }
      } catch (error) {
        console.error("Error creating asset:", error);
        setAssetMessage("Error creating asset");
      }
    }
  };

  return (
    <>
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={() => setModalIsOpen(false)}
        style={customStyles}
        contentLabel="QrCode Modal"
        ariaHideApp={false}
      >
        <div style={{ textAlign: "center", marginTop: 10 }}>
          {qrcode && <PaymentQRCode size={500} value={qrcode} />}
        </div>

        <span
          onClick={() => setModalIsOpen(false)}
          style={{
            position: "absolute",
            top: 3,
            right: 20,
            fontSize: 28,
            cursor: "pointer",
          }}
        >
          <FontAwesomeIcon icon="fa-solid fa-xmark" />
        </span>
      </Modal>
      <Modal
        isOpen={assetModalIsOpen}
        onRequestClose={assetcloseModal}
        style={assetModalStyles}
        contentLabel="Asset Modal"
        ariaHideApp={false}
      >
        <div style={{ textAlign: "center", marginTop: 10, color: "black" }}>
          <h2>Name:{assetDetails[0]}</h2>
          <h2>Description:{assetDetails[1]}</h2>
          <h2>Quantity:{assetDetails[8]}</h2>
          <h2>Cost:{assetDetails[7]}</h2>
          <h2>Manufacturer:{assetDetails[2]}</h2>
          <h2>Consumer:{assetDetails[3]}</h2>
          <h2>AddressFrom:{assetDetails[4]}</h2>
          <h2>AddressTo:{assetDetails[5]}</h2>
        </div>

        <span
          onClick={assetcloseModal}
          style={{
            position: "absolute",
            top: 3,
            right: 20,
            fontSize: 28,
            cursor: "pointer",
          }}
        >
          <FontAwesomeIcon icon="fa-solid fa-xmark" />
        </span>
      </Modal>

      <br />
      <StyledTable {...getTableProps()}>
        <thead>
          {headerGroups.map((headerGroup) => (
            <tr {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map((column) => (
                <th {...column.getHeaderProps()}>{column.render("Header")}</th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {rows.map((row) => {
            prepareRow(row);
            return (
              <tr {...row.getRowProps()}>
                {row.cells.map((cell) => (
                  <td {...cell.getCellProps()}>{cell.render("Cell")}</td>
                ))}
              </tr>
            );
          })}
          <tr>
            <td colSpan={3}>
              <button type="button" onClick={resetData} className="btn">
                Reset Table
              </button>
            </td>
            <br />
            <button
              type="submit"
              onClick={handleSubmit}
              className="btn"
              style={{ marginLeft: "40%" }}
            >
              {assetMessage}
            </button>
          </tr>
        </tbody>
      </StyledTable>
    </>
  );
});

const FormStyles = styled.div`
  form {
    margin: 10px;
    label {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    aside {
      display: flex;
      justify-content: space-between;
    }
    section {
      flex: 1 1 auto;
      display: flex;
      flex-flow: column nowrap;
    }
    button {
      margin: 5px;
      padding: 5px;
      width: 100px;
      align-self: flex-end;
    }
  }
`;
const AmountDue = styled.label`
  margin: 10px;
  font-size: 1.5em;
  align-self: flex-end;
`;
const PaymentQRCode = styled(QRCode)`
  padding: 5px;
  align-self: flex-end;
`;

const ReactForm = (props) => {
  const navigate = useNavigate();
  const { amountDue, setAmountDue, distributors } = props;

  // Add state variables here
  const [qrcode, setQrcode] = React.useState(null);
  const [assetMessage, setAssetMessage] = React.useState("Create");
  const [isOpen, setIsOpen] = React.useState(false);
  const [vendorName, setVendorName] = React.useState("");
  const [vendorAdd, setVendorAdd] = React.useState("");
  const [consumerAdd, setConsumerAdd] = React.useState("");
  const [consumerName, setConsumerName] = React.useState("");
  const [distributorId, setDistributorId] = React.useState("");

  return (
    <>
      <FormStyles style={{ marginTop: "40px" }}>
        <form>
          <aside>
            <section>
              <div className="info-container">
                <label className="label">
                  Manufacturer :{" "}
                  <input
                    type="text"
                    className="VendorInfo"
                    onChange={(e) => {
                      e.preventDefault();
                      setVendorName(e.target.value);
                    }}
                  />
                </label>
                <label className="label">
                  Consumer :{" "}
                  <input
                    type="text"
                    className="VendorInfo"
                    onChange={(e) => {
                      e.preventDefault();
                      setConsumerName(e.target.value);
                    }}
                  />
                </label>
                <label className="label">
                  Address From:
                  <input
                    type="text"
                    className="VendorInfo"
                    onChange={(e) => {
                      e.preventDefault();
                      setVendorAdd(e.target.value);
                    }}
                  />
                </label>
                <label className="label">
                  Address To:
                  <input
                    type="text"
                    className="VendorInfo"
                    onChange={(e) => {
                      e.preventDefault();
                      setConsumerAdd(e.target.value);
                    }}
                  />
                </label>
                <label className="label">
                  Distributors:
                  <select
                    className="VendorInfo"
                    value={distributorId}
                    onChange={(e) => {
                      const selectedId = e.target.value;
                      setDistributorId(selectedId);
                    }}
                  >
                    <option value="">Select a distributor</option>
                    {distributors &&
                      distributors.map((d, i) => (
                        <option key={i} value={i}>
                          {d.name}
                        </option>
                      ))}
                  </select>
                </label>
              </div>
            </section>
            <section>
              <AmountDue>Amount Due: {amountDue} INR</AmountDue>
            </section>
          </aside>
          <ReactTable
            setAmountDue={setAmountDue}
            contract={props.contract}
            vendorName={vendorName}
            consumerName={consumerName}
            vendorAdd={vendorAdd}
            consumerAdd={consumerAdd}
            distributorId={distributorId}
            setQrcode={setQrcode}
            setAssetMessage={setAssetMessage}
            setIsOpen={setIsOpen}
            assetMessage={assetMessage}
            isOpen={isOpen}
            qrcode={qrcode}
          />
          <br />
        </form>
      </FormStyles>
    </>
  );
};

const Main = styled.main`
  border-radius: 5px;
  padding: 10px;
  background: white;
  height: 100vh;
  h2 {
    text-align: center;
  }
`;
const Invoice = (props) => {
  const [amountDue, setAmountDue] = React.useState(0);

  return (
    <Main>
      <ReactForm
        amountDue={amountDue}
        setAmountDue={setAmountDue}
        account={props.account}
        contract={props.contract}
        distributors={props.distributors}
      />
    </Main>
  );
};

const App = (props) => {
  const [distributors, setDistributors] = useState([]);
  const getDistributors = async () => {
    let dis = await props.contract.getAlldistributors();
    setDistributors(dis);
  };
  useEffect(() => {
    getDistributors();
  }, []);

  return (
    <div>
      <Invoice
        account={props.account}
        contract={props.contract}
        distributors={distributors}
      />
    </div>
  );
};
export default App;
