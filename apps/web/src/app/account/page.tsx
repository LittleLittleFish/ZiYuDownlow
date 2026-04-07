import { AccountCenter } from "../../components/account/account-center";

export default function AccountPage() {
  return (
    <main>
      <section className="page-header card">
        <p className="eyebrow">用户中心</p>
        <h1>这里看个人订单和会员权益</h1>
        <p className="subcopy">用户中心只处理个人信息、购买记录和确认收货；卖家功能统一放在卖家中心，避免角色混淆。</p>
      </section>
      <AccountCenter />
    </main>
  );
}
