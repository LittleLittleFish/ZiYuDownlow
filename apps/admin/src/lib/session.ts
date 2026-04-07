import type { AuthSession, DemoUser } from "@ziyu/shared";

const STORAGE_KEY = "ziyu-admin-session";

export function getStoredAdminSession(): AuthSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
}

export function getStoredAdmin(): DemoUser | null {
  return getStoredAdminSession()?.user ?? null;
}

export function setStoredAdminSession(session: AuthSession): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearStoredAdmin(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEY);
}
