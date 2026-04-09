import {
  type AuthSession,
  type CreateOrderResult,
  demoUsers,
  featuredResources,
  findResourceById,
  membershipPlans,
  type PasswordLoginInput,
  platformHighlights,
  type RegisterBuyerInput,
  resourceDetails,
  sellerDashboard,
  type ApiResponse,
  type CreateResourceInput,
  type DashboardStat,
  type DemoUser,
  type RefundRequestInput,
  type ResourceCard,
  type ResourceDetail,
  type SellerDashboard,
  type SellerWorkspaceData,
  type WithdrawalRequestInput,
  type WorkflowOrderRecord
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

async function postJson<TResponse, TPayload>(path: string, payload: TPayload): Promise<TResponse | null> {
  return postJsonWithToken(path, payload);
}

async function postJsonWithToken<TResponse, TPayload>(path: string, payload: TPayload, token?: string): Promise<TResponse | null> {
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

export async function getFeaturedResources(): Promise<ResourceCard[]> {
  return requestJson("/resources/featured", featuredResources);
}

export async function getResourceList(): Promise<ResourceDetail[]> {
  return requestJson("/resources", resourceDetails);
}

export async function getResourceDetail(resourceId: string): Promise<ResourceDetail | null> {
  return requestJson(`/resources/${resourceId}`, findResourceById(resourceId) ?? null);
}

export async function getPlatformHighlights(): Promise<DashboardStat[]> {
  return Promise.resolve(platformHighlights);
}

export async function getMembershipPlans() {
  return Promise.resolve(membershipPlans);
}

export async function getSellerDashboard(): Promise<SellerDashboard> {
  return Promise.resolve(sellerDashboard);
}

export async function getDemoUsers(): Promise<DemoUser[]> {
  return requestJson("/auth/demo-users", demoUsers);
}

export async function loginDemoUser(userId: string): Promise<AuthSession | null> {
  return postJson("/auth/login", { userId });
}

export async function registerBuyerAccount(payload: RegisterBuyerInput): Promise<AuthSession | null> {
  return postJson("/auth/register", payload);
}

export async function loginBuyerAccount(payload: PasswordLoginInput): Promise<AuthSession | null> {
  return postJson("/auth/password-login", payload);
}

export async function getBuyerOrders(token: string): Promise<WorkflowOrderRecord[]> {
  return requestJson("/orders/mine", [], token);
}

export async function createOrder(token: string, buyerId: string, resourceId: string): Promise<CreateOrderResult | null> {
  return postJsonWithToken("/orders", { buyerId, resourceId }, token);
}

export async function confirmBuyerOrder(orderId: string, buyerId: string, token: string): Promise<WorkflowOrderRecord | null> {
  return postJsonWithToken(`/orders/${orderId}/confirm`, { buyerId }, token);
}

export async function requestBuyerRefund(orderId: string, reason: string, token: string): Promise<WorkflowOrderRecord | null> {
  return postJsonWithToken<WorkflowOrderRecord, RefundRequestInput>(`/orders/${orderId}/refund`, { reason }, token);
}

export async function getSellerWorkspace(token: string): Promise<SellerWorkspaceData | null> {
  return requestJson(`/seller/workspace/me`, null, token);
}

export async function deliverSellerOrder(orderId: string, sellerId: string, deliveryNote: string, token: string): Promise<WorkflowOrderRecord | null> {
  return postJsonWithToken(`/seller/orders/${orderId}/deliver`, { sellerId, deliveryNote }, token);
}

export async function createSellerResource(input: CreateResourceInput, token: string) {
  return postJsonWithToken<ResourceDetail, CreateResourceInput>(`/resources`, input, token);
}

export async function createSellerWithdrawal(input: WithdrawalRequestInput, token: string) {
  return postJsonWithToken<{ id: string }, WithdrawalRequestInput>(`/seller/withdrawals`, input, token);
}
