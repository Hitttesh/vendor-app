// frontend/src/pages/VendorLogin.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { vendorLogin } from "../api/api";

export default function VendorLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await vendorLogin(email.trim(), password);

      // expect backend to return { vendor: {...}, ... }
      if (data && data.vendor) {
        navigate("/vendor/dashboard");
      } else {
        const msg =
          data?.detail ||
          data?.message ||
          "Invalid email or password. Please try again.";
        setError(msg);
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(err.message || "Login error, please try again.");
    } finally {
      setLoading(false);
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

          {error && (
            <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

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
            disabled={loading}
            className={`w-full px-6 py-3 rounded-lg font-semibold text-white text-lg
              bg-gradient-to-r from-[#2b7aff] to-[#1e5bff] shadow-lg
              transform transition-transform duration-200 hover:-translate-y-1
              ${loading ? "opacity-70 cursor-not-allowed" : ""}`}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
