import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { User, UserRole } from "@/types";
import { useData } from "@/data/store";
import { hashPassword } from "@/lib/auth";

const SESSION_KEY = "atlas-sales-os:session:v2";
const THEME_KEY = "atlas-sales-os:theme:v1";

export type LoginResult =
  | { ok: true; user: User }
  | { ok: false; reason: "not_found" | "wrong_password" | "inactive" };

export type RegisterResult =
  | { ok: true; user: User }
  | { ok: false; reason: "email_taken" };

interface SessionContextValue {
  currentUser: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  loginAs: (userId: string) => void; // atajo demo
  register: (input: { name: string; email: string; password: string; role?: UserRole }) => Promise<RegisterResult>;
  logout: () => void;
  theme: "light" | "dark";
  toggleTheme: () => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const { users, registerUser, logAudit, _setActor } = useData();
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

  // Mantiene informado al store del actor para la auditoría.
  useEffect(() => {
    _setActor(currentUser);
  }, [currentUser, _setActor]);

  const login = useCallback(
    async (email: string, password: string): Promise<LoginResult> => {
      const normalized = email.trim().toLowerCase();
      const user = users.find((u) => u.email.toLowerCase() === normalized);
      if (!user) return { ok: false, reason: "not_found" };
      if (!user.active) return { ok: false, reason: "inactive" };
      const hash = await hashPassword(password);
      if (user.password_hash && user.password_hash !== hash) {
        return { ok: false, reason: "wrong_password" };
      }
      setUserId(user.id);
      window.localStorage.setItem(SESSION_KEY, user.id);
      _setActor(user);
      logAudit({ action: "login", resource: "session", resource_id: user.id, meta: user.email });
      return { ok: true, user };
    },
    [users, logAudit, _setActor]
  );

  const loginAs = useCallback(
    (id: string) => {
      setUserId(id);
      window.localStorage.setItem(SESSION_KEY, id);
      const user = users.find((u) => u.id === id) ?? null;
      _setActor(user);
      if (user) logAudit({ action: "login", resource: "session", resource_id: user.id, meta: user.email + " (demo)" });
    },
    [users, logAudit, _setActor]
  );

  const register = useCallback(
    async ({ name, email, password, role }: { name: string; email: string; password: string; role?: UserRole }): Promise<RegisterResult> => {
      const normalized = email.trim().toLowerCase();
      if (users.some((u) => u.email.toLowerCase() === normalized)) {
        return { ok: false, reason: "email_taken" };
      }
      const password_hash = await hashPassword(password);
      const user = registerUser({ name: name.trim(), email: normalized, password_hash, role });
      setUserId(user.id);
      window.localStorage.setItem(SESSION_KEY, user.id);
      return { ok: true, user };
    },
    [users, registerUser]
  );

  const logout = useCallback(() => {
    if (currentUser) {
      logAudit({ action: "logout", resource: "session", resource_id: currentUser.id });
    }
    setUserId(null);
    window.localStorage.removeItem(SESSION_KEY);
    _setActor(null);
  }, [currentUser, logAudit, _setActor]);

  const toggleTheme = useCallback(
    () => setTheme((t) => (t === "light" ? "dark" : "light")),
    []
  );

  const value: SessionContextValue = {
    currentUser,
    isAuthenticated: Boolean(currentUser),
    login,
    loginAs,
    register,
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
