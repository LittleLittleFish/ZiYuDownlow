"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import type { DemoUser, WorkflowOrderRecord } from "@ziyu/shared";
import { confirmBuyerOrder, getBuyerOrders, requestBuyerRefund } from "../../lib/api";
import { clearStoredDemoUser, getStoredDemoSession, getStoredDemoUser } from "../../lib/demo-session";

export function AccountCenter() {
  const [user, setUser] = useState<DemoUser | null>(null);
  const [orders, setOrders] = useState<WorkflowOrderRecord[]>([]);
  const [refundReasonByOrder, setRefundReasonByOrder] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const currentUser = getStoredDemoUser();
    const session = getStoredDemoSession();
    setUser(currentUser);

    if (currentUser && session?.token) {
      getBuyerOrders(session.token).then(setOrders);
    }
  }, []);

  function refreshOrders(currentUser: DemoUser) {
    const session = getStoredDemoSession();

    if (!session?.token) {
      return;
    }

    getBuyerOrders(session.token).then(setOrders);
  }

  function handleConfirm(orderId: string) {
    const session = getStoredDemoSession();

    if (!user || !session?.token) {
      return;
    }

    setMessage("");
    startTransition(() => {
      void (async () => {
        const order = await confirmBuyerOrder(orderId, user.id, session.token);

        if (!order) {
          setMessage("确认收货失败，请刷新后重试。");
          return;
        }

        setMessage(`订单 ${order.id} 已确认收货，卖家收益已进入结算。`);
        refreshOrders(user);
      })();
    });
  }

  function handleRefund(orderId: string) {
    const session = getStoredDemoSession();

    if (!user || !session?.token) {
      return;
    }

    const reason = refundReasonByOrder[orderId] || "卖家未按约定完成交付";
    setMessage("");
    startTransition(() => {
      void (async () => {
        const order = await requestBuyerRefund(orderId, reason, session.token);

        if (!order) {
          setMessage("退款申请提交失败，当前订单状态不支持退款。");
          return;
        }

        setMessage(`订单 ${order.id} 已提交退款申请，等待管理员处理。`);
        refreshOrders(user);
      })();
    });
  }

  if (!user) {
    return (
      <section className="card section-block">
        <h2>用户中心</h2>
        <p>当前未登录。用户中心用于查看个人资料、订单和会员权益；卖家中心用于上传资源、发货和查看收益。</p>
        <Link className="button primary" href="/login">去登录</Link>
      </section>
    );
  }

  return (
    <div className="stack-list">
      <section className="card section-block">
        <div className="resource-meta-row">
          <div>
            <p className="eyebrow">用户中心</p>
            <h2>{user.name}</h2>
            <p className="muted">这里看个人订单、会员权益和购买记录；卖家账号还可以进入卖家中心处理资源和发货。</p>
          </div>
          <div className="stack-actions">
            {user.role === "seller" ? <Link className="button secondary" href="/seller">进入卖家中心</Link> : null}
            <button
              className="button secondary"
              type="button"
              onClick={() => {
                clearStoredDemoUser();
                setUser(null);
                setOrders([]);
              }}
            >
              退出演示账号
            </button>
          </div>
        </div>
        {message ? <p className="muted">{message}</p> : null}
      </section>

      <section className="card section-block">
        <h2>我的订单</h2>
        <div className="stack-list">
          {orders.length === 0 ? <p className="muted">暂无订单，先去资源详情页下单。</p> : null}
          {orders.map((order) => (
            <article className="order-card nested-card" key={order.id}>
              <div>
                <div className="resource-meta-row">
                  <strong>{order.resourceTitle}</strong>
                  <span className="pill">{order.status}</span>
                </div>
                <p className="muted">订单号：{order.id}</p>
                <p className="muted">卖家：{order.sellerName}</p>
                <p className="muted">联系方式：{order.status === "待支付" ? "支付成功后显示" : order.contact}</p>
                <p className="muted">发货说明：{order.deliveryNote || "卖家尚未发货"}</p>
                <p className="muted">支付状态：{order.paymentStatus}</p>
                {order.paymentType ? <p className="muted">支付方式：{order.paymentType}</p> : null}
                {order.paymentTradeNo ? <p className="muted">平台订单号：{order.paymentTradeNo}</p> : null}
                {order.paymentApiTradeNo ? <p className="muted">渠道单号：{order.paymentApiTradeNo}</p> : null}
                {order.paymentCompletedAt ? <p className="muted">支付完成时间：{order.paymentCompletedAt}</p> : null}
                {order.paymentNotifiedAt ? <p className="muted">回调入库时间：{order.paymentNotifiedAt}</p> : null}
                {order.status !== "已完成" && order.status !== "已退款" ? (
                  <textarea
                    rows={2}
                    value={refundReasonByOrder[order.id] ?? ""}
                    onChange={(event) => setRefundReasonByOrder((prev) => ({ ...prev, [order.id]: event.target.value }))}
                    placeholder="如需退款，可填写退款原因"
                  />
                ) : null}
                {order.refundReason ? <p className="muted">退款原因：{order.refundReason}</p> : null}
                {order.refundReviewNote ? <p className="muted">审核备注：{order.refundReviewNote}</p> : null}
              </div>
              <div className="order-actions">
                <strong>{order.amountLabel}</strong>
                {order.status === "待确认收货" ? (
                  <button className="button primary" type="button" disabled={isPending} onClick={() => handleConfirm(order.id)}>
                    {isPending ? "处理中..." : "确认收货"}
                  </button>
                ) : null}
                {order.status === "已支付待卖家发货" || order.status === "待确认收货" ? (
                  <button className="button secondary" type="button" disabled={isPending} onClick={() => handleRefund(order.id)}>
                    {isPending ? "处理中..." : "申请退款"}
                  </button>
                ) : null}
                <Link className="button secondary" href={`/resources/${order.resourceId}`}>返回资源详情</Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
