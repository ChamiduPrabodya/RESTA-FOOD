const PAYHERE_SCRIPT_URL = "https://www.payhere.lk/lib/payhere.js";

function getPayHereGlobal() {
  return window.payhere;
}

export async function loadPayHereSdk() {
  if (getPayHereGlobal()) {
    return getPayHereGlobal();
  }

  await new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${PAYHERE_SCRIPT_URL}"]`);
    if (existing) {
      existing.addEventListener("load", resolve, { once: true });
      existing.addEventListener("error", () => reject(new Error("Unable to load PayHere SDK.")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = PAYHERE_SCRIPT_URL;
    script.async = true;
    script.onload = resolve;
    script.onerror = () => reject(new Error("Unable to load PayHere SDK."));
    document.body.appendChild(script);
  });

  if (!getPayHereGlobal()) {
    throw new Error("PayHere SDK did not initialize.");
  }

  return getPayHereGlobal();
}

export async function startPayHerePayment(payment, handlers = {}) {
  const payhere = await loadPayHereSdk();

  payhere.onCompleted = (orderId) => {
    if (typeof handlers.onCompleted === "function") {
      handlers.onCompleted(orderId);
    }
  };

  payhere.onDismissed = () => {
    if (typeof handlers.onDismissed === "function") {
      handlers.onDismissed();
    }
  };

  payhere.onError = (error) => {
    if (typeof handlers.onError === "function") {
      handlers.onError(error);
    }
  };

  payhere.startPayment(payment);
}
