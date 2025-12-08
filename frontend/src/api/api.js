// vendor/frontend/src/api/api.js
const BASE = "http://localhost:8000";

// Common fetch wrapper
async function request(url, options = {}) {
  const res = await fetch(url, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  const isJSON = (res.headers.get("content-type") || "").includes("application/json");
  const data = isJSON ? await res.json() : await res.text();

  if (!res.ok) {
    const errorMsg = typeof data === "string" ? data : data?.detail || "Request failed";
    throw new Error(errorMsg);
  }

  return data;
}

// ----------- Auth ----------
export function vendorLogin(email, password) {
  return request(`${BASE}/auth/vendor/login`, {
    method: "POST",
    body: JSON.stringify({ email, password, company_name: ""   }),
  });
}

export function vendorRegister(company_name, email, password) {
  return request(`${BASE}/auth/vendor/register`, {
    method: "POST",
    body: JSON.stringify({ company_name, email, password }),
  });
}

export function vendorLogout() {
  return request(`${BASE}/auth/logout`, { method: "POST" });
}

// ----------- Vendor ----------
export function getVendorDashboard() {
  return request(`${BASE}/vendor/dashboard`);
}

export function changeVendorPassword(oldPassword, newPassword) {
  return request(`${BASE}/vendor/change-password`, {
    method: "POST",
    body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
  });
}

// ----------- Assessments ----------
export function createAssessment(payload) {
  return request(`${BASE}/vendor/create-assessment`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getAssessment(assessmentId) {
  return request(`${BASE}/vendor/assessment/${assessmentId}`);
}

// ----------- Candidates ----------
export function addCandidateToAssessment(assessmentId, name, email, phone, resume_url) {
  const payload = { name, email, phone, resume_url };
  return request(`${BASE}/vendor/assessment/${assessmentId}/add-candidate`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateCandidateStatus(assessmentId, candidateUuid, status) {
  return request(`${BASE}/vendor/assessment/${assessmentId}/candidate/${candidateUuid}/status`, {
    method: "POST",
    body: JSON.stringify({ status }),
  });
}
