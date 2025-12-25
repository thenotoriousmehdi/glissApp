import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { User } from "../types/auth";
import * as authApi from "../api/auth";
import { AuthContext, type AuthContextValue } from "./AuthContext";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async (): Promise<User | null> => {
    try {
      const me = await authApi.getMe();
      setUser(me);
      return me;
    } catch {
      setUser(null);
      return null;
    }
  };

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        if (!authApi.getAccessToken()) {
          if (mounted) setUser(null);
          return;
        }
        const me = await authApi.getMe();
        if (mounted) setUser(me);
      } catch {
        if (mounted) setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const login = async (username: string, password: string) => {
    const loggedInUser = await authApi.login(username, password);
    setUser(loggedInUser);
    return loggedInUser;
  };

  const logout = async () => {
    await authApi.logout();
    setUser(null);
  };

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, login, logout, refreshUser }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
