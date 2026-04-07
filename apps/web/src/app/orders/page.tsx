import { AccountCenter } from "../../components/account/account-center";

export default function OrdersPage() {
  return (
    <main>
      <section className="page-header card">
        <p className="eyebrow">买家订单中心</p>
        <h1>支付成功后在订单页查看卖家联系方式</h1>
        <p className="subcopy">这里已经接通完整演示链路：买家下单后订单进入待卖家发货，卖家发货后买家可确认收货，订单完成后自动视为进入分佣阶段。</p>
      </section>
      <AccountCenter />
    </main>
  );
}
