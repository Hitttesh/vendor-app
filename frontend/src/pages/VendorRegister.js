// frontend/src/pages/VendorRegister.js
import React, { useState } from "react";
import { vendorRegister } from "../api/api";
import { useNavigate } from "react-router-dom";

export default function VendorRegister() {
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  async function onSubmit(e) {
    e.preventDefault();
    if (!companyName || !email || !password) {
      alert("Please fill all fields");
      return;
    }
    try {
      const res = await vendorRegister(companyName, email, password);
        if (res.ok) {
            alert("Registered successfully. Now login.");
            navigate("/vendor/login");
        } else {
            alert("Registration failed: " + JSON.stringify(res.body) + " (status " + res.status + ")");
        }
    } catch (err) {
      console.error(err);
      alert("Request error - check console");
    }
  }

  return (
    <div style={{ maxWidth: 480, margin: "40px auto", background: "#fff", padding: 20, borderRadius: 6 }}>
      <h2>Vendor Register</h2>
      <form onSubmit={onSubmit}>
        <div style={{ marginBottom: 8 }}>
          <input
            placeholder="Company Name"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
          />
        </div>
        <div style={{ marginBottom: 8 }}>
          <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div style={{ marginBottom: 8 }}>
          <input
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div style={{ marginTop: 10 }}>
          <button type="submit">Register</button>
          <button type="button" onClick={() => navigate("/vendor/login")} style={{ marginLeft: 8 }}>
            Back to Login
          </button>
        </div>
      </form>
    </div>
  );
}