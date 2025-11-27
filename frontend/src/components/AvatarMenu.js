// frontend/src/components/AvatarMenu.js
import React, { useEffect, useRef, useState, useCallback } from "react";

export default function AvatarMenu({ email, onLogout, onSettings }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close when clicking outside or pressing Escape
  useEffect(() => {
    function handleDoc(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    }
    function handleKey(e) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handleDoc);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleDoc);
      document.removeEventListener("keydown", handleKey);
    };
  }, []);

  const initials = (email || "").trim().charAt(0).toUpperCase() || "U";

  const handleToggle = useCallback(() => setOpen(v => !v), []);
  const handleSettings = useCallback(() => {
    setOpen(false);
    if (typeof onSettings === "function") onSettings();
  }, [onSettings]);
  const handleLogout = useCallback(() => {
    setOpen(false);
    if (typeof onLogout === "function") onLogout();
  }, [onLogout]);

  return (
    <div ref={ref} className="relative inline-block">
      <div className="flex items-center gap-3">
        <div className="text-gray-800 font-semibold truncate max-w-[180px]">{email}</div>

        <button
          type="button"
          aria-label="Open user menu"
          aria-expanded={open}
          onClick={handleToggle}
          className="w-9 h-9 rounded-full bg-gray-100 border-0 shadow-sm flex items-center justify-center text-gray-800 font-medium hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400"
        >
          <span className="select-none">{initials}</span>
        </button>
      </div>

      {/* Menu */}
      <div
        className={`absolute right-0 mt-2 z-50 w-44 transform origin-top-right transition-all duration-150
          ${open ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none"}`}
        role="menu"
        aria-hidden={!open}
      >
        <div className="bg-white rounded-md shadow-lg ring-1 ring-black/5 py-1">
          <button
            type="button"
            onClick={handleSettings}
            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 focus:bg-gray-50"
            role="menuitem"
          >
            Settings
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 focus:bg-gray-50"
            role="menuitem"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
