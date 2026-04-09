import { AccountCenter } from "../../components/account/account-center";

export default function OrdersPage() {
  return (
    <main>
      <section className="page-header card">
        <p className="eyebrow">买家订单中心</p>
        <h1>订单内展示支付结果、回调信息与后续履约状态</h1>
        <p className="subcopy">买家下单后先跳转支付，异步回调验签成功后订单自动进入待卖家发货，并在订单详情展示平台订单号、渠道单号、支付完成时间和回调入库时间。</p>
      </section>
      <AccountCenter />
    </main>
  );
}
