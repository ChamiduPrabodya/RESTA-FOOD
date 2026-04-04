const GOOGLE_IDENTITY_SRC = "https://accounts.google.com/gsi/client";

export const getGoogleClientId = () => {
  const value = String(import.meta.env.VITE_GOOGLE_CLIENT_ID || "").trim();
  return value || null;
};

let scriptPromise = null;

export const loadGoogleIdentityScript = () => {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google Identity is not available."));
  }

  if (window.google?.accounts?.id) {
    return Promise.resolve(window.google);
  }

  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${GOOGLE_IDENTITY_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(window.google));
      existing.addEventListener("error", () => reject(new Error("Failed to load Google login.")));
      return;
    }

    const script = document.createElement("script");
    script.src = GOOGLE_IDENTITY_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google);
    script.onerror = () => reject(new Error("Failed to load Google login."));
    document.head.appendChild(script);
  });

  return scriptPromise;
};
