const BASE_URL = "/api";

export function getToken(): string | null {
  return localStorage.getItem("mana_token");
}

export function setToken(token: string): void {
  localStorage.setItem("mana_token", token);
}

export function removeToken(): void {
  localStorage.removeItem("mana_token");
  localStorage.removeItem("mana_user");
}

export interface StoredUser {
  userId: string;
  communityId?: number;
  role?: string;
  fullName?: string;
  email?: string;
  dateOfBirth?: string;
  permissions?: string[];
}

export function getStoredUser(): StoredUser | null {
  const raw = localStorage.getItem("mana_user");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredUser;
  } catch {
    return null;
  }
}

export function storeUser(user: StoredUser): void {
  localStorage.setItem("mana_user", JSON.stringify(user));
}

function buildHeaders(contentType = "application/json"): HeadersInit {
  const headers: Record<string, string> = {
    "Content-Type": contentType,
  };
  const token = getToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.status === 401 || res.status === 403) {
    // 401 = not authenticated, 403 = not authorized (missing/invalid token or role)
    // Both indicate the user needs to re-login during development
    const token = getToken();
    console.warn(
      `[apiClient] ${res.status} on ${res.url}. Token present: ${!!token}`,
      token ? `(token: ${token.substring(0, 20)}...)` : "(no token)"
    );
    removeToken();
    window.location.href = "/login";
    throw new Error(res.status === 401 ? "Unauthorized" : "Forbidden — please log in again");
  }
  if (!res.ok) {
    let message = `Request failed with status ${res.status}`;
    try {
      const text = await res.text();
      if (text) message = text;
    } catch {
      // ignore
    }
    throw new Error(message);
  }
  // 204 No Content
  if (res.status === 204) return undefined as T;
  
  const text = await res.text();
  if (!text) return undefined as T;
  
  try {
    return JSON.parse(text) as T;
  } catch {
    // If it's not valid JSON (e.g., a plain string message), return the raw text
    return text as unknown as T;
  }
}

export const apiClient = {
  async get<T>(path: string): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: "GET",
      headers: buildHeaders(),
    });
    return handleResponse<T>(res);
  },

  async post<T>(path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: "POST",
      headers: buildHeaders(),
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    return handleResponse<T>(res);
  },

  async put<T>(path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: "PUT",
      headers: buildHeaders(),
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    return handleResponse<T>(res);
  },

  async patch<T>(path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: "PATCH",
      headers: buildHeaders(),
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    return handleResponse<T>(res);
  },

  async delete<T>(path: string): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: "DELETE",
      headers: buildHeaders(),
    });
    return handleResponse<T>(res);
  },

  async postForm<T>(path: string, formData: FormData): Promise<T> {
    const token = getToken();
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(`${BASE_URL}${path}`, {
      method: "POST",
      headers,
      body: formData,
    });
    return handleResponse<T>(res);
  },
};
