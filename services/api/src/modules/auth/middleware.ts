import type { NextFunction, Request, Response } from "express";
import type { DemoUser, UserPortalRole } from "@ziyu/shared";
import { getSessionByToken } from "../../store/mock-store.js";

export interface AuthenticatedRequest extends Request {
  authUser?: DemoUser;
  authToken?: string;
}

function getBearerToken(request: Request): string | undefined {
  const header = request.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return undefined;
  }

  return header.slice("Bearer ".length).trim();
}

export function requireAuth(request: AuthenticatedRequest, response: Response, next: NextFunction): void {
  const token = getBearerToken(request);

  if (!token) {
    response.status(401).json({
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message: "当前请求缺少登录凭证。"
      }
    });
    return;
  }

  const session = getSessionByToken(token);

  if (!session) {
    response.status(401).json({
      success: false,
      error: {
        code: "SESSION_EXPIRED",
        message: "登录态已失效，请重新登录。"
      }
    });
    return;
  }

  request.authUser = session.user;
  request.authToken = session.token;
  next();
}

export function requireRole(roles: UserPortalRole | UserPortalRole[]) {
  const acceptedRoles = Array.isArray(roles) ? roles : [roles];

  return (request: AuthenticatedRequest, response: Response, next: NextFunction): void => {
    if (!request.authUser) {
      response.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "当前请求缺少登录凭证。"
        }
      });
      return;
    }

    if (!acceptedRoles.includes(request.authUser.role)) {
      response.status(403).json({
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "当前账号无权限执行该操作。"
        }
      });
      return;
    }

    next();
  };
}