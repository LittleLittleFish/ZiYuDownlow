import { LoginPanel } from "../../components/auth/login-panel";

export default function RegisterPage() {
  return (
    <main>
      <section className="page-header card">
        <p className="eyebrow">用户注册</p>
        <h1>先注册账号，再购买用户贡献资源</h1>
        <p className="subcopy">买家注册后会自动登录，之后可以正常下单、查看订单、确认收货和申请退款。</p>
      </section>
      <LoginPanel initialMode="register" />
    </main>
  );
}