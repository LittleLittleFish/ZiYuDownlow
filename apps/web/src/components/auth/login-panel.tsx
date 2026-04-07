"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { DemoUser } from "@ziyu/shared";
import { getDemoUsers, loginDemoUser } from "../../lib/api";
import { setStoredDemoSession } from "../../lib/demo-session";

export function LoginPanel() {
  const router = useRouter();
  const [users, setUsers] = useState<DemoUser[]>([]);
  const [error, setError] = useState<string>("");
  const [isPending, startTransition] = useTransition();
  const adminBaseUrl = process.env.NEXT_PUBLIC_ADMIN_BASE_URL ?? "http://127.0.0.1:3001";

  useEffect(() => {
    getDemoUsers().then(setUsers);
  }, []);

  function handleLogin(userId: string) {
    setError("");
    startTransition(() => {
      void (async () => {
        const session = await loginDemoUser(userId);

        if (!session) {
          setError("登录失败，请重试。");
          return;
        }

        setStoredDemoSession(session);

        if (session.user.role === "admin") {
          window.location.href = `${adminBaseUrl.replace(/\/$/, "")}/login`;
          return;
        }

        router.push(session.user.role === "seller" ? "/seller" : "/account");
        router.refresh();
      })();
    });
  }

  return (
    <section className="login-grid">
      {users.map((user) => (
        <article className="card login-card" key={user.id}>
          <p className="eyebrow">{user.role === "buyer" ? "用户入口" : user.role === "seller" ? "卖家入口" : "后台入口"}</p>
          <h2>{user.name}</h2>
          <p>{user.description}</p>
          <button className="button primary" type="button" onClick={() => handleLogin(user.id)} disabled={isPending}>
            {isPending ? "登录中..." : "进入体验"}
          </button>
        </article>
      ))}
      {error ? <p className="form-error">{error}</p> : null}
    </section>
  );
}
