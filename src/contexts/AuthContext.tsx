import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import {
  getToken,
  setToken,
  removeToken,
  getStoredUser,
  storeUser,
  type StoredUser,
} from "../services/apiClient";
import { authService } from "../services/authService";
import { userService } from "../services/userService";
import type { LoginRequest, RegisterRequest } from "../types/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuthUser extends StoredUser {
  userId: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isSportsAdmin: boolean;
  isAuctionAdmin: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  /** Call this to hydrate communityId / role after receiving extra user info */
  updateUser: (patch: Partial<StoredUser>) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    // Hydrate from localStorage on first render
    const stored = getStoredUser();
    const token = getToken();
    if (stored && token) return stored as AuthUser;
    return null;
  });

  const updateUser = useCallback((patch: Partial<StoredUser>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...patch };
      storeUser(updated);
      return updated;
    });
  }, []);

  // Synchronize full profile and permissions on startup
  useEffect(() => {
    const token = getToken();
    if (token) {
      userService.getMe()
        .then((me) => {
          updateUser({
            role: me.role,
            fullName: me.fullName,
            email: me.email,
            communityId: me.communityId,
            permissions: me.permissions,
          });
        })
        .catch((err) => {
          console.error("Failed to synchronize user permissions on boot:", err);
        });
    }
  }, [updateUser]);

  const login = useCallback(async (data: LoginRequest) => {
    const response = await authService.login(data);
    setToken(response.token);

    // Try to use direct response fields first, fallback to JWT payload
    const payload = decodeJwtPayload(response.token);
    const newUser: AuthUser = {
      userId: response.userId,
      role: response.role ?? (payload?.role != null ? String(payload.role) : "MEMBER"),
      communityId: response.communityId ?? (payload?.communityId != null ? Number(payload.communityId) : undefined),
      fullName: response.fullName ?? (payload?.fullName != null ? String(payload.fullName) : payload?.sub != null ? String(payload.sub) : undefined),
      email: response.email ?? (payload?.email != null ? String(payload.email) : undefined),
      dateOfBirth: response.dateOfBirth,
    };
    storeUser(newUser);
    setUser(newUser);

    try {
      const me = await userService.getMe();
      const updated = {
        ...newUser,
        role: me.role,
        fullName: me.fullName,
        email: me.email,
        communityId: me.communityId,
        permissions: me.permissions,
      };
      storeUser(updated);
      setUser(updated);
    } catch (err) {
      console.error("Failed to sync permissions on login:", err);
    }
  }, []);

  const register = useCallback(async (data: RegisterRequest) => {
    const response = await authService.register(data);
    setToken(response.token);

    const payload = decodeJwtPayload(response.token);
    const newUser: AuthUser = {
      userId: response.userId,
      role: response.role ?? (payload?.role != null ? String(payload.role) : "MEMBER"),
      communityId: response.communityId ?? (payload?.communityId != null ? Number(payload.communityId) : undefined),
      fullName: response.fullName ?? (payload?.fullName != null ? String(payload.fullName) : undefined),
      email: response.email ?? data.email,
      dateOfBirth: response.dateOfBirth,
    };
    storeUser(newUser);
    setUser(newUser);

    try {
      const me = await userService.getMe();
      const updated = {
        ...newUser,
        role: me.role,
        fullName: me.fullName,
        email: me.email,
        communityId: me.communityId,
        permissions: me.permissions,
      };
      storeUser(updated);
      setUser(updated);
    } catch (err) {
      console.error("Failed to sync permissions on registration:", err);
    }
  }, []);

  const logout = useCallback(() => {
    removeToken();
    setUser(null);
    window.location.href = "/login";
  }, []);

  // Removed redundant updateUser declaration

  const value: AuthContextValue = {
    user,
    isAuthenticated: !!user && !!getToken(),
    isAdmin: user?.role === "ADMIN" || user?.role === "SUPER_ADMIN" || user?.role === "COMMUNITY_ADMIN",
    isSportsAdmin: user?.role === "SPORTS_ADMIN" || user?.role === "SUPER_ADMIN" || user?.role === "COMMUNITY_ADMIN",
    isAuctionAdmin: user?.role === "SUPER_ADMIN" || user?.role === "COMMUNITY_ADMIN" || user?.role === "SPORTS_ADMIN" || user?.role === "ADMIN",
    login,
    register,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Safely decode the JWT payload (base64url → JSON). Returns null on failure. */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const base64 = token.split(".")[1];
    if (!base64) return null;
    const padded = base64.replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(padded);
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}
