// frontend/src/components/CandidateList.js
import React, { useState } from "react";
import CandidateItem from "./CandidateItem";

export default function CandidateList({
  candidates = [],
  onCandidateClick,
  onAdd = () => {},
  onRefresh = () => {},
  requiredCount = null,
}) {
  const [expanded, setExpanded] = useState(false);
  const [hoverAddBtn, setHoverAddBtn] = useState(false);

  const addedCount = Array.isArray(candidates) ? candidates.length : 0;
  const required = requiredCount ?? null;

  return (
    <div className="flex flex-col gap-3">

      {/* ---------- CONTROL CARD (TOGGLE EXPAND) ---------- */}
      <div
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        onClick={() => setExpanded(e => !e)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setExpanded(prev => !prev);
          }
        }}
        className={`bg-white rounded-lg border border-gray-200 p-3 flex items-center justify-between cursor-pointer transition-all shadow-sm hover:shadow-md ${
          expanded ? "shadow-[0_6px_18px_rgba(0,0,0,0.06)]" : "shadow-[0_1px_0_rgba(0,0,0,0.02)]"
        }`}
      >
        {/* Left Section */}
        <div className="flex items-center gap-3 min-w-0">
          <h3 className="text-base font-semibold text-gray-900">Candidates</h3>

          <p className="text-[13px] text-gray-500 truncate">
            {required !== null ? (
              <>
                <span className="font-semibold text-gray-700">Required:</span> {required}
                <span className="mx-2 text-gray-400">•</span>
                <span className="font-semibold text-gray-700">Added:</span> {addedCount}
              </>
            ) : (
              <>
                <span className="font-semibold text-gray-700">Added:</span> {addedCount}
              </>
            )}
          </p>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onAdd();
          }}
          onMouseEnter={() => setHoverAddBtn(true)}
          onMouseLeave={() => setHoverAddBtn(false)}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-blue-600 text-white font-semibold shadow-sm hover:bg-blue-700 active:bg-blue-800 transition"
            >
          Add Candidate
        </button>

      </div>


      {/* ---------- COLLAPSED MESSAGE ---------- */}
      {!expanded ? (
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-sm text-gray-500 shadow-sm">
          Candidates hidden. Click the card above to show.
        </div>
      ) : (

        /* ---------- EXPANDED GRID SECTION ---------- */
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          {candidates.length === 0 ? (
            <p className="text-center text-sm text-gray-500">No candidates yet.</p>
          ) : (
            <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
              {candidates.map((c) => (
                <div key={c.candidate_uuid ?? c.id} className="flex justify-center">
                  <CandidateItem
                    candidate={c}
                    assessmentId={c.assessment_id ?? null}
                    onStatusUpdated={onRefresh}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
