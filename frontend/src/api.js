// api.js - thin wrapper around fetch for the backend API.
// Set VITE_API_URL in a .env file (frontend/.env) when deploying, e.g.
// VITE_API_URL=https://your-backend.onrender.com

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

export const api = {
  getSettings: () => request("/api/settings"),
  updateSettings: (data) =>
    request("/api/settings", { method: "PUT", body: JSON.stringify(data) }),
  getLogs: () => request("/api/logs"),
  deleteHistoryEntry: (id) =>
    request(`/api/settings/history/${id}`, { method: "DELETE" }),
};
