"use client";
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import {
  fetchProducts,
  placeOrder,
  registerUser,
  loginUser,
  logoutUser,
  fetchMe,
  fetchCart,
  syncCart,
  getStoredToken,
  setStoredToken,
  getGuestCart,
  setGuestCart,
} from "@/lib/api";
import type { Product, CartItem, User } from "@/types";

const StoreContext = createContext<any>(null);

export const StoreProvider = ({ children }: { children: React.ReactNode }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCartState] = useState<CartItem[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isHaggleMode, setIsHaggleMode] = useState(false);
  const [aiSearchResults, setAiSearchResults] = useState<Product[]>([]);
  const [forceBillingView, setForceBillingView] = useState(false);
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  const placingOrderRef = useRef(false);
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipCartSyncRef = useRef(false);
  const router = useRouter();

  const isAuthenticated = !!user;

  const persistGuestCart = useCallback((items: CartItem[]) => {
    if (!getStoredToken()) {
      setGuestCart(items);
    }
  }, []);

  const setCart = useCallback(
    (updater: CartItem[] | ((prev: CartItem[]) => CartItem[])) => {
      setCartState((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        persistGuestCart(next);
        return next;
      });
    },
    [persistGuestCart],
  );

  const scheduleCartSync = useCallback((items: CartItem[]) => {
    if (!getStoredToken()) return;
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(async () => {
      try {
        const synced = await syncCart(items);
        skipCartSyncRef.current = true;
        setCartState(synced);
      } catch (err) {
        console.error("Cart sync failed", err);
      }
    }, 400);
  }, []);

  useEffect(() => {
    if (!user) return;
    if (skipCartSyncRef.current) {
      skipCartSyncRef.current = false;
      return;
    }
    scheduleCartSync(cart);
  }, [cart, user, scheduleCartSync]);

  const loadProducts = async () => {
    try {
      const data = await fetchProducts();
      setProducts(data);
    } catch (err) {
      console.error("Failed to fetch products", err);
    }
  };

  const loadSession = async () => {
    setIsAuthLoading(true);
    const token = getStoredToken();
    if (!token) {
      skipCartSyncRef.current = true;
      setCartState(getGuestCart());
      setIsAuthLoading(false);
      return;
    }

    try {
      const me = await fetchMe();
      setUser(me);
      const serverCart = await fetchCart();
      skipCartSyncRef.current = true;
      setCartState(serverCart);
      setGuestCart([]);
    } catch {
      setStoredToken(null);
      setUser(null);
      skipCartSyncRef.current = true;
      setCartState(getGuestCart());
    } finally {
      setIsAuthLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
    loadSession();
  }, []);

  const mergeCarts = (local: CartItem[], server: CartItem[]): CartItem[] => {
    const merged = new Map<number, CartItem>();
    for (const item of server) merged.set(item.id, { ...item });
    for (const item of local) {
      const existing = merged.get(item.id);
      if (existing) {
        merged.set(item.id, {
          ...existing,
          quantity: existing.quantity + item.quantity,
        });
      } else {
        merged.set(item.id, { ...item });
      }
    }
    return Array.from(merged.values());
  };

  const login = async (email: string, password: string) => {
    const res = await loginUser({ email, password });
    setStoredToken(res.token);
    setUser(res.user);

    const guestItems = getGuestCart();
    let serverCart = await fetchCart();
    if (guestItems.length > 0) {
      const merged = mergeCarts(guestItems, serverCart);
      serverCart = await syncCart(merged);
      setGuestCart([]);
    }
    skipCartSyncRef.current = true;
    setCartState(serverCart);
    return res.user;
  };

  const register = async (name: string, email: string, password: string) => {
    const res = await registerUser({ name, email, password });
    setStoredToken(res.token);
    setUser(res.user);

    const guestItems = getGuestCart();
    if (guestItems.length > 0) {
      const synced = await syncCart(guestItems);
      skipCartSyncRef.current = true;
      setCartState(synced);
      setGuestCart([]);
    } else {
      skipCartSyncRef.current = true;
      setCartState([]);
    }
    return res.user;
  };

  const logout = async () => {
    await logoutUser();
    setStoredToken(null);
    setUser(null);
    setCartState([]);
    setDiscountPercentage(0);
  };

  const promptSignIn = useCallback(async (): Promise<boolean> => {
    const result = await Swal.fire({
      title: "Please sign in first",
      text: "You need an account to confirm your order.",
      icon: "info",
      showCancelButton: true,
      confirmButtonText: "Sign In",
      cancelButtonText: "Create Account",
      confirmButtonColor: "#2563eb",
      cancelButtonColor: "#0f172a",
    });

    if (result.isConfirmed) {
      router.push("/auth/signin");
      return false;
    }
    if (result.dismiss === Swal.DismissReason.cancel) {
      router.push("/auth/signup");
      return false;
    }
    return false;
  }, [router]);

  const cartHasStockIssues = cart.some(
    (item) => item.out_of_stock || item.insufficient_stock || item.stock <= 0,
  );

  const refreshCartStock = useCallback(async () => {
    if (!getStoredToken()) return;
    try {
      const synced = await fetchCart();
      skipCartSyncRef.current = true;
      setCartState(synced);
    } catch (err) {
      console.error("Failed to refresh cart stock", err);
    }
  }, []);

  const executeOrder = async () => {
    if (cart.length === 0 || placingOrderRef.current) return;

    if (!isAuthenticated) {
      await promptSignIn();
      return;
    }

    if (cartHasStockIssues) {
      await Swal.fire({
        title: "Stock issue",
        text: "Some items in your bag are out of stock or exceed available quantity. Please update your cart.",
        icon: "warning",
        confirmButtonColor: "#2563eb",
      });
      await refreshCartStock();
      return;
    }

    placingOrderRef.current = true;
    setIsPlacingOrder(true);

    try {
      await placeOrder({
        items: cart.map((item) => ({ id: item.id, quantity: item.quantity })),
      });

      setCart([]);
      setDiscountPercentage(0);
      setGuestCart([]);
      await loadProducts();

      await Swal.fire({
        title: "Order Confirmed!",
        text: "Your order has been placed. Stock has been updated.",
        icon: "success",
        confirmButtonColor: "#2563eb",
        confirmButtonText: "Continue Shopping",
      });

      router.push("/");
    } catch (error: any) {
      console.error("Order failed:", error);
      const message =
        error?.response?.data?.detail ||
        "Something went wrong. Please try again.";
      await Swal.fire({
        title: "Order Failed",
        text: message,
        icon: "error",
        confirmButtonColor: "#ef4444",
      });
      await refreshCartStock();
    } finally {
      placingOrderRef.current = false;
      setIsPlacingOrder(false);
    }
  };

  const handleAIAction = (action: string) => {
    if (action.startsWith("APPLY_DISCOUNT:")) {
      const discountVal = parseInt(action.replace("APPLY_DISCOUNT:", ""));
      setDiscountPercentage(discountVal);
      return;
    }

    if (action.startsWith("SHOW_RESULTS:")) {
      const ids = action
        .replace("SHOW_RESULTS:", "")
        .split(",")
        .map((id) => parseInt(id.trim()));
      setAiSearchResults(products.filter((p) => ids.includes(p.id)));
      router.push("/ai-results");
      return;
    }

    if (action.startsWith("ADD_AND_BILL:")) {
      const productId = parseInt(action.replace("ADD_AND_BILL:", ""));
      const productToAdd = products.find((p) => p.id === productId);
      if (productToAdd) {
        setCart((prev) => {
          const existing = prev.find((item) => item.id === productId);
          if (existing) {
            return prev.map((item) =>
              item.id === productId
                ? { ...item, quantity: item.quantity + 1 }
                : item,
            );
          }
          return [...prev, { ...productToAdd, quantity: 1 }];
        });
        setForceBillingView(true);
        router.push("/cart");
      }
      return;
    }

    if (action === "PLACE_ORDER") {
      executeOrder();
      return;
    }

    if (action.startsWith("ADD_TO_CART:")) {
      const parts = action.split(":");
      const productId = parseInt(parts[1]);
      const qtyToAdd =
        parts.length >= 4 && parts[2].toUpperCase() === "QTY"
          ? parseInt(parts[3]) || 1
          : 1;

      const productToAdd = products.find((p) => p.id === productId);
      if (productToAdd) {
        setCart((prev) => {
          const existing = prev.find((item) => item.id === productId);
          if (existing) {
            return prev.map((item) =>
              item.id === productId
                ? { ...item, quantity: item.quantity + qtyToAdd }
                : item,
            );
          }
          return [...prev, { ...productToAdd, quantity: qtyToAdd }];
        });
      }
      return;
    }

    if (action.startsWith("REMOVE_FROM_CART:")) {
      const productId = parseInt(action.replace("REMOVE_FROM_CART:", ""));
      setCart((prev) => prev.filter((item) => item.id !== productId));
      return;
    }

    if (action === "CLEAR_CART") {
      setCart([]);
      return;
    }

    switch (action) {
      case "SORT_PRICE_ASC":
        setProducts([...products].sort((a, b) => a.price - b.price));
        setAiSearchResults([...aiSearchResults].sort((a, b) => a.price - b.price));
        break;
      case "SORT_PRICE_DESC":
        setProducts([...products].sort((a, b) => b.price - a.price));
        setAiSearchResults([...aiSearchResults].sort((a, b) => b.price - a.price));
        break;
      case "TRIGGER_HAGGLE_MODE":
        setIsHaggleMode(true);
        break;
      case "NAVIGATE_CART":
        router.push("/cart");
        break;
      default:
        break;
    }
  };

  return (
    <StoreContext.Provider
      value={{
        products,
        setProducts,
        cart,
        setCart,
        user,
        isAuthenticated,
        isAuthLoading,
        login,
        register,
        logout,
        promptSignIn,
        handleAIAction,
        isHaggleMode,
        fetchProducts: loadProducts,
        executeOrder,
        isPlacingOrder,
        cartHasStockIssues,
        refreshCartStock,
        aiSearchResults,
        forceBillingView,
        setForceBillingView,
        discountPercentage,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => useContext(StoreContext);
