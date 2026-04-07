import { Router } from "express";
import { z } from "zod";
import { type ApiResponse, type AuthSession, type DemoUser } from "@ziyu/shared";
import { listDemoUsers, loginAs, logoutByToken } from "../../store/mock-store.js";
import { requireAuth, type AuthenticatedRequest } from "./middleware.js";

const loginSchema = z.object({
  userId: z.string().min(1)
});

export const authRouter = Router();

authRouter.get("/auth/demo-users", (_request, response) => {
  const payload: ApiResponse<DemoUser[]> = {
    success: true,
    data: listDemoUsers()
  };

  response.json(payload);
});

authRouter.post("/auth/login", (request, response) => {
  const parsed = loginSchema.safeParse(request.body);

  if (!parsed.success) {
    response.status(400).json({
      success: false,
      error: {
        code: "INVALID_LOGIN_PAYLOAD",
        message: "登录参数不正确"
      }
    } satisfies ApiResponse<AuthSession>);
    return;
  }

  const session = loginAs(parsed.data.userId);

  if (!session) {
    response.status(404).json({
      success: false,
      error: {
        code: "USER_NOT_FOUND",
        message: "演示用户不存在"
      }
    } satisfies ApiResponse<AuthSession>);
    return;
  }

  response.json({
    success: true,
    data: session
  } satisfies ApiResponse<AuthSession>);
});

authRouter.get("/auth/me", requireAuth, (request: AuthenticatedRequest, response) => {
  response.json({
    success: true,
    data: request.authUser
  } satisfies ApiResponse<DemoUser>);
});

authRouter.post("/auth/logout", requireAuth, (request: AuthenticatedRequest, response) => {
  if (request.authToken) {
    logoutByToken(request.authToken);
  }

  response.json({
    success: true,
    data: { ok: true }
  } satisfies ApiResponse<{ ok: boolean }>);
});
