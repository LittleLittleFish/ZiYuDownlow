import { Router } from "express";
import { z } from "zod";
import { type ApiResponse, type AuthSession, type DemoUser } from "@ziyu/shared";
import { listDemoUsers, loginAs, loginWithPassword, logoutByToken, registerBuyer } from "../../store/mock-store.js";
import { requireAuth, type AuthenticatedRequest } from "./middleware.js";

const demoLoginSchema = z.object({
  userId: z.string().min(1)
});

const registerSchema = z.object({
  name: z.string().min(2, "姓名至少 2 个字符").max(30),
  email: z.string().email("请输入正确的邮箱"),
  password: z.string().min(6, "密码至少 6 位").max(64)
});

const passwordLoginSchema = z.object({
  email: z.string().email("请输入正确的邮箱"),
  password: z.string().min(6).max(64)
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
  const parsed = demoLoginSchema.safeParse(request.body);

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

authRouter.post("/auth/register", (request, response) => {
  const parsed = registerSchema.safeParse(request.body);

  if (!parsed.success) {
    response.status(400).json({
      success: false,
      error: {
        code: "INVALID_REGISTER_PAYLOAD",
        message: "注册参数不正确"
      }
    } satisfies ApiResponse<AuthSession>);
    return;
  }

  const session = registerBuyer(parsed.data);

  if (!session) {
    response.status(409).json({
      success: false,
      error: {
        code: "EMAIL_ALREADY_EXISTS",
        message: "该邮箱已注册，请直接登录。"
      }
    } satisfies ApiResponse<AuthSession>);
    return;
  }

  response.json({
    success: true,
    data: session
  } satisfies ApiResponse<AuthSession>);
});

authRouter.post("/auth/password-login", (request, response) => {
  const parsed = passwordLoginSchema.safeParse(request.body);

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

  const session = loginWithPassword(parsed.data);

  if (!session) {
    response.status(401).json({
      success: false,
      error: {
        code: "LOGIN_FAILED",
        message: "邮箱或密码不正确"
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
