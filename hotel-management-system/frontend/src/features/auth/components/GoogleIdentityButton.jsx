import { useEffect, useRef, useState } from "react";
import { Box } from "@mui/material";
import { getGoogleClientId, loadGoogleIdentityScript } from "../../../common/utils/googleIdentity";

function GoogleIdentityButton({ onCredential, onError, text = "continue_with" }) {
  const containerRef = useRef(null);
  const frameRef = useRef(null);
  const onCredentialRef = useRef(onCredential);
  const onErrorRef = useRef(onError);
  const [ready, setReady] = useState(false);
  const [buttonWidth, setButtonWidth] = useState(320);

  useEffect(() => {
    onCredentialRef.current = onCredential;
    onErrorRef.current = onError;
  }, [onCredential, onError]);

  useEffect(() => {
    const updateWidth = () => {
      const nextWidth = Math.max(220, Math.min(frameRef.current?.clientWidth || 320, 360));
      setButtonWidth((currentWidth) => (currentWidth === nextWidth ? currentWidth : nextWidth));
    };

    updateWidth();

    if (typeof ResizeObserver === "undefined" || !frameRef.current) {
      window.addEventListener("resize", updateWidth);
      return () => window.removeEventListener("resize", updateWidth);
    }

    const observer = new ResizeObserver(() => updateWidth());
    observer.observe(frameRef.current);

    return () => observer.disconnect();
  }, []);

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
          setReady(false);
          google.accounts.id.renderButton(containerRef.current, {
            theme: "outline",
            size: "large",
            width: buttonWidth,
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
  }, [buttonWidth, text]);

  return (
    <Box
      ref={frameRef}
      sx={{
        width: "100%",
        maxWidth: 360,
        mx: "auto",
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
