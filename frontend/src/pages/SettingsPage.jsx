// frontend/src/pages/SettingsPage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import { changeVendorPassword, getVendorDashboard } from "../api/api";

export default function SettingsPage() {
  const navigate = useNavigate();

  const [oldPwd, setOldPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");

  const [loading, setLoading] = useState(false);
  const [vendor, setVendor] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const loadVendor = async () => {
      try {
        const data = await getVendorDashboard(); // plain JSON: { vendor, assessments }
        if (data?.vendor) {
          setVendor(data.vendor);
        } else {
          // no vendor session → send to login
          navigate("/vendor/login");
        }
      } catch (e) {
        console.warn("Failed to load vendor in settings:", e);
      }
    };

    loadVendor();
  }, [navigate]);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!oldPwd || !newPwd) {
      setError("Enter both current and new password.");
      return;
    }

    if (newPwd !== confirmPwd) {
      setError("New password and confirmation do not match.");
      return;
    }

    setLoading(true);
    try {
      // new api.js: changeVendorPassword throws on error, returns JSON on success
      await changeVendorPassword(oldPwd, newPwd);

      setSuccess("Password updated successfully.");
      setOldPwd("");
      setNewPwd("");
      setConfirmPwd("");

      // Optional: navigate back after success
      // setTimeout(() => navigate("/vendor/dashboard"), 1000);
    } catch (err) {
      console.error("Password change failed:", err);
      setError(err.message || "Failed to update password. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a1122] to-[#0d1b3d]">
      <Header
        companyName={vendor?.company_name}
        email={vendor?.email}
        onCreateAssessment={() => navigate("/vendor/dashboard")}
        onSettings={() => {}}
      />

      {/* Settings Title in Left Corner */}
      <div className="px-6 pt-4">
        <h1 className="text-xl font-semibold text-white tracking-wide">
          Settings
        </h1>
      </div>

      {/* Center Password Card */}
      <div className="flex items-center justify-center pt-12 px-4">
        <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-6">
          <h2 className="text-2xl font-bold text-[#0a1122] text-center mb-6">
            Change Password
          </h2>

          {error && (
            <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
              {success}
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            <input
              type="password"
              placeholder="Current password"
              value={oldPwd}
              onChange={(e) => setOldPwd(e.target.value)}
              required
              className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none
              focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400"
            />

            <input
              type="password"
              placeholder="New password"
              value={newPwd}
              onChange={(e) => setNewPwd(e.target.value)}
              required
              className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none
              focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400"
            />

            <input
              type="password"
              placeholder="Confirm new password"
              value={confirmPwd}
              onChange={(e) => setConfirmPwd(e.target.value)}
              required
              className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none
              focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400"
            />

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium
                hover:bg-blue-700 transition disabled:opacity-60"
              >
                {loading ? "Saving..." : "Save"}
              </button>

              <button
                type="button"
                onClick={() => navigate("/vendor/dashboard")}
                disabled={loading}
                className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-medium
                hover:bg-gray-200 transition disabled:opacity-60"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
