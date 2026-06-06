import { createContext, useCallback, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiLogin, apiRegister, type AuthUser } from "../lib/api";

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string, confirmPassword: string) => Promise<void>;
  logout: () => void;
  updateUser: (user: AuthUser) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function restore() {
      try {
        const storedToken = await AsyncStorage.getItem("csag_token");
        const storedUser = await AsyncStorage.getItem("csag_user");
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser) as AuthUser);
        }
      } catch {
        await AsyncStorage.multiRemove(["csag_token", "csag_user"]);
      } finally {
        setLoading(false);
      }
    }
    void restore();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiLogin(email, password);
    await AsyncStorage.setItem("csag_token", res.accessToken);
    await AsyncStorage.setItem("csag_user", JSON.stringify(res.user));
    setToken(res.accessToken);
    setUser(res.user);
  }, []);

  const register = useCallback(async (username: string, email: string, password: string, confirmPassword: string) => {
    const res = await apiRegister(username, email, password, confirmPassword);
    await AsyncStorage.setItem("csag_token", res.accessToken);
    await AsyncStorage.setItem("csag_user", JSON.stringify(res.user));
    setToken(res.accessToken);
    setUser(res.user);
  }, []);

  const logout = useCallback(async () => {
    await AsyncStorage.multiRemove(["csag_token", "csag_user"]);
    setToken(null);
    setUser(null);
  }, []);

  const updateUser = useCallback(async (updated: AuthUser) => {
    setUser(updated);
    await AsyncStorage.setItem("csag_user", JSON.stringify(updated));
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout: () => void logout(), updateUser: (u) => void updateUser(u) }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
