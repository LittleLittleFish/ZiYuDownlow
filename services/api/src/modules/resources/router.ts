import { Router } from "express";
import { z } from "zod";
import { type ApiResponse, type CreateResourceInput, type ResourceCard, type ResourceDetail, type ResourceType, type UploadedResourceRecord } from "@ziyu/shared";
import { approveResource, createResource, getResource, listFeaturedResources, listPublicResources } from "../../store/mock-store.js";
import { requireAuth, requireRole, type AuthenticatedRequest } from "../auth/middleware.js";

export const resourcesRouter = Router();

const createResourceSchema = z.object({
  sellerId: z.string().min(1),
  title: z.string().min(2),
  summary: z.string().min(5),
  description: z.string().min(10),
  category: z.enum(["工具类", "教程类", "素材类", "代码类", "AI 类"]),
  sourceLink: z.string().url(),
  contact: z.string().min(2),
  priceAmount: z.coerce.number().int().positive()
});

resourcesRouter.get("/featured", (_request, response) => {
  const payload: ApiResponse<ResourceCard[]> = {
    success: true,
    data: listFeaturedResources()
  };

  response.json(payload);
});

resourcesRouter.get("/", (request, response) => {
  const requestedType = request.query.type as ResourceType | undefined;
  const keyword = String(request.query.keyword ?? "").trim().toLowerCase();

  const data = listPublicResources(requestedType).filter((item) => {
    if (!keyword) {
      return true;
    }

    return [item.title, item.summary, item.category, item.sellerName].join(" ").toLowerCase().includes(keyword);
  });

  const payload: ApiResponse<UploadedResourceRecord[]> = {
    success: true,
    data
  };

  response.json(payload);
});

resourcesRouter.get("/:id", (request, response) => {
  const resource = getResource(request.params.id);

  if (!resource) {
    const payload: ApiResponse<ResourceDetail> = {
      success: false,
      error: {
        code: "RESOURCE_NOT_FOUND",
        message: "未找到对应资源"
      }
    };

    response.status(404).json(payload);
    return;
  }

  const payload: ApiResponse<ResourceDetail> = {
    success: true,
    data: resource
  };

  response.json(payload);
});

resourcesRouter.post("/", requireAuth, requireRole("seller"), (request, response) => {
  const parsed = createResourceSchema.safeParse(request.body);

  if (!parsed.success) {
    response.status(400).json({
      success: false,
      error: {
        code: "INVALID_RESOURCE_PAYLOAD",
        message: "资源提交参数不正确"
      }
    } satisfies ApiResponse<CreateResourceInput>);
    return;
  }

  const authRequest = request as AuthenticatedRequest;
  const resource = authRequest.authUser ? createResource(authRequest.authUser, parsed.data) : undefined;

  if (!resource) {
    response.status(403).json({
      success: false,
      error: {
        code: "RESOURCE_CREATE_FORBIDDEN",
        message: "当前账号无权上传资源。"
      }
    } satisfies ApiResponse<UploadedResourceRecord>);
    return;
  }

  response.status(201).json({
    success: true,
    data: resource
  } satisfies ApiResponse<UploadedResourceRecord>);
});

resourcesRouter.post("/:id/approve", requireAuth, requireRole("admin"), (request, response) => {
  const resourceId = String(request.params.id);
  const resource = approveResource(resourceId);

  if (!resource) {
    response.status(404).json({
      success: false,
      error: {
        code: "RESOURCE_NOT_FOUND",
        message: "待审核资源不存在"
      }
    } satisfies ApiResponse<UploadedResourceRecord>);
    return;
  }

  response.json({
    success: true,
    data: resource
  } satisfies ApiResponse<UploadedResourceRecord>);
});
