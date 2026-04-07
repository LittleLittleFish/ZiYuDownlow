import { SellerWorkspace } from "../../components/seller/seller-workspace";

export default function SellerPage() {
  return (
    <main>
      <section className="page-header card">
        <p className="eyebrow">卖家中心</p>
        <h1>上传资源、看订单、查收益、发起提现</h1>
        <p className="subcopy">卖家中心已经接入上传资源和订单发货动作，资源先提交审核，审核通过后买家才能下单。</p>
      </section>
      <SellerWorkspace />
    </main>
  );
}
