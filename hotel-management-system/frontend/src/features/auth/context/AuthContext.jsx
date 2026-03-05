/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from "react";

const ADMIN_EMAIL = "admin@gmail.com";
const ADMIN_PASSWORD = "admin123";
const DEMO_USER_EMAIL = "user@gmail.com";
const DEMO_USER_PASSWORD = "user123";
const USERS_STORAGE_KEY = "hms_users";
const PURCHASES_STORAGE_KEY = "hms_purchases";
const BOOKINGS_STORAGE_KEY = "hms_vip_bookings";

const AuthContext = createContext(null);

const parseStoredJson = (key, fallback) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

export function AuthProvider({ children }) {
  const [authUser, setAuthUser] = useState(null);
  const [users, setUsers] = useState(() => parseStoredJson(USERS_STORAGE_KEY, []));
  const [purchases, setPurchases] = useState(() => parseStoredJson(PURCHASES_STORAGE_KEY, []));
  const [vipBookings, setVipBookings] = useState(() => parseStoredJson(BOOKINGS_STORAGE_KEY, []));

  useEffect(() => {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem(PURCHASES_STORAGE_KEY, JSON.stringify(purchases));
  }, [purchases]);

  useEffect(() => {
    localStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(vipBookings));
  }, [vipBookings]);

  const login = (email, password) => {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password.trim()) {
      return { success: false, message: "Please enter email and password." };
    }

    if (normalizedEmail === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      const adminUser = { email: ADMIN_EMAIL, role: "admin", fullName: "Admin" };
      setAuthUser(adminUser);
      return { success: true, role: "admin" };
    }

    if (normalizedEmail === DEMO_USER_EMAIL && password === DEMO_USER_PASSWORD) {
      setAuthUser({
        email: DEMO_USER_EMAIL,
        role: "user",
        fullName: "John Doe",
      });
      return { success: true, role: "user" };
    }

    return { success: false, message: "Invalid credentials." };
  };

  const signup = (fullName, email, password) => {
    const normalizedEmail = email.trim().toLowerCase();

    if (!fullName.trim() || !normalizedEmail || !password.trim()) {
      return { success: false, message: "Please fill all required fields." };
    }

    if (normalizedEmail === ADMIN_EMAIL) {
      return { success: false, message: "This email is reserved." };
    }

    const exists = users.some((user) => user.email.toLowerCase() === normalizedEmail);
    if (exists) {
      return { success: false, message: "Email already registered." };
    }

    const nextUser = { fullName: fullName.trim(), email: normalizedEmail, password };
    setUsers((current) => [...current, nextUser]);
    return { success: true };
  };

  const logout = () => setAuthUser(null);

  const addPurchase = (itemName, price) => {
    if (!authUser || authUser.role !== "user") {
      return { success: false, message: "Only logged-in users can buy items." };
    }

    const purchase = {
      id: crypto.randomUUID(),
      itemName,
      price,
      userEmail: authUser.email,
      createdAt: new Date().toISOString(),
    };
    setPurchases((current) => [purchase, ...current]);
    return { success: true };
  };

  const addVipBooking = ({ suiteId, date, time, guests }) => {
    if (!authUser || authUser.role !== "user") {
      return { success: false, message: "Only logged-in users can book VIP rooms." };
    }

    const booking = {
      id: crypto.randomUUID(),
      suiteId,
      date,
      time,
      guests,
      userEmail: authUser.email,
      createdAt: new Date().toISOString(),
    };
    setVipBookings((current) => [booking, ...current]);
    return { success: true };
  };

  const value = {
    authUser,
    users,
    purchases,
    vipBookings,
    login,
    signup,
    logout,
    addPurchase,
    addVipBooking,
    adminEmail: ADMIN_EMAIL,
    userEmail: DEMO_USER_EMAIL,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
