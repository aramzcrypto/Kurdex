import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import * as SecureStore from "expo-secure-store";
import axios from "axios";
import { getApiBaseUrl } from "../constants/api";

interface AuthUser {
  id: number;
  email: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const ACCESS_KEY = "kurdex_access_token";
const REFRESH_KEY = "kurdex_refresh_token";

async function storeTokens(accessToken: string, refreshToken: string) {
  await SecureStore.setItemAsync(ACCESS_KEY, accessToken);
  await SecureStore.setItemAsync(REFRESH_KEY, refreshToken);
}

async function clearTokens() {
  await SecureStore.deleteItemAsync(ACCESS_KEY);
  await SecureStore.deleteItemAsync(REFRESH_KEY);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      const storedAccess = await SecureStore.getItemAsync(ACCESS_KEY);
      const storedRefresh = await SecureStore.getItemAsync(REFRESH_KEY);
      if (storedAccess) {
        setAccessToken(storedAccess);
        setRefreshToken(storedRefresh);
        try {
          const res = await axios.get(`${getApiBaseUrl()}/api/auth/me`, {
            headers: { Authorization: `Bearer ${storedAccess}` },
          });
          setUser(res.data?.user || null);
        } catch {
          await clearTokens();
          setUser(null);
          setAccessToken(null);
          setRefreshToken(null);
        }
      }
      setLoading(false);
    };
    bootstrap();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await axios.post(`${getApiBaseUrl()}/api/auth/login`, { email, password });
    setUser(res.data.user);
    setAccessToken(res.data.accessToken);
    setRefreshToken(res.data.refreshToken);
    await storeTokens(res.data.accessToken, res.data.refreshToken);
  };

  const register = async (email: string, password: string) => {
    const res = await axios.post(`${getApiBaseUrl()}/api/auth/register`, { email, password });
    setUser(res.data.user);
    setAccessToken(res.data.accessToken);
    setRefreshToken(res.data.refreshToken);
    await storeTokens(res.data.accessToken, res.data.refreshToken);
  };

  const logout = async () => {
    if (accessToken) {
      await axios.post(
        `${getApiBaseUrl()}/api/auth/logout`,
        { refreshToken },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      ).catch(() => {});
    }
    await clearTokens();
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
  };

  const deleteAccount = async () => {
    if (!accessToken) return;
    await axios.delete(`${getApiBaseUrl()}/api/auth/account`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    await clearTokens();
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
  };

  const value = useMemo(
    () => ({ user, loading, accessToken, refreshToken, login, register, logout, deleteAccount }),
    [user, loading, accessToken, refreshToken]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
