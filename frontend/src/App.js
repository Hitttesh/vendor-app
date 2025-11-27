// frontend/src/App.js
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import VendorLogin from "./pages/VendorLogin";
import AssessmentPage from "./pages/AssessmentPage";
import VendorDashboard from "./pages/VendorDashboard";
import VendorRegister from "./pages/VendorRegister";
import SettingsPage from "./pages/SettingsPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/vendor/login" element={<VendorLogin />} />
        <Route path="/vendor/register" element={<VendorRegister />} />
        <Route path="/vendor/assessment/:id" element={<AssessmentPage />} />
        <Route path="/vendor/dashboard" element={<VendorDashboard />} />
        <Route path="/vendor/assessment/:id" element={<AssessmentPage />} />
        <Route path="/vendor/settings" element={<SettingsPage />} />
        <Route path="*" element={<VendorLogin />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;