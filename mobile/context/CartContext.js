import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const CartContext = createContext();
const STORAGE_KEY = "myrestaurant_cart";

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((data) => {
        if (data) setItems(JSON.parse(data));
      })
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (loaded) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, loaded]);

  const addToCart = (meal, qty = 1) =>
    setItems((prev) => {
      const exists = prev.find((i) => i._id === meal._id);
      if (exists) {
        return prev.map((i) =>
          i._id === meal._id ? { ...i, quantite: i.quantite + qty } : i,
        );
      }
      return [
        ...prev,
        {
          _id: meal._id,
          nom: meal.nom,
          prix: meal.prix,
          image: meal.image,
          quantite: qty,
        },
      ];
    });

  const updateQuantity = (id, delta) =>
    setItems((prev) =>
      prev
        .map((i) => (i._id === id ? { ...i, quantite: i.quantite + delta } : i))
        .filter((i) => i.quantite > 0),
    );

  const removeFromCart = (id) =>
    setItems((prev) => prev.filter((i) => i._id !== id));

  const clearCart = () => setItems([]);

  const total = items.reduce((sum, i) => sum + i.prix * i.quantite, 0);
  const count = items.reduce((sum, i) => sum + i.quantite, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        total,
        count,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
