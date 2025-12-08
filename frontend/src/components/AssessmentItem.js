// vendor/frontend/src/components/AssessmentItem.js
import React from "react";
import { useNavigate } from "react-router-dom";

export default function AssessmentItem({ assessment }) {
  const navigate = useNavigate();

  const experience = assessment?.work_experience || "-";

  const requiredCandidates =
    typeof assessment?.required_candidates === "number"
      ? assessment.required_candidates
      : "-";

  const addedCount =
    typeof assessment?.candidates_count === "number"
      ? assessment.candidates_count
      : Array.isArray(assessment?.candidates)
      ? assessment.candidates.length
      : 0;

  const handleClick = () => {
    if (!assessment?.assessment_id) {
      console.warn("Missing assessment_id on assessment:", assessment);
      return;
    }
    navigate(`/vendor/assessment/${assessment.assessment_id}`);
  };

  return (
    <div
      role="button"
      onClick={handleClick}
      className="p-4 bg-white border border-gray-200 rounded-md cursor-pointer transition transform hover:-translate-y-1 hover:shadow-md"
    >
      <div className="text-base font-semibold text-gray-900">
        {assessment.title}
      </div>

      <div className="mt-1 text-sm text-gray-600 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 whitespace-nowrap">
          <span className="text-gray-500">Experience:</span>
          <span className="text-gray-800">{experience}</span>
        </div>

        <span className="text-gray-300">|</span>

        <div className="flex items-center gap-2 whitespace-nowrap">
          <span className="text-gray-500">Candidates Required:</span>
          <span className="text-gray-800">{requiredCandidates}</span>
        </div>

        <span className="text-gray-300">|</span>

        <div className="flex items-center gap-2 whitespace-nowrap">
          <span className="text-gray-500">Added:</span>
          <span className="text-gray-800">{addedCount}</span>
        </div>
      </div>
    </div>
  );
}
