import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@/types";
import { useData } from "@/data/store";

const SESSION_KEY = "surf-sales-os:session:v1";
const THEME_KEY = "surf-sales-os:theme:v1";

interface SessionContextValue {
  currentUser: User | null;
  isAuthenticated: boolean;
  login: (userId: string) => void;
  logout: () => void;
  theme: "light" | "dark";
  toggleTheme: () => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const { users } = useData();
  const [userId, setUserId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(SESSION_KEY);
  });
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") return "light";
    return (window.localStorage.getItem(THEME_KEY) as "light" | "dark") || "light";
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    window.localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const currentUser = useMemo(
    () => users.find((u) => u.id === userId) ?? null,
    [users, userId]
  );

  const login = useCallback((id: string) => {
    setUserId(id);
    window.localStorage.setItem(SESSION_KEY, id);
  }, []);

  const logout = useCallback(() => {
    setUserId(null);
    window.localStorage.removeItem(SESSION_KEY);
  }, []);

  const toggleTheme = useCallback(
    () => setTheme((t) => (t === "light" ? "dark" : "light")),
    []
  );

  const value: SessionContextValue = {
    currentUser,
    isAuthenticated: Boolean(currentUser),
    login,
    logout,
    theme,
    toggleTheme,
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession debe usarse dentro de <SessionProvider>");
  return ctx;
}
