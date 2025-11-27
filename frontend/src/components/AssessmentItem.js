// vendor/frontend/src/components/AssessmentItem.js
import React from "react";
import { useNavigate } from "react-router-dom";

export default function AssessmentItem({ assessment }) {
  const navigate = useNavigate();

  // minimal, resilient field normalization (kept inline)
  const experience =
    assessment?.experience ||
    "-";
  const requiredCandidates =
    assessment?.required_candidates ??
    "-";

  const addedCount = Array.isArray(assessment?.candidates)
    ? assessment.candidates.length
    : typeof assessment?.candidates === "number"
    ? assessment.candidates
    : assessment?.added ?? assessment?.added_count ?? 0;

  return (
    <div
      role="button"
      onClick={() =>
        navigate(`/vendor/assessment/${assessment.id ?? assessment.assessment_id}`)
      }
      className="p-4 bg-white border border-gray-200 rounded-md cursor-pointer transition transform hover:-translate-y-1 hover:shadow-md"
    >
      <div className="text-base font-semibold text-gray-900">{assessment.title}</div>

      <div className="mt-1 text-sm text-gray-600 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 whitespace-nowrap">
          <span className="text-gray-500">Experience:</span>
          <span className="text-gray-800">{String(experience)}</span>
        </div>

        <span className="text-gray-300">|</span>

        <div className="flex items-center gap-2 whitespace-nowrap">
          <span className="text-gray-500">Candidates Required:</span>
          <span className="text-gray-800">{requiredCandidates ?? "-"}</span>
        </div>

        <span className="text-gray-300">|</span>

        <div className="flex items-center gap-2 whitespace-nowrap">
          <span className="text-gray-500">Added:</span>
          <span className="text-gray-800">{addedCount ?? 0}</span>
        </div>
      </div>
    </div>
  );
}
