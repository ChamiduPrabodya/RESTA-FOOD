/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from "react";

const ADMIN_EMAIL = "admin@gmail.com";
const ADMIN_PASSWORD = "admin123";
const DEMO_USER_EMAIL = "user@gmail.com";
const DEMO_USER_PASSWORD = "user123";
const GOOGLE_DEMO_EMAIL = "google.user@gmail.com";
const USERS_STORAGE_KEY = "hms_users";
const PURCHASES_STORAGE_KEY = "hms_purchases";
const BOOKINGS_STORAGE_KEY = "hms_vip_bookings";
const CART_STORAGE_KEY = "hms_cart_items";
const DELIVERY_DETAILS_STORAGE_KEY = "hms_delivery_details";

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
  const [cartItems, setCartItems] = useState(() => parseStoredJson(CART_STORAGE_KEY, []));
  const [deliveryDetailsByUser, setDeliveryDetailsByUser] = useState(() =>
    parseStoredJson(DELIVERY_DETAILS_STORAGE_KEY, {})
  );

  useEffect(() => {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem(PURCHASES_STORAGE_KEY, JSON.stringify(purchases));
  }, [purchases]);

  useEffect(() => {
    localStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(vipBookings));
  }, [vipBookings]);

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    localStorage.setItem(DELIVERY_DETAILS_STORAGE_KEY, JSON.stringify(deliveryDetailsByUser));
  }, [deliveryDetailsByUser]);

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
        phone: "+94 71 987 6543",
      });
      return { success: true, role: "user" };
    }

    const registeredUser = users.find(
      (user) => user.email.toLowerCase() === normalizedEmail && user.password === password
    );
    if (registeredUser) {
      setAuthUser({
        email: registeredUser.email,
        role: "user",
        fullName: registeredUser.fullName,
        phone: registeredUser.phone || "",
      });
      return { success: true, role: "user" };
    }

    return { success: false, message: "Invalid credentials." };
  };

  const signup = (fullName, email, password, phone) => {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPhone = String(phone || "").trim();

    if (!fullName.trim() || !normalizedEmail || !password.trim() || !normalizedPhone) {
      return { success: false, message: "Please fill all required fields." };
    }
    if (fullName.trim().length < 2) {
      return { success: false, message: "Full name must be at least 2 characters." };
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return { success: false, message: "Please enter a valid email address." };
    }
    if (password.length < 8) {
      return { success: false, message: "Password must be at least 8 characters." };
    }
    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password)) {
      return { success: false, message: "Password must include uppercase, lowercase, and a number." };
    }
    if (!/^[0-9+\-\s]{9,15}$/.test(normalizedPhone)) {
      return { success: false, message: "Please enter a valid phone number." };
    }

    if (normalizedEmail === ADMIN_EMAIL) {
      return { success: false, message: "This email is reserved." };
    }

    const exists = users.some((user) => user.email.toLowerCase() === normalizedEmail);
    if (exists) {
      return { success: false, message: "Email already registered." };
    }

    const nextUser = {
      fullName: fullName.trim(),
      email: normalizedEmail,
      password,
      phone: normalizedPhone,
    };
    setUsers((current) => [...current, nextUser]);
    return { success: true };
  };

  const loginWithGoogle = () => {
    const existing = users.find((user) => user.email.toLowerCase() === GOOGLE_DEMO_EMAIL);
    if (!existing) {
      const googleUser = {
        fullName: "Google User",
        email: GOOGLE_DEMO_EMAIL,
        password: "",
      };
      setUsers((current) => [...current, googleUser]);
    }

    setAuthUser({
      email: GOOGLE_DEMO_EMAIL,
      role: "user",
      fullName: "Google User",
      phone: "",
    });
    return { success: true, role: "user" };
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
      size: "Small",
      quantity: 1,
      status: "Pending",
      userEmail: authUser.email,
      createdAt: new Date().toISOString(),
    };
    setPurchases((current) => [purchase, ...current]);
    return { success: true };
  };

  const parsePrice = (price) => Number(String(price).replace(/[^\d.]/g, "")) || 0;
  const formatPrice = (value) => `SLR ${Math.round(value).toLocaleString()}`;

  const addToCart = ({ itemName, price, image, size = "Small" }) => {
    if (!authUser || authUser.role !== "user") {
      return { success: false, message: "Please login as user to use cart." };
    }

    const priceValue = parsePrice(price);
    const existing = cartItems.find(
      (item) =>
        item.userEmail === authUser.email &&
        item.itemName === itemName &&
        item.size === size
    );

    if (existing) {
      setCartItems((current) =>
        current.map((item) =>
          item.id === existing.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
      return { success: true };
    }

    const cartItem = {
      id: crypto.randomUUID(),
      itemName,
      size,
      image,
      unitPrice: priceValue,
      quantity: 1,
      userEmail: authUser.email,
    };
    setCartItems((current) => [cartItem, ...current]);
    return { success: true };
  };

  const increaseCartQty = (cartItemId) => {
    if (!authUser || authUser.role !== "user") return;
    setCartItems((current) =>
      current.map((item) =>
        item.id === cartItemId && item.userEmail === authUser.email
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    );
  };

  const decreaseCartQty = (cartItemId) => {
    if (!authUser || authUser.role !== "user") return;
    setCartItems((current) =>
      current.map((item) =>
        item.id === cartItemId && item.userEmail === authUser.email
          ? { ...item, quantity: Math.max(1, item.quantity - 1) }
          : item
      )
    );
  };

  const removeFromCart = (cartItemId) => {
    if (!authUser || authUser.role !== "user") return;
    setCartItems((current) =>
      current.filter(
        (item) => !(item.id === cartItemId && item.userEmail === authUser.email)
      )
    );
  };

  const placeOrderFromCart = (checkoutDetails = {}) => {
    if (!authUser || authUser.role !== "user") {
      return { success: false, message: "Please login as user to place order." };
    }

    const userCart = cartItems.filter((item) => item.userEmail === authUser.email);
    if (userCart.length === 0) {
      return { success: false, message: "Your cart is empty." };
    }

    const {
      orderType = "Delivery",
      paymentMethod = "Cash",
      deliveryDetails = null,
    } = checkoutDetails;

    if (orderType === "Delivery") {
      const hasAllDeliveryFields =
        deliveryDetails &&
        String(deliveryDetails.name || "").trim() &&
        String(deliveryDetails.phone || "").trim() &&
        String(deliveryDetails.location || "").trim();
      if (!hasAllDeliveryFields) {
        return { success: false, message: "Delivery name, phone, and location are required." };
      }
    }

    const orderRows = userCart.map((item) => {
      const rowTotal = item.unitPrice * item.quantity;
      return {
        id: crypto.randomUUID(),
        itemName: item.itemName,
        price: formatPrice(rowTotal),
        size: item.size,
        quantity: item.quantity,
        status: "Pending",
        userEmail: authUser.email,
        orderType,
        paymentMethod,
        deliveryDetails: orderType === "Delivery" ? deliveryDetails : null,
        createdAt: new Date().toISOString(),
      };
    });

    if (orderType === "Delivery" && deliveryDetails) {
      setDeliveryDetailsByUser((current) => ({
        ...current,
        [authUser.email]: {
          name: String(deliveryDetails.name || "").trim(),
          phone: String(deliveryDetails.phone || "").trim(),
          location: String(deliveryDetails.location || "").trim(),
        },
      }));
    }

    setPurchases((current) => [...orderRows, ...current]);
    setCartItems((current) =>
      current.filter((item) => item.userEmail !== authUser.email)
    );
    return { success: true };
  };

  const updatePurchaseStatus = (purchaseId, status) => {
    setPurchases((current) =>
      current.map((purchase) =>
        purchase.id === purchaseId ? { ...purchase, status } : purchase
      )
    );
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
    loginWithGoogle,
    logout,
    addPurchase,
    updatePurchaseStatus,
    addVipBooking,
    cartItems,
    addToCart,
    increaseCartQty,
    decreaseCartQty,
    removeFromCart,
    placeOrderFromCart,
    lastDeliveryDetails: authUser ? deliveryDetailsByUser[authUser.email] || null : null,
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
