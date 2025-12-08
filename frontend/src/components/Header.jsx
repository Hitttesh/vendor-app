// frontend/src/components/Header.jsx
import React, { useState, useRef, useEffect } from "react";
import { vendorLogout } from "../api/api";

export default function Header({
  companyName,
  email,
  onSettings = () => {},
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleLogout() {
    try {
      await vendorLogout();
    } catch (err) {
      console.warn("Logout error:", err);
    } finally {
      window.location.href = "/vendor/login";
    }
  }

  const initial = String((email || "U").charAt(0)).toUpperCase();

  return (
    <header className="bg-white text-gray-900 px-7 py-4 flex items-center justify-between shadow-md">
      {/* Brand / Company */}
      <div>
        <h1 className="text-xl font-bold tracking-wide">
          {companyName || "Vendor"}
        </h1>
      </div>

      {/* User Section + Dropdown */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 bg-transparent border-none cursor-pointer"
        >
          <span className="text-sm text-right truncate max-w-[180px]">
            {email}
          </span>

          {/* Avatar */}
          <div className="w-9 h-9 rounded-full bg-indigo-100 text-gray-900 flex items-center justify-center font-bold text-sm shadow">
            {initial}
          </div>
        </button>

        {open && (
          <div className="absolute right-0 mt-2 bg-white text-gray-900 rounded-md shadow-lg min-w-[180px] z-50 overflow-hidden border border-gray-100 animate-fadeIn">
            <button
              onClick={() => {
                setOpen(false);
                onSettings();
              }}
              className="w-full px-4 py-2 text-sm text-left hover:bg-gray-100 transition"
            >
              Settings
            </button>

            <button
              onClick={() => {
                setOpen(false);
                handleLogout();
              }}
              className="w-full px-4 py-2 text-sm text-left hover:bg-red-50 text-red-600 font-medium transition"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
