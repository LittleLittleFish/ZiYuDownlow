import type { ReactNode } from "react";
import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "../components/layout/app-shell";

export const metadata: Metadata = {
  title: "ZiYuDownlow",
  description: "资源整理类付费撮合平台"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const adminBaseUrl = process.env.NEXT_PUBLIC_ADMIN_BASE_URL ?? "http://127.0.0.1:3001";

  return (
    <html lang="zh-CN">
      <body>
        <AppShell adminBaseUrl={adminBaseUrl}>{children}</AppShell>
      </body>
    </html>
  );
}
