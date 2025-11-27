// vendor/frontend/src/pages/VendorDashboard.js

import React, { useEffect, useState, useRef } from "react";
import AssessmentItem from "../components/AssessmentItem";
import CandidateList from "../components/CandidateList";
import CandidateModal from "../components/CandidateModal";
import Header from "../components/Header";
import { getVendorDashboard, addCandidateToAssessment } from "../api/api";
import { storage, fbRef, uploadBytesResumable, getDownloadURL } from "../firebase";
import { useNavigate } from "react-router-dom";

export default function VendorDashboard() {
  const navigate = useNavigate();
  const [vendor, setVendor] = useState(null);
  const [assessments, setAssessments] = useState([]);
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [showAddCandidateModal, setShowAddCandidateModal] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await getVendorDashboard();
        if (data?.vendor) {
          setVendor(data.vendor);

          const formatted = (data.assessments || []).map((a) => {
            const skills = a.skills ?? a.skill_tags ?? a.skills_text ?? "";
            const duration = a.duration ?? a.time_limit ?? 0;
            const experience = a.experience ?? a.work_experience ?? a.min_experience ?? "";

            const candList = (a.candidates || []).map((c) => ({
              ...c,
              id: String(c.id ?? c.candidate_uuid ?? c.candidate_id ?? ""),
              candidate_uuid: c.candidate_uuid ? String(c.candidate_uuid) : c.candidate_uuid || c.id || null,
              resume_url: c.resume_url ?? c.resume_path ?? c.resume ?? null,
              phone: c.phone ?? c.contact ?? null,
              email: c.email ?? c.contact_email ?? null,
              status: c.status ?? "invited",
            }));

            return {
              ...a,
              id: String(a.id ?? a.assessment_id ?? a.assessmentId ?? ""),
              assessment_id: a.assessment_id ?? a.id ?? null,
              skills,
              duration,
              experience,
              candidates: candList,
            };
          });

          setAssessments(formatted);
        } else {
          window.location.href = "/vendor/login";
        }
      } catch (err) {
        console.error("Failed to load vendor dashboard", err);
      }
    })();
  }, []);

  const handleCandidateAdded = (candidate, updatedCandidates, assessmentId) => {
    const targetId = assessmentId || selectedAssessment?.id;

    const normCandidates = (updatedCandidates || []).map((c) => ({
      ...c,
      id: String(c.id ?? c.candidate_uuid ?? ""),
      candidate_uuid: c.candidate_uuid ? String(c.candidate_uuid) : c.candidate_uuid || c.id || null,
      resume_url: c.resume_url ?? c.resume_path ?? c.resume ?? null,
      phone: c.phone ?? c.contact ?? null,
      email: c.email ?? c.contact_email ?? null,
    }));

    setAssessments((prev) => prev.map((a) => (String(a.id) === String(targetId) ? { ...a, candidates: normCandidates } : a)));

    setSelectedAssessment((prev) =>
      prev && String(prev.id) === String(targetId) ? { ...prev, candidates: normCandidates } : prev
    );

    setShowAddCandidateModal(false);
  };

  if (!vendor) return <div className="text-center p-10">Loading...</div>;

  return (
    <div className="min-h-screen bg-white">
      <Header
        companyName={vendor.company_name}
        email={vendor.email}
        onNavigate={(tab) => {
          if (tab === "Candidates") navigate("/vendor/candidates");
        }}
        onSettings={() => navigate("/vendor/settings")}
      />

      <main className="max-w-5xl mx-auto mt-6 p-4">
        <h2 className="text-xl font-semibold">Assessments</h2>

        <div className="mt-4 space-y-4">
          {assessments.length === 0 ? (
            <div>No assessments available.</div>
          ) : (
            assessments.map((a) => (
              <AssessmentItem key={a.id} assessment={a} onClick={() => setSelectedAssessment(a)} />
            ))
          )}
        </div>
      </main>

      {selectedAssessment && (
        <AssessmentDetailsModal
          assessment={selectedAssessment}
          onClose={() => setSelectedAssessment(null)}
          onAddCandidate={() => setShowAddCandidateModal(true)}
          onCandidateClick={(c) => setSelectedCandidate(c)}
        />
      )}

      <CandidateModal candidate={selectedCandidate} onClose={() => setSelectedCandidate(null)} />

      {showAddCandidateModal && selectedAssessment && (
        <AddCandidateModal
          assessment={selectedAssessment}
          onClose={() => setShowAddCandidateModal(false)}
          onAdded={(candidate, updated) => handleCandidateAdded(candidate, updated, selectedAssessment.id)}
        />
      )}
    </div>
  );
}

function AssessmentDetailsModal({ assessment, onClose, onAddCandidate, onCandidateClick }) {
  const backdropRef = useRef(null);

  return (
    <div
      ref={backdropRef}
      onMouseDown={(e) => e.target === backdropRef.current && onClose()}
      className="fixed inset-0 bg-black/40 flex justify-center pt-12 z-50"
    >
      <div
        onMouseDown={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-2xl rounded-xl shadow-xl p-6"
      >
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">{assessment.title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-black">Close</button>
        </div>

        <p className="text-gray-600 mt-2">{assessment.description || "No description provided."}</p>

        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <div><strong>Duration:</strong> {assessment.duration}</div>
          <div><strong>Experience:</strong> {assessment.experience || "-"}</div>
          <div><strong>Skills:</strong> {Array.isArray(assessment.skills) ? assessment.skills.join(", ") : assessment.skills || "-"}</div>
        </div>

        <div className="mt-6">
          <div className="flex justify-between items-center">
            <h4 className="font-semibold">Candidates</h4>
            <button onClick={onAddCandidate} className="px-3 py-1 bg-blue-600 text-white rounded">Add Candidate</button>
          </div>

          <CandidateList candidates={assessment.candidates} onCandidateClick={onCandidateClick} />
        </div>
      </div>
    </div>
  );
}

function AddCandidateModal({ assessment, onClose, onAdded }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
      <div className="bg-white w-full max-w-lg rounded-xl p-6 shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Add Candidate to "{assessment.title}"</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-black">✕</button>
        </div>

        <AddCandidateFormInline assessment={assessment} onAdded={onAdded} onClose={onClose} />
      </div>
    </div>
  );
}

function AddCandidateFormInline({ assessment, onAdded, onClose }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [resumeFile, setResumeFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  async function uploadFile(file) {
    if (!file) return null;
    const uid = Math.random().toString(36).slice(2, 9);
    const fileName = `${uid}_${file.name}`;
    const path = `resumes/${assessment.id}/${fileName}`;

    const fbStorageRef = fbRef(storage, path);
    const task = uploadBytesResumable(fbStorageRef, file);

    return new Promise((resolve, reject) => {
      task.on(
        "state_changed",
        (snap) => setProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
        reject,
        async () => resolve(await getDownloadURL(task.snapshot.ref))
      );
    });
  }

  async function submit(e) {
    e.preventDefault();
    setLoading(true);

    try {
      const resume_url = resumeFile ? await uploadFile(resumeFile) : null;
      const res = await addCandidateToAssessment(assessment.id, name, email, phone, resume_url);

      let body = res.body ?? res.data ?? res;
      const candidate = body?.candidate ?? body?.data?.candidate ?? null;

      const updatedCandidatesRaw =
        body?.assessment?.candidates || body?.data?.assessment?.candidates || body?.candidates || [];

      const updatedCandidates = updatedCandidatesRaw.map((c) => ({
        ...c,
        id: String(c.id ?? c.candidate_uuid ?? ""),
        candidate_uuid: c.candidate_uuid ? String(c.candidate_uuid) : c.candidate_uuid || c.id || null,
        resume_url: c.resume_url ?? c.resume_path ?? null,
        phone: c.phone ?? c.contact ?? null,
        email: c.email ?? c.contact_email ?? null,
      }));

      onAdded(candidate, updatedCandidates);

      setName("");
      setEmail("");
      setPhone("");
      setResumeFile(null);
      setProgress(0);
    } catch (err) {
      alert("Failed to add candidate. Check console.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-3">
      <input className="border p-2 rounded" placeholder="Full Name" value={name} required onChange={(e) => setName(e.target.value)} />
      <input className="border p-2 rounded" placeholder="Email" value={email} required onChange={(e) => setEmail(e.target.value)} />
      <input className="border p-2 rounded" placeholder="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} />

      <input type="file" accept=".pdf,.doc,.docx" onChange={(e) => setResumeFile(e.target.files[0])} />

      {resumeFile && <div>Upload Progress: {progress}%</div>}

      <div className="flex gap-3 mt-2">
        <button type="submit" disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded">
          {loading ? "Adding..." : "Add"}
        </button>
        <button type="button" onClick={onClose} className="px-4 py-2 border rounded">Cancel</button>
      </div>
    </form>
  );
}