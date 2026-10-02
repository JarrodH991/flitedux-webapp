/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
}

interface CartContextType {
  cart: Course[];
  purchasedCourses: Course[];
  addToCart: (course: Course) => void;
  removeFromCart: (courseId: string) => void;
  clearCart: () => void;
  completeCheckout: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<Course[]>([]);
  
  // Lazy state initialization: runs once on mount without triggering a cascading re-render
  const [purchasedCourses, setPurchasedCourses] = useState<Course[]>(() => {
    const saved = localStorage.getItem("flitedux_purchased");
    return saved ? JSON.parse(saved) : [];
  });

  // Keep localStorage synced whenever purchasedCourses updates
  useEffect(() => {
    localStorage.setItem("flitedux_purchased", JSON.stringify(purchasedCourses));
  }, [purchasedCourses]);

  const addToCart = (course: Course) => {
    if (!cart.some((item) => item.id === course.id)) {
      setCart([...cart, course]);
    }
  };

  const removeFromCart = (courseId: string) => {
    setCart(cart.filter((item) => item.id !== courseId));
  };

  const clearCart = () => setCart([]);

  const completeCheckout = () => {
    const updatedPurchases = [...purchasedCourses, ...cart];
    setPurchasedCourses(updatedPurchases);
    clearCart();
  };

  return (
    <CartContext.Provider
      value={{ cart, purchasedCourses, addToCart, removeFromCart, clearCart, completeCheckout }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};