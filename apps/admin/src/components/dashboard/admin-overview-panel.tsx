"use client";

import { useEffect, useState } from "react";
import type { AdminOverview } from "@ziyu/shared";
import { getAdminOverview } from "../../lib/api";
import { getStoredAdminSession } from "../../lib/session";

export function AdminOverviewPanel() {
  const [overview, setOverview] = useState<AdminOverview | null>(null);

  useEffect(() => {
    const session = getStoredAdminSession();

    if (!session?.token) {
      return;
    }

    getAdminOverview(session.token).then(setOverview);
  }, []);

  if (!getStoredAdminSession()?.token) {
    return (
      <main className="content">
        <section className="panel">
          <h2>后台总览</h2>
          <p>请先登录管理员账号查看实时总览。</p>
        </section>
      </main>
    );
  }

  return (
    <main className="content">
      <section className="stats">
        {overview?.stats.map((item) => (
          <div className="panel stat" key={item.label}>
            <div>{item.label}</div>
            <strong>{item.value}</strong>
            <div>{item.description}</div>
          </div>
        ))}
      </section>
      <section className="panel">
        <h2>待处理审核</h2>
        <table className="table">
          <thead>
            <tr>
              <th>资源</th>
              <th>类型</th>
              <th>提交人</th>
              <th>状态</th>
            </tr>
          </thead>
          <tbody>
            {overview?.pending.map((item) => (
              <tr key={item.id}>
                <td>{item.title}</td>
                <td>{item.type}</td>
                <td>{item.owner}</td>
                <td><span className="badge">{item.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}