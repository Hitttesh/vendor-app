// frontend/src/components/AddCandidateModal.jsx

import React, { useState } from "react";
import { AiOutlineClose } from "react-icons/ai";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { addCandidateToAssessment } from "../api/api";
import { storage, fbRef, uploadBytesResumable, getDownloadURL } from "../firebase";

// --- SIZE LIMITS ---
const MIN_BYTES = 50 * 1024;       // 50KB
const MAX_BYTES = 2 * 1024 * 1024; // 2MB

function formatBytes(bytes) {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
}

export default function AddCandidateInline({ assessment, onClose, onAdded }) {
  const [rows, setRows] = useState([
    {
      name: "",
      email: "",
      phone: "",
      resumeFile: null,
      resumeName: "",
      resumeError: "",
      errors: {},
    },
  ]);

  const [progressMap, setProgressMap] = useState({});
  const [loading, setLoading] = useState(false);

  const PRIMARY = "#2563eb";
  const PRIMARY_HOVER = "#1e40af";
  const [hoverSubmit, setHoverSubmit] = useState(false);

  function updateRow(idx, key, value) {
    setRows((prev) => {
      const copy = prev.map((r) => ({ ...r }));
      copy[idx][key] = value;

      if (copy[idx].errors && copy[idx].errors[key]) {
        copy[idx].errors[key] = null;
      }
      if (key === "resumeError") {
        copy[idx].resumeError = value;
      }
      return copy;
    });
  }

  function addEmptyRow() {
    setRows((prev) => [
      ...prev,
      {
        name: "",
        email: "",
        phone: "",
        resumeFile: null,
        resumeName: "",
        resumeError: "",
        errors: {},
      },
    ]);
  }

  function removeRow(i) {
    if (rows.length === 1) {
      setRows([
        {
          name: "",
          email: "",
          phone: "",
          resumeFile: null,
          resumeName: "",
          resumeError: "",
          errors: {},
        },
      ]);
      setProgressMap({});
      return;
    }
    setRows((prev) => prev.filter((_, idx) => idx !== i));
    setProgressMap((pm) => {
      const copy = { ...pm };
      delete copy[i];
      return copy;
    });
  }

  async function uploadFile(file, idx) {
    if (!file) return null;

    try {
      const uid = Math.random().toString(36).slice(2, 9);
      const fileName = `${uid}_${file.name}`;
      const path = `resumes/${assessment.id}/${fileName}`;

      const fbStorageRef = fbRef(storage, path);
      const uploadTask = uploadBytesResumable(fbStorageRef, file);

      return new Promise((resolve, reject) => {
        uploadTask.on(
          "state_changed",
          (snap) => {
            const pct = Math.round(
              (snap.bytesTransferred / snap.totalBytes) * 100
            );
            setProgressMap((pm) => ({ ...pm, [idx]: pct }));
          },
          (err) => reject(err),
          async () => resolve(await getDownloadURL(uploadTask.snapshot.ref))
        );
      });
    } catch (err) {
      console.error("uploadFile err", err);
      return null;
    }
  }

  // VALIDATION (name/email/resume presence)
  function validateAllRowsAndSetErrors() {
    let ok = true;
    const copy = rows.map((r) => ({
      ...r,
      errors: { ...(r.errors || {}) },
    }));

    copy.forEach((r, i) => {
      const e = {};

      if (!r.name || !String(r.name).trim()) {
        e.name = "Name is required";
        ok = false;
      }
      if (!r.email || !String(r.email).trim()) {
        e.email = "Email is required";
        ok = false;
      } else {
        const re = /\S+@\S+\.\S+/;
        if (!re.test(String(r.email).toLowerCase())) {
          e.email = "Enter a valid email";
          ok = false;
        }
      }
      if (!r.resumeFile) {
        e.resumeFile = "Resume is required";
        ok = false;
      }
      if (r.resumeError) {
        e.resumeFile = r.resumeError;
        ok = false;
      }

      copy[i].errors = e;
    });

    setRows(copy);
    return ok;
  }

  // FORM SUBMIT
  async function submit(e) {
    e.preventDefault();

    const ok = validateAllRowsAndSetErrors();
    if (!ok) {
      // Build toast summary from inline errors
      const messages = rows
        .map((r, i) => {
          const errs = r.errors
            ? Object.values(r.errors).filter(Boolean)
            : [];
          if (errs.length) {
            return `Candidate ${i + 1}: ${errs.join(", ")}`;
          }
          return null;
        })
        .filter(Boolean);

      if (messages.length) {
        toast.error(
          <div>
            {messages.map((m, idx) => (
              <div
                key={idx}
                style={{ marginBottom: idx < messages.length - 1 ? 6 : 0 }}
              >
                {m}
              </div>
            ))}
          </div>,
          { autoClose: 6000 }
        );
      }

      const firstErrIdx = rows.findIndex(
        (r) => r.errors && Object.values(r.errors).some(Boolean)
      );
      if (firstErrIdx >= 0) {
        const el = document.querySelector(
          `[data-row-index="${firstErrIdx}"]`
        );
        if (el)
          el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    setLoading(true);
    try {
      const addedCandidates = [];

      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];

        const resume_url = r.resumeFile
          ? await uploadFile(r.resumeFile, i)
          : null;

        // Our api.addCandidateToAssessment now returns plain JSON
        const body = await addCandidateToAssessment(
          assessment.id,
          r.name,
          r.email,
          r.phone,
          resume_url
        );

        let candidate = null;

        if (body && body.candidate) {
          candidate = body.candidate;
        } else if (body && Array.isArray(body.candidates)) {
          candidate = body.candidates[body.candidates.length - 1];
        } else {
          // Fallback: local object (UI only)
          candidate = {
            name: r.name,
            email: r.email,
            phone: r.phone,
            resume_path: resume_url,
          };
        }

        addedCandidates.push(candidate);
      }

      if (typeof onAdded === "function") {
        onAdded(null, addedCandidates);
      }

      setRows([
        {
          name: "",
          email: "",
          phone: "",
          resumeFile: null,
          resumeName: "",
          resumeError: "",
          errors: {},
        },
      ]);
      setProgressMap({});
      if (typeof onClose === "function") {
        onClose();
      }

      toast.success("Candidates added successfully", {
        autoClose: 4000,
      });
    } catch (err) {
      console.error("Add candidates failed", err);
      toast.error("Failed to add candidates. Check console.", {
        autoClose: 6000,
      });
    } finally {
      setLoading(false);
    }
  }

  const CONTROL_BASE =
    "w-full h-10 px-3 py-2 box-border leading-none rounded border";
  const CONTROL_ERROR = "border-red-500";
  const CONTROL_NORMAL = "border-gray-300";

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-5 bg-black/25">
      <ToastContainer position="top-center" newestOnTop />

      <div className="bg-white rounded-lg shadow-lg p-4 w-[1080px] max-w-[96vw] max-h-[88vh] overflow-auto">
        <div className="flex items-center justify-between mb-3">
          <div className="font-semibold">
            {`Add candidates to "${assessment?.title || ""}"`}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-gray-600 hover:text-gray-800 p-1 rounded"
          >
            ✕
          </button>
        </div>

        <form onSubmit={submit} className="grid gap-3">
          {rows.map((r, i) => (
            <div
              key={i}
              data-row-index={i}
              className="p-3 rounded border border-gray-200 bg-gray-50"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium">{`Candidate ${i + 1}`}</div>

                <button
                  type="button"
                  onClick={() => removeRow(i)}
                  className={`p-1 rounded ${
                    rows.length === 1
                      ? "opacity-40"
                      : "hover:bg-gray-100"
                  } text-gray-600`}
                >
                  <AiOutlineClose className="text-lg" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-start">
                {/* NAME */}
                <div>
                  <input
                    placeholder="Full name"
                    value={r.name}
                    onChange={(e) =>
                      updateRow(i, "name", e.target.value)
                    }
                    className={`${CONTROL_BASE} ${
                      r.errors?.name ? CONTROL_ERROR : CONTROL_NORMAL
                    }`}
                  />
                  <div className="h-4 mt-1 text-red-500 text-xs">
                    {r.errors?.name}
                  </div>
                </div>

                {/* EMAIL */}
                <div>
                  <input
                    placeholder="Email"
                    value={r.email}
                    onChange={(e) =>
                      updateRow(i, "email", e.target.value)
                    }
                    className={`${CONTROL_BASE} ${
                      r.errors?.email ? CONTROL_ERROR : CONTROL_NORMAL
                    }`}
                  />
                  <div className="h-4 mt-1 text-red-500 text-xs">
                    {r.errors?.email}
                  </div>
                </div>

                {/* PHONE */}
                <div>
                  <input
                    placeholder="Phone"
                    value={r.phone}
                    onChange={(e) =>
                      updateRow(i, "phone", e.target.value)
                    }
                    className={`${CONTROL_BASE} ${CONTROL_NORMAL}`}
                  />
                  <div className="h-4 mt-1 text-red-500 text-xs" />
                </div>

                {/* RESUME (with size validation) */}
                <div>
                  <div className="relative">
                    <input
                      type="text"
                      readOnly
                      placeholder="Resume (50KB–2MB)"
                      value={
                        r.resumeFile
                          ? `${r.resumeName} • ${formatBytes(
                              r.resumeFile.size
                            )}`
                          : ""
                      }
                      onClick={() => {
                        const el =
                          document.getElementById(`resume-${i}`);
                        if (el) el.click();
                      }}
                      className={`${CONTROL_BASE} ${
                        r.errors?.resumeFile || r.resumeError
                          ? CONTROL_ERROR
                          : CONTROL_NORMAL
                      } cursor-pointer`}
                    />

                    {progressMap[i] ? (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-600">
                        {progressMap[i]}%
                      </span>
                    ) : null}

                    <input
                      id={`resume-${i}`}
                      type="file"
                      accept=".pdf,.doc,.docx"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];

                        if (!file) {
                          updateRow(i, "resumeFile", null);
                          updateRow(i, "resumeError", "");
                          updateRow(i, "resumeName", "");
                          return;
                        }

                        // --- SIZE VALIDATION ---
                        if (file.size < MIN_BYTES) {
                          const msg = `File too small. Minimum is ${formatBytes(
                            MIN_BYTES
                          )}.`;
                          updateRow(i, "resumeFile", null);
                          updateRow(i, "resumeName", "");
                          updateRow(i, "resumeError", msg);
                          return;
                        }

                        if (file.size > MAX_BYTES) {
                          const msg = `File too large. Maximum allowed is ${formatBytes(
                            MAX_BYTES
                          )}.`;
                          updateRow(i, "resumeFile", null);
                          updateRow(i, "resumeName", "");
                          updateRow(i, "resumeError", msg);
                          return;
                        }

                        // valid
                        updateRow(i, "resumeError", "");
                        updateRow(i, "resumeFile", file);
                        updateRow(i, "resumeName", file.name);
                      }}
                    />
                  </div>

                  <div className="h-4 mt-1 text-red-500 text-xs">
                    {r.errors?.resumeFile || r.resumeError}
                  </div>
                </div>

                {/* EMPTY COLUMN */}
                <div />
              </div>
            </div>
          ))}

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={addEmptyRow}
              className="px-3 py-2 rounded border border-gray-200 bg-white hover:bg-gray-50"
            >
              + Add another
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-2 rounded border border-gray-300 bg-white"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                onMouseEnter={() => setHoverSubmit(true)}
                onMouseLeave={() => setHoverSubmit(false)}
                className={`px-4 py-2 rounded-md font-semibold text-white ${
                  loading ? "opacity-60 cursor-not-allowed" : ""
                }`}
                style={{
                  background: hoverSubmit ? PRIMARY_HOVER : PRIMARY,
                  boxShadow: hoverSubmit
                    ? "0 6px 18px rgba(37,99,235,0.12)"
                    : "0 4px 10px rgba(2,6,23,0.04)",
                  border: "1px solid rgba(37,99,235,0.12)",
                }}
              >
                {loading ? "Adding..." : "Add candidate(s)"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
