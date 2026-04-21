/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { DEFAULT_LOYALTY_RULES, calculateCheckoutPricing, normalizeLoyaltyRules } from "../../../common/utils/pricing";

const ADMIN_EMAIL = String(import.meta.env.VITE_ADMIN_EMAIL || "").trim().toLowerCase();
const DEMO_USER_EMAIL = "user@gmail.com";
const DEMO_USER_PASSWORD = "user123";
const AUTH_TOKEN_STORAGE_KEY = "hms_auth_token";
const resolveDefaultApiBaseUrl = () => {
  try {
    const location = typeof window !== "undefined" ? window.location : null;
    const hostname = location ? String(location.hostname || "").trim() : "";
    const port = location ? String(location.port || "").trim() : "";

    // Local/Vite dev (5173) or preview (4173) expects the API to run on :5000.
    if (hostname === "localhost" || port === "5173" || port === "4173") {
      const resolvedHost = hostname || "localhost";
      return `http://${resolvedHost}:5000/api`;
    }

    // Production (Railway): serve API from same origin.
    return `${String(location.origin || "").replace(/\/$/, "")}/api`;
  } catch {
    return "http://localhost:5000/api";
  }
};

const API_BASE_URL = String(import.meta.env.VITE_API_BASE_URL || resolveDefaultApiBaseUrl()).trim().replace(/\/$/, "");
const sleep = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));
const USERS_STORAGE_KEY = "hms_users";
const PURCHASES_STORAGE_KEY = "hms_purchases";
const ORDER_COUNTER_STORAGE_KEY = "hms_order_counter";
const BOOKINGS_STORAGE_KEY = "hms_vip_bookings";
const FEEDBACK_STORAGE_KEY = "hms_feedbacks";
const PROMOTIONS_STORAGE_KEY = "hms_promotions";
const LOYALTY_RULES_STORAGE_KEY = "hms_loyalty_rules";
const CART_STORAGE_KEY = "hms_cart_items";
const DELIVERY_DETAILS_STORAGE_KEY = "hms_delivery_details";
const TABLE_CONTEXT_STORAGE_KEY = "hms_table_context";
// Menu data must come from MongoDB (backend). Keep no local default menu seed here.

const VIP_SUITE_CAPACITY = Object.freeze({
  platinum: 15,
  gold: 6,
});

const ORDER_REF_START = 3046;
const formatOrderRef = (orderNumber) => `ORD-${Number(orderNumber) || ORDER_REF_START}`;

const AuthContext = createContext(null);

const isQuotaExceededError = (error) => {
  if (!error) return false;
  if (error.name === "QuotaExceededError") return true;
  if (error.code === 22) return true;
  if (error.number === -2147024882) return true;
  const message = String(error.message || "").toLowerCase();
  return message.includes("quota") && message.includes("exceed");
};

const safeLocalStorageSetItem = (key, value) => {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    if (isQuotaExceededError(error)) return false;
    return false;
  }
};

const parseStoredJson = (key, fallback) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

const splitFullName = (fullName) => {
  const text = String(fullName || "").trim().replace(/\s+/g, " ");
  if (!text) return { firstName: "Customer", lastName: "HMS" };
  const [firstName, ...rest] = text.split(" ");
  return { firstName: firstName || "Customer", lastName: rest.join(" ").trim() || "HMS" };
};

const submitPostForm = ({ actionUrl, fields }) => {
  if (!actionUrl || !fields || typeof fields !== "object") return false;
  try {
    const form = document.createElement("form");
    form.method = "POST";
    form.action = String(actionUrl);

    Object.entries(fields).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = String(key);
      input.value = String(value);
      form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();
    form.remove();
    return true;
  } catch {
    return false;
  }
};

const formatSLRValue = (value) => `SLR ${Math.round(Number(value) || 0).toLocaleString()}`;

const flattenServerOrderRows = (orders) =>
  (Array.isArray(orders) ? orders : []).flatMap((order, orderIndex) => {
    const orderId = String(order?.id || order?.orderId || "").trim();
    if (!orderId) return [];
    const orderRef = String(order?.orderRef || "").trim() || formatOrderRef(ORDER_REF_START + orderIndex);
    const items = Array.isArray(order?.items) && order.items.length > 0 ? order.items : [{ itemName: "Order", quantity: 1 }];
    const orderTotal = Number(order?.finalPaid ?? order?.orderTotal ?? 0) || 0;

    return items.map((item, index) => {
      const quantity = Math.max(1, Number(item?.quantity) || 1);
      const unitPrice = Math.max(0, Number(item?.unitPrice) || 0);
      const rowTotal = Number(item?.finalAmount ?? item?.total ?? unitPrice * quantity) || 0;
      return {
        id: String(item?.id || `${orderId}:${index}`),
        orderId,
        orderRef,
        menuItemId: item?.menuItemId || "",
        image: item?.image || "",
        itemName: String(item?.itemName || item?.name || "Order").trim(),
        price: item?.price || formatSLRValue(rowTotal),
        size: String(item?.size || "").trim() || "Regular",
        unitPrice,
        quantity,
        status: order?.status || item?.status || "Pending",
        cancelReason: order?.cancelReason || item?.cancelReason || "",
        statusUpdatedAt: order?.statusUpdatedAt || item?.statusUpdatedAt || "",
        userEmail: order?.userEmail || "",
        orderType: order?.orderType || "Delivery",
        paymentMethod: order?.paymentMethod || "",
        paymentStatus: order?.paymentStatus || "",
        deliveryDetails: order?.deliveryDetails || null,
        createdAt: order?.createdAt || "",
        orderSubtotal: Number(order?.subtotal) || 0,
        orderTotalDiscount: (Number(order?.promotionDiscount) || 0) + (Number(order?.loyaltyDiscount) || 0),
        deliveryZone: order?.deliveryZone || "",
        deliveryFee: Number(order?.deliveryFee) || 0,
        orderTotal,
        tableId: order?.tableId || "",
        tableLabel: order?.tableLabel || "",
        tableSessionId: order?.tableSessionId || "",
        guestCount: Number(order?.guestCount) || 0,
      };
    });
  });

export function AuthProvider({ children }) {
  const [authUser, setAuthUser] = useState(null);
  const [authToken, setAuthToken] = useState(() => String(localStorage.getItem(AUTH_TOKEN_STORAGE_KEY) || "").trim());
  const [users, setUsers] = useState(() => parseStoredJson(USERS_STORAGE_KEY, []));
  const [purchases, setPurchases] = useState(() => parseStoredJson(PURCHASES_STORAGE_KEY, []));
  const [loyaltyPurchases, setLoyaltyPurchases] = useState([]);
  const [adminPointsByEmail, setAdminPointsByEmail] = useState({});
  const [vipBookings, setVipBookings] = useState(() => parseStoredJson(BOOKINGS_STORAGE_KEY, []));
  const [feedbacks, setFeedbacks] = useState(() => parseStoredJson(FEEDBACK_STORAGE_KEY, []));
  const [promotions, setPromotions] = useState(() => parseStoredJson(PROMOTIONS_STORAGE_KEY, []));
  const [loyaltySummary, setLoyaltySummary] = useState({ points: 0, discountPercent: 0 });
  const [loyaltyRules, setLoyaltyRules] = useState(() =>
    normalizeLoyaltyRules(parseStoredJson(LOYALTY_RULES_STORAGE_KEY, DEFAULT_LOYALTY_RULES))
  );
  const [menuItems, setMenuItems] = useState(() => []);
  const menuItemsRef = useRef(menuItems);
  useEffect(() => {
    menuItemsRef.current = menuItems;
  }, [menuItems]);
  const [menuCategories, setMenuCategories] = useState(() => []);
  const [cartItems, setCartItems] = useState(() => parseStoredJson(CART_STORAGE_KEY, []));
  const [deliveryDetailsByUser, setDeliveryDetailsByUser] = useState(() =>
    parseStoredJson(DELIVERY_DETAILS_STORAGE_KEY, {})
  );
  const [tableContext, setTableContextState] = useState(() => parseStoredJson(TABLE_CONTEXT_STORAGE_KEY, null));

  const getGuestCartKey = useCallback(() => {
    const sessionId = String(tableContext?.sessionId || "").trim();
    if (!sessionId) return "";
    return `guest:${sessionId}`;
  }, [tableContext?.sessionId]);

  useEffect(() => {
    safeLocalStorageSetItem(USERS_STORAGE_KEY, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    safeLocalStorageSetItem(PURCHASES_STORAGE_KEY, JSON.stringify(purchases));
  }, [purchases]);

  useEffect(() => {
    try {
      if (!tableContext) {
        localStorage.removeItem(TABLE_CONTEXT_STORAGE_KEY);
        return;
      }
      safeLocalStorageSetItem(TABLE_CONTEXT_STORAGE_KEY, JSON.stringify(tableContext));
    } catch {
      // ignore
    }
  }, [tableContext]);

  useEffect(() => {
    setPurchases((current) => {
      const list = Array.isArray(current) ? current : [];
      if (list.length === 0) return current;

      const groups = new Map();
      list.forEach((purchase) => {
        const key = String(purchase?.orderId || "").trim();
        if (!key) return;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(purchase);
      });

      if (groups.size === 0) return current;

      const hasMissingRefs = list.some(
        (purchase) => String(purchase?.orderId || "").trim() && !String(purchase?.orderRef || "").trim()
      );
      if (!hasMissingRefs) return current;

      const existingNumbers = list
        .map((item) => Number(item?.orderNumber))
        .filter((value) => Number.isFinite(value) && value >= ORDER_REF_START);
      let nextNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : ORDER_REF_START;

      const ordersNeedingNumbers = [...groups.entries()]
        .filter(([, items]) => !items.some((item) => String(item?.orderRef || "").trim()))
        .map(([orderId, items]) => {
          const times = items
            .map((item) => String(item?.createdAt || "").trim())
            .filter(Boolean)
            .map((value) => new Date(value).getTime())
            .filter((t) => Number.isFinite(t) && t > 0);
          const earliest = times.length > 0 ? Math.min(...times) : 0;
          return { orderId, earliest };
        })
        .sort((a, b) => (a.earliest || 0) - (b.earliest || 0));

      const orderNumberById = new Map();
      ordersNeedingNumbers.forEach(({ orderId }) => {
        orderNumberById.set(orderId, nextNumber);
        nextNumber += 1;
      });

      safeLocalStorageSetItem(ORDER_COUNTER_STORAGE_KEY, String(nextNumber));

      return list.map((purchase) => {
        const orderId = String(purchase?.orderId || "").trim();
        if (!orderId) return purchase;
        const assigned = orderNumberById.get(orderId);
        if (!assigned) return purchase;
        return {
          ...purchase,
          orderNumber: assigned,
          orderRef: formatOrderRef(assigned),
        };
      });
    });
  }, []);

  useEffect(() => {
    safeLocalStorageSetItem(BOOKINGS_STORAGE_KEY, JSON.stringify(vipBookings));
  }, [vipBookings]);

  useEffect(() => {
    safeLocalStorageSetItem(FEEDBACK_STORAGE_KEY, JSON.stringify(feedbacks));
  }, [feedbacks]);

  useEffect(() => {
    try {
      safeLocalStorageSetItem(PROMOTIONS_STORAGE_KEY, JSON.stringify(promotions));
    } catch {
      // ignore quota errors for large embedded images
    }
  }, [promotions]);

  useEffect(() => {
    const handleStorage = (event) => {
      if (!event) return;
      if (event.key !== PROMOTIONS_STORAGE_KEY) return;
      setPromotions(parseStoredJson(PROMOTIONS_STORAGE_KEY, []));
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  useEffect(() => {
    safeLocalStorageSetItem(LOYALTY_RULES_STORAGE_KEY, JSON.stringify(loyaltyRules));
  }, [loyaltyRules]);

  // Menu items/categories are fetched from the backend (MongoDB). Do not persist locally.

  useEffect(() => {
    const minimized = (Array.isArray(cartItems) ? cartItems : []).map((item) => ({
      id: item?.id,
      menuItemId: item?.menuItemId,
      itemName: item?.itemName,
      size: item?.size,
      unitPrice: item?.unitPrice,
      quantity: item?.quantity,
      userEmail: item?.userEmail,
    }));
    safeLocalStorageSetItem(CART_STORAGE_KEY, JSON.stringify(minimized));
  }, [cartItems]);

  useEffect(() => {
    safeLocalStorageSetItem(DELIVERY_DETAILS_STORAGE_KEY, JSON.stringify(deliveryDetailsByUser));
  }, [deliveryDetailsByUser]);

  useEffect(() => {
    const token = String(authToken || "").trim();
    if (token) {
      safeLocalStorageSetItem(AUTH_TOKEN_STORAGE_KEY, token);
      return;
    }
    try {
      localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    } catch {
      // ignore
    }
  }, [authToken]);

  const formatAddress = ({ streetAddress1, streetAddress2, cityTown } = {}) => {
    const parts = [
      String(streetAddress1 || "").trim(),
      String(streetAddress2 || "").trim(),
      String(cityTown || "").trim(),
    ].filter(Boolean);
    return parts.join(", ");
  };

  const upsertLocalUser = (user) => {
    if (!user || !user.email) return;
    const normalizedEmail = String(user.email || "").trim().toLowerCase();
    if (!normalizedEmail) return;

    setUsers((current) => {
      const list = Array.isArray(current) ? current : [];
      const nextUser = {
        ...(list.find((u) => String(u?.email || "").trim().toLowerCase() === normalizedEmail) || {}),
        ...user,
        email: normalizedEmail,
      };
      const filtered = list.filter((u) => String(u?.email || "").trim().toLowerCase() !== normalizedEmail);
      return [nextUser, ...filtered];
    });
  };

  const apiRequest = useCallback(async (path, { method = "GET", body, token } = {}) => {
    const headers = {};
    if (body !== undefined) headers["Content-Type"] = "application/json";
    if (token) headers.Authorization = `Bearer ${String(token).trim()}`;

    const response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    let data = null;
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    return { ok: response.ok, status: response.status, data };
  }, []);

  const startTableSession = useCallback(async ({ tableId, tableToken, guestCount } = {}) => {
    const normalizedTableId = String(tableId || "").trim();
    const normalizedToken = String(tableToken || "").trim();
    const normalizedGuestCount = Math.round(Number(guestCount));
    if (!normalizedTableId) return { success: false, message: "Missing tableId." };
    if (!Number.isFinite(normalizedGuestCount) || normalizedGuestCount < 1) {
      return { success: false, message: "Please enter at least 1 guest." };
    }
    if (normalizedGuestCount > 6) {
      return { success: false, message: "Maximum 6 guests are allowed per table order." };
    }

    try {
      const { ok, data } = await apiRequest("/sessions/start", {
        method: "POST",
        body: { tableId: normalizedTableId, tableToken: normalizedToken, guestCount: normalizedGuestCount },
      });
      if (!ok || !data || data.success !== true || !data.session) {
        return { success: false, message: data?.message || "Unable to start table session." };
      }

      setTableContextState({
        tableId: data.tableId || normalizedTableId,
        tableLabel: data.tableLabel || "",
        sessionId: data.session?.id || "",
        guestCount: Number(data.session?.guestCount || normalizedGuestCount) || normalizedGuestCount,
        tableToken: normalizedToken,
        startedAt: data.session?.createdAt || new Date().toISOString(),
      });
      return { success: true, tableId: data.tableId, tableLabel: data.tableLabel, session: data.session, reused: data.reused };
    } catch {
      return { success: false, message: "Backend is not reachable. Start the backend server." };
    }
  }, [apiRequest]);

  const clearTableContext = useCallback(() => {
    const guestKey = getGuestCartKey();
    setTableContextState(null);
    if (guestKey) {
      setCartItems((current) => (Array.isArray(current) ? current : []).filter((item) => item.userEmail !== guestKey));
    }
  }, [getGuestCartKey]);

  const refreshMenuItemsFromServer = async ({ retries = 0 } = {}) => {
    let lastResult = { success: false, message: "Backend is not reachable. Start the backend server." };

    for (let attempt = 0; attempt <= retries; attempt += 1) {
      try {
        const { ok, data } = await apiRequest("/menu/items");
        if (!ok || !data || data.success !== true || !Array.isArray(data.items)) {
          lastResult = { success: false, message: data?.message || "Unable to load menu items." };
        } else {
          const serverItems = data.items;
          const normalized = serverItems.map((item) => ({
            ...item,
            id: item.id || crypto.randomUUID(),
            outOfStock: Boolean(item.outOfStock),
            loyaltyPoints:
              item && Object.prototype.hasOwnProperty.call(item, "loyaltyPoints") && item.loyaltyPoints !== undefined && item.loyaltyPoints !== null
                ? Math.max(0, Math.round(Number(item.loyaltyPoints) || 0))
                : undefined,
          }));
          setMenuItems(normalized);
          return { success: true, items: data.items };
        }
      } catch {
        lastResult = { success: false, message: "Backend is not reachable. Start the backend server." };
      }

      if (attempt < retries) {
        await sleep(1800 * (attempt + 1));
      }
    }

    return lastResult;
  };

  const refreshMenuCategoriesFromServer = async () => {
    try {
      const { ok, data } = await apiRequest("/menu/categories");
      if (!ok || !data || data.success !== true || !Array.isArray(data.categories)) {
        return { success: false, message: data?.message || "Unable to load menu categories." };
      }
      setMenuCategories(data.categories.map((name) => String(name || "").trim()).filter(Boolean));
      return { success: true, categories: data.categories };
    } catch {
      return { success: false, message: "Backend is not reachable. Start the backend server." };
    }
  };

  const refreshPromotionsFromServer = async () => {
    try {
      const { ok, data } = await apiRequest("/promotions");
      if (!ok || !data || data.success !== true || !Array.isArray(data.promotions)) {
        return { success: false, message: data?.message || "Unable to load promotions." };
      }
      setPromotions(data.promotions);
      return { success: true, promotions: data.promotions };
    } catch {
      return { success: false, message: "Backend is not reachable. Start the backend server." };
    }
  };

  const refreshReviewsFromServer = async () => {
    try {
      const { ok, data } = await apiRequest("/reviews");
      if (!ok || !data || data.success !== true || !Array.isArray(data.reviews)) {
        return { success: false, message: data?.message || "Unable to load feedback." };
      }
      setFeedbacks(data.reviews);
      return { success: true, reviews: data.reviews };
    } catch {
      return { success: false, message: "Backend is not reachable. Start the backend server." };
    }
  };

  const saveMenuItemsToServer = async (items, token = authToken) => {
    const normalizedToken = String(token || "").trim();
    if (!normalizedToken) return { success: false, message: "Missing auth token." };

    try {
      const { ok, data } = await apiRequest("/menu/items", {
        method: "PUT",
        token: normalizedToken,
        body: { items: Array.isArray(items) ? items : [] },
      });
      if (!ok || !data || data.success !== true || !Array.isArray(data.items)) {
        return { success: false, message: data?.message || "Unable to save menu items." };
      }
      return { success: true, items: data.items };
    } catch {
      return { success: false, message: "Backend is not reachable. Start the backend server." };
    }
  };

  useEffect(() => {
    refreshMenuItemsFromServer({ retries: 3 });
    refreshMenuCategoriesFromServer();
    refreshPromotionsFromServer();
    refreshReviewsFromServer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveMenuCategoriesToServer = async (categories, token = authToken) => {
    const normalizedToken = String(token || "").trim();
    if (!normalizedToken) return { success: false, message: "Missing auth token." };

    try {
      const payload = (Array.isArray(categories) ? categories : [])
        .map((name) => String(name || "").trim())
        .filter(Boolean);

      const { ok, data } = await apiRequest("/menu/categories", {
        method: "PUT",
        token: normalizedToken,
        body: { categories: payload },
      });
      if (!ok || !data || data.success !== true || !Array.isArray(data.categories)) {
        return { success: false, message: data?.message || "Unable to save menu categories." };
      }
      setMenuCategories(data.categories.map((name) => String(name || "").trim()).filter(Boolean));
      return { success: true, categories: data.categories };
    } catch {
      return { success: false, message: "Backend is not reachable. Start the backend server." };
    }
  };

  const refreshLoyaltyRules = async () => {
    try {
      const { ok, data } = await apiRequest("/loyalty/rules");
      if (!ok || !data || data.success !== true || !Array.isArray(data.rules)) {
        return { success: false, message: data?.message || "Unable to load loyalty rules." };
      }
      setLoyaltyRules(normalizeLoyaltyRules(data.rules));
      return { success: true, rules: data.rules };
    } catch {
      return { success: false, message: "Backend is not reachable. Start the backend server." };
    }
  };

  const saveLoyaltyRulesToServer = async (token = authToken) => {
    const normalizedToken = String(token || "").trim();
    if (!normalizedToken) return { success: false, message: "Please login again." };

    try {
      const payloadRules = normalizeLoyaltyRules(loyaltyRules).map((rule) => ({
        id: rule.id,
        threshold: rule.threshold,
        discount: rule.discount,
      }));

      const { ok, data } = await apiRequest("/loyalty/rules", {
        method: "PUT",
        token: normalizedToken,
        body: { rules: payloadRules },
      });

      if (!ok || !data || data.success !== true || !Array.isArray(data.rules)) {
        return { success: false, message: data?.message || "Unable to save loyalty rules." };
      }

      setLoyaltyRules(normalizeLoyaltyRules(data.rules));
      return { success: true };
    } catch {
      return { success: false, message: "Backend is not reachable. Start the backend server." };
    }
  };

  const refreshAdminLoyaltyPurchases = async (token = authToken) => {
    const normalizedToken = String(token || "").trim();
    if (!normalizedToken) return { success: false, message: "Missing auth token." };

    try {
      const { ok, data } = await apiRequest("/loyalty/purchases", { token: normalizedToken });
      if (!ok || !data || data.success !== true || !Array.isArray(data.purchases)) {
        return { success: false, message: data?.message || "Unable to load purchases." };
      }
      setLoyaltyPurchases(data.purchases);
      if (data.pointsByEmail && typeof data.pointsByEmail === "object") {
        setAdminPointsByEmail(data.pointsByEmail);
      } else {
        setAdminPointsByEmail({});
      }
      return { success: true, purchases: data.purchases };
    } catch {
      return { success: false, message: "Backend is not reachable. Start the backend server." };
    }
  };

  const refreshOrdersFromServer = async (token = authToken) => {
    const normalizedToken = String(token || "").trim();
    if (!normalizedToken) return { success: false, message: "Missing auth token." };

    try {
      const { ok, data } = await apiRequest("/orders", { token: normalizedToken });
      if (!ok || !data || data.success !== true || !Array.isArray(data.orders)) {
        return { success: false, message: data?.message || "Unable to load orders." };
      }
      const rows = flattenServerOrderRows(data.orders);
      setPurchases(rows);
      return { success: true, orders: data.orders, purchases: rows };
    } catch {
      return { success: false, message: "Backend is not reachable. Start the backend server." };
    }
  };
  const refreshAdminOrders = refreshOrdersFromServer;

  const refreshAdminUsers = async (token = authToken) => {
    const normalizedToken = String(token || "").trim();
    if (!normalizedToken) return { success: false, message: "Missing auth token." };

    try {
      const { ok, data } = await apiRequest("/admin/users", { token: normalizedToken });
      if (!ok || !data || data.success !== true || !Array.isArray(data.users)) {
        return { success: false, message: data?.message || "Unable to load users." };
      }
      setUsers(data.users);
      return { success: true, users: data.users };
    } catch {
      return { success: false, message: "Backend is not reachable. Start the backend server." };
    }
  };

  const refreshVipBookingsFromServer = async (token = authToken) => {
    const normalizedToken = String(token || "").trim();
    if (!normalizedToken) {
      return { success: false, message: "Missing auth token." };
    }

    try {
      const { ok, data } = await apiRequest("/vip-bookings", { token: normalizedToken });
      if (!ok || !data || data.success !== true || !Array.isArray(data.bookings)) {
        return { success: false, message: data?.message || "Unable to load VIP bookings." };
      }
      setVipBookings(data.bookings);
      return { success: true, bookings: data.bookings };
    } catch {
      return { success: false, message: "Backend is not reachable. Start the backend server." };
    }
  };

  const refreshLoyaltySummary = async (token = authToken) => {
    const normalizedToken = String(token || "").trim();
    if (!normalizedToken) {
      setLoyaltySummary({ points: 0, discountPercent: 0 });
      return { success: false, message: "Missing auth token." };
    }

    try {
      const { ok, data } = await apiRequest("/loyalty/me", { token: normalizedToken });
      if (!ok || !data || data.success !== true) {
        return { success: false, message: data?.message || "Unable to load loyalty summary." };
      }
      const summary = data.summary || {};
      setLoyaltySummary({
        points: Number(summary.points) || 0,
        discountPercent: Number(summary.discountPercent) || 0,
      });
      if (Array.isArray(summary.rules)) {
        setLoyaltyRules(normalizeLoyaltyRules(summary.rules));
      }
      return { success: true, summary };
    } catch {
      return { success: false, message: "Backend is not reachable. Start the backend server." };
    }
  };

  useEffect(() => {
    const token = String(authToken || "").trim();
    if (!token) {
      setAuthUser(null);
      setLoyaltySummary({ points: 0, discountPercent: 0 });
      setLoyaltyPurchases([]);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const { ok, data } = await apiRequest("/users/me", { token });
        if (cancelled) return;
        if (!ok || !data || data.success !== true || !data.user) {
          setAuthUser(null);
          setAuthToken("");
          setLoyaltySummary({ points: 0, discountPercent: 0 });
          setLoyaltyPurchases([]);
          return;
        }
        setAuthUser(data.user);
        upsertLocalUser(data.user);
        if (String(data.user.role || "") !== "admin") {
          refreshOrdersFromServer(token);
          refreshLoyaltySummary(token);
          refreshVipBookingsFromServer(token);
        } else {
          setLoyaltySummary({ points: 0, discountPercent: 0 });
          refreshLoyaltyRules();
          refreshMenuItemsFromServer();
          refreshPromotionsFromServer();
          refreshReviewsFromServer();
          refreshAdminUsers(token);
          refreshAdminOrders(token);
          refreshAdminLoyaltyPurchases(token);
          refreshVipBookingsFromServer(token);
        }
      } catch {
        // ignore if backend offline
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authToken]);

  useEffect(() => {
    const token = String(authToken || "").trim();
    if (!token || !authUser) return undefined;

    const refreshLiveData = () => {
      if (typeof document !== "undefined" && document.hidden) return;
      refreshOrdersFromServer(token);
      refreshVipBookingsFromServer(token);
      if (authUser.role === "admin") {
        refreshAdminLoyaltyPurchases(token);
        return;
      }
      refreshLoyaltySummary(token);
    };

    const intervalMs = authUser.role === "admin" ? 8000 : 12000;
    const intervalId = window.setInterval(refreshLiveData, intervalMs);
    const handleVisibilityChange = () => {
      if (!document.hidden) refreshLiveData();
    };

    window.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("visibilitychange", handleVisibilityChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authToken, authUser?.email, authUser?.role]);

// login validation
  const login = async (email, password) => {
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const normalizedPassword = String(password || "").trim();

    if (!normalizedEmail || !normalizedPassword) {
      return { success: false, message: "Please enter email and password." };
    }

    try {
      const { ok, data } = await apiRequest("/auth/login", {
        method: "POST",
        body: { email: normalizedEmail, password: normalizedPassword },
      });

      if (!ok || !data || data.success !== true) {
        return { success: false, message: data?.message || "Invalid credentials." };
      }

      if (data.token) setAuthToken(String(data.token));
      if (data.user) setAuthUser(data.user);
      if (data.user) upsertLocalUser(data.user);

      if (data.token && data.role !== "admin") {
        refreshLoyaltySummary(String(data.token));
      } else {
        setLoyaltySummary({ points: 0, discountPercent: 0 });
      }

      return { success: true, role: data.role };
    } catch {
      return { success: false, message: "Backend is not reachable. Start the backend server." };
    }
  };

  const signup = async ({ fullName, email, password, phone, streetAddress1, streetAddress2, cityTown } = {}) => {
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const normalizedPhone = String(phone || "").trim();
    const normalizedStreet1 = String(streetAddress1 || "").trim();
    const normalizedStreet2 = String(streetAddress2 || "").trim();
    const normalizedCityTown = String(cityTown || "").trim();
    const normalizedAddress = formatAddress({
      streetAddress1: normalizedStreet1,
      streetAddress2: normalizedStreet2,
      cityTown: normalizedCityTown,
    });
// signupvalidation
    if (!String(fullName || "").trim() || !normalizedEmail || !String(password || "").trim() || !normalizedPhone || !normalizedStreet1 || !normalizedCityTown) {
      return { success: false, message: "Please fill all required fields." };
    }
    if (String(fullName || "").trim().length < 2) {
      return { success: false, message: "Full name must be at least 2 characters." };
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return { success: false, message: "Please enter a valid email address." };
    }
    if (String(password || "").length < 8) {
      return { success: false, message: "Password must be at least 8 characters." };
    }
    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password)) {
      return { success: false, message: "Password must include uppercase, lowercase, and a number." };
    }
    if (!/^[0-9+\-\s]{9,15}$/.test(normalizedPhone)) {
      return { success: false, message: "Please enter a valid phone number." };
    }
    if (normalizedStreet1.length < 3) {
      return { success: false, message: "Please enter a valid street address." };
    }
    if (normalizedCityTown.length < 2) {
      return { success: false, message: "Please enter a valid town/city." };
    }

    if (ADMIN_EMAIL && normalizedEmail === ADMIN_EMAIL) {
      return { success: false, message: "This email is reserved." };
    }

    const exists = users.some((user) => user.email.toLowerCase() === normalizedEmail);
    if (exists) {
      return { success: false, message: "Email already registered." };
    }

    try {
      const { ok, data } = await apiRequest("/auth/signup", {
        method: "POST",
        body: {
          fullName: String(fullName || "").trim(),
          email: normalizedEmail,
          password: String(password || ""),
          phone: normalizedPhone,
          streetAddress1: normalizedStreet1,
          streetAddress2: normalizedStreet2,
          cityTown: normalizedCityTown,
          address: normalizedAddress,
        },
      });

      if (!ok || !data || data.success !== true) {
        return { success: false, message: data?.message || "Signup failed." };
      }

      if (data.token) setAuthToken(String(data.token));
      if (data.user) setAuthUser(data.user);
      if (data.user) upsertLocalUser(data.user);
      if (data.token) refreshLoyaltySummary(String(data.token));

      return { success: true, role: data.role || "user" };
    } catch {
      return { success: false, message: "Backend is not reachable. Start the backend server." };
    }
  };

  const loginWithGoogle = async (idToken) => {
    const tokenText = String(idToken || "").trim();
    if (!tokenText) {
      return { success: false, message: "Missing Google token." };
    }

    try {
      const { ok, data } = await apiRequest("/auth/google", {
        method: "POST",
        body: { idToken: tokenText },
      });

      if (!ok || !data || data.success !== true) {
        return { success: false, message: data?.message || "Google login failed." };
      }

      if (data.token) setAuthToken(String(data.token));
      if (data.user) setAuthUser(data.user);
      if (data.user) upsertLocalUser(data.user);

      if (data.token && data.role !== "admin") {
        refreshLoyaltySummary(String(data.token));
      } else {
        setLoyaltySummary({ points: 0, discountPercent: 0 });
      }

      return { success: true, role: data.role };
    } catch {
      return { success: false, message: "Backend is not reachable. Start the backend server." };
    }
  };

  const updateUserProfile = async ({ fullName, phone, streetAddress1, streetAddress2, cityTown } = {}) => {
    if (!authUser || authUser.role !== "user") {
      return { success: false, message: "Only logged-in users can update profile." };
    }

    const normalizedFullName = String(fullName || "").trim();
    const normalizedPhone = String(phone || "").trim();
    const normalizedStreet1 = String(streetAddress1 || "").trim();
    const normalizedStreet2 = String(streetAddress2 || "").trim();
    const normalizedCityTown = String(cityTown || "").trim();
    const normalizedAddress = formatAddress({
      streetAddress1: normalizedStreet1,
      streetAddress2: normalizedStreet2,
      cityTown: normalizedCityTown,
    });

    if (normalizedFullName.length < 2) {
      return { success: false, message: "Full name must be at least 2 characters." };
    }
    if (!/^[0-9+\-\s]{9,15}$/.test(normalizedPhone)) {
      return { success: false, message: "Please enter a valid phone number." };
    }
    if (normalizedStreet1.length < 3) {
      return { success: false, message: "Please enter a valid street address." };
    }
    if (normalizedCityTown.length < 2) {
      return { success: false, message: "Please enter a valid town/city." };
    }

    const token = String(authToken || "").trim();
    if (!token) return { success: false, message: "Please login again." };

    try {
      const { ok, data } = await apiRequest("/users/me", {
        method: "PUT",
        token,
        body: {
          fullName: normalizedFullName,
          phone: normalizedPhone,
          streetAddress1: normalizedStreet1,
          streetAddress2: normalizedStreet2,
          cityTown: normalizedCityTown,
          address: normalizedAddress,
        },
      });

      if (!ok || !data || data.success !== true || !data.user) {
        return { success: false, message: data?.message || "Unable to update profile." };
      }

      setAuthUser(data.user);
      upsertLocalUser(data.user);
      return { success: true, message: "Profile updated successfully." };
    } catch {
      return { success: false, message: "Backend is not reachable. Start the backend server." };
    }
  };

  const logout = () => {
    setAuthUser(null);
    setAuthToken("");
    setLoyaltySummary({ points: 0, discountPercent: 0 });
  };

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

  const updateLoyaltyRule = (id, field, value) => {
    const normalizedField = field === "discount" ? "discount" : "threshold";
    const normalizedId = String(id || "");
    setLoyaltyRules((current) =>
      normalizeLoyaltyRules(
        (Array.isArray(current) ? current : []).map((rule) =>
          String(rule.id) === normalizedId ? { ...rule, [normalizedField]: value } : rule
        )
      )
    );
    return { success: true };
  };

  const addLoyaltyRule = () => {
    const nextId = `r${Date.now()}`;
    setLoyaltyRules((current) =>
      normalizeLoyaltyRules([...(Array.isArray(current) ? current : []), { id: nextId, threshold: "", discount: "" }])
    );
    return { success: true };
  };

  const removeLoyaltyRule = (id) => {
    const normalizedId = String(id || "");
    setLoyaltyRules((current) =>
      normalizeLoyaltyRules((Array.isArray(current) ? current : []).filter((rule) => String(rule.id) !== normalizedId))
    );
    return { success: true };
  };

  const addToCart = ({ menuItemId, itemName, price, image, size = "Small" }) => {
    const guestKey = getGuestCartKey();
    const isGuest = Boolean(guestKey) && (!authUser || authUser.role !== "user");
    if (!authUser && !isGuest) {
      return { success: false, message: "Please login as user to use cart." };
    }
    if (authUser && authUser.role !== "user" && !isGuest) {
      return { success: false, message: "Please login as user to use cart." };
    }
    const menuItem = menuItems.find(
      (item) =>
        (menuItemId && item.id === menuItemId) ||
        (!menuItemId && item.name === itemName)
    );
    if (!menuItem) {
      return { success: false, message: "Menu item not found ." };
    }
    if (menuItem.outOfStock) {
      return { success: false, message: "This item is currently out of stock." };
    }

    const priceValue = parsePrice(price);
    const cartOwnerKey = isGuest ? guestKey : authUser.email;
    const existing = cartItems.find(
      (item) =>
        item.userEmail === cartOwnerKey &&
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
      menuItemId: menuItem.id,
      itemName,
      size,
      image,
      unitPrice: priceValue,
      quantity: 1,
      userEmail: cartOwnerKey,
    };
    setCartItems((current) => [cartItem, ...current]);
    return { success: true };
  };

  const increaseCartQty = (cartItemId) => {
    const guestKey = getGuestCartKey();
    const isGuest = Boolean(guestKey) && (!authUser || authUser.role !== "user");
    if (!authUser && !isGuest) return;
    if (authUser && authUser.role !== "user" && !isGuest) return;
    const cartOwnerKey = isGuest ? guestKey : authUser.email;
    setCartItems((current) =>
      current.map((item) =>
        item.id === cartItemId && item.userEmail === cartOwnerKey
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    );
  };

  const decreaseCartQty = (cartItemId) => {
    const guestKey = getGuestCartKey();
    const isGuest = Boolean(guestKey) && (!authUser || authUser.role !== "user");
    if (!authUser && !isGuest) return;
    if (authUser && authUser.role !== "user" && !isGuest) return;
    const cartOwnerKey = isGuest ? guestKey : authUser.email;
    setCartItems((current) =>
      current.map((item) =>
        item.id === cartItemId && item.userEmail === cartOwnerKey
          ? { ...item, quantity: Math.max(1, item.quantity - 1) }
          : item
      )
    );
  };

  const removeFromCart = (cartItemId) => {
    const guestKey = getGuestCartKey();
    const isGuest = Boolean(guestKey) && (!authUser || authUser.role !== "user");
    if (!authUser && !isGuest) return;
    if (authUser && authUser.role !== "user" && !isGuest) return;
    const cartOwnerKey = isGuest ? guestKey : authUser.email;
    setCartItems((current) =>
      current.filter(
        (item) => !(item.id === cartItemId && item.userEmail === cartOwnerKey)
      )
    );
  };

  const clearCart = () => {
    const guestKey = getGuestCartKey();
    const isGuest = Boolean(guestKey) && (!authUser || authUser.role !== "user");
    if (!authUser && !isGuest) return;
    if (authUser && authUser.role !== "user" && !isGuest) return;
    const cartOwnerKey = isGuest ? guestKey : authUser.email;
    setCartItems((current) =>
      (Array.isArray(current) ? current : []).filter((item) => String(item?.userEmail || "").trim().toLowerCase() !== String(cartOwnerKey || "").trim().toLowerCase())
    );
  };

  const placeOrderFromCart = async (checkoutDetails = {}) => {
    const guestKey = getGuestCartKey();
    const isGuest = Boolean(guestKey) && (!authUser || authUser.role !== "user");
    if (!authUser && !isGuest) {
      return { success: false, message: "Please login as user to place order." };
    }
    if (authUser && authUser.role !== "user" && !isGuest) {
      return { success: false, message: "Please login as user to place order." };
    }

    const cartOwnerKey = isGuest ? guestKey : authUser.email;
    const userCart = cartItems.filter((item) => item.userEmail === cartOwnerKey);
    if (userCart.length === 0) {
      return { success: false, message: "Your cart is empty." };
    }

    const outOfStockItems = userCart
      .filter((cartItem) => {
        const menuItem = menuItems.find(
          (item) =>
            (cartItem.menuItemId && item.id === cartItem.menuItemId) ||
            item.name === cartItem.itemName
        );
        return menuItem?.outOfStock;
      })
      .map((item) => item.itemName);
    if (outOfStockItems.length > 0) {
      return {
        success: false,
        message: `Out of stock: ${[...new Set(outOfStockItems)].join(", ")}. Remove them from cart to continue.`,
      };
    }

    if (isGuest) {
      const tableId = String(tableContext?.tableId || "").trim();
      const tableSessionId = String(tableContext?.sessionId || "").trim();
      const tableToken = String(tableContext?.tableToken || "").trim();
      if (!tableId || !tableSessionId) {
        return { success: false, message: "Missing dine-in session. Scan the table QR again." };
      }

      try {
        const { ok, data } = await apiRequest("/orders/dine-in", {
          method: "POST",
          body: {
            tableId,
            tableSessionId,
            tableToken,
            guestCount: Number(tableContext?.guestCount) || 1,
            items: userCart.map((item) => ({
              menuItemId: item.menuItemId || "",
              itemName: item.itemName || "",
              quantity: item.quantity,
              size: item.size || "",
            })),
          },
        });

        if (!ok || !data || data.success !== true || !data.order) {
          return { success: false, message: data?.message || "Unable to place dine-in order." };
        }

        setCartItems((current) => (Array.isArray(current) ? current : []).filter((item) => item.userEmail !== guestKey));
        return { success: true, order: data.order, mode: "guest-dine-in" };
      } catch {
        return { success: false, message: "Backend is not reachable. Start the backend server." };
      }
    }

    const { orderType = "Delivery", paymentMethod = "Cash", deliveryDetails } = checkoutDetails;
    const normalizedDeliveryDetails = deliveryDetails && typeof deliveryDetails === "object" ? deliveryDetails : null;
    const normalizedOrderType = String(orderType || "").trim();

    const storedUser = users.find(
      (item) => String(item.email || "").toLowerCase() === String(authUser.email || "").toLowerCase()
    );
    const resolvedDeliveryDetails =
      orderType === "Delivery"
        ? {
            name: String(authUser.fullName || storedUser?.fullName || "").trim(),
            phone: String(normalizedDeliveryDetails?.phone ?? authUser.phone ?? storedUser?.phone ?? "").trim(),
            streetAddress1: String(
              normalizedDeliveryDetails?.streetAddress1 ?? authUser.streetAddress1 ?? storedUser?.streetAddress1 ?? ""
            ).trim(),
            streetAddress2: String(
              normalizedDeliveryDetails?.streetAddress2 ?? authUser.streetAddress2 ?? storedUser?.streetAddress2 ?? ""
            ).trim(),
            cityTown: String(normalizedDeliveryDetails?.cityTown ?? authUser.cityTown ?? storedUser?.cityTown ?? "").trim(),
            location:
              formatAddress({
                streetAddress1: normalizedDeliveryDetails?.streetAddress1 ?? authUser.streetAddress1 ?? storedUser?.streetAddress1,
                streetAddress2: normalizedDeliveryDetails?.streetAddress2 ?? authUser.streetAddress2 ?? storedUser?.streetAddress2,
                cityTown: normalizedDeliveryDetails?.cityTown ?? authUser.cityTown ?? storedUser?.cityTown,
              }) ||
              String(normalizedDeliveryDetails?.location ?? authUser.address ?? storedUser?.address ?? "").trim(),
          }
        : null;

    if (orderType === "Delivery") {
      const hasAllDeliveryFields =
        resolvedDeliveryDetails &&
        String(resolvedDeliveryDetails.name || "").trim() &&
        String(resolvedDeliveryDetails.phone || "").trim() &&
        (String(resolvedDeliveryDetails.streetAddress1 || "").trim() || String(resolvedDeliveryDetails.location || "").trim()) &&
        (String(resolvedDeliveryDetails.cityTown || "").trim() || String(resolvedDeliveryDetails.location || "").trim());
      if (!hasAllDeliveryFields) {
        return { success: false, message: "Please complete your profile details before placing a delivery order." };
      }
    }

    const pricing = calculateCheckoutPricing({
      cartItems: userCart,
      userEmail: authUser.email,
      promotions,
      points: loyaltySummary?.points,
      loyaltyPercent: loyaltySummary?.discountPercent,
      orderType: normalizedOrderType,
      deliveryAddress: resolvedDeliveryDetails?.location,
      deliveryCityTown: resolvedDeliveryDetails?.cityTown,
    });

    if (orderType === "Delivery" && pricing.deliveryAllowed === false) {
      return { success: false, message: "Delivery is not available for this area. Please choose Takeaway." };
    }

   const token = String(authToken || "").trim();
    const paymentMethodText = String(paymentMethod || "").trim().toLowerCase();
    const normalizedPaymentMethod = paymentMethodText.includes("card") ? "Card" : "Cash";

    let serverOrder = null;
    let serverOrderId = "";

    // Prefer server-side order creation so totals + delivery fees are authoritative and PayHere can reference the order id.
    if (token) {
      try {
        if (normalizedOrderType === "DineIn") {
          const sessionId = String(tableContext?.sessionId || "").trim();
          const tableId = String(tableContext?.tableId || "").trim();
          if (!tableId || !sessionId) {
            return { success: false, message: "Missing dine-in session. Scan the table QR again." };
          }
        }

        const { ok, data } = await apiRequest("/orders", {
          method: "POST",
          token,
          body: {
            orderType: normalizedOrderType,
            paymentMethod: normalizedPaymentMethod,
            promotionDiscount: pricing.promotionDiscount,
            deliveryAddress: resolvedDeliveryDetails?.location || "",
            deliveryCityTown: resolvedDeliveryDetails?.cityTown || "",
            tableId: normalizedOrderType === "DineIn" ? String(tableContext?.tableId || "").trim() : "",
            tableSessionId: normalizedOrderType === "DineIn" ? String(tableContext?.sessionId || "").trim() : "",
            items: userCart.map((item) => ({
              menuItemId: item.menuItemId || "",
              itemName: item.itemName || "",
              quantity: item.quantity,
              size: item.size || "",
            })),
          },
        });

        if (ok && data && data.success === true && data.order) {
          serverOrder = data.order;
          serverOrderId = String(serverOrder.id || "").trim();
        } else if (normalizedPaymentMethod === "Card") {
          return { success: false, message: data?.message || "Unable to create order for card payment." };
        }
      } catch {
        if (normalizedPaymentMethod === "Card") {
          return { success: false, message: "Backend is not reachable. Start the backend server." };
        }
      }
    } else if (normalizedPaymentMethod === "Card") {
      return { success: false, message: "Please login again." };
    }

    const orderId = serverOrderId || crypto.randomUUID();
    const resolvedNextOrderNumber = (() => {
      try {
        const stored = Number.parseInt(localStorage.getItem(ORDER_COUNTER_STORAGE_KEY) || "", 10);
        if (Number.isFinite(stored) && stored >= ORDER_REF_START) return stored;
      } catch {
        // ignore
      }
      const existing = (Array.isArray(purchases) ? purchases : [])
        .map((item) => Number(item?.orderNumber))
        .filter((value) => Number.isFinite(value) && value >= ORDER_REF_START);
      if (existing.length > 0) return Math.max(...existing) + 1;
      return ORDER_REF_START;
    })();
    safeLocalStorageSetItem(ORDER_COUNTER_STORAGE_KEY, String(resolvedNextOrderNumber + 1));
    const orderRef = formatOrderRef(resolvedNextOrderNumber);
    const createdAt = serverOrder?.createdAt || new Date().toISOString();
    let remainingDiscount = Math.min(pricing.totalDiscount, pricing.subtotal);

    const orderRows = userCart.map((item, index) => {
      const rowSubtotal = item.unitPrice * item.quantity;
      const matchingMenuItem = menuItems.find(
        (menuItem) => (item.menuItemId && menuItem.id === item.menuItemId) || menuItem.name === item.itemName
      );
      const loyaltyPointsPerUnit =
        typeof matchingMenuItem?.loyaltyPoints === "number"
          ? matchingMenuItem.loyaltyPoints
          : Math.max(0, Math.round(Number(item.unitPrice) || 0));
      const loyaltyPointsEarned = Math.max(0, Math.round(loyaltyPointsPerUnit * (Number(item.quantity) || 0)));
      const share =
        pricing.totalDiscount > 0 && pricing.subtotal > 0
          ? index === userCart.length - 1
            ? remainingDiscount
            : Math.min(
                remainingDiscount,
                Math.min(
                  rowSubtotal,
                  Math.max(0, Math.round((rowSubtotal / pricing.subtotal) * pricing.totalDiscount))
                )
              )
          : 0;
      const safeShare = Math.min(rowSubtotal, Math.max(0, share));
      remainingDiscount -= safeShare;
      const finalRowTotal = Math.max(0, rowSubtotal - safeShare);

      return {
        id: crypto.randomUUID(),
        orderId,
        orderNumber: resolvedNextOrderNumber,
        orderRef,
        menuItemId: item.menuItemId,
        image: item.image,
        itemName: item.itemName,
        originalPrice: formatPrice(rowSubtotal),
        discountAmount: safeShare,
        finalAmount: finalRowTotal,
        price: formatPrice(finalRowTotal),
        size: item.size,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        status: "Pending",
        userEmail: authUser.email,
        orderType: normalizedOrderType,
        paymentMethod: normalizedPaymentMethod,
        deliveryDetails: resolvedDeliveryDetails,
        createdAt,
        orderSubtotal: serverOrder?.subtotal ?? pricing.subtotal,
        orderTotalDiscount: pricing.totalDiscount,
        deliveryZone: serverOrder?.deliveryZone ?? pricing.deliveryZone,
        deliveryFee: serverOrder?.deliveryFee ?? pricing.deliveryFee,
        orderTotal: serverOrder?.finalPaid ?? (pricing.grandTotal ?? pricing.total),
        promotionId: pricing.promotion?.id || null,
        promotionTitle: pricing.promotion?.title || null,
        promotionDiscount: serverOrder?.promotionDiscount ?? pricing.promotionDiscount,
        loyaltyPointsAtPurchase: pricing.points,
        loyaltyDiscountPercent: serverOrder?.loyaltyPercentUsed ?? pricing.loyaltyPercent,
        loyaltyDiscount: serverOrder?.loyaltyDiscount ?? pricing.loyaltyDiscount,
        loyaltyPointsPerUnit,
        loyaltyPointsEarned,
      };
    });

    if (resolvedDeliveryDetails) {
      setDeliveryDetailsByUser((current) => ({
        ...current,
        [authUser.email]: {
          name: String(resolvedDeliveryDetails.name || "").trim(),
          phone: String(resolvedDeliveryDetails.phone || "").trim(),
          streetAddress1: String(resolvedDeliveryDetails.streetAddress1 || "").trim(),
          streetAddress2: String(resolvedDeliveryDetails.streetAddress2 || "").trim(),
          cityTown: String(resolvedDeliveryDetails.cityTown || "").trim(),
          location: String(resolvedDeliveryDetails.location || "").trim(),
        },
      }));
    }

    setPurchases((current) => [...orderRows, ...current]);
    setCartItems((current) =>
      current.filter((item) => item.userEmail !== authUser.email)
    );

    // PayHere (Card): start the payment after order is created and cart is cleared.
    if (token && normalizedPaymentMethod === "Card" && serverOrderId) {
      try {
        const nameParts = splitFullName(resolvedDeliveryDetails?.name || authUser.fullName || "");
        const { ok, data } = await apiRequest(`/orders/${encodeURIComponent(orderId)}/payments`, {
          method: "POST",
          token,
          body: {
            provider: "payhere",
            customer: {
              firstName: nameParts.firstName,
              lastName: nameParts.lastName,
              email: authUser.email,
              phone: resolvedDeliveryDetails?.phone || authUser.phone || "",
              address: resolvedDeliveryDetails?.location || authUser.address || "",
              city: resolvedDeliveryDetails?.cityTown || authUser.cityTown || "",
              country: "Sri Lanka",
            },
          },
        });

        if (!ok || !data || data.success !== true || !data.checkout) {
          return { success: false, message: data?.message || "Unable to start card payment." };
        }

        const submitted = submitPostForm({ actionUrl: data.checkout.actionUrl, fields: data.checkout.fields });
        if (!submitted) {
          return { success: false, message: "Unable to open payment gateway. Please try again." };
        }
        return { success: true, redirect: "payhere" };
      } catch {
        return { success: false, message: "Unable to start card payment. Backend is not reachable." };
      }
    }

    // Fallback (older backend): sync the order into loyalty purchases if /orders isn't available.
    if (token && !serverOrderId) {
      try {
        const grandTotal = pricing.grandTotal ?? pricing.total;
          const payload = [
          {
            id: orderId,
            orderId,
            subtotal: pricing.subtotal,
            promotionDiscount: pricing.promotionDiscount,
            orderType: normalizedOrderType,
            status: "Pending",
            items: userCart.map((item) => ({
              menuItemId: item.menuItemId || "",
              itemName: item.itemName || "",
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              size: item.size || "",
            })),
            deliveryAddress: resolvedDeliveryDetails?.location || "",
            deliveryCityTown: resolvedDeliveryDetails?.cityTown || "",
            tableId: normalizedOrderType === "DineIn" ? String(tableContext?.tableId || "").trim() : "",
            tableSessionId: normalizedOrderType === "DineIn" ? String(tableContext?.sessionId || "").trim() : "",
            price: `SLR ${Math.round(Number(grandTotal) || 0)}`,
            createdAt,
          },
        ];
        const { ok, data } = await apiRequest("/loyalty/purchases", {
          method: "POST",
          token,
          body: { purchases: payload },
        });
        if (ok && data && data.success === true && data.summary) {
          setLoyaltySummary({
            points: Number(data.summary.points) || 0,
            discountPercent: Number(data.summary.discountPercent) || 0,
          });
        }
      } catch {
        // Ignore backend sync errors so checkout still succeeds.
      }
    }
    return { success: true };
  };

  const normalizePurchaseStatus = (status) => {
    const text = String(status || "").trim();
    if (!text) return "";
    const lower = text.toLowerCase();
    if (lower === "pending") return "Pending";
    if (lower === "preparing") return "Preparing";
    if (lower === "prepared" || lower === "prepared (ready)" || lower === "ready") return "Prepared (Ready)";
    if (lower === "out for delivery" || lower === "outfordelivery") return "Out for Delivery";
    if (lower === "delivered") return "Delivered";
    if (lower === "cancelled" || lower === "canceled" || lower === "canceled by admin" || lower === "cancelled by admin")
      return "Cancelled";
    return text;
  };

  const updatePurchaseStatus = (purchaseId, status, cancelReason = "") => {
    const normalizedPurchaseId = String(purchaseId || "").trim();
    if (!normalizedPurchaseId) {
      return { success: false, message: "Purchase id is required." };
    }

    const nextStatus = normalizePurchaseStatus(status) || String(status || "").trim();
    const normalizedReason = String(cancelReason || "").trim();
    if (nextStatus === "Cancelled" && !normalizedReason) {
      return { success: false, message: "Please provide a cancellation reason." };
    }

    const exists = purchases.some((purchase) => String(purchase?.id || "").trim() === normalizedPurchaseId);
    if (!exists) {
      return { success: false, message: "Purchase not found." };
    }

    setPurchases((current) =>
      current.map((purchase) => {
        if (String(purchase?.id || "").trim() !== normalizedPurchaseId) return purchase;
        return {
          ...purchase,
          status: nextStatus,
          cancelReason: nextStatus === "Cancelled" ? normalizedReason : "",
          statusUpdatedAt: new Date().toISOString(),
        };
      })
    );
    return { success: true };
  };

  const updateOrderStatus = async (orderId, status, cancelReason = "") => {
    const normalizedOrderId = String(orderId || "").trim();
    if (!normalizedOrderId) {
      return { success: false, message: "Order id is required." };
    }

    const nextStatus = normalizePurchaseStatus(status) || String(status || "").trim();
    const normalizedReason = String(cancelReason || "").trim();
    if (nextStatus === "Cancelled" && !normalizedReason) {
      return { success: false, message: "Please provide a cancellation reason." };
    }

    const token = String(authToken || "").trim();
    if (token && authUser?.role === "admin") {
      try {
        const { ok, data } = await apiRequest(`/orders/${encodeURIComponent(normalizedOrderId)}/status`, {
          method: "PATCH",
          token,
          body: { status: nextStatus, cancelReason: normalizedReason },
        });

        if (!ok || !data || data.success !== true || !data.order) {
          return { success: false, message: data?.message || "Unable to update order status." };
        }

        const rows = flattenServerOrderRows([data.order]);
        setPurchases((current) => [
          ...rows,
          ...(Array.isArray(current) ? current : []).filter((purchase) => {
            const purchaseOrderId = String(purchase?.orderId || "").trim();
            const purchaseId = String(purchase?.id || "").trim();
            return purchaseOrderId !== normalizedOrderId && purchaseId !== normalizedOrderId;
          }),
        ]);
        return { success: true, order: data.order };
      } catch {
        return { success: false, message: "Backend is not reachable. Start the backend server." };
      }
    }

    const matches = purchases.some((purchase) => {
      const purchaseOrderId = String(purchase?.orderId || "").trim();
      const purchaseId = String(purchase?.id || "").trim();
      return purchaseOrderId === normalizedOrderId || purchaseId === normalizedOrderId;
    });
    if (!matches) {
      return { success: false, message: "Order not found." };
    }

    setPurchases((current) =>
      current.map((purchase) => {
        const purchaseOrderId = String(purchase.orderId || "").trim();
        const purchaseId = String(purchase.id || "").trim();
        if (purchaseOrderId !== normalizedOrderId && purchaseId !== normalizedOrderId) return purchase;
        return {
          ...purchase,
          status: nextStatus,
          cancelReason: nextStatus === "Cancelled" ? normalizedReason : "",
          statusUpdatedAt: new Date().toISOString(),
        };
      })
    );
    return { success: true };
  };

  const normalizeVipBookingStatus = (status) => {
    const text = String(status || "").trim();
    if (!text) return "";
    const lower = text.toLowerCase();
    if (lower === "pending") return "Pending";
    if (lower === "confirmed") return "Confirmed";
    if (lower === "cancelled" || lower === "canceled") return "Cancelled";
    return text;
  };

  const updateVipBookingStatus = async (bookingId, status, cancelReason = "") => {
    if (!authUser) {
      return { success: false, message: "Please login again." };
    }

    const normalizedBookingId = String(bookingId || "").trim();
    if (!normalizedBookingId) {
      return { success: false, message: "Booking id is required." };
    }

    const nextStatus = normalizeVipBookingStatus(status) || String(status || "").trim();
    const normalizedReason = String(cancelReason || "").trim();
    if (authUser.role === "admin" && nextStatus === "Cancelled" && !normalizedReason) {
      return { success: false, message: "Please provide a cancellation reason." };
    }

    const token = String(authToken || "").trim();
    if (!token) return { success: false, message: "Please login again." };

    try {
      const { ok, data } = await apiRequest(`/vip-bookings/${encodeURIComponent(normalizedBookingId)}/status`, {
        method: "PATCH",
        token,
        body: { status: nextStatus, cancelReason: normalizedReason },
      });

      if (!ok || !data || data.success !== true || !data.booking) {
        return { success: false, message: data?.message || "Unable to update booking status." };
      }

      setVipBookings((current) =>
        (Array.isArray(current) ? current : []).map((booking) =>
          String(booking?.id || "").trim() === normalizedBookingId ? data.booking : booking
        )
      );
      return { success: true, booking: data.booking };
    } catch {
      return { success: false, message: "Backend is not reachable. Start the backend server." };
    }
  };

  const cancelVipBookingByUser = async (bookingId) => {
    if (!authUser || authUser.role !== "user") {
      return { success: false, message: "Only logged-in users can cancel bookings." };
    }

    const result = await updateVipBookingStatus(bookingId, "Cancelled");
    if (!result?.success) return result;

    return { success: true, message: result?.message || "Booking cancelled successfully." };
  };

  const addFeedback = async ({ rating, message }) => {
    if (!authUser || authUser.role !== "user") {
      return { success: false, message: "Only logged-in users can submit feedback." };
    }
    const token = String(authToken || "").trim();
    if (!token) return { success: false, message: "Please login again." };

    const normalizedMessage = String(message || "").trim();
    const ratingValue = Number(rating);
    if (!normalizedMessage) {
      return { success: false, message: "Please enter your feedback message." };
    }
    if (!Number.isFinite(ratingValue) || ratingValue < 1 || ratingValue > 5) {
      return { success: false, message: "Please select a rating between 1 and 5." };
    }

    try {
      const { ok, data } = await apiRequest("/reviews", {
        method: "POST",
        token,
        body: {
          rating: ratingValue,
          message: normalizedMessage,
        },
      });

      if (!ok || !data || data.success !== true || !data.review) {
        return { success: false, message: data?.message || "Unable to submit feedback." };
      }

      setFeedbacks((current) => [data.review, ...(Array.isArray(current) ? current : []).filter((item) => item.id !== data.review.id)]);
      return { success: true, review: data.review };
    } catch {
      return { success: false, message: "Backend is not reachable. Start the backend server." };
    }
  };

  const addPromotion = async ({
    type,
    title,
    description,
    discountType,
    discountValue,
    maxDiscount,
    minOrderValue,
    promoCode,
    startDate,
    endDate,
    imageUrl,
    displayInHomeHeader,
    activateNow,
  }) => {
    if (!authUser || authUser.role !== "admin") {
      return { success: false, message: "Only admins can create promotions." };
    }
    const token = String(authToken || "").trim();
    if (!token) return { success: false, message: "Please login again." };

    const normalizedType = type === "vip" ? "vip" : "food";
    const normalizedTitle = String(title || "").trim();
    const normalizedDescription = String(description || "").trim();
    const normalizedDiscountType = discountType === "fixed" ? "fixed" : "percentage";
    const normalizedDiscountValue = Number(discountValue);
    const normalizedMaxDiscount = Number(maxDiscount) || 0;
    const normalizedMinOrderValue = Number(minOrderValue) || 0;
    const normalizedPromoCode = String(promoCode || "").trim().toUpperCase();
    const normalizedStartDate = String(startDate || "").trim();
    const normalizedEndDate = String(endDate || "").trim();
    const normalizedImageUrl = String(imageUrl || "").trim();

    if (!normalizedTitle || !normalizedDescription || !normalizedStartDate || !normalizedEndDate) {
      return { success: false, message: "Please fill all required promotion fields." };
    }
    if (!Number.isFinite(normalizedDiscountValue) || normalizedDiscountValue <= 0) {
      return { success: false, message: "Discount value must be greater than zero." };
    }
    if (new Date(normalizedEndDate).getTime() < new Date(normalizedStartDate).getTime()) {
      return { success: false, message: "End date must be after start date." };
    }

    try {
      const { ok, data } = await apiRequest("/promotions", {
        method: "POST",
        token,
        body: {
          type: normalizedType,
          title: normalizedTitle,
          description: normalizedDescription,
          discountType: normalizedDiscountType,
          discountValue: normalizedDiscountValue,
          maxDiscount: normalizedMaxDiscount,
          minOrderValue: normalizedMinOrderValue,
          promoCode: normalizedPromoCode,
          startDate: normalizedStartDate,
          endDate: normalizedEndDate,
          imageUrl: normalizedImageUrl,
          displayInHomeHeader: Boolean(displayInHomeHeader),
          activateNow: Boolean(activateNow),
        },
      });

      if (!ok || !data || data.success !== true || !data.promotion) {
        return { success: false, message: data?.message || "Unable to create promotion." };
      }

      setPromotions((current) => [data.promotion, ...(Array.isArray(current) ? current : []).filter((item) => item.id !== data.promotion.id)]);
      return { success: true, promotion: data.promotion };
    } catch {
      return { success: false, message: "Backend is not reachable. Start the backend server." };
    }
  };

  const togglePromotionStatus = async (promotionId) => {
    if (!authUser || authUser.role !== "admin") {
      return { success: false, message: "Only admins can update promotions." };
    }
    const token = String(authToken || "").trim();
    if (!token) return { success: false, message: "Please login again." };

    const existing = promotions.find((promotion) => promotion.id === promotionId);
    if (!existing) return { success: false, message: "Promotion not found." };

    try {
      const { ok, data } = await apiRequest(`/promotions/${encodeURIComponent(promotionId)}`, {
        method: "PATCH",
        token,
        body: { active: !existing.active },
      });

      if (!ok || !data || data.success !== true || !data.promotion) {
        return { success: false, message: data?.message || "Unable to update promotion." };
      }

      setPromotions((current) =>
        (Array.isArray(current) ? current : []).map((promotion) =>
          promotion.id === promotionId ? data.promotion : promotion
        )
      );
      return { success: true, promotion: data.promotion };
    } catch {
      return { success: false, message: "Backend is not reachable. Start the backend server." };
    }
  };

  const updatePromotion = async (promotionId, updates) => {
    if (!authUser || authUser.role !== "admin") {
      return { success: false, message: "Only admins can update promotions." };
    }
    const token = String(authToken || "").trim();
    if (!token) return { success: false, message: "Please login again." };

    const existingPromotion = promotions.find((promotion) => promotion.id === promotionId);
    if (!existingPromotion) {
      return { success: false, message: "Promotion not found." };
    }

    const normalizedType = updates?.type === "vip" ? "vip" : "food";
    const normalizedTitle = String(updates?.title ?? existingPromotion.title ?? "").trim();
    const normalizedDescription = String(updates?.description ?? existingPromotion.description ?? "").trim();
    const normalizedDiscountType =
      updates?.discountType === "fixed"
        ? "fixed"
        : updates?.discountType === "percentage"
          ? "percentage"
          : existingPromotion.discountType === "fixed"
            ? "fixed"
            : "percentage";

    const discountValueSource =
      updates?.discountValue ?? existingPromotion.discountValue ?? existingPromotion.discount ?? 0;
    const normalizedDiscountValue = Number(discountValueSource);
    const normalizedMaxDiscount = Number(updates?.maxDiscount ?? existingPromotion.maxDiscount ?? 0) || 0;
    const normalizedMinOrderValue = Number(updates?.minOrderValue ?? existingPromotion.minOrderValue ?? 0) || 0;
    const normalizedPromoCode = String(updates?.promoCode ?? existingPromotion.promoCode ?? "")
      .trim()
      .toUpperCase();
    const normalizedStartDate = String(updates?.startDate ?? existingPromotion.startDate ?? "").trim();
    const normalizedEndDate = String(updates?.endDate ?? existingPromotion.endDate ?? "").trim();
    const normalizedImageUrl = String(updates?.imageUrl ?? existingPromotion.imageUrl ?? "").trim();

    const normalizedDisplayInHomeHeader =
      typeof updates?.displayInHomeHeader === "boolean"
        ? updates.displayInHomeHeader
        : Boolean(existingPromotion.displayInHomeHeader);

    const normalizedActive =
      typeof updates?.activateNow === "boolean"
        ? updates.activateNow
        : typeof updates?.active === "boolean"
          ? updates.active
          : Boolean(existingPromotion.active);

    if (!normalizedTitle || !normalizedDescription || !normalizedStartDate || !normalizedEndDate) {
      return { success: false, message: "Please fill all required promotion fields." };
    }
    if (!Number.isFinite(normalizedDiscountValue) || normalizedDiscountValue <= 0) {
      return { success: false, message: "Discount value must be greater than zero." };
    }
    if (new Date(normalizedEndDate).getTime() < new Date(normalizedStartDate).getTime()) {
      return { success: false, message: "End date must be after start date." };
    }

    try {
      const { ok, data } = await apiRequest(`/promotions/${encodeURIComponent(promotionId)}`, {
        method: "PATCH",
        token,
        body: {
          type: normalizedType,
          title: normalizedTitle,
          description: normalizedDescription,
          discountType: normalizedDiscountType,
          discountValue: normalizedDiscountValue,
          maxDiscount: normalizedMaxDiscount,
          minOrderValue: normalizedMinOrderValue,
          promoCode: normalizedPromoCode,
          startDate: normalizedStartDate,
          endDate: normalizedEndDate,
          imageUrl: normalizedImageUrl,
          displayInHomeHeader: normalizedDisplayInHomeHeader,
          active: normalizedActive,
        },
      });

      if (!ok || !data || data.success !== true || !data.promotion) {
        return { success: false, message: data?.message || "Unable to update promotion." };
      }

      setPromotions((current) =>
        (Array.isArray(current) ? current : []).map((promotion) =>
          promotion.id === promotionId ? data.promotion : promotion
        )
      );
      return { success: true, promotion: data.promotion };
    } catch {
      return { success: false, message: "Backend is not reachable. Start the backend server." };
    }
  };

  const deletePromotion = async (promotionId) => {
    if (!authUser || authUser.role !== "admin") {
      return { success: false, message: "Only admins can delete promotions." };
    }
    const token = String(authToken || "").trim();
    if (!token) return { success: false, message: "Please login again." };

    try {
      const { ok, data } = await apiRequest(`/promotions/${encodeURIComponent(promotionId)}`, {
        method: "DELETE",
        token,
      });

      if (!ok || !data || data.success !== true) {
        return { success: false, message: data?.message || "Unable to delete promotion." };
      }

      setPromotions((current) => (Array.isArray(current) ? current : []).filter((promotion) => promotion.id !== promotionId));
      return { success: true };
    } catch {
      return { success: false, message: "Backend is not reachable. Start the backend server." };
    }
  };

  const addVipBooking = async ({ suiteId, date, time, timeSlots, guests } = {}) => {
    if (!authUser || authUser.role !== "user") {
      return { success: false, message: "Only logged-in users can book VIP rooms." };
    }

    const token = String(authToken || "").trim();
    if (!token) return { success: false, message: "Please login again." };

    try {
      const { ok, data } = await apiRequest("/vip-bookings", {
        method: "POST",
        token,
        body: { suiteId, date, time, timeSlots, guests },
      });

      if (!ok || !data || data.success !== true || !data.booking) {
        return { success: false, message: data?.message || "Unable to submit VIP booking request." };
      }

      setVipBookings((current) => {
        const list = Array.isArray(current) ? current : [];
        const filtered = list.filter((booking) => String(booking?.id || "").trim() !== String(data.booking.id || "").trim());
        return [data.booking, ...filtered];
      });
      return { success: true, booking: data.booking };
    } catch {
      return { success: false, message: "Backend is not reachable. Start the backend server." };
    }
  };

  const addMenuItem = ({ name, category, description, portions, image, outOfStock = false, loyaltyPoints }) => {
    if (!authUser || authUser.role !== "admin") {
      return { success: false, message: "Only admins can add menu items." };
    }
    const normalizedName = String(name || "").trim();
    const normalizedCategory = String(category || "").trim();
    const normalizedDescription = String(description || "").trim();
    if (!normalizedName || !normalizedCategory || !normalizedDescription) {
      return { success: false, message: "Name, category, and description are required." };
    }
    if (loyaltyPoints === undefined || loyaltyPoints === null || String(loyaltyPoints).trim() === "") {
      return { success: false, message: "Loyalty points are required." };
    }
    const parsedLoyaltyPoints = Number(String(loyaltyPoints).trim());
    if (!Number.isFinite(parsedLoyaltyPoints) || parsedLoyaltyPoints < 0) {
      return { success: false, message: "Loyalty points must be a valid number (0 or more)." };
    }
    if (!portions || typeof portions !== "object" || Object.keys(portions).length === 0) {
      return { success: false, message: "At least one portion and price is required." };
    }
    const exists = menuItems.some(
      (item) => item.name.toLowerCase() === normalizedName.toLowerCase()
    );
    if (exists) {
      return { success: false, message: "Menu item with this name already exists." };
    }
    const menuItem = {
      id: crypto.randomUUID(),
      name: normalizedName,
      category: normalizedCategory,
      description: normalizedDescription,
      portions,
      image: String(image || "").trim() || "/images/home/popular-01.svg",
      outOfStock: Boolean(outOfStock),
      loyaltyPoints: Math.max(0, Math.round(parsedLoyaltyPoints || 0)),
    };
    setMenuItems((current) => {
      const next = [menuItem, ...current];
      queueMicrotask(() => {
        if (authUser?.role === "admin") saveMenuItemsToServer(next);
      });
      return next;
    });
    setMenuCategories((current) => {
      if (current.some((item) => item.toLowerCase() === normalizedCategory.toLowerCase())) {
        return current;
      }
      const next = [...current, normalizedCategory];
      queueMicrotask(() => {
        if (authUser?.role === "admin") saveMenuCategoriesToServer(next);
      });
      return next;
    });
    return { success: true };
  };

  const addMenuCategory = (categoryName) => {
    if (!authUser || authUser.role !== "admin") {
      return { success: false, message: "Only admins can add menu categories." };
    }
    const normalizedCategory = String(categoryName || "").trim();
    if (!normalizedCategory) {
      return { success: false, message: "Category name is required." };
    }
    const exists = menuCategories.some(
      (category) => category.toLowerCase() === normalizedCategory.toLowerCase()
    );
    if (exists) {
      return { success: false, message: "This category already exists." };
    }
    setMenuCategories((current) => {
      const next = [...current, normalizedCategory];
      queueMicrotask(() => {
        if (authUser?.role === "admin") saveMenuCategoriesToServer(next);
      });
      return next;
    });
    return { success: true };
  };

  const updateMenuCategory = (currentCategoryName, nextCategoryName) => {
    if (!authUser || authUser.role !== "admin") {
      return { success: false, message: "Only admins can update menu categories." };
    }
    const normalizedCurrent = String(currentCategoryName || "").trim();
    const normalizedNext = String(nextCategoryName || "").trim();
    if (!normalizedCurrent || !normalizedNext) {
      return { success: false, message: "Current and new category names are required." };
    }

    const currentExists = menuCategories.some(
      (category) => category.toLowerCase() === normalizedCurrent.toLowerCase()
    );
    if (!currentExists) {
      return { success: false, message: "Category not found." };
    }

    const nextExists = menuCategories.some(
      (category) =>
        category.toLowerCase() === normalizedNext.toLowerCase() &&
        category.toLowerCase() !== normalizedCurrent.toLowerCase()
    );
    if (nextExists) {
      return { success: false, message: "A category with this name already exists." };
    }

    setMenuCategories((current) => {
      const next = current.map((category) =>
        category.toLowerCase() === normalizedCurrent.toLowerCase() ? normalizedNext : category
      );
      queueMicrotask(() => {
        if (authUser?.role === "admin") saveMenuCategoriesToServer(next);
      });
      return next;
    });
    setMenuItems((current) => {
      const next = current.map((item) =>
        String(item.category || "").toLowerCase() === normalizedCurrent.toLowerCase()
          ? { ...item, category: normalizedNext }
          : item
      );
      queueMicrotask(() => {
        if (authUser?.role === "admin") saveMenuItemsToServer(next);
      });
      return next;
    });
    return { success: true };
  };

  const deleteMenuCategory = (categoryName) => {
    if (!authUser || authUser.role !== "admin") {
      return { success: false, message: "Only admins can delete menu categories." };
    }
    const normalizedCategory = String(categoryName || "").trim();
    if (!normalizedCategory) {
      return { success: false, message: "Category name is required." };
    }

    const exists = menuCategories.some(
      (category) => category.toLowerCase() === normalizedCategory.toLowerCase()
    );
    if (!exists) {
      return { success: false, message: "Category not found." };
    }

    const hasItems = menuItems.some(
      (item) => String(item.category || "").toLowerCase() === normalizedCategory.toLowerCase()
    );
    if (hasItems) {
      return {
        success: false,
        message: "Cannot delete this category because menu items are still assigned to it.",
      };
    }

    setMenuCategories((current) => {
      const next = current.filter((category) => category.toLowerCase() !== normalizedCategory.toLowerCase());
      queueMicrotask(() => {
        if (authUser?.role === "admin") saveMenuCategoriesToServer(next);
      });
      return next;
    });
    return { success: true };
  };

  const updateMenuItem = (menuItemId, updates) => {
    if (!authUser || authUser.role !== "admin") {
      return { success: false, message: "Only admins can update menu items." };
    }
    const normalizedCategory = String(updates?.category || "").trim();
    setMenuItems((current) => {
      const next = current.map((item) => {
        if (item.id !== menuItemId) return item;
        const next = { ...item, ...updates };
        if (updates && Object.prototype.hasOwnProperty.call(updates, "loyaltyPoints")) {
          next.loyaltyPoints =
            updates.loyaltyPoints === undefined || updates.loyaltyPoints === null || String(updates.loyaltyPoints).trim() === ""
              ? undefined
              : Math.max(0, Math.round(Number(updates.loyaltyPoints) || 0));
        }
        return next;
      });
      queueMicrotask(() => {
        if (authUser?.role === "admin") saveMenuItemsToServer(next);
      });
      return next;
    });
    if (normalizedCategory) {
      setMenuCategories((current) => {
        if (current.some((category) => category.toLowerCase() === normalizedCategory.toLowerCase())) {
          return current;
        }
        return [...current, normalizedCategory];
      });
    }
    return { success: true };
  };

  const deleteMenuItem = (menuItemId) => {
    if (!authUser || authUser.role !== "admin") {
      return { success: false, message: "Only admins can delete menu items." };
    }
    setMenuItems((current) => {
      const next = current.filter((item) => item.id !== menuItemId);
      queueMicrotask(() => {
        if (authUser?.role === "admin") saveMenuItemsToServer(next);
      });
      return next;
    });
    return { success: true };
  };

  const value = {
    authUser,
    authToken,
    users,
    purchases,
    loyaltyPurchases,
    adminPointsByEmail,
    vipBookings,
    feedbacks,
    promotions,
    loyaltySummary,
    loyaltyRules,
    menuItems,
    menuCategories,
    login,
    signup,
    loginWithGoogle,
    updateUserProfile,
    logout,
    addPurchase,
    updatePurchaseStatus,
    updateOrderStatus,
    updateVipBookingStatus,
    cancelVipBookingByUser,
    addVipBooking,
    addFeedback,
    addPromotion,
    togglePromotionStatus,
    updatePromotion,
    deletePromotion,
    updateLoyaltyRule,
    addLoyaltyRule,
    removeLoyaltyRule,
    saveLoyaltyRulesToServer,
    refreshAdminOrders,
    refreshAdminLoyaltyPurchases,
    refreshAdminUsers,
    refreshLoyaltySummary,
    refreshPromotionsFromServer,
    refreshReviewsFromServer,
    refreshMenuItemsFromServer,
    addMenuItem,
    addMenuCategory,
    updateMenuCategory,
    deleteMenuCategory,
    updateMenuItem,
    deleteMenuItem,
    tableContext,
    startTableSession,
    clearTableContext,
    cartItems,
    addToCart,
    increaseCartQty,
    decreaseCartQty,
    removeFromCart,
    clearCart,
    placeOrderFromCart,
    lastDeliveryDetails: authUser ? deliveryDetailsByUser[authUser.email] || null : null,
    adminEmail: ADMIN_EMAIL || null,
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
