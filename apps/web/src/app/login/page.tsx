import { LoginPanel } from "../../components/auth/login-panel";

export default function LoginPage() {
  return (
    <main>
      <section className="page-header card">
        <p className="eyebrow">统一登录入口</p>
        <h1>买家真实登录，卖家和后台保留演示入口</h1>
        <p className="subcopy">普通买家现在需要先注册再登录；卖家仍从演示入口进入卖家中心；管理员从后台登录页进入审核系统。</p>
      </section>
      <LoginPanel />
    </main>
  );
}
