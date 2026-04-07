"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { DemoUser } from "@ziyu/shared";
import { getDemoUsers, loginBuyerAccount, loginDemoUser, registerBuyerAccount } from "../../lib/api";
import { setStoredDemoSession } from "../../lib/demo-session";

type LoginPanelProps = {
  initialMode?: "login" | "register";
};

const emptyRegisterForm = {
  name: "",
  email: "",
  password: ""
};

const emptyLoginForm = {
  email: "",
  password: ""
};

export function LoginPanel({ initialMode = "login" }: LoginPanelProps) {
  const router = useRouter();
  const [users, setUsers] = useState<DemoUser[]>([]);
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [registerForm, setRegisterForm] = useState(emptyRegisterForm);
  const [loginForm, setLoginForm] = useState(emptyLoginForm);
  const [error, setError] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [isPending, startTransition] = useTransition();
  const adminBaseUrl = process.env.NEXT_PUBLIC_ADMIN_BASE_URL ?? "http://127.0.0.1:3001";

  useEffect(() => {
    getDemoUsers().then(setUsers);
  }, []);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  function completeSessionRedirect(role: DemoUser["role"]) {
    router.push(role === "seller" ? "/seller" : "/account");
    router.refresh();
  }

  function handleBuyerLogin() {
    setError("");
    setMessage("");
    startTransition(() => {
      void (async () => {
        const session = await loginBuyerAccount(loginForm);

        if (!session) {
          setError("登录失败，请检查邮箱和密码。\n");
          return;
        }

        setStoredDemoSession(session);
        setMessage(`欢迎回来，${session.user.name}。`);
        completeSessionRedirect(session.user.role);
      })();
    });
  }

  function handleBuyerRegister() {
    setError("");
    setMessage("");
    startTransition(() => {
      void (async () => {
        const session = await registerBuyerAccount(registerForm);

        if (!session) {
          setError("注册失败，该邮箱可能已被使用，请直接登录。\n");
          return;
        }

        setStoredDemoSession(session);
        setRegisterForm(emptyRegisterForm);
        setMessage("注册成功，已自动登录，现在可以购买资源。\n");
        completeSessionRedirect(session.user.role);
      })();
    });
  }

  function handleLogin(userId: string) {
    setError("");
    setMessage("");
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
    <div className="auth-stack">
      <section className="auth-shell card">
        <div className="auth-header-row">
          <div>
            <p className="eyebrow">买家账号</p>
            <h2>{mode === "register" ? "注册后才能购买用户贡献资源" : "登录后查看订单和购买记录"}</h2>
            <p className="muted">资源购买已经改成真实账号链路。买家先注册，再登录下单；卖家和后台保留演示入口。</p>
          </div>
          <div className="auth-mode-switch">
            <button className={`button secondary ${mode === "login" ? "is-active-button" : ""}`} type="button" onClick={() => setMode("login")}>登录</button>
            <button className={`button secondary ${mode === "register" ? "is-active-button" : ""}`} type="button" onClick={() => setMode("register")}>注册</button>
          </div>
        </div>

        {mode === "register" ? (
          <div className="form-grid auth-form-grid">
            <label>
              昵称
              <input value={registerForm.name} onChange={(event) => setRegisterForm((prev) => ({ ...prev, name: event.target.value }))} placeholder="例如：阿木" />
            </label>
            <label>
              邮箱
              <input type="email" value={registerForm.email} onChange={(event) => setRegisterForm((prev) => ({ ...prev, email: event.target.value }))} placeholder="you@example.com" />
            </label>
            <label className="span-full">
              密码
              <input type="password" value={registerForm.password} onChange={(event) => setRegisterForm((prev) => ({ ...prev, password: event.target.value }))} placeholder="至少 6 位密码" />
            </label>
            <div className="form-actions span-full">
              <button className="button primary" type="button" disabled={isPending} onClick={handleBuyerRegister}>
                {isPending ? "注册中..." : "注册并登录"}
              </button>
              <Link className="text-link" href="/login">已有账号？去登录</Link>
            </div>
          </div>
        ) : (
          <div className="form-grid auth-form-grid">
            <label>
              邮箱
              <input type="email" value={loginForm.email} onChange={(event) => setLoginForm((prev) => ({ ...prev, email: event.target.value }))} placeholder="you@example.com" />
            </label>
            <label>
              密码
              <input type="password" value={loginForm.password} onChange={(event) => setLoginForm((prev) => ({ ...prev, password: event.target.value }))} placeholder="请输入登录密码" />
            </label>
            <div className="form-actions span-full">
              <button className="button primary" type="button" disabled={isPending} onClick={handleBuyerLogin}>
                {isPending ? "登录中..." : "登录买家账号"}
              </button>
              <Link className="text-link" href="/register">没有账号？先注册</Link>
            </div>
          </div>
        )}

        {message ? <p className="muted auth-feedback">{message}</p> : null}
        {error ? <p className="form-error auth-feedback">{error}</p> : null}
      </section>

      <section className="login-grid">
        {users.map((user) => (
          <article className="card login-card" key={user.id}>
            <p className="eyebrow">{user.role === "seller" ? "卖家演示入口" : "后台演示入口"}</p>
            <h2>{user.name}</h2>
            <p>{user.description}</p>
            <button className="button primary" type="button" onClick={() => handleLogin(user.id)} disabled={isPending}>
              {isPending ? "登录中..." : "进入演示"}
            </button>
            {user.role === "admin" ? <p className="muted">将跳转到后台登录页：{adminBaseUrl}/login</p> : null}
          </article>
        ))}
      </section>
    </div>
  );
}
