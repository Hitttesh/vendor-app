// frontend/src/components/CandidateModal.js
import React from "react";

export default function CandidateModal({ candidate, onClose }) {
  if (!candidate) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/30 z-[9999] p-4">
      
      {/* Modal Card */}
      <div className="bg-white w-full max-w-[420px] rounded-lg shadow-2xl p-5 space-y-3 animate-fadeIn">

        {/* Candidate Name */}
        <h2 className="text-xl font-semibold text-gray-900 border-b border-gray-100 pb-2">
          {candidate.name}
        </h2>

        {/* Email */}
        <div className="text-sm text-gray-600">
          <span className="font-medium text-gray-700">Email:</span> {candidate.email}
        </div>

        {/* Phone (optional) */}
        {candidate.phone && (
          <div className="text-sm text-gray-600">
            <span className="font-medium text-gray-700">Phone:</span> {candidate.phone}
          </div>
        )}

        {/* Resume Link (optional) */}
        {candidate.resume_path && (
          <div className="text-sm text-gray-600">
            <span className="font-medium text-gray-700">Resume:</span>{" "}
            <a
              href={candidate.resume_path}
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 hover:underline font-semibold transition-all"
            >
              Download Resume
            </a>
          </div>
        )}

        {/* Close Button */}
        <div className="pt-3 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-all shadow"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
