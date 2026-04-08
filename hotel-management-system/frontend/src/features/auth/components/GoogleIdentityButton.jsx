import { useEffect, useRef, useState } from "react";
import { Box } from "@mui/material";
import { getGoogleClientId, loadGoogleIdentityScript } from "../../../common/utils/googleIdentity";

function GoogleIdentityButton({ onCredential, onError, text = "continue_with" }) {
  const containerRef = useRef(null);
  const onCredentialRef = useRef(onCredential);
  const onErrorRef = useRef(onError);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    onCredentialRef.current = onCredential;
    onErrorRef.current = onError;
  }, [onCredential, onError]);

  useEffect(() => {
    let cancelled = false;
    const clientId = getGoogleClientId();
    if (!clientId) {
      onErrorRef.current?.("Missing VITE_GOOGLE_CLIENT_ID in frontend environment.");
      return undefined;
    }

    (async () => {
      try {
        const google = await loadGoogleIdentityScript();
        if (cancelled) return;

        if (!google?.accounts?.id) {
          onErrorRef.current?.("Google login is not available.");
          return;
        }

        google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => {
            const credential = String(response?.credential || "").trim();
            if (!credential) {
              onErrorRef.current?.("Google login failed.");
              return;
            }
            onCredentialRef.current?.(credential);
          },
        });

        if (containerRef.current) {
          containerRef.current.innerHTML = "";
          google.accounts.id.renderButton(containerRef.current, {
            theme: "outline",
            size: "large",
            width: 360,
            text,
            shape: "pill",
          });
          setReady(true);
        }
      } catch (error) {
        if (!cancelled) onErrorRef.current?.(error?.message || "Google login failed.");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [text]);

  return (
    <Box
      sx={{
        display: "grid",
        justifyContent: "center",
        minHeight: 44,
        opacity: ready ? 1 : 0.92,
        "& > div": { display: "inline-block" },
      }}
    >
      <div ref={containerRef} />
    </Box>
  );
}

export default GoogleIdentityButton;
