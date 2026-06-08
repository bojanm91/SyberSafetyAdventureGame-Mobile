import { createContext, useCallback, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiDeleteProfile, apiLogin, apiRegister, apiUpdateAvatar, type AuthUser } from "../lib/api";
import { unregisterPushNotifications } from "../lib/notifications";

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  justLoggedIn: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (username: string, email: string, password: string, confirmPassword: string) => Promise<AuthUser>;
  logout: () => void;
  deleteProfile: () => Promise<void>;
  updateUser: (user: AuthUser) => void;
  ackLogin: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [justLoggedIn, setJustLoggedIn] = useState(false);

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

  const login = useCallback(async (email: string, password: string): Promise<AuthUser> => {
    const res = await apiLogin(email, password);
    await AsyncStorage.setItem("csag_token", res.accessToken);
    let nextUser = res.user;
    if (!nextUser.onboardingDone) {
      try {
        const saved = await apiUpdateAvatar({ onboardingDone: true });
        nextUser = { ...nextUser, ...saved, onboardingDone: true };
      } catch {
        nextUser = { ...nextUser, onboardingDone: true };
      }
    }
    await AsyncStorage.setItem("csag_user", JSON.stringify(nextUser));
    await AsyncStorage.setItem("onboardingDone", "true");
    setToken(res.accessToken);
    setUser(nextUser);
    setJustLoggedIn(true);
    return nextUser;
  }, []);

  const register = useCallback(async (username: string, email: string, password: string, confirmPassword: string): Promise<AuthUser> => {
    const res = await apiRegister(username, email, password, confirmPassword);
    await AsyncStorage.setItem("csag_token", res.accessToken);
    await AsyncStorage.setItem("csag_user", JSON.stringify(res.user));
    setToken(res.accessToken);
    setUser(res.user);
    setJustLoggedIn(true);
    return res.user;
  }, []);

  const logout = useCallback(async () => {
    if (user?.id) await unregisterPushNotifications(user.id);
    await AsyncStorage.multiRemove(["csag_token", "csag_user"]);
    setToken(null);
    setUser(null);
    setJustLoggedIn(false);
  }, [user?.id]);

  const deleteProfile = useCallback(async () => {
    const userId = user?.id;
    if (userId) await unregisterPushNotifications(userId);
    await apiDeleteProfile();
    await AsyncStorage.multiRemove([
      "csag_token",
      "csag_user",
      ...(userId ? [`csag_completed_scenarios_${userId}`] : []),
    ]);
    setToken(null);
    setUser(null);
    setJustLoggedIn(false);
  }, [user?.id]);

  const updateUser = useCallback(async (updated: AuthUser) => {
    setUser(updated);
    await AsyncStorage.setItem("csag_user", JSON.stringify(updated));
  }, []);

  const ackLogin = useCallback(() => setJustLoggedIn(false), []);

  return (
    <AuthContext.Provider value={{ user, token, loading, justLoggedIn, login, register, logout: () => void logout(), deleteProfile, updateUser: (u) => void updateUser(u), ackLogin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
