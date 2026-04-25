const resolveDefaultApiBaseUrl = () => {
  try {
    const location = typeof window !== "undefined" ? window.location : null;
    const hostname = location ? String(location.hostname || "").trim() : "";
    const port = location ? String(location.port || "").trim() : "";

    if (hostname === "localhost" || port === "5173" || port === "4173") {
      const resolvedHost = hostname || "localhost";
      return `http://${resolvedHost}:5000/api`;
    }

    return `${String(location?.origin || "").replace(/\/$/, "")}/api`;
  } catch {
    return "http://localhost:5000/api";
  }
};

const API_BASE_URL = String(import.meta.env.VITE_API_BASE_URL || resolveDefaultApiBaseUrl()).trim().replace(/\/$/, "");
const TOKEN_STORAGE_KEY = "hms_auth_token";

export const getStoredToken = () => localStorage.getItem(TOKEN_STORAGE_KEY) || "";

export const setStoredToken = (token) => {
  if (token) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    return;
  }
  localStorage.removeItem(TOKEN_STORAGE_KEY);
};

export const clearStoredToken = () => {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
};

export async function apiRequest(path, { token, headers, body, ...options } = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let payload = {};
  try {
    payload = await response.json();
  } catch {
    payload = {};
  }

  return {
    ok: response.ok,
    status: response.status,
    data: payload,
  };
}

export { API_BASE_URL, TOKEN_STORAGE_KEY, resolveDefaultApiBaseUrl };
