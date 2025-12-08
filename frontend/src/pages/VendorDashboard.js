// vendor/frontend/src/pages/VendorDashboard.js

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AssessmentItem from "../components/AssessmentItem";
import Header from "../components/Header";
import { getVendorDashboard } from "../api/api";

export default function VendorDashboard() {
  const navigate = useNavigate();

  const [vendor, setVendor] = useState(null);
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await getVendorDashboard(); // plain JSON: { vendor, assessments }

        if (!data || !data.vendor) {
          // no vendor in session – send to login
          window.location.href = "/vendor/login";
          return;
        }

        setVendor(data.vendor);

        const formatted = (data.assessments || []).map((a) => {
          const skills = a.skills || "";
          const duration = typeof a.duration === "number" ? a.duration : 0;
          const work_experience = a.work_experience || "";
          const required_candidates =
            typeof a.required_candidates === "number"
              ? a.required_candidates
              : 0;

          const candidates_count =
            typeof a.candidates_count === "number"
              ? a.candidates_count
              : Array.isArray(a.candidates)
              ? a.candidates.length
              : 0;

          const assessment_id = a.assessment_id;
          const id = assessment_id || a.id;

          return {
            ...a,
            id,
            assessment_id,
            skills,
            duration,
            work_experience,
            required_candidates,
            candidates_count,
          };
        });

        setAssessments(formatted);
      } catch (err) {
        console.error("Failed to load vendor dashboard", err);
        setError("Failed to load dashboard. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading) {
    return <div className="text-center p-10">Loading...</div>;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 rounded bg-blue-600 text-white"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!vendor) {
    return <div className="text-center p-10">Redirecting...</div>;
  }

  return (
    <div className="min-h-screen bg-white">
      <Header
        companyName={vendor.company_name}
        email={vendor.email}
        onSettings={() => navigate("/vendor/settings")}
      />

      <main className="max-w-5xl mx-auto mt-6 p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Assessments</h2>
          {/* (Optional) Add new assessment button in future */}
        </div>

        <div className="mt-4 space-y-4">
          {assessments.length === 0 ? (
            <div className="text-gray-500">No assessments available.</div>
          ) : (
            assessments.map((a) => (
              <AssessmentItem
                key={a.id}
                assessment={a}
                onClick={() =>
                  navigate(`/vendor/assessment/${a.assessment_id}`)
                }
              />
            ))
          )}
        </div>
      </main>
    </div>
  );
}
