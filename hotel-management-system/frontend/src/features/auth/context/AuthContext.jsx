/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from "react";
import { DEFAULT_LOYALTY_RULES, calculateCheckoutPricing, normalizeLoyaltyRules } from "../../../common/utils/pricing";

const ADMIN_EMAIL = "admin@gmail.com";
const ADMIN_PASSWORD = "admin123";
const DEMO_USER_EMAIL = "user@gmail.com";
const DEMO_USER_PASSWORD = "user123";
const GOOGLE_DEMO_EMAIL = "google.user@gmail.com";
const USERS_STORAGE_KEY = "hms_users";
const PURCHASES_STORAGE_KEY = "hms_purchases";
const BOOKINGS_STORAGE_KEY = "hms_vip_bookings";
const FEEDBACK_STORAGE_KEY = "hms_feedbacks";
const PROMOTIONS_STORAGE_KEY = "hms_promotions";
const LOYALTY_RULES_STORAGE_KEY = "hms_loyalty_rules";
const MENU_ITEMS_STORAGE_KEY = "hms_menu_items";
const MENU_CATEGORIES_STORAGE_KEY = "hms_menu_categories";
const CART_STORAGE_KEY = "hms_cart_items";
const DELIVERY_DETAILS_STORAGE_KEY = "hms_delivery_details";
const DEFAULT_MENU_CATEGORIES = [
  "Kottu",
  "Rice",
  "Chicken",
  "Prawns",
  "Pork",
  "Biriyani",
  "Deviled",
  "Pasta",
  "Set Menu",
];

const DEFAULT_MENU_ITEMS = [
  {
    id: "menu-cheese-kottu",
    name: "Cheese Kottu",
    category: "Kottu",
    description: "Freshly made paratha chopped with vegetables and creamy cheese sauce.",
    portions: { Small: "SLR 850", Medium: "SLR 1,150", Large: "SLR 1,450" },
    image: "/images/home/popular-01.svg",
    outOfStock: false,
  },
  {
    id: "menu-chicken-biriyani",
    name: "Chicken Biriyani",
    category: "Biriyani",
    description: "Fragrant basmati rice cooked with aromatic spices and tender chicken.",
    portions: { Small: "SLR 950", Medium: "SLR 1,250", Large: "SLR 1,550" },
    image: "/images/home/popular-02.svg",
    outOfStock: false,
  },
  {
    id: "menu-seafood-rice",
    name: "Seafood Rice",
    category: "Rice",
    description: "Sri Lankan style seafood rice with prawns and cuttlefish.",
    portions: { Small: "SLR 1,100", Medium: "SLR 1,450", Large: "SLR 1,850" },
    image: "/images/home/popular-02.svg",
    outOfStock: false,
  },
  {
    id: "menu-deviled-chicken",
    name: "Deviled Chicken",
    category: "Deviled",
    description: "Spicy and tangy chicken stir-fried with onions and peppers.",
    portions: { "300g": "SLR 1,200", "500g": "SLR 1,800", "1kg": "SLR 3,300" },
    image: "/images/home/popular-03.svg",
    outOfStock: false,
  },
  {
    id: "menu-black-curry-beef",
    name: "Black Curry Beef",
    category: "Black Curry",
    description: "Slow-cooked black curry beef with roasted spices and deep flavor.",
    portions: { "300g": "SLR 1,350", "500g": "SLR 2,000", "1kg": "SLR 3,700" },
    image: "/images/home/popular-03.svg",
    outOfStock: false,
  },
  {
    id: "menu-chicken-isstu",
    name: "Chicken Isstu",
    category: "Isstu",
    description: "Classic rich gravy style isstu made with tender chicken and spices.",
    portions: { "300g": "SLR 1,150", "500g": "SLR 1,700", "1kg": "SLR 3,100" },
    image: "/images/home/popular-01.svg",
    outOfStock: false,
  },
  {
    id: "menu-creamy-pasta",
    name: "Creamy Pasta",
    category: "Pasta",
    description: "Penne pasta in rich cream sauce with chicken strips.",
    portions: { Regular: "SLR 1,050" },
    image: "/images/home/popular-01.svg",
    outOfStock: false,
  },
  {
    id: "menu-family-set",
    name: "Family Set Menu",
    category: "Set Menu",
    description: "Special combo for four with mains, sides, and beverages.",
    portions: { Regular: "SLR 3,800" },
    image: "/images/home/popular-03.svg",
    outOfStock: false,
  },
];

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
  const [feedbacks, setFeedbacks] = useState(() => parseStoredJson(FEEDBACK_STORAGE_KEY, []));
  const [promotions, setPromotions] = useState(() => parseStoredJson(PROMOTIONS_STORAGE_KEY, []));
  const [loyaltyRules, setLoyaltyRules] = useState(() =>
    normalizeLoyaltyRules(parseStoredJson(LOYALTY_RULES_STORAGE_KEY, DEFAULT_LOYALTY_RULES))
  );
  const [menuItems, setMenuItems] = useState(() => {
    const stored = parseStoredJson(MENU_ITEMS_STORAGE_KEY, []);
    const source = Array.isArray(stored) && stored.length > 0 ? stored : DEFAULT_MENU_ITEMS;
    return source.map((item) => ({
      ...item,
      id: item.id || crypto.randomUUID(),
      outOfStock: Boolean(item.outOfStock),
      loyaltyPoints:
        item && Object.prototype.hasOwnProperty.call(item, "loyaltyPoints") && String(item.loyaltyPoints).trim() !== ""
          ? Math.max(0, Math.round(Number(item.loyaltyPoints) || 0))
          : undefined,
    }));
  });
  const [menuCategories, setMenuCategories] = useState(() => {
    const stored = parseStoredJson(MENU_CATEGORIES_STORAGE_KEY, []);
    const baseCategories =
      Array.isArray(stored) && stored.length > 0 ? stored : DEFAULT_MENU_CATEGORIES;
    const categoriesFromItems = (Array.isArray(menuItems) ? menuItems : [])
      .map((item) => String(item.category || "").trim())
      .filter(Boolean);
    return [...new Set([...baseCategories, ...categoriesFromItems])];
  });
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
    localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(feedbacks));
  }, [feedbacks]);

  useEffect(() => {
    localStorage.setItem(PROMOTIONS_STORAGE_KEY, JSON.stringify(promotions));
  }, [promotions]);

  useEffect(() => {
    localStorage.setItem(LOYALTY_RULES_STORAGE_KEY, JSON.stringify(loyaltyRules));
  }, [loyaltyRules]);

  useEffect(() => {
    localStorage.setItem(MENU_ITEMS_STORAGE_KEY, JSON.stringify(menuItems));
  }, [menuItems]);

  useEffect(() => {
    localStorage.setItem(MENU_CATEGORIES_STORAGE_KEY, JSON.stringify(menuCategories));
  }, [menuCategories]);

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    localStorage.setItem(DELIVERY_DETAILS_STORAGE_KEY, JSON.stringify(deliveryDetailsByUser));
  }, [deliveryDetailsByUser]);

  const formatAddress = ({ streetAddress1, streetAddress2, cityTown } = {}) => {
    const parts = [
      String(streetAddress1 || "").trim(),
      String(streetAddress2 || "").trim(),
      String(cityTown || "").trim(),
    ].filter(Boolean);
    return parts.join(", ");
  };

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
        streetAddress1: "No. 25, Galle Road",
        streetAddress2: "",
        cityTown: "Colombo 03",
        address: "No. 25, Galle Road, Colombo 03",
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
        streetAddress1: registeredUser.streetAddress1 || "",
        streetAddress2: registeredUser.streetAddress2 || "",
        cityTown: registeredUser.cityTown || "",
        address: registeredUser.address || formatAddress(registeredUser) || "",
      });
      return { success: true, role: "user" };
    }

    return { success: false, message: "Invalid credentials." };
  };

  const signup = ({ fullName, email, password, phone, streetAddress1, streetAddress2, cityTown } = {}) => {
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

    if (normalizedEmail === ADMIN_EMAIL) {
      return { success: false, message: "This email is reserved." };
    }

    const exists = users.some((user) => user.email.toLowerCase() === normalizedEmail);
    if (exists) {
      return { success: false, message: "Email already registered." };
    }

    const nextUser = {
      fullName: String(fullName || "").trim(),
      email: normalizedEmail,
      password,
      phone: normalizedPhone,
      streetAddress1: normalizedStreet1,
      streetAddress2: normalizedStreet2,
      cityTown: normalizedCityTown,
      address: normalizedAddress,
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
        phone: "+94 77 555 7788",
        streetAddress1: "No. 12, Duplication Road",
        streetAddress2: "",
        cityTown: "Colombo 04",
        address: "No. 12, Duplication Road, Colombo 04",
      };
      setUsers((current) => [...current, googleUser]);
    }

    setAuthUser({
      email: GOOGLE_DEMO_EMAIL,
      role: "user",
      fullName: "Google User",
      phone: "+94 77 555 7788",
      streetAddress1: "No. 12, Duplication Road",
      streetAddress2: "",
      cityTown: "Colombo 04",
      address: "No. 12, Duplication Road, Colombo 04",
    });
    return { success: true, role: "user" };
  };

  const updateUserProfile = ({ fullName, phone, streetAddress1, streetAddress2, cityTown } = {}) => {
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

    setUsers((current) =>
      current.map((user) =>
        user.email.toLowerCase() === authUser.email.toLowerCase()
          ? {
              ...user,
              fullName: normalizedFullName,
              phone: normalizedPhone,
              streetAddress1: normalizedStreet1,
              streetAddress2: normalizedStreet2,
              cityTown: normalizedCityTown,
              address: normalizedAddress,
            }
          : user
      )
    );
    setAuthUser((current) =>
      current
        ? {
            ...current,
            fullName: normalizedFullName,
            phone: normalizedPhone,
            streetAddress1: normalizedStreet1,
            streetAddress2: normalizedStreet2,
            cityTown: normalizedCityTown,
            address: normalizedAddress,
          }
        : current
    );
    return { success: true, message: "Profile updated successfully." };
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
    if (!authUser || authUser.role !== "user") {
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
      menuItemId: menuItem.id,
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

    const { orderType = "Delivery", paymentMethod = "Cash" } = checkoutDetails;

    const storedUser = users.find(
      (item) => String(item.email || "").toLowerCase() === String(authUser.email || "").toLowerCase()
    );
    const resolvedDeliveryDetails =
      orderType === "Delivery"
        ? {
            name: String(authUser.fullName || storedUser?.fullName || "").trim(),
            phone: String(authUser.phone || storedUser?.phone || "").trim(),
            streetAddress1: String(authUser.streetAddress1 || storedUser?.streetAddress1 || "").trim(),
            streetAddress2: String(authUser.streetAddress2 || storedUser?.streetAddress2 || "").trim(),
            cityTown: String(authUser.cityTown || storedUser?.cityTown || "").trim(),
            location:
              formatAddress({
                streetAddress1: authUser.streetAddress1 || storedUser?.streetAddress1,
                streetAddress2: authUser.streetAddress2 || storedUser?.streetAddress2,
                cityTown: authUser.cityTown || storedUser?.cityTown,
              }) || String(authUser.address || storedUser?.address || "").trim(),
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
      purchases,
      promotions,
      loyaltyRules,
      orderType,
      deliveryAddress: resolvedDeliveryDetails?.location,
      deliveryCityTown: resolvedDeliveryDetails?.cityTown,
    });

    const orderId = crypto.randomUUID();
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
        orderType,
        paymentMethod,
        deliveryDetails: resolvedDeliveryDetails,
        createdAt: new Date().toISOString(),
        orderSubtotal: pricing.subtotal,
        orderTotalDiscount: pricing.totalDiscount,
        deliveryZone: pricing.deliveryZone,
        deliveryFee: pricing.deliveryFee,
        orderTotal: pricing.grandTotal ?? pricing.total,
        promotionId: pricing.promotion?.id || null,
        promotionTitle: pricing.promotion?.title || null,
        promotionDiscount: pricing.promotionDiscount,
        loyaltyPointsAtPurchase: pricing.points,
        loyaltyDiscountPercent: pricing.loyaltyPercent,
        loyaltyDiscount: pricing.loyaltyDiscount,
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
    return { success: true };
  };

  const updatePurchaseStatus = (purchaseId, status, cancelReason = "") => {
    const nextStatus = String(status || "").trim();
    const normalizedReason = String(cancelReason || "").trim();
    if (nextStatus === "Cancelled" && !normalizedReason) {
      return { success: false, message: "Please provide a cancellation reason." };
    }

    setPurchases((current) =>
      current.map((purchase) => {
        if (purchase.id !== purchaseId) return purchase;
        return {
          ...purchase,
          status: nextStatus,
          cancelReason: nextStatus === "Cancelled" ? normalizedReason : purchase.cancelReason || "",
          statusUpdatedAt: new Date().toISOString(),
        };
      })
    );
    return { success: true };
  };

  const updateOrderStatus = (orderId, status, cancelReason = "") => {
    const normalizedOrderId = String(orderId || "").trim();
    if (!normalizedOrderId) {
      return { success: false, message: "Order id is required." };
    }

    const nextStatus = String(status || "").trim();
    const normalizedReason = String(cancelReason || "").trim();
    if (nextStatus === "Cancelled" && !normalizedReason) {
      return { success: false, message: "Please provide a cancellation reason." };
    }

    setPurchases((current) =>
      current.map((purchase) => {
        const purchaseOrderId = String(purchase.orderId || "").trim();
        const purchaseId = String(purchase.id || "").trim();
        if (purchaseOrderId !== normalizedOrderId && purchaseId !== normalizedOrderId) return purchase;
        return {
          ...purchase,
          status: nextStatus,
          cancelReason: nextStatus === "Cancelled" ? normalizedReason : purchase.cancelReason || "",
          statusUpdatedAt: new Date().toISOString(),
        };
      })
    );
    return { success: true };
  };

  const updateVipBookingStatus = (bookingId, status) => {
    setVipBookings((current) =>
      current.map((booking) =>
        booking.id === bookingId ? { ...booking, status } : booking
      )
    );
    return { success: true };
  };

  const cancelVipBookingByUser = (bookingId) => {
    if (!authUser || authUser.role !== "user") {
      return { success: false, message: "Only logged-in users can cancel bookings." };
    }

    const booking = vipBookings.find(
      (item) => item.id === bookingId && item.userEmail === authUser.email
    );
    if (!booking) {
      return { success: false, message: "Booking not found." };
    }
    const normalizedStatus = String(booking.status || "Pending").trim().toLowerCase();
    if (normalizedStatus === "cancelled") {
      return { success: false, message: "This booking is already cancelled." };
    }
    if (normalizedStatus === "confirmed") {
      return { success: false, message: "Bookings cannot be cancelled after admin approval." };
    }

    const resolveVipBookingStartTime = (value) => {
      const text = String(value || "").trim();
      if (!text) return "";
      if (text.includes("-")) return text.split("-")[0].trim();
      if (text.includes("|")) return text.split("|")[0].split("-")[0].trim();
      return text;
    };

    const startSlot = Array.isArray(booking.timeSlots) && booking.timeSlots.length > 0 ? booking.timeSlots[0] : booking.time;
    const startTime = resolveVipBookingStartTime(startSlot);
    const startTimeText = /^\d{2}:\d{2}$/.test(startTime) ? `${startTime}:00` : startTime;
    const bookingDateTime = new Date(`${booking.date}T${startTimeText}`);
    if (Number.isNaN(bookingDateTime.getTime())) {
      return { success: false, message: "Booking time is invalid." };
    }

    const threeHoursMs = 3 * 60 * 60 * 1000;
    const timeUntilBooking = bookingDateTime.getTime() - Date.now();
    if (timeUntilBooking < threeHoursMs) {
      return {
        success: false,
        message: "Bookings can only be cancelled at least 3 hours before the reserved time.",
      };
    }

    setVipBookings((current) =>
      current.map((item) =>
        item.id === bookingId && item.userEmail === authUser.email
          ? { ...item, status: "Cancelled", cancelledBy: "user", cancelledAt: new Date().toISOString() }
          : item
      )
    );
    return { success: true, message: "Booking cancelled successfully." };
  };

  const addFeedback = ({ rating, message }) => {
    if (!authUser || authUser.role !== "user") {
      return { success: false, message: "Only logged-in users can submit feedback." };
    }

    const normalizedMessage = String(message || "").trim();
    const ratingValue = Number(rating);
    if (!normalizedMessage) {
      return { success: false, message: "Please enter your feedback message." };
    }
    if (!Number.isFinite(ratingValue) || ratingValue < 1 || ratingValue > 5) {
      return { success: false, message: "Please select a rating between 1 and 5." };
    }

    const feedback = {
      id: crypto.randomUUID(),
      userEmail: authUser.email,
      userName: authUser.fullName || authUser.email,
      rating: ratingValue,
      message: normalizedMessage,
      createdAt: new Date().toISOString(),
    };
    setFeedbacks((current) => [feedback, ...current]);
    return { success: true };
  };

  const addPromotion = ({
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

    const normalizedDiscount =
      normalizedDiscountType === "fixed"
        ? `SLR ${Math.round(normalizedDiscountValue).toLocaleString()} OFF`
        : `${normalizedDiscountValue}% OFF`;

    const promotion = {
      id: crypto.randomUUID(),
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
      discountText: normalizedDiscount,
      active: Boolean(activateNow),
      createdAt: new Date().toISOString(),
    };
    setPromotions((current) => [promotion, ...current]);
    return { success: true };
  };

  const togglePromotionStatus = (promotionId) => {
    if (!authUser || authUser.role !== "admin") {
      return { success: false, message: "Only admins can update promotions." };
    }
    setPromotions((current) =>
      current.map((promotion) =>
        promotion.id === promotionId
          ? { ...promotion, active: !promotion.active }
          : promotion
      )
    );
    return { success: true };
  };

  const updatePromotion = (promotionId, updates) => {
    if (!authUser || authUser.role !== "admin") {
      return { success: false, message: "Only admins can update promotions." };
    }

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

    const normalizedDiscount =
      normalizedDiscountType === "fixed"
        ? `SLR ${Math.round(normalizedDiscountValue).toLocaleString()} OFF`
        : `${normalizedDiscountValue}% OFF`;

    const nextPromotion = {
      ...existingPromotion,
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
      discountText: normalizedDiscount,
      active: normalizedActive,
      updatedAt: new Date().toISOString(),
    };

    setPromotions((current) =>
      current.map((promotion) => (promotion.id === promotionId ? nextPromotion : promotion))
    );

    return { success: true };
  };

  const deletePromotion = (promotionId) => {
    if (!authUser || authUser.role !== "admin") {
      return { success: false, message: "Only admins can delete promotions." };
    }
    setPromotions((current) => current.filter((promotion) => promotion.id !== promotionId));
    return { success: true };
  };

  const addVipBooking = ({ suiteId, date, time, timeSlots, guests } = {}) => {
    if (!authUser || authUser.role !== "user") {
      return { success: false, message: "Only logged-in users can book VIP rooms." };
    }

    const normalizedSuiteId = String(suiteId || "").trim().toLowerCase();
    const normalizedDate = String(date || "").trim();
    const normalizedTimeSlots = (Array.isArray(timeSlots) ? timeSlots : [time])
      .map((value) => String(value || "").trim())
      .filter(Boolean);
    const normalizedTime = normalizedTimeSlots[0] || "";
    const guestsCount = Number(guests);

    if (!normalizedSuiteId || !normalizedDate || normalizedTimeSlots.length === 0) {
      return { success: false, message: "Please add room type, date, and time." };
    }
    if (!Number.isFinite(guestsCount) || guestsCount <= 0) {
      return { success: false, message: "Please enter a valid guest count." };
    }

    const bookingDay = new Date(`${normalizedDate}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (Number.isNaN(bookingDay.getTime()) || bookingDay.getTime() <= today.getTime()) {
      return { success: false, message: "Please select a booking date after today." };
    }

    const legacySlotMap = {
      "10:00-12:00": "11:00-13:00",
      "12:00-15:00": "13:00-16:00",
      "15:00-18:00": "16:00-19:00",
      "18:00-21:00": "19:00-22:00",
      "10:00": "11:00-13:00",
      "12:00": "13:00-16:00",
      "15:00": "16:00-19:00",
      "18:00": "19:00-22:00",
    };
    const allowedSlotOrder = ["11:00-13:00", "13:00-16:00", "16:00-19:00", "19:00-22:00"];
    const slotIndexByValue = allowedSlotOrder.reduce((acc, value, index) => {
      acc[value] = index;
      return acc;
    }, {});
    const normalizeSlotValue = (value) => {
      const text = String(value || "").trim();
      if (!text) return "";
      if (Object.prototype.hasOwnProperty.call(legacySlotMap, text)) return legacySlotMap[text];
      return text;
    };

    const uniqueRequestedSlots = [...new Set(normalizedTimeSlots.map(normalizeSlotValue).filter(Boolean))];
    const slotIndexes = uniqueRequestedSlots
      .map((slotValue) => slotIndexByValue[slotValue])
      .filter((index) => typeof index === "number");

    if (slotIndexes.length !== uniqueRequestedSlots.length) {
      return { success: false, message: "Please select a valid VIP time slot." };
    }

    const sortedIndexes = [...slotIndexes].sort((a, b) => a - b);
    const isConsecutiveRange = sortedIndexes.every((value, i) => i === 0 || value === sortedIndexes[i - 1] + 1);
    if (!isConsecutiveRange) {
      return { success: false, message: "Please select consecutive time slots only." };
    }

    const requested = new Set(uniqueRequestedSlots);
    const slotTaken = vipBookings.some((booking) => {
      if (String(booking.suiteId || "").trim().toLowerCase() !== normalizedSuiteId) return false;
      if (String(booking.date || "").trim() !== normalizedDate) return false;
      if (String(booking.status || "").trim().toLowerCase() === "cancelled") return false;

      const existingSlots = Array.isArray(booking.timeSlots) && booking.timeSlots.length > 0
        ? booking.timeSlots
        : String(booking.time || "").includes("|")
          ? String(booking.time || "").split("|")
          : [booking.time];

      return existingSlots
        .map(normalizeSlotValue)
        .filter(Boolean)
        .some((slotValue) => requested.has(slotValue));
    });
    if (slotTaken) {
      return {
        success: false,
        message: "This time slot is already booked for the selected room. Please choose another time.",
      };
    }

    const booking = {
      id: crypto.randomUUID(),
      suiteId: normalizedSuiteId,
      date: normalizedDate,
      time: normalizedTime,
      timeSlots: uniqueRequestedSlots,
      guests: guestsCount,
      status: "Pending",
      userEmail: authUser.email,
      createdAt: new Date().toISOString(),
    };
    setVipBookings((current) => [booking, ...current]);
    return { success: true };
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
      loyaltyPoints:
        loyaltyPoints === undefined || loyaltyPoints === null || String(loyaltyPoints).trim() === ""
          ? undefined
          : Math.max(0, Math.round(Number(loyaltyPoints) || 0)),
    };
    setMenuItems((current) => [menuItem, ...current]);
    setMenuCategories((current) => {
      if (current.some((item) => item.toLowerCase() === normalizedCategory.toLowerCase())) {
        return current;
      }
      return [...current, normalizedCategory];
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
    setMenuCategories((current) => [...current, normalizedCategory]);
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

    setMenuCategories((current) =>
      current.map((category) =>
        category.toLowerCase() === normalizedCurrent.toLowerCase() ? normalizedNext : category
      )
    );
    setMenuItems((current) =>
      current.map((item) =>
        String(item.category || "").toLowerCase() === normalizedCurrent.toLowerCase()
          ? { ...item, category: normalizedNext }
          : item
      )
    );
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

    setMenuCategories((current) =>
      current.filter((category) => category.toLowerCase() !== normalizedCategory.toLowerCase())
    );
    return { success: true };
  };

  const updateMenuItem = (menuItemId, updates) => {
    if (!authUser || authUser.role !== "admin") {
      return { success: false, message: "Only admins can update menu items." };
    }
    const normalizedCategory = String(updates?.category || "").trim();
    setMenuItems((current) =>
      current.map((item) => {
        if (item.id !== menuItemId) return item;
        const next = { ...item, ...updates };
        if (updates && Object.prototype.hasOwnProperty.call(updates, "loyaltyPoints")) {
          next.loyaltyPoints =
            updates.loyaltyPoints === undefined || updates.loyaltyPoints === null || String(updates.loyaltyPoints).trim() === ""
              ? undefined
              : Math.max(0, Math.round(Number(updates.loyaltyPoints) || 0));
        }
        return next;
      })
    );
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
    setMenuItems((current) => current.filter((item) => item.id !== menuItemId));
    return { success: true };
  };

  const value = {
    authUser,
    users,
    purchases,
    vipBookings,
    feedbacks,
    promotions,
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
    addMenuItem,
    addMenuCategory,
    updateMenuCategory,
    deleteMenuCategory,
    updateMenuItem,
    deleteMenuItem,
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
