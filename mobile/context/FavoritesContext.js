import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "./AuthContext";

const FavoritesContext = createContext();

export function FavoritesProvider({ children }) {
  const { user } = useAuth();
  const key = user ? `myrestaurant_fav_${user.id}` : null; // favorites are per account
  const [ids, setIds] = useState([]);

  useEffect(() => {
    setIds([]);
    if (!key) return;
    AsyncStorage.getItem(key)
      .then((data) => setIds(data ? JSON.parse(data) : []))
      .catch(() => {});
  }, [key]);

  const toggle = (id) => {
    const next = ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];
    setIds(next);
    if (key) AsyncStorage.setItem(key, JSON.stringify(next)).catch(() => {});
  };

  const isFav = (id) => ids.includes(id);

  return (
    <FavoritesContext.Provider value={{ ids, toggle, isFav }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export const useFavorites = () => useContext(FavoritesContext);
