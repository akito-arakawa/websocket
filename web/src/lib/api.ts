import type { User, Group, ChatMessage } from "../types";

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";

export function getToken(): string | null {
  return localStorage.getItem("token");
}

export function setToken(token: string): void {
  localStorage.setItem("token", token);
}

export function clearToken(): void {
  localStorage.removeItem("token");
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      (data as { error?: string }).error ?? `Request failed: ${response.status}`,
    );
  }

  return data as T;
}

export const api = {
  register: (body: { email: string; password: string; displayName: string }) =>
    request<{ user: User; token: string }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  login: (body: { email: string; password: string }) =>
    request<{ user: User; token: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  me: () => request<{ user: User }>("/auth/me"),

  listGroups: () => request<{ groups: Group[] }>("/groups"),

  createGroup: (name: string) =>
    request<{ group: Group }>("/groups", {
      method: "POST",
      body: JSON.stringify({ name }),
    }),

  joinGroup: (groupId: string) =>
    request<{ group: Group }>("/groups/join", {
      method: "POST",
      body: JSON.stringify({ groupId }),
    }),

  listMessages: (groupId: string, before?: string) => {
    const params = new URLSearchParams({ groupId, limit: "50" });
    if (before) params.set("before", before);
    return request<{ messages: ChatMessage[]; hasMore: boolean }>(
      `/messages?${params}`,
    );
  },
};
