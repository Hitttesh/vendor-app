// vendor/frontend/src/components/CandidateItem.jsx
import React, { useState, useMemo } from "react";
import { updateCandidateStatus as apiUpdateStatus } from "../api/api";

export default function CandidateItem({ candidate = {}, assessmentId, onStatusUpdated }) {
  const [loading, setLoading] = useState(false);

  /* ---------- Normalize Status ---------- */
  const rawStatus = String(candidate.status || "invited").toLowerCase();
  const status = rawStatus === "interviewed" ? "interview" : rawStatus;

  /* ---------- Stepper Logic ---------- */
  const currentIndex = useMemo(() => {
    if (status === "interview") return 1;
    if (status === "shortlisted" || status === "rejected") return 2;
    return 0;
  }, [status]);

  const finalLabel = useMemo(() => {
    if (status === "shortlisted") return "Shortlisted";
    if (status === "rejected") return "Rejected";
    return "Feedback";
  }, [status]);

  const candidateId = candidate.candidate_uuid || candidate.id;
  const initial = String((candidate.name || "U").charAt(0)).toUpperCase();

  const activeWidthPercent = `${currentIndex * 33.3333333}%`;

  /* ---------- API Status Update (kept logic, cleaned format) ---------- */
  async function changeStatus(newStatus) {
    if (!assessmentId) {
      console.warn("Missing assessment ID");
      return;
    }

    setLoading(true);
    try {
      const res = await apiUpdateStatus(assessmentId, candidateId, { status: newStatus });
      const body = res?.body ?? res?.data ?? res;

      if (!(res && (res.ok || (res.status >= 200 && res.status < 300)))) {
        throw new Error(body?.detail || JSON.stringify(body));
      }

      if (typeof onStatusUpdated === "function") onStatusUpdated();

    } catch (err) {
      console.error("Status update failed", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-[520px] bg-white border border-gray-100 rounded-md shadow-sm p-4 flex flex-col gap-3">

      {/* ---------- Header Row ---------- */}
      <div className="flex items-start justify-between">

        {/* Avatar + Candidate Meta */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-gray-100 text-gray-900 flex items-center justify-center font-bold text-sm">
            {initial}
          </div>

          <div className="flex flex-col min-w-0 truncate">
            <p className="text-sm font-semibold">{candidate.name || "Unknown User"}</p>
            <p className="text-[13px] text-gray-600 truncate">
              {candidate.email}
              {candidate.phone && <span className="text-gray-500 text-[12px] ml-1">• {candidate.phone}</span>}
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <span
          className={`px-3 py-1 text-sm font-semibold rounded-full capitalize ${
            status === "rejected" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700"
          }`}
        >
          {status}
        </span>
      </div>

      {/* ---------- Resume Row ---------- */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <p className="text-[12px] text-gray-500">Resume</p>
          {candidate.resume_path ? (
            <a
              href={candidate.resume_path}
              target="_blank"
              rel="noreferrer"
              className="text-green-600 text-[13px] font-semibold hover:underline"
            >
              View Resume
            </a>
          ) : (
            <p className="text-[13px] text-gray-500">No resume available</p>
          )}
        </div>
      </div>

      {/* ---------- Stepper UI ---------- */}
      <div className="flex flex-col gap-2">

        <div className="relative w-full py-4">
          {/* Inactive Line */}
          <div className="absolute top-1/2 -translate-y-1/2 h-[6px] bg-gray-200 rounded-full left-[16.66%] right-[16.66%] z-10" />

          {/* Active Overlay */}
          <div
            className="absolute top-1/2 -translate-y-1/2 h-[6px] bg-green-600 rounded-full left-[16.66%] z-20 transition-all"
            style={{ width: activeWidthPercent, transition: "width 220ms ease" }}
          />

          {/* Step Dots */}
          <div className="relative z-30 flex w-full">
            {[0, 1, 2].map(idx => {
              const active = currentIndex >= idx;
              return (
                <div key={idx} className="w-1/3 flex justify-center">
                  <div
                    className={`w-[14px] h-[14px] rounded-full border-[3px] transition-all ${
                      active ? "bg-green-600 border-green-600 shadow-[0_0_0_6px_rgba(22,163,74,0.06)]"
                             : "bg-white border-gray-200"
                    }`}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Labels */}
        <div className="flex justify-between px-1">
          <p className={`flex-1 text-center text-[13px] ${currentIndex >= 0 ? "text-gray-900 font-bold" : "text-gray-400"}`}>Invited</p>
          <p className={`flex-1 text-center text-[13px] ${currentIndex >= 1 ? "text-gray-900 font-bold" : "text-gray-400"}`}>Interview</p>
          <p className={`flex-1 text-center text-[13px] ${currentIndex >= 2 ? "text-gray-900 font-bold" : "text-gray-400"}`}>{finalLabel}</p>
        </div>

      </div>

      {/* Optional: show loading indicator */}
      {loading && (
        <div className="text-center text-sm text-gray-500 animate-pulse">
          Updating status...
        </div>
      )}

    </div>
  );
}
