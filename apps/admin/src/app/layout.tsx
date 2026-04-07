import type { ReactNode } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "ZiYuDownlow Admin",
  description: "资源整理类付费撮合平台管理后台"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <div className="shell">
          <aside className="sidebar">
            <h1>ZiYuDownlow Admin</h1>
            <ul>
              <li><Link href="/login">登录</Link></li>
              <li><Link href="/">总览</Link></li>
              <li><Link href="/resources">资源审核</Link></li>
              <li><Link href="/orders">订单监控</Link></li>
              <li><Link href="/withdrawals">提现审核</Link></li>
              <li><Link href="/settings">系统设置</Link></li>
            </ul>
          </aside>
          {children}
        </div>
      </body>
    </html>
  );
}
