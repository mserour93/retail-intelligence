import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { api, getCurrentUserId, setCurrentUserId } from "../api/client";
import type { Persona } from "../api/types";

interface AuthContextValue {
  personas: Persona[];
  currentUser: Persona | null;
  loading: boolean;
  login: (userId: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [currentUser, setCurrentUser] = useState<Persona | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ personas: Persona[] }>("/auth/personas")
      .then(({ personas }) => {
        setPersonas(personas);
        const savedId = getCurrentUserId();
        const saved = savedId ? personas.find((p) => p.id === savedId) : null;
        if (saved) setCurrentUser(saved);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(
    async (userId: string) => {
      await api.post("/auth/login", { userId }); // records the sign-in in the audit trail
      setCurrentUserId(userId);
      const persona = personas.find((p) => p.id === userId) ?? null;
      setCurrentUser(persona);
    },
    [personas],
  );

  const logout = useCallback(() => {
    setCurrentUserId(null);
    setCurrentUser(null);
  }, []);

  return <AuthContext.Provider value={{ personas, currentUser, loading, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
