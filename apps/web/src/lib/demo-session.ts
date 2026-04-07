import type { AuthSession, DemoUser } from "@ziyu/shared";

const STORAGE_KEY = "ziyu-demo-session";

export function getStoredDemoSession(): AuthSession | null {
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

export function getStoredDemoUser(): DemoUser | null {
  return getStoredDemoSession()?.user ?? null;
}

export function setStoredDemoSession(session: AuthSession): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearStoredDemoUser(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEY);
}
