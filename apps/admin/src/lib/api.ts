import {
  adminOverview,
  demoUsers,
  type AdminOverview,
  type ApiResponse,
  type AuthSession,
  type DemoUser,
  type ResolveRefundInput,
  type ReviewWithdrawalInput,
  type UploadedResourceRecord
} from "@ziyu/shared";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api";

function createHeaders(token?: string): HeadersInit | undefined {
  if (!token) {
    return undefined;
  }

  return {
    Authorization: `Bearer ${token}`
  };
}

async function requestJson<T>(path: string, fallback: T, token?: string): Promise<T> {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      cache: "no-store",
      headers: createHeaders(token)
    });

    if (!response.ok) {
      return fallback;
    }

    const payload = (await response.json()) as ApiResponse<T>;
    return payload.data ?? fallback;
  } catch {
    return fallback;
  }
}

async function postJson<TResponse, TPayload>(path: string, payload: TPayload, token?: string): Promise<TResponse | null> {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...createHeaders(token)
      },
      body: JSON.stringify(payload)
    });

    const result = (await response.json()) as ApiResponse<TResponse>;

    if (!response.ok || !result.success || !result.data) {
      return null;
    }

    return result.data;
  } catch {
    return null;
  }
}

export async function getAdminOverview(token?: string): Promise<AdminOverview> {
  return requestJson("/admin/overview", adminOverview, token);
}

export async function getAdminDemoUsers(): Promise<DemoUser[]> {
  return requestJson("/auth/demo-users", demoUsers);
}

export async function loginAdminUser(userId: string): Promise<AuthSession | null> {
  return postJson("/auth/login", { userId });
}

export async function approvePendingResource(resourceId: string, token: string): Promise<UploadedResourceRecord | null> {
  return postJson(`/resources/${resourceId}/approve`, { adminId: "admin-001" }, token);
}

export async function reviewRefund(orderId: string, payload: ResolveRefundInput, token: string) {
  return postJson(`/orders/${orderId}/refund/review`, payload, token);
}

export async function reviewWithdrawalRequest(withdrawalId: string, payload: ReviewWithdrawalInput, token: string) {
  return postJson(`/admin/withdrawals/${withdrawalId}/review`, payload, token);
}
