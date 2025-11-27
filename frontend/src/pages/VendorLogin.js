// frontend/src/pages/VendorLogin.js
import React, { useState } from "react";
import { vendorLogin } from "../api/api";
import { useNavigate } from "react-router-dom";

export default function VendorLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  async function onSubmit(e) {
    e.preventDefault();
    try {
      const data = await vendorLogin(email, password);
      if (data?.vendor) {
        navigate("/vendor/dashboard");
      } else {
        alert("Login failed: " + (data?.detail || "Unknown error"));
      }
    } catch (err) {
      console.error(err);
      alert("Login error, check console");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#0f2546] to-[#08213b] p-4">
      <div className="relative z-10 w-full max-w-md">
        <form
          onSubmit={onSubmit}
          className="bg-white/95 backdrop-blur-md rounded-xl shadow-2xl px-6 py-8 md:px-8 md:py-9"
        >
          <h1 className="text-2xl md:text-3xl font-semibold text-[#071029] mb-6 text-center">
             Sign In
          </h1>

          {/* Email */}
          <div className="mb-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-3 text-base placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-200 transition-shadow"
            />
          </div>

          {/* Password */}
          <div className="mb-6">
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-3 text-base placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-200 transition-shadow"
            />
          </div>

          {/* Button */}
          <button
            type="submit"
            className="w-full px-6 py-3 rounded-lg font-semibold text-white text-lg
            bg-gradient-to-r from-[#2b7aff] to-[#1e5bff] shadow-lg
            transform transition-transform duration-200 hover:-translate-y-1"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}
