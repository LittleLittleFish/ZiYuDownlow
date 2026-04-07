import { LoginPanel } from "../../components/auth/login-panel";

export default function LoginPage() {
  return (
    <main>
      <section className="page-header card">
        <p className="eyebrow">统一登录入口</p>
        <h1>用户中心、卖家中心和后台入口分开</h1>
        <p className="subcopy">普通用户进入用户中心查看订单和会员；卖家进入卖家中心上传资源、发货和查看收益；管理员从后台登录页进入审核系统。</p>
      </section>
      <LoginPanel />
    </main>
  );
}
