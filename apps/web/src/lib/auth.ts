"use client";

const TOKEN_KEY = "goodhuman.token";
const USER_KEY = "goodhuman.user";
export const AUTH_EVENT = "goodhuman-auth";

export type AuthUser = {
  id: string;
  email: string;
  role: string;
  displayName: string;
  premium?: boolean;
  bookerSubtype?: string | null;
};

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

function notifyAuthChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(AUTH_EVENT));
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
  notifyAuthChanged();
}

export function setSession(token: string, user: AuthUser) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  notifyAuthChanged();
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  notifyAuthChanged();
}

export function clearSession() {
  clearToken();
}
