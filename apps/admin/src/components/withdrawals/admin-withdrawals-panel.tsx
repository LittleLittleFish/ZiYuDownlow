"use client";

import { useEffect, useState, useTransition } from "react";
import type { AdminOverview } from "@ziyu/shared";
import { getAdminOverview, reviewWithdrawalRequest } from "../../lib/api";
import { getStoredAdminSession } from "../../lib/session";

export function AdminWithdrawalsPanel() {
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

  function handleReview(withdrawalId: string, action: "approve" | "paid" | "reject") {
    const session = getStoredAdminSession();

    if (!session?.token) {
      return;
    }

    const note = action === "approve"
      ? "管理员已审核通过。"
      : action === "paid"
        ? "财务已登记打款。"
        : "管理员已驳回提现申请。";

    startTransition(() => {
      void (async () => {
        await reviewWithdrawalRequest(withdrawalId, { action, note }, session.token);
        refresh();
      })();
    });
  }

  if (!getStoredAdminSession()?.token) {
    return <main className="content"><section className="panel"><p>请先登录管理员账号查看提现审核。</p></section></main>;
  }

  return (
    <main className="content">
      <section className="panel">
        <h2>提现审核</h2>
        <table className="table">
          <thead>
            <tr>
              <th>申请号</th>
              <th>卖家</th>
              <th>金额</th>
              <th>方式</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {overview?.withdrawals.map((item) => (
              <tr key={item.id}>
                <td>{item.id}</td>
                <td>{item.sellerName}</td>
                <td>{item.amountLabel}</td>
                <td>{item.method}</td>
                <td><span className="badge">{item.status}</span></td>
                <td>
                  {item.status === "待审核" ? (
                    <div className="single-row">
                      <button className="admin-button" type="button" disabled={isPending} onClick={() => handleReview(item.id, "approve")}>审核通过</button>
                      <button className="admin-button" type="button" disabled={isPending} onClick={() => handleReview(item.id, "reject")}>驳回</button>
                    </div>
                  ) : item.status === "待打款登记" ? (
                    <button className="admin-button" type="button" disabled={isPending} onClick={() => handleReview(item.id, "paid")}>标记已打款</button>
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