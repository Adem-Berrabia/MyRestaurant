import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  setToken,
  setUnauthorizedHandler,
  loginRequest,
  registerRequest,
  meRequest,
  updateProfileRequest,
} from "../services/api";
import { saveUser, clearUser } from "../services/user";

const AuthContext = createContext();
const TOKEN_KEY = "myrestaurant_token";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const startSession = async ({ token, user }) => {
    setToken(token);
    await AsyncStorage.setItem(TOKEN_KEY, token);
    await saveUser(user.nom);
    setUser(user);
  };

  const logout = async () => {
    setToken(null);
    await AsyncStorage.removeItem(TOKEN_KEY);
    await clearUser();
    setUser(null);
  };

  // Restore the session at startup
  useEffect(() => {
    setUnauthorizedHandler(() => {
      logout();
    });
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(TOKEN_KEY);
        if (saved) {
          setToken(saved);
          const me = await meRequest();
          await saveUser(me.nom);
          setUser(me);
        }
      } catch (e) {
        setToken(null); // invalid token or server unreachable -> login screen
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = async (email, password) =>
    startSession(await loginRequest(email, password));

  const register = async (nom, email, password) =>
    startSession(await registerRequest(nom, email, password));

  const updateProfile = async (nom) => {
    const me = await updateProfileRequest(nom);
    await saveUser(me.nom);
    setUser(me);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, updateProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
