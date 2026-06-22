import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  clearAccessToken,
  loginRequest,
  registerRequest,
  refreshSessionRequest,
  logoutRequest,
  fetchCurrentUser,
} from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } catch {
      clearAccessToken();
    }
    setUser(null);
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        const data = await refreshSessionRequest();
        setUser(data.user);
      } catch {
        clearAccessToken();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  useEffect(() => {
    const handleLogout = () => {
      clearAccessToken();
      setUser(null);
    };
    window.addEventListener("auth:logout", handleLogout);
    return () => window.removeEventListener("auth:logout", handleLogout);
  }, []);

  const login = async (email, password) => {
    const data = await loginRequest(email, password);
    setUser(data.user);
    return data.user;
  };

  const register = async (name, email, password) => {
    const data = await registerRequest(name, email, password);
    setUser(data.user);
    return data.user;
  };

  const value = {
    user,
    loading,
    isAuthenticated: Boolean(user),
    login,
    register,
    logout,
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
