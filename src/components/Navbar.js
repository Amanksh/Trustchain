import React from "react";
import { Link, useLocation } from "react-router-dom";
import "../css/Navbar.css";

const Navbar = ({ account }) => {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/" className="brand-link">
          <span className="brand-icon">🔍</span>
          TrustChain
        </Link>
      </div>

      <div className="navbar-links">
        <Link to="/" className={`nav-link ${isActive("/") ? "active" : ""}`}>
          Home
        </Link>
        <Link
          to="/vendor"
          className={`nav-link ${isActive("/vendor") ? "active" : ""}`}
        >
          Vendor
        </Link>
        <Link
          to="/distributorform"
          className={`nav-link ${isActive("/distributorform") ? "active" : ""}`}
        >
          Distributor
        </Link>
        <Link
          to="/authenticate"
          className={`nav-link ${isActive("/authenticate") ? "active" : ""}`}
        >
          Authenticate
        </Link>
      </div>

      <div className="navbar-wallet">
        <span className="wallet-icon">👛</span>
        <span className="wallet-address">
          {account
            ? `${account.substring(0, 4)}...${account.substring(
                account.length - 4
              )}`
            : "Not Connected"}
        </span>
      </div>
    </nav>
  );
};

export default Navbar;
