"use client";

import type { FormEvent } from "react";
import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import type { CreateResourceInput, DemoUser, ResourceCategory, SellerWorkspaceData } from "@ziyu/shared";
import { createSellerResource, createSellerWithdrawal, deliverSellerOrder, getSellerWorkspace } from "../../lib/api";
import { getStoredDemoSession, getStoredDemoUser } from "../../lib/demo-session";

const initialForm: Omit<CreateResourceInput, "sellerId"> = {
  title: "",
  summary: "",
  description: "",
  category: "工具类",
  sourceLink: "https://example.com/share-link",
  contact: "微信: design-lab / QQ: 172009",
  priceAmount: 2990
};

const initialWithdrawalForm = {
  amountValue: 1000,
  method: "支付宝",
  account: "design-lab@alipay"
};

export function SellerWorkspace() {
  const [user, setUser] = useState<DemoUser | null>(null);
  const [workspace, setWorkspace] = useState<SellerWorkspaceData | null>(null);
  const [form, setForm] = useState(initialForm);
  const [withdrawalForm, setWithdrawalForm] = useState(initialWithdrawalForm);
  const [deliveryNoteByOrder, setDeliveryNoteByOrder] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const currentUser = getStoredDemoUser();
    setUser(currentUser);

    const session = getStoredDemoSession();

    if (currentUser?.sellerId && session?.token) {
      getSellerWorkspace(session.token).then(setWorkspace);
    }
  }, []);

  function refresh(currentUser: DemoUser) {
    const session = getStoredDemoSession();

    if (!currentUser.sellerId || !session?.token) {
      return;
    }

    getSellerWorkspace(session.token).then(setWorkspace);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const session = getStoredDemoSession();

    if (!user?.sellerId || !session?.token) {
      return;
    }

    const sellerId = user.sellerId;

    setMessage("");
    startTransition(() => {
      void (async () => {
        const resource = await createSellerResource({
          sellerId,
          ...form
        }, session.token);

        if (!resource) {
          setMessage("资源上传失败，请检查字段后重试。");
          return;
        }

        setMessage("资源已提交，当前状态为待审核。");
        setForm(initialForm);
        refresh(user);
      })();
    });
  }

  function handleDeliver(orderId: string) {
    const session = getStoredDemoSession();

    if (!user?.sellerId || !session?.token) {
      return;
    }

    const sellerId = user.sellerId;

    const deliveryNote = deliveryNoteByOrder[orderId] || "已发送提取码，请在网盘内查收。";

    startTransition(() => {
      void (async () => {
        await deliverSellerOrder(orderId, sellerId, deliveryNote, session.token);
        refresh(user);
      })();
    });
  }

  function handleWithdrawal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const session = getStoredDemoSession();

    if (!user?.sellerId || !session?.token) {
      return;
    }

    setMessage("");
    startTransition(() => {
      void (async () => {
        const withdrawal = await createSellerWithdrawal(withdrawalForm, session.token);

        if (!withdrawal) {
          setMessage("提现申请失败，请检查金额是否超过可提现余额。 ");
          return;
        }

        setMessage(`提现申请 ${withdrawal.id} 已提交，等待管理员审核。`);
        setWithdrawalForm(initialWithdrawalForm);
        refresh(user);
      })();
    });
  }

  if (!user || user.role !== "seller" || !user.sellerId) {
    return (
      <section className="card section-block">
        <h2>卖家中心</h2>
        <p>卖家中心用于上传资源、查看审核状态、处理订单发货和确认收益。当前账号不是卖家，请先从登录页进入卖家入口。</p>
        <Link className="button primary" href="/login">去登录</Link>
      </section>
    );
  }

  return (
    <div className="stack-list">
      <section className="metric-grid">
        {workspace?.metrics.map((item) => (
          <article className="card metric-card" key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </article>
        ))}
      </section>

      <section className="detail-grid three-up">
        <article className="card section-block span-two">
          <h2>上传资源</h2>
          <form className="form-grid" onSubmit={handleSubmit}>
            <label>
              资源标题
              <input value={form.title} onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))} required />
            </label>
            <label>
              分类
              <select value={form.category} onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value as ResourceCategory }))}>
                <option value="工具类">工具类</option>
                <option value="教程类">教程类</option>
                <option value="素材类">素材类</option>
                <option value="代码类">代码类</option>
                <option value="AI 类">AI 类</option>
              </select>
            </label>
            <label className="span-full">
              资源简介
              <input value={form.summary} onChange={(event) => setForm((prev) => ({ ...prev, summary: event.target.value }))} required />
            </label>
            <label className="span-full">
              详细说明
              <textarea rows={4} value={form.description} onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))} required />
            </label>
            <label>
              网盘链接
              <input value={form.sourceLink} onChange={(event) => setForm((prev) => ({ ...prev, sourceLink: event.target.value }))} required />
            </label>
            <label>
              联系方式
              <input value={form.contact} onChange={(event) => setForm((prev) => ({ ...prev, contact: event.target.value }))} required />
            </label>
            <label>
              售价（分）
              <input type="number" min={100} value={form.priceAmount} onChange={(event) => setForm((prev) => ({ ...prev, priceAmount: Number(event.target.value) }))} required />
            </label>
            <div className="form-actions span-full">
              <button className="button primary" type="submit" disabled={isPending}>{isPending ? "提交中..." : "提交审核"}</button>
              {message ? <span className="muted">{message}</span> : null}
            </div>
          </form>
        </article>

        <article className="card section-block">
          <h2>资源状态</h2>
          <ul className="compact-list">
            {workspace?.resources.map((item) => (
              <li key={item.id}>
                <strong>{item.title}</strong>
                <span>{item.auditStatus}</span>
                <span>{item.priceLabel}</span>
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="detail-grid three-up">
        <article className="card section-block span-two">
          <h2>发起提现</h2>
          <p className="muted">当前可提现余额：{workspace?.availableWithdrawalLabel ?? "¥0.00"}</p>
          <form className="form-grid" onSubmit={handleWithdrawal}>
            <label>
              提现金额（分）
              <input type="number" min={1000} value={withdrawalForm.amountValue} onChange={(event) => setWithdrawalForm((prev) => ({ ...prev, amountValue: Number(event.target.value) }))} required />
            </label>
            <label>
              提现方式
              <select value={withdrawalForm.method} onChange={(event) => setWithdrawalForm((prev) => ({ ...prev, method: event.target.value }))}>
                <option value="支付宝">支付宝</option>
                <option value="微信">微信</option>
                <option value="银行卡">银行卡</option>
              </select>
            </label>
            <label className="span-full">
              收款账户
              <input value={withdrawalForm.account} onChange={(event) => setWithdrawalForm((prev) => ({ ...prev, account: event.target.value }))} required />
            </label>
            <div className="form-actions span-full">
              <button className="button primary" type="submit" disabled={isPending}>{isPending ? "提交中..." : "提交提现申请"}</button>
              {message ? <span className="muted">{message}</span> : null}
            </div>
          </form>
        </article>

        <article className="card section-block">
          <h2>提现记录</h2>
          <ul className="compact-list">
            {workspace?.withdrawals.map((item) => (
              <li key={item.id}>
                <strong>{item.amountLabel}</strong>
                <span>{item.status}</span>
                <span>{item.method}</span>
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="card section-block">
        <h2>卖家订单处理</h2>
        <div className="stack-list">
          {workspace?.orders.map((order) => (
            <article className="order-card nested-card" key={order.id}>
              <div>
                <div className="resource-meta-row">
                  <strong>{order.resourceTitle}</strong>
                  <span className="pill">{order.status}</span>
                </div>
                <p className="muted">买家：{order.buyerName}</p>
                <p className="muted">联系方式已展示给买家：{order.contact}</p>
                <p className="muted">当前发货说明：{order.deliveryNote || "尚未发货"}</p>
                {order.status === "已支付待卖家发货" ? (
                  <textarea
                    rows={3}
                    value={deliveryNoteByOrder[order.id] ?? ""}
                    onChange={(event) => setDeliveryNoteByOrder((prev) => ({ ...prev, [order.id]: event.target.value }))}
                    placeholder="填写已私下发送给买家的提取码或发货说明"
                  />
                ) : null}
              </div>
              <div className="order-actions">
                <strong>{order.amountLabel}</strong>
                {order.status === "已支付待卖家发货" ? (
                  <button className="button primary" type="button" disabled={isPending} onClick={() => handleDeliver(order.id)}>
                    {isPending ? "处理中..." : "确认已发货"}
                  </button>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
