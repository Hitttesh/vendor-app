// frontend/src/pages/SettingsPage.jsx
import React, { useState } from "react";
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

  React.useEffect(() => {
    (async () => {
      try {
        const res = await getVendorDashboard();
        const body = res.body || res.data || res;
        setVendor(body.vendor || body);
      } catch (e) { /* ignore */ }
    })();
  }, []);

  async function submit(e) {
    e.preventDefault();
    if (!oldPwd || !newPwd) return alert("Enter both old and new password");
    if (newPwd !== confirmPwd) return alert("New password and confirmation do not match");
    setLoading(true);
    try {
      const res = await changeVendorPassword(oldPwd, newPwd);
      if (res && res.ok) {
        alert("Password updated successfully");
        navigate("/vendor/dashboard");
      } else {
        const msg = (res && res.detail) || JSON.stringify(res) || "Failed";
        alert("Failed: " + msg);
      }
    } catch (err) {
      alert("Error: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  }

  return (
  <div className="min-h-screen bg-gradient-to-b from-[#0a1122] to-[#0d1b3d]">
    <Header
      companyName={vendor?.company_name}
      email={vendor?.email}
      onNavigate={(tab) => {
        if (tab === "Candidates") navigate("/vendor/candidates");
        else if (tab === "Assessments") navigate("/vendor/dashboard");
      }}
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

        <form onSubmit={submit} className="space-y-4">

          <input type="password" placeholder="Current password" value={oldPwd}
            onChange={(e)=>setOldPwd(e.target.value)} required
            className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none
            focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400" />

          <input type="password" placeholder="New password" value={newPwd}
            onChange={(e)=>setNewPwd(e.target.value)} required
            className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none
            focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400" />

          <input type="password" placeholder="Confirm new password" value={confirmPwd}
            onChange={(e)=>setConfirmPwd(e.target.value)} required
            className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none
            focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400" />

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium
              hover:bg-blue-700 transition disabled:opacity-60">
              {loading?"Saving...":"Save"}
            </button>

            <button type="button" onClick={()=>navigate("/vendor/dashboard")} disabled={loading}
              className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-medium
              hover:bg-gray-200 transition disabled:opacity-60">
              Cancel
            </button>
          </div>

        </form>

      </div>
    </div>
  </div>
);
}