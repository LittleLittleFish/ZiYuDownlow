import { getMembershipPlans } from "../../lib/api";

export default async function MembershipPage() {
  const plans = await getMembershipPlans();

  return (
    <main>
      <section className="page-header card">
        <p className="eyebrow">会员中心</p>
        <h1>会员只覆盖官方资源，不覆盖用户贡献资源</h1>
        <p className="subcopy">会员费 100% 归平台，官方资源可直接使用会员权益，用户贡献资源仍然单独购买。</p>
      </section>

      <section className="pricing-grid">
        {plans.map((plan) => (
          <article className="card plan-card" key={plan.code}>
            <p className="eyebrow">{plan.name}</p>
            <strong>{plan.priceLabel}</strong>
            <p>{plan.description}</p>
            <button className="button primary" type="button">选择该套餐</button>
          </article>
        ))}
      </section>
    </main>
  );
}
