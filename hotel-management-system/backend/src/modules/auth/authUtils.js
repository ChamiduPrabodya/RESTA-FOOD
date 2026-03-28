function formatAddress({ streetAddress1, streetAddress2, cityTown } = {}) {
  const parts = [streetAddress1, streetAddress2, cityTown]
    .map((value) => String(value || "").trim())
    .filter(Boolean);
  return parts.join(", ");
}

function validateSignup({ fullName, email, password, phone, streetAddress1, streetAddress2, cityTown } = {}) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const normalizedFullName = String(fullName || "").trim();
  const normalizedPhone = String(phone || "").trim();
  const normalizedStreet1 = String(streetAddress1 || "").trim();
  const normalizedStreet2 = String(streetAddress2 || "").trim();
  const normalizedCityTown = String(cityTown || "").trim();

  if (
    !normalizedFullName ||
    !normalizedEmail ||
    !String(password || "").trim() ||
    !normalizedPhone ||
    !normalizedStreet1 ||
    !normalizedCityTown
  ) {
    return { ok: false, message: "Please fill all required fields." };
  }
  if (normalizedFullName.length < 2) {
    return { ok: false, message: "Full name must be at least 2 characters." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return { ok: false, message: "Please enter a valid email address." };
  }
  if (String(password || "").length < 8) {
    return { ok: false, message: "Password must be at least 8 characters." };
  }
  if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password)) {
    return { ok: false, message: "Password must include uppercase, lowercase, and a number." };
  }
  if (!/^[0-9+\-\s]{9,15}$/.test(normalizedPhone)) {
    return { ok: false, message: "Please enter a valid phone number." };
  }
  if (normalizedStreet1.length < 3) {
    return { ok: false, message: "Please enter a valid street address." };
  }
  if (normalizedCityTown.length < 2) {
    return { ok: false, message: "Please enter a valid town/city." };
  }

  return {
    ok: true,
    value: {
      fullName: normalizedFullName,
      email: normalizedEmail,
      password: String(password || ""),
      phone: normalizedPhone,
      streetAddress1: normalizedStreet1,
      streetAddress2: normalizedStreet2,
      cityTown: normalizedCityTown,
      address: formatAddress({
        streetAddress1: normalizedStreet1,
        streetAddress2: normalizedStreet2,
        cityTown: normalizedCityTown,
      }),
    },
  };
}

function validateLogin({ email, password } = {}) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const normalizedPassword = String(password || "").trim();

  if (!normalizedEmail || !normalizedPassword) {
    return { ok: false, message: "Please enter email and password." };
  }

  return { ok: true, value: { email: normalizedEmail, password: normalizedPassword } };
}

module.exports = { validateSignup, validateLogin, formatAddress };

