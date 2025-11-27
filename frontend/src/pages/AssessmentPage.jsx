// frontend/src/pages/AssessmentPage.jsx
import React, { useEffect, useState, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";
import Header from "../components/Header";
import CandidateList from "../components/CandidateList";
import AddCandidateInline from "../components/AddCandidateModal";
import { getAssessment, getVendorDashboard } from "../api/api";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function AssessmentPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  // -------------------- state --------------------
  const [vendor, setVendor] = useState(null);
  const [assessment, setAssessment] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [error, setError] = useState(null);
  const [backHover, setBackHover] = useState(false);

  const candidatesRef = useRef(null);

  // -------------------- fetch data --------------------
  useEffect(() => {
    (async () => {
      await fetchVendor();
      await fetchAssessment();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function fetchVendor() {
    try {
      const res = await getVendorDashboard();
      const body = res?.body ?? res?.data ?? res;
      setVendor(body?.vendor ?? body ?? null);
    } catch (err) {
      console.warn("Failed to load vendor", err);
    }
  }

  async function fetchAssessment() {
    setLoading(true);
    setError(null);

    try {
      const res = await getAssessment(id);
      const body = res?.body ?? res?.data ?? res;
      const a = body?.assessment ?? body;
      const c = a?.candidates ?? body?.candidates ?? [];

      setAssessment(a ?? null);
      setCandidates(Array.isArray(c) ? c : []);
    } catch (err) {
      console.error("Failed to load assessment", err);
      setError("Server error.");
    } finally {
      setLoading(false);
    }
  }

  // -------------------- handlers --------------------
  function onAddedCandidate(candidate, updatedList) {
    if (Array.isArray(updatedList)) {
      setCandidates(updatedList);
    } else if (candidate) {
      setCandidates((prev) => [...prev, candidate]);
    }

    setShowAdd(false);
  }

  function scrollToLowerAddButton() {
    setTimeout(() => {
      try {
        const container = candidatesRef.current;
        if (!container) return;

        const btns = Array.from(container.querySelectorAll("button"));
        const match = btns.find((b) =>
          (b.textContent || "")
            .trim()
            .toLowerCase()
            .includes("add candidate")
        );

        if (match) {
          match.scrollIntoView({ behavior: "smooth", block: "center" });
          try {
            match.focus({ preventScroll: true });
          } catch (_) {}
          return;
        }

        const alt = container.querySelector(
          '[data-role="add-candidate"], .add-candidate-btn, #add-candidate'
        );

        if (alt) {
          alt.scrollIntoView({ behavior: "smooth", block: "center" });
          try {
            alt.focus({ preventScroll: true });
          } catch (_) {}
          return;
        }

        container.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      } catch (err) {
        console.error("scrollToLowerAddButton error:", err);
        candidatesRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }, 50);
  }

  function openAddInlineAndScroll() {
    setShowAdd(true);
    setTimeout(() => {
      candidatesRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 60);
  }

  // -------------------- computed --------------------
  const skills =
    assessment?.skills ||
    assessment?.skill_tags ||
    assessment?.skills_text ||
    "";

  const experience =
    assessment?.experience ||
    assessment?.work_experience ||
    assessment?.min_experience ||
    "";

  const requiredCandidates =
    assessment?.required_candidates ??
    assessment?.required ??
    assessment?.positions ??
    assessment?.num_positions ??
    assessment?.required_count ??
    null;

  const preparedDescription = useMemo(() => {
    let d = assessment?.description ?? "";
    if (!d) return "";

    d = d.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

    const hasExplicitList =
      /^[\s]*[-*+•]\s+/m.test(d) || /^\s*\d+\.\s+/m.test(d);

    return hasExplicitList ? d : d.trim();
  }, [assessment?.description]);

  // -------------------- loading / error --------------------
  if (loading) return <div className="p-6">Loading...</div>;
  if (!assessment) return <div className="p-6">Assessment not found</div>;

  // -------------------- UI --------------------
  return (
    <div className="min-h-screen bg-white">
      <Header
        companyName={vendor?.company_name}
        email={vendor?.email}
        onNavigate={(tab) => {
          if (tab === "Candidates") navigate("/vendor/candidates");
          if (tab === "Assessments") navigate("/vendor/dashboard");
        }}
        onSettings={() => navigate("/vendor/settings")}
      />

      <main className="px-6 mx-auto max-w-5xl">
        {/* ---------- TOP CARD ---------- */}
        <div className="mt-6 bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Back button */}
              <div className="flex items-center justify-center h-full w-12">
                <button
                  onClick={() => navigate("/vendor/dashboard")}
                  onMouseEnter={() => setBackHover(true)}
                  onMouseLeave={() => setBackHover(false)}
                  aria-label="Back to assessments"
                  className={`w-10 h-10 flex items-center justify-center rounded-full transition-all ${
                    backHover
                      ? "bg-blue-50 border border-blue-200"
                      : "bg-gray-50 border border-gray-100"
                  }`}
                >
                  <FiArrowLeft size={18} className="text-blue-600" />
                </button>
              </div>

              {/* Title + meta */}
              <div className="flex flex-col justify-center">
                <h2 className="text-lg font-semibold text-gray-900 leading-none">
                  {assessment?.title}
                </h2>

                <div className="mt-0 text-sm text-gray-600 flex items-center gap-3">
                  <span className="text-gray-500">Experience:</span>
                  <span className="text-gray-800">
                    {String(experience) || "-"}
                  </span>

                  <span className="text-gray-300">|</span>

                  <span className="text-gray-500">Candidates Required:</span>
                  <span className="text-gray-800">
                    {requiredCandidates ?? "-"}
                  </span>

                  <span className="text-gray-300">|</span>

                  <span className="text-gray-500">Added:</span>
                  <span className="text-gray-800">{candidates.length}</span>
                </div>
              </div>
            </div>

            {/* Top Add Candidate (scroll only) */}
            <button
              onClick={scrollToLowerAddButton}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-blue-600 text-white font-semibold shadow-sm hover:bg-blue-700 active:bg-blue-800 transition"
            >
              Add Candidate
            </button>
          </div>
        </div>

        {/* ---------- SKILLS + DESCRIPTION ---------- */}
        <div className="mt-8 space-y-4 text-[16px] text-gray-800">
          {/* Skills */}
          <div className="flex items-start gap-2">
            <strong className="text-gray-900 text-[16px] font-semibold">
              Skills:
            </strong>
            <span className="text-gray-700 text-[16px] leading-relaxed">
              {Array.isArray(skills) ? skills.join(", ") : skills}
            </span>
          </div>

          {/* Job Description */}
          <div>
          <strong className="text-gray-900 text-[16px] font-semibold">
            Job Description:
          </strong>
        </div>

        {/* Description Body */}
        <div className="text-gray-700 text-[16px] leading-[1.7]">
          {preparedDescription ? (
            <div className="prose prose-slate max-w-none text-[16px] leading-[1.7]">
              <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({ children }) => <h1 className="text-2xl font-bold text-gray-600">{children}</h1>,
            h2: ({ children }) => <h2 className="text-xl font-semibold text-gray-600">{children}</h2>,
            h3: ({ children }) => <h3 className="text-lg font-medium text-gray-600">{children}</h3>,
            strong: ({ children }) => <span className="font-semibold text-gray-600">{children}</span>,
          }}
        >
          {preparedDescription}
        </ReactMarkdown>
            </div>
          ) : (
            <div className="text-gray-500">No description provided.</div>
          )}
        </div>
        </div>

        {/* ---------- CANDIDATES SECTION ---------- */}
        <section ref={candidatesRef} className="mt-8">
          <CandidateList
            candidates={candidates}
            requiredCount={
              assessment?.required_candidates ??
              assessment?.requiredCandidates
            }
            onAdd={() => {
              setShowAdd(true);
              setTimeout(() => {
                candidatesRef.current?.scrollIntoView({
                  behavior: "smooth",
                  block: "center",
                });
              }, 60);
            }}
            onRefresh={fetchAssessment}
          />

          {showAdd && (
            <div className="mt-4">
              <AddCandidateInline
                assessment={{
                  id: assessment?.assessment_id ?? assessment?.id,
                  title: assessment?.title,
                }}
                onClose={() => setShowAdd(false)}
                onAdded={onAddedCandidate}
              />
            </div>
          )}
        </section>
      </main>

      {error && <div className="text-red-600 p-4">{error}</div>}
    </div>
  );
}
