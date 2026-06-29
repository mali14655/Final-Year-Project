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

  const restoreSession = useCallback(async () => {
    const data = await refreshSessionRequest();
    setUser(data.user);
    return data.user;
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        await restoreSession();
      } catch {
        clearAccessToken();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [restoreSession]);

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
    if (data.pendingApproval) {
      return data;
    }
    setUser(data.user);
    return data;
  };

  const updateUser = useCallback((nextUser) => {
    setUser(nextUser);
  }, []);

  const refreshUser = useCallback(async () => {
    const nextUser = await fetchCurrentUser();
    setUser(nextUser);
    return nextUser;
  }, []);

  const value = {
    user,
    loading,
    isAuthenticated: Boolean(user),
    login,
    register,
    logout,
    updateUser,
    refreshUser,
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
