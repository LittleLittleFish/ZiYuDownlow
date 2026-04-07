import type { ReactNode } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "ZiYuDownlow",
  description: "资源整理类付费撮合平台"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <header className="site-header">
          <div className="site-header-inner">
            <Link className="brand-mark" href="/">ZiYuDownlow</Link>
            <nav className="site-nav">
              <Link href="/login">登录</Link>
              <Link href="/account">用户中心</Link>
              <Link href="/resources">资源库</Link>
              <Link href="/membership">会员</Link>
              <Link href="/orders">订单</Link>
              <Link href="/seller">卖家中心</Link>
              <a href="http://127.0.0.1:3001/login" target="_blank" rel="noreferrer">后台登录</a>
            </nav>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
