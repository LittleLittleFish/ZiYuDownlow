"use client";

import { useEffect, useState, useTransition } from "react";
import type { AdminOverview } from "@ziyu/shared";
import { getAdminOverview, reviewRefund } from "../../lib/api";
import { getStoredAdminSession } from "../../lib/session";

export function AdminOrdersPanel() {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const session = getStoredAdminSession();

    if (!session?.token) {
      return;
    }

    getAdminOverview(session.token).then(setOverview);
  }, []);

  function refresh() {
    const session = getStoredAdminSession();

    if (!session?.token) {
      return;
    }

    getAdminOverview(session.token).then(setOverview);
  }

  function handleRefund(orderId: string, approved: boolean) {
    const session = getStoredAdminSession();

    if (!session?.token) {
      return;
    }

    startTransition(() => {
      void (async () => {
        await reviewRefund(orderId, { approved, note: approved ? "管理员已同意退款。" : "管理员驳回退款申请。" }, session.token);
        refresh();
      })();
    });
  }

  if (!getStoredAdminSession()?.token) {
    return <main className="content"><section className="panel"><p>请先登录管理员账号查看订单监控。</p></section></main>;
  }

  return (
    <main className="content">
      <section className="panel">
        <h2>订单监控</h2>
        <table className="table">
          <thead>
            <tr>
              <th>订单号</th>
              <th>买家</th>
              <th>资源</th>
              <th>金额</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {overview?.orders.map((item) => (
              <tr key={item.id}>
                <td>{item.id}</td>
                <td>{item.buyerName}</td>
                <td>{item.resourceTitle}</td>
                <td>{item.amountLabel}</td>
                <td><span className="badge">{item.status}</span></td>
                <td>
                  {item.status === "退款处理中" ? (
                    <div className="single-row">
                      <button className="admin-button" type="button" disabled={isPending} onClick={() => handleRefund(item.id, true)}>同意退款</button>
                      <button className="admin-button" type="button" disabled={isPending} onClick={() => handleRefund(item.id, false)}>驳回退款</button>
                    </div>
                  ) : (
                    <span className="muted">无需处理</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}