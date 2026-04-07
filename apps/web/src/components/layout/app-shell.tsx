"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  href: string;
  label: string;
  shortLabel: string;
};

const primaryNavItems: NavItem[] = [
  { href: "/resources", label: "资源库", shortLabel: "资源" },
  { href: "/membership", label: "会员中心", shortLabel: "会员" },
  { href: "/orders", label: "订单中心", shortLabel: "订单" },
  { href: "/seller", label: "卖家中心", shortLabel: "卖家" },
  { href: "/account", label: "我的主页", shortLabel: "我的" }
];

function isActivePath(currentPath: string, href: string) {
  if (href === "/") {
    return currentPath === "/";
  }

  return currentPath === href || currentPath.startsWith(`${href}/`);
}

export function AppShell({ children, adminBaseUrl }: { children: ReactNode; adminBaseUrl: string }) {
  const pathname = usePathname();

  return (
    <>
      <header className="site-header">
        <div className="site-header-inner">
          <div className="brand-group">
            <Link className="brand-mark" href="/">ZiYuDownlow</Link>
            <p className="brand-subtitle">资源整理类付费撮合平台</p>
          </div>

          <nav className="site-nav desktop-nav" aria-label="桌面导航">
            <Link className={isActivePath(pathname, "/") ? "is-active" : undefined} href="/">首页</Link>
            <Link className={isActivePath(pathname, "/login") ? "is-active" : undefined} href="/login">登录</Link>
            <Link className={isActivePath(pathname, "/register") ? "is-active" : undefined} href="/register">注册</Link>
            {primaryNavItems.map((item) => (
              <Link className={isActivePath(pathname, item.href) ? "is-active" : undefined} href={item.href} key={item.href}>
                {item.label}
              </Link>
            ))}
            <a className="admin-entry" href={`${adminBaseUrl}/login`} target="_blank" rel="noreferrer">后台登录</a>
          </nav>

          <div className="mobile-header-actions">
            <Link className="mobile-action-chip" href="/login">登录</Link>
            <Link className="mobile-action-chip" href="/register">注册</Link>
            <a className="mobile-action-chip" href={`${adminBaseUrl}/login`} target="_blank" rel="noreferrer">后台</a>
          </div>
        </div>
      </header>

      <div className="app-shell-content">{children}</div>

      <nav className="mobile-bottom-nav" aria-label="移动端底部导航">
        <Link className={isActivePath(pathname, "/") ? "is-active" : undefined} href="/">
          <span className="nav-icon">01</span>
          <span>首页</span>
        </Link>
        {primaryNavItems.map((item, index) => (
          <Link className={isActivePath(pathname, item.href) ? "is-active" : undefined} href={item.href} key={item.href}>
            <span className="nav-icon">0{index + 2}</span>
            <span>{item.shortLabel}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}