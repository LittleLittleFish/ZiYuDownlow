"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { DemoUser } from "@ziyu/shared";
import { getAdminDemoUsers, loginAdminUser } from "../../lib/api";
import { setStoredAdminSession } from "../../lib/session";

export function AdminLoginPanel() {
  const router = useRouter();
  const [users, setUsers] = useState<DemoUser[]>([]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    getAdminDemoUsers().then((items) => setUsers(items.filter((item) => item.role === "admin")));
  }, []);

  function handleLogin(userId: string) {
    startTransition(() => {
      void (async () => {
        const session = await loginAdminUser(userId);

        if (!session) {
          return;
        }

        setStoredAdminSession(session);
        router.push("/");
        router.refresh();
      })();
    });
  }

  return (
    <section className="panel">
      <h2>后台登录入口</h2>
      <div className="stats single-row">
        {users.map((user) => (
          <div className="panel stat" key={user.id}>
            <div>{user.name}</div>
            <div>{user.description}</div>
            <button className="admin-button" type="button" disabled={isPending} onClick={() => handleLogin(user.id)}>
              {isPending ? "登录中..." : "进入后台"}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
