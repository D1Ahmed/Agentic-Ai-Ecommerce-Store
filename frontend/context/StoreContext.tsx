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
  fetchMyStore,
  fetchCart,
  syncCart,
  clearCart,
  getStoredToken,
  setStoredToken,
  getGuestCart,
  setGuestCart,
  googleLoginUser,
  updateUserProfile,
  getStoredUser,
  setStoredUser,
  getStoredCart,
  setStoredCart,
  getStoredProducts,
  setStoredProducts,
  fetchNotifications,
  registerStore,
  createCollection,
} from "@/lib/api";
import type { Product, CartItem, User, Collection } from "@/types";

const StoreContext = createContext<any>(null);

export const StoreProvider = ({ children }: { children: React.ReactNode }) => {
  // ── Optimistic initial state from localStorage ──────────────────────────────
  // Read user and cart from localStorage synchronously on first render.
  // This means the UI shows the correct auth state INSTANTLY with zero flash.
  const cachedUser = getStoredUser();
  const cachedCart = cachedUser ? getStoredCart() : getGuestCart();
  const cachedProducts = getStoredProducts();

  const [products, setProducts] = useState<Product[]>(cachedProducts);
  const [isProductsLoading, setIsProductsLoading] = useState(cachedProducts.length === 0);
  const [productsLoadTime, setProductsLoadTime] = useState<number | null>(null);
  const [cart, setCartState] = useState<CartItem[]>(cachedCart);
  const [user, setUser] = useState<User | null>(cachedUser);
  const [notifications, setNotifications] = useState<any[]>([]);
  // If we have a cached user, we don't need to show the loading state —
  // we're optimistically showing them as logged in while we validate in background.
  const [isAuthLoading, setIsAuthLoading] = useState(!cachedUser && !!getStoredToken());
  const [isHaggleMode, setIsHaggleMode] = useState(false);
  const [aiSearchResults, setAiSearchResults] = useState<Product[]>([]);
  const [forceBillingItemId, setForceBillingItemId] = useState<number | null>(null);
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [hasStore, setHasStore] = useState(cachedUser?.has_store || false);
  const [pendingStoreData, setPendingStoreData] = useState<{
    name: string;
    address: string;
    phone: string;
    description: string;
    categories: string[];
  } | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [pendingProductUpload, setPendingProductUpload] = useState<any>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [pendingImageAnalysis, setPendingImageAnalysis] = useState<File[] | null>(null);

  // Expose this globally so ChatWindow can inject the File object directly
  useEffect(() => {
    (window as any).__setPendingUploadImages = (files: File[]) => {
      setPendingProductUpload((prev: any) => {
        return { ...prev, imageFiles: files };
      });
    };
  }, []);
  
  const [optimisticCollections, setOptimisticCollections] = useState<any[]>([]);
  
  const placingOrderRef = useRef(false);
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestCartRef = useRef<CartItem[]>(cachedCart);
  const router = useRouter();

  // cartReadyRef: true once the authoritative cart has been loaded/set.
  // Sync is BLOCKED while this is false to prevent empty-cart wipes.
  const cartReadyRef = useRef(!!cachedUser); // If we have a cached user+cart, we can consider ready
  // cartDirtyRef: true only when the USER changed the cart (not a server load).
  const cartDirtyRef = useRef(false);

  // Keep latestCartRef in sync
  useEffect(() => {
    latestCartRef.current = cart;
  }, [cart]);

  const isAuthenticated = !!user;

  // Persist guest cart to localStorage
  const persistGuestCart = useCallback((items: CartItem[]) => {
    if (!getStoredToken()) {
      setGuestCart(items);
    }
  }, []);

  // Central cart setter
  const setCart = useCallback(
    (updater: CartItem[] | ((prev: CartItem[]) => CartItem[])) => {
      setCartState((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        persistGuestCart(next);
        if (cartReadyRef.current) {
          cartDirtyRef.current = true;
          // Also persist server cart to localStorage for next-load optimism
          if (getStoredToken()) {
            setStoredCart(next);
          }
        }
        return next;
      });
    },
    [persistGuestCart],
  );

  // Debounced server sync
  const scheduleCartSync = useCallback(() => {
    if (!getStoredToken()) return;
    if (!cartReadyRef.current) return;
    if (!cartDirtyRef.current) return;

    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(async () => {
      if (!cartDirtyRef.current) return;
      cartDirtyRef.current = false;
      try {
        const itemsToSync = latestCartRef.current;
        if (itemsToSync.length === 0) return; // backend guard too, but skip early
        await syncCart(itemsToSync);
      } catch (err) {
        console.error("Cart sync failed", err);
      }
    }, 600);
  }, []);

  // Trigger sync on cart changes (only when ready + dirty)
  useEffect(() => {
    if (!user) return;
    if (!cartReadyRef.current) return;
    if (!cartDirtyRef.current) return;
    scheduleCartSync();
  }, [cart, user, scheduleCartSync]);

  const loadProducts = async () => {
    // Only show loading state if we don't have cached products
    if (products.length === 0) {
      setIsProductsLoading(true);
    }
    const startTime = performance.now();
    try {
      const data = await fetchProducts();
      setProducts(data);
      setStoredProducts(data);
    } catch (err) {
      console.error("Failed to fetch products", err);
    } finally {
      const endTime = performance.now();
      const duration = endTime - startTime;
      console.log(`[PERFORMANCE] Products loaded in ${duration.toFixed(2)}ms`);
      setProductsLoadTime(duration);
      setIsProductsLoading(false);
    }
  };

  // Background session validation — runs after optimistic render
  const loadSession = async () => {
    const token = getStoredToken();

    if (!token) {
      // Guest — cart already loaded from localStorage above
      if (!cachedUser) {
        cartReadyRef.current = true;
        cartDirtyRef.current = false;
      }
      setIsAuthLoading(false);
      return;
    }

    // If we already showed the user optimistically (cachedUser), this runs
    // silently in the background to validate the token and get fresh data.
    try {
      const [me, serverCart] = await Promise.all([fetchMe(), fetchCart()]);

      // Update with fresh server data — close the gate first
      cartReadyRef.current = false;
      cartDirtyRef.current = false;

      setUser(me);
      setStoredUser(me); // Keep localStorage in sync
      setCartState(serverCart);
      setStoredCart(serverCart); // Cache fresh cart
      latestCartRef.current = serverCart;
      setGuestCart([]);

      setHasStore(me.has_store || false);

      if (me.has_store) {
        import("@/lib/api").then(({ fetchMyCollections }) => {
          fetchMyCollections().then(setCollections).catch(() => {});
        });
      }

      cartReadyRef.current = true;
    } catch {
      // Token is invalid — clear everything
      setStoredToken(null);
      setStoredUser(null);
      setStoredCart([]);
      setUser(null);
      const guestCart = getGuestCart();
      setCartState(guestCart);
      latestCartRef.current = guestCart;
      cartReadyRef.current = true;
      cartDirtyRef.current = false;
    } finally {
      setIsAuthLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
    loadSession();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      const loadNotifs = () => fetchNotifications().then(setNotifications).catch(() => {});
      loadNotifs();
      const intervalId = setInterval(loadNotifs, 10000); // Poll every 10 seconds
      return () => clearInterval(intervalId);
    } else {
      setNotifications([]);
    }
  }, [isAuthenticated]);

  const getItemKey = (item: CartItem) => `${item.id}-${item.selected_size || ''}-${item.selected_color || ''}`;

  const mergeCarts = (local: CartItem[], server: CartItem[]): CartItem[] => {
    const merged = new Map<string, CartItem>();
    for (const item of server) merged.set(getItemKey(item), { ...item });
    for (const item of local) {
      const key = getItemKey(item);
      const existing = merged.get(key);
      if (existing) {
        merged.set(key, {
          ...existing,
          quantity: existing.quantity + item.quantity,
        });
      } else {
        merged.set(key, { ...item });
      }
    }
    return Array.from(merged.values());
  };

  const login = async (email: string, password: string) => {
    const res = await loginUser({ email, password });
    setStoredToken(res.token);

    const guestItems = getGuestCart();
    let serverCart = await fetchCart();
    if (guestItems.length > 0) {
      const merged = mergeCarts(guestItems, serverCart);
      serverCart = await syncCart(merged);
      setGuestCart([]);
    }

    cartReadyRef.current = false;
    cartDirtyRef.current = false;
    setCartState(serverCart);
    latestCartRef.current = serverCart;
    setStoredUser(res.user);
    setStoredCart(serverCart);
    setUser(res.user);
    setHasStore(res.user.has_store || false);
    cartReadyRef.current = true;

    return res.user;
  };

  const register = async (name: string, email: string, password: string) => {
    const res = await registerUser({ name, email, password });
    setStoredToken(res.token);

    const guestItems = getGuestCart();
    let finalCart: CartItem[] = [];
    if (guestItems.length > 0) {
      finalCart = await syncCart(guestItems);
      setGuestCart([]);
    }

    cartReadyRef.current = false;
    cartDirtyRef.current = false;
    setCartState(finalCart);
    latestCartRef.current = finalCart;
    setStoredUser(res.user);
    setStoredCart(finalCart);
    setUser(res.user);
    setHasStore(res.user.has_store || false);
    cartReadyRef.current = true;

    return res.user;
  };

  const googleLogin = async (credential: string) => {
    const res = await googleLoginUser(credential);
    setStoredToken(res.token);

    const guestItems = getGuestCart();
    let serverCart = await fetchCart();
    if (guestItems.length > 0) {
      const merged = mergeCarts(guestItems, serverCart);
      serverCart = await syncCart(merged);
      setGuestCart([]);
    }

    cartReadyRef.current = false;
    cartDirtyRef.current = false;
    setCartState(serverCart);
    latestCartRef.current = serverCart;
    setStoredUser(res.user);
    setStoredCart(serverCart);
    setUser(res.user);
    setHasStore(res.user.has_store || false);
    cartReadyRef.current = true;

    return res.user;
  };



  const updateProfile = async (address?: string, phone_number?: string) => {
    const updatedUser = await updateUserProfile({ address, phone_number });
    setUser(updatedUser);
    setStoredUser(updatedUser); // Keep cache in sync
    return updatedUser;
  };

  const logout = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.error("Backend logout failed, proceeding with local logout", err);
    } finally {
      setStoredToken(null);
      setStoredUser(null);
      setStoredCart([]);
      cartReadyRef.current = false;
      cartDirtyRef.current = false;
      setUser(null);
      setCartState([]);
      latestCartRef.current = [];
      cartReadyRef.current = true;
      setDiscountPercentage(0);
    }
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
      const serverItems = await fetchCart();
      setCartState((prev) => {
        const updated = prev.map((item) => {
          const serverMatch = serverItems.find((s) => s.id === item.id);
          if (serverMatch) {
            return {
              ...item,
              stock: serverMatch.stock,
              out_of_stock: serverMatch.out_of_stock,
              insufficient_stock: serverMatch.stock < item.quantity,
            };
          }
          return item;
        });
        return updated;
      });
      // Don't mark dirty — this is a read not a user change
    } catch (err) {
      console.error("Failed to refresh cart stock", err);
    }
  }, []);

  const executeOrder = async (city: string, province: string) => {
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
        city,
        province,
      });

      cartDirtyRef.current = false;
      setCartState([]);
      latestCartRef.current = [];
      setGuestCart([]);
      setStoredCart([]);
      setDiscountPercentage(0);
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

  // Individual / partial order — buys specific items and keeps the rest of the cart
  const placePartialOrder = async (itemsToBuy: CartItem[], city: string, province: string): Promise<void> => {
    if (!isAuthenticated) {
      await promptSignIn();
      return;
    }
    if (itemsToBuy.length === 0 || placingOrderRef.current) return;

    placingOrderRef.current = true;
    setIsPlacingOrder(true);

    try {
      await placeOrder(
        { 
          items: itemsToBuy.map((item) => ({ id: item.id, quantity: item.quantity })),
          city,
          province
        },
        true, // partial=true — backend only removes these items from cart
      );

      // Remove purchased items from frontend cart state
      const purchasedIds = new Set(itemsToBuy.map((i) => i.id));
      const remaining = latestCartRef.current.filter((i) => !purchasedIds.has(i.id));

      cartDirtyRef.current = false;
      setCartState(remaining);
      latestCartRef.current = remaining;
      setStoredCart(remaining);

      // If cart is now empty, explicitly clear backend cart
      if (remaining.length === 0 && getStoredToken()) {
        try { await clearCart(); } catch { /* best effort */ }
      }

      await loadProducts(); // Refresh stock counts
    } catch (error: any) {
      throw error; // Let the caller (cart page) handle the error UI
    } finally {
      placingOrderRef.current = false;
      setIsPlacingOrder(false);
    }
  };

  const handleAIAction = async (action: string) => {
    if (!action || action === "NONE") return;

    console.log(`[AI_TRACE] handleAIAction called with action: ${action.substring(0, 100)}${action.length > 100 ? '...' : ''}`);

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
      const parts = action.split(":");
      const productId = parseInt(parts[1]);
      const qtyToAdd =
        parts.length >= 4 && parts[2].toUpperCase() === "QTY"
          ? parseInt(parts[3]) || 1
          : 1;

      const productToAdd = products.find((p) => p.id === productId);
      
      let selectedSize = undefined;
      let selectedColor = undefined;
      const sizeIndex = parts.indexOf("SIZE");
      if (sizeIndex !== -1 && sizeIndex + 1 < parts.length) selectedSize = parts[sizeIndex + 1];
      const colorIndex = parts.indexOf("COLOR");
      if (colorIndex !== -1 && colorIndex + 1 < parts.length) selectedColor = parts[colorIndex + 1];

      if (productToAdd) {
        setCart((prev) => {
          const itemKey = `${productId}-${selectedSize || ''}-${selectedColor || ''}`;
          const existing = prev.find((item) => `${item.id}-${item.selected_size || ''}-${item.selected_color || ''}` === itemKey);
          if (existing) {
            return prev.map((item) =>
              `${item.id}-${item.selected_size || ''}-${item.selected_color || ''}` === itemKey
                ? { ...item, quantity: item.quantity + qtyToAdd }
                : item,
            );
          }
          return [...prev, { ...productToAdd, quantity: qtyToAdd, selected_size: selectedSize, selected_color: selectedColor }];
        });
        setForceBillingItemId(productId);
        router.push("/cart");
      }
      return;
    }

    if (action === "PLACE_ORDER") {
      executeOrder("", "");
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
      
      let selectedSize = undefined;
      let selectedColor = undefined;
      const sizeIndex = parts.indexOf("SIZE");
      if (sizeIndex !== -1 && sizeIndex + 1 < parts.length) selectedSize = parts[sizeIndex + 1];
      const colorIndex = parts.indexOf("COLOR");
      if (colorIndex !== -1 && colorIndex + 1 < parts.length) selectedColor = parts[colorIndex + 1];

      if (productToAdd) {
        setCart((prev) => {
          const itemKey = `${productId}-${selectedSize || ''}-${selectedColor || ''}`;
          const existing = prev.find((item) => `${item.id}-${item.selected_size || ''}-${item.selected_color || ''}` === itemKey);
          if (existing) {
            return prev.map((item) =>
              `${item.id}-${item.selected_size || ''}-${item.selected_color || ''}` === itemKey
                ? { ...item, quantity: item.quantity + qtyToAdd }
                : item,
            );
          }
          return [...prev, { ...productToAdd, quantity: qtyToAdd, selected_size: selectedSize, selected_color: selectedColor }];
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

    if (action === "NAVIGATE_STORE_REGISTER") {
      router.push("/seller/register");
      return;
    }

    if (action.startsWith("PREFILL_STORE:")) {
      // Parse: PREFILL_STORE:name=X:address=Y:phone=Z:cats=A,B:desc=D
      const raw = action.replace("PREFILL_STORE:", "");
      const pairs: Record<string, string> = {};
      raw.split(/:(?=[a-z]+=)/i).forEach((chunk) => {
        const eqIdx = chunk.indexOf("=");
        if (eqIdx !== -1) {
          const k = chunk.slice(0, eqIdx).toLowerCase().trim();
          const v = chunk.slice(eqIdx + 1).trim();
          pairs[k] = v;
        }
      });
      const cats = (pairs["cats"] || "").split(",").map((c) => c.trim()).filter(Boolean);
      setPendingStoreData({
        name: pairs["name"] || "",
        address: pairs["address"] || "",
        phone: pairs["phone"] || "",
        description: pairs["desc"] || "",
        categories: cats,
      });
      router.push("/seller/register");
      return;
    }

    if (action.startsWith("CREATE_STORE:")) {
      // Parse: CREATE_STORE:name=X:address=Y:phone=Z:cats=A,B:desc=D
      try {
        const raw = action.replace("CREATE_STORE:", "");
        const pairs: Record<string, string> = {};
        // Split on ":" but only where preceded by a key name (word chars)
        raw.split(/:(?=[a-z]+=)/i).forEach((chunk) => {
          const eqIdx = chunk.indexOf("=");
          if (eqIdx !== -1) {
            const k = chunk.slice(0, eqIdx).toLowerCase().trim();
            const v = chunk.slice(eqIdx + 1).trim();
            pairs[k] = v;
          }
        });
        const cats = (pairs["cats"] || "").split(",").map((c) => c.trim()).filter(Boolean);
        await registerStore({
          name: pairs["name"] || "My Store",
          address: pairs["address"] || "",
          phone: pairs["phone"] || "",
          categories: cats,
          description: pairs["desc"] || undefined,
        });
        setHasStore(true);
        await loadSession();
        router.push("/seller/dashboard");
      } catch (err: any) {
        console.error("[AI] Failed to create store:", err);
        Swal.fire({ icon: "error", title: "Store creation failed", text: err?.response?.data?.detail || "Please try again." });
      }
      return;
    }

    if (action.startsWith("UPDATE_PRODUCT_EDIT:")) {
      try {
        const payload = action.replace("UPDATE_PRODUCT_EDIT:", "");
        const data = JSON.parse(payload);
        window.dispatchEvent(new CustomEvent("UPDATE_PRODUCT_EDIT", { detail: data }));
      } catch (e) {
        console.error("Failed to parse UPDATE_PRODUCT_EDIT payload", e);
      }
      return;
    }

    if (action === "NAVIGATE_SELLER_DASHBOARD") {
      router.push("/seller/dashboard");
      return;
    }

    if (action.startsWith("PREFILL_PRODUCT_UPLOAD:")) {
      try {
        const encodedData = action.replace("PREFILL_PRODUCT_UPLOAD:", "");
        const decodedString = decodeURIComponent(encodedData);
        const data = JSON.parse(decodedString);
        setPendingProductUpload((prev: any) => {
           return { ...prev, ...data };
        });
        if (!window.location.pathname.includes("/seller/products/upload")) {
          router.push("/seller/products/upload");
        }
      } catch (e) {
        console.error("Failed to parse PREFILL_PRODUCT_UPLOAD data", e);
      }
      return;
    }

    if (action.startsWith("NAVIGATE_UPLOAD")) {
      const collectionName = action.replace("NAVIGATE_UPLOAD:", "").replace("NAVIGATE_UPLOAD", "");
      if (collectionName) {
        const collection = [...collections, ...optimisticCollections].find(c => c.name.toLowerCase() === collectionName.toLowerCase());
        console.log(`[AI_TRACE] NAVIGATE_UPLOAD parsed. collectionName: ${collectionName}, found collection ID: ${collection?.id}`);
        if (collection) {
          router.push(`/seller/products/upload?collection_id=${collection.id}`);
          return;
        }
      }
      router.push(`/seller/products/upload`);
      return;
    }

    if (action.startsWith("CREATE_AND_NAVIGATE_UPLOAD:")) {
      const collectionNameStr = action.replace("CREATE_AND_NAVIGATE_UPLOAD:", "");
      const name = collectionNameStr.trim();
      if (name) {
        // Optimistic UI Update - inject fake collection instantly
        const fakeId = -1000 - Date.now();
        const fakeCollection = {
          id: fakeId,
          name,
          description: "Creating...",
          product_count: 0
        };
        setOptimisticCollections([fakeCollection]);

        Swal.fire({
          icon: 'success',
          title: 'Setting up Collection!',
          text: `Creating ${name}...`,
          timer: 2000,
          showConfirmButton: false
        });

        // Navigate to upload page right away
        router.push(`/seller/products/upload?collection_id=${fakeId}`);

        // Run API in the background
        createCollection({ name })
          .then(() => {
            // Once real API succeeds, trigger a refresh to fetch real IDs
            window.dispatchEvent(new Event("refresh_dashboard"));
          })
          .catch((err: any) => {
            console.error("Failed to create collection:", err);
            // Revert optimistic update on failure
            setOptimisticCollections([]);
            Swal.fire({
              icon: 'error',
              title: 'Oops...',
              text: err?.response?.data?.detail || "Failed to create collection.",
            });
          });
      }
      return;
    }

    if (action.startsWith("CREATE_COLLECTIONS:")) {
      const collectionNamesStr = action.replace("CREATE_COLLECTIONS:", "");
      const names = collectionNamesStr.split(",").map(n => n.trim()).filter(Boolean);
      console.log(`[AI_TRACE] CREATE_COLLECTIONS parsed. names:`, names);
      if (names.length > 0) {
        // Optimistic UI Update - inject fake collections instantly
        const fakeCollections = names.map((name, i) => ({
          id: -1000 - i, // negative ID to indicate it's temporary
          name,
          description: "Creating...",
          product_count: 0
        }));
        setOptimisticCollections(fakeCollections);

        Swal.fire({
          icon: 'success',
          title: 'Setting up Collections!',
          text: `Creating ${names.length} collections in the background...`,
          timer: 2000,
          showConfirmButton: false
        });
        
        router.push("/seller/dashboard");

        // Run API in the background
        Promise.all(names.map(name => createCollection({ name })))
          .then(() => {
            // Once real API succeeds, trigger a refresh to fetch real IDs
            window.dispatchEvent(new Event("refresh_dashboard"));
          })
          .catch((err: any) => {
            console.error("Failed to create collections:", err);
            // Revert optimistic update on failure
            setOptimisticCollections([]);
            Swal.fire({
              icon: 'error',
              title: 'Oops...',
              text: err?.response?.data?.detail || "Failed to create some collections.",
            });
          });
      }
      return;
    }

    console.log(`[AI_TRACE] Falling back to standard switch cases for action: ${action}`);
    switch (action) {
      case "SORT_PRICE_ASC":
        console.log(`[AI_TRACE] SORT_PRICE_ASC executed`);
        setProducts([...products].sort((a, b) => a.price - b.price));
        setAiSearchResults([...aiSearchResults].sort((a, b) => a.price - b.price));
        break;
      case "SORT_PRICE_DESC":
        console.log(`[AI_TRACE] SORT_PRICE_DESC executed`);
        setProducts([...products].sort((a, b) => b.price - a.price));
        setAiSearchResults([...aiSearchResults].sort((a, b) => b.price - a.price));
        break;
      case "TRIGGER_HAGGLE_MODE":
        console.log(`[AI_TRACE] TRIGGER_HAGGLE_MODE executed`);
        setIsHaggleMode(true);
        break;
      case "NAVIGATE_CART":
        console.log(`[AI_TRACE] NAVIGATE_CART executed`);
        router.push("/cart");
        break;
      default:
        console.log(`[AI_TRACE] Unhandled action type: ${action}`);
        break;
    }
  };

  return (
    <StoreContext.Provider
      value={{
        products,
        setProducts,
        isProductsLoading,
        productsLoadTime,
        cart,
        setCart,
        user,
        isAuthenticated,
        isAuthLoading,
        login,
        register,
        googleLogin,
        logout,
        promptSignIn,
        updateProfile,
        handleAIAction,
        isHaggleMode,
        hasStore,
        setHasStore,
        pendingStoreData,
        setPendingStoreData,
        fetchProducts: loadProducts,
        refreshSession: loadSession,
        executeOrder,
        placePartialOrder,
        isPlacingOrder,
        cartHasStockIssues,
        refreshCartStock,
        aiSearchResults,
        forceBillingItemId,
        setForceBillingItemId,
        discountPercentage,
        setDiscountPercentage,
        notifications,
        setNotifications,
        optimisticCollections,
        setOptimisticCollections,
        collections,
        pendingProductUpload,
        setPendingProductUpload,
        isChatOpen,
        setIsChatOpen,
        pendingImageAnalysis,
        setPendingImageAnalysis,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => useContext(StoreContext);
