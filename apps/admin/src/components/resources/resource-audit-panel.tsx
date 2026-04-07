"use client";

import { useEffect, useState, useTransition } from "react";
import type { AdminOverview } from "@ziyu/shared";
import { approvePendingResource, getAdminOverview } from "../../lib/api";
import { getStoredAdminSession } from "../../lib/session";

export function ResourceAuditPanel() {
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

  function handleApprove(resourceId: string) {
    const session = getStoredAdminSession();

    if (!session?.token) {
      return;
    }

    startTransition(() => {
      void (async () => {
        await approvePendingResource(resourceId, session.token);
        refresh();
      })();
    });
  }

  if (!getStoredAdminSession()?.token) {
    return <section className="panel"><p>请先登录管理员账号，再处理资源审核。</p></section>;
  }

  return (
    <section className="panel">
      <h2>资源审核队列</h2>
      <table className="table">
        <thead>
          <tr>
            <th>资源</th>
            <th>类型</th>
            <th>提交人</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {overview?.pending.map((item) => (
            <tr key={item.id}>
              <td>{item.title}</td>
              <td>{item.type}</td>
              <td>{item.owner}</td>
              <td><span className="badge">{item.status}</span></td>
              <td>
                <button className="admin-button" type="button" disabled={isPending} onClick={() => handleApprove(item.id)}>
                  审核通过
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {overview?.pending.length === 0 ? <p>当前没有待审核资源。</p> : null}
    </section>
  );
}
