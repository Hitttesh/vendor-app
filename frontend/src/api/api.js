// vendor\frontend\src\api\api.js
const BASE = "http://localhost:8000";

export async function getAssessment(assessmentId) {
  try {
    const res = await fetch(`${BASE}/vendor/assessment/${assessmentId}`, {
      method: "GET",
      credentials: "include",
    });
    let body = null;
    const contentType = res.headers.get("content-type") || "";
    try {
      if (contentType.includes("application/json")) body = await res.json();
      else body = await res.text();
    } catch (e) {
      body = await res.text().catch(() => null);
    }
    return { ok: res.ok, status: res.status, body };
  } catch (err) {
    return { ok: false, status: 0, body: String(err) };
  }
}

export async function vendorLogin(email, password) {
  const res = await fetch(`${BASE}/auth/vendor/login`, {
    method: "POST",
    credentials: "include", // important to include cookies
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, company_name: "" }) // backend expects company_name in VendorCreate; ignored for login
  });
  return res.json();
}

export async function vendorRegister(company_name, email, password) {
  try {
    const res = await fetch(`${BASE}/auth/vendor/register`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ company_name, email, password }),
    });

    let body = null;
    try { body = await res.json(); } catch (e) { body = await res.text().catch(()=>null); }

    return { ok: res.ok, status: res.status, body };
  } catch (err) {
    return { ok: false, status: 0, body: String(err) };
  }
}

export async function getVendorDashboard() {
  const res = await fetch(`${BASE}/vendor/dashboard`, {
    method: "GET",
    credentials: "include",
  });
  return res.json();
}

export async function createAssessment(payload){
  const res = await fetch("/vendor/create-assessment", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  return res.ok ? await res.json() : Promise.reject(await res.text());
}

export async function addCandidateToAssessment(assessmentId, name, email, phone, resume_url) {
  const url = `${BASE}/vendor/assessment/${assessmentId}/add-candidate`;
  const payload = { name, email, phone, resume_url }; // server will accept resume_url field
  try {
    const res = await fetch(url, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    let body;
    try { body = await res.json(); } catch (e) { body = await res.text().catch(()=>null); }
    return { ok: res.ok, status: res.status, body };
  } catch (err) {
    return { ok: false, status: 0, body: String(err) };
  }
}

export async function vendorLogout() {
  try {
    const res = await fetch(`${BASE}/auth/logout`, {
      method: "POST",
      credentials: "include", // send cookie so backend can identify session
      headers: { "Content-Type": "application/json" }
    });

    // read body exactly once
    const txt = await res.text();
    let body = null;
    try { body = txt ? JSON.parse(txt) : null; } catch (e) { body = txt; }

    return { ok: res.ok, status: res.status, body };
  } catch (err) {
    console.error("vendorLogout fetch error:", err);
    return { ok: false, status: 0, body: String(err) };
  }
}

export async function changeVendorPassword(oldPassword, newPassword) {
  const res = await fetch("/vendor/change-password", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ old_password: oldPassword, new_password: newPassword })
  });
  if (!res.ok) {
    // return parsed JSON or throw as appropriate
    try {
      const txt = await res.text();
      throw new Error(txt || `Status ${res.status}`);
    } catch (e) {
      throw e;
    }
  }
  return res.json();
}

export async function updateCandidateStatus(assessmentId, candidateUuid, status) {
  const res = await fetch(`/vendor/assessment/${assessmentId}/candidate/${candidateUuid}/status`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status })
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Failed to update status: ${res.status} ${text}`);
  }
  return res.json();
}
