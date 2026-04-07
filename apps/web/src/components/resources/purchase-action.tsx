"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { ResourceType } from "@ziyu/shared";
import { createOrder } from "../../lib/api";
import { getStoredDemoSession } from "../../lib/demo-session";

export function PurchaseAction({ resourceId, resourceType }: { resourceId: string; resourceType: ResourceType }) {
  const router = useRouter();
  const [message, setMessage] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  if (resourceType === "official") {
    return <Link className="button primary" href="/membership">开通会员获取官方资源</Link>;
  }

  function handlePurchase() {
    const session = getStoredDemoSession();

    if (!session) {
      setMessage("购买前请先注册并登录买家账号。正在跳转注册页...");
      router.push("/register");
      return;
    }

    if (session.user.role !== "buyer") {
      setMessage("当前账号不是买家账号，请先注册或登录买家账号后再购买。");
      router.push("/login");
      return;
    }

    startTransition(() => {
      void (async () => {
        const order = await createOrder(session.token, session.user.id, resourceId);

        if (!order) {
          setMessage("下单失败，资源可能尚未审核通过。请稍后重试。");
          return;
        }

        setMessage(`下单成功，订单 ${order.id} 已创建，可前往订单中心查看联系方式。`);
      })();
    });
  }

  return (
    <div className="stack-actions">
      <button className="button primary" type="button" onClick={handlePurchase} disabled={isPending}>
        {isPending ? "下单中..." : "立即下单"}
      </button>
      <Link className="button secondary" href="/orders">查看订单中心</Link>
      {message ? <p className="muted">{message}</p> : null}
    </div>
  );
}
