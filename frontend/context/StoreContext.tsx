"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation"; // 1. Import Router

const StoreContext = createContext<any>(null);

export const StoreProvider = ({ children }: { children: React.ReactNode }) => {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState<any[]>([]); // Typed as array
  const [isHaggleMode, setIsHaggleMode] = useState(false);

  const router = useRouter(); // 2. Initialize Router

  // Fetch products
  const fetchProducts = async () => {
    try {
      const res = await axios.get("http://localhost:8000/products");
      setProducts(res.data);
    } catch (err) {
      console.error("Failed to fetch products", err);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // 3. The Brain: Handling AI Commands
  const handleAIAction = (action: string) => {
    console.log("AI triggered action:", action);

    // Case A: Add to Cart (Format: "ADD_TO_CART:5")
    if (action.startsWith("ADD_TO_CART:")) {
      const productId = parseInt(action.split(":")[1]);
      const productToAdd = products.find((p: any) => p.id === productId);

      if (productToAdd) {
        setCart((prev) => [...prev, productToAdd]);
        // Optional: You could trigger a toast notification here
        console.log("AI added to cart:", productToAdd);
      }
      return;
    }

    // Case B: Standard Actions
    switch (action) {
      case "SORT_PRICE_ASC":
        setProducts([...products].sort((a: any, b: any) => a.price - b.price));
        break;
      case "SORT_PRICE_DESC":
        setProducts([...products].sort((a: any, b: any) => b.price - a.price));
        break;
      case "TRIGGER_HAGGLE_MODE":
        setIsHaggleMode(true);
        break;
      case "NAVIGATE_CART": // Case C: Navigation
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
        handleAIAction,
        isHaggleMode,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => useContext(StoreContext);
