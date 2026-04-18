const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";
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

  if (!response.ok) {
    const error = new Error(payload?.message || "Request failed.");
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

export { API_BASE_URL, TOKEN_STORAGE_KEY };
