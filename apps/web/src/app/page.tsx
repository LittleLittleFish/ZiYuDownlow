import Link from "next/link";
import { getFeaturedResources, getMembershipPlans, getPlatformHighlights } from "../lib/api";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [resources, highlights, plans] = await Promise.all([
    getFeaturedResources(),
    getPlatformHighlights(),
    getMembershipPlans()
  ]);

  return (
    <main>
      <section className="hero">
        <div className="card hero-copy">
          <span className="kicker">资源整理 · 付费撮合 · 担保结算</span>
          <h1>把筛选时间卖给真正需要结果的人。</h1>
          <p>
            ZiYuDownlow 聚焦公开免费资源的整理、筛选与交易担保。平台不存储资源文件，也不存储提取码，只负责展示、担保、结算和规则治理。
          </p>
          <div className="cta-row">
            <Link className="button primary" href="/resources">查看资源</Link>
            <Link className="button secondary" href="/login">用户登录</Link>
            <Link className="button secondary" href="/seller">卖家中心</Link>
            <a className="button secondary" href="http://127.0.0.1:3001/login" target="_blank" rel="noreferrer">管理员登录</a>
          </div>
          <p className="footer-note">会员仅适用于官方资源，用户贡献资源仍保持单独付费购买。</p>
        </div>
        <div className="card hero-panel">
          {highlights.map((item) => (
            <div className="metric" key={item.label}>
              <div>{item.label}</div>
              <strong>{item.value}</strong>
              <div>{item.description}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="card section" id="official">
        <h2>官方资源专区</h2>
        <div className="grid">
          {resources
            .filter((item) => item.type === "official")
            .map((item) => (
              <article className="resource-item" key={item.id}>
                <span>会员权益</span>
                <h3>{item.title}</h3>
                <p>{item.summary}</p>
                <Link className="text-link" href={`/resources/${item.id}`}>查看详情</Link>
              </article>
            ))}
        </div>
      </section>

      <section className="card section" id="resources">
        <h2>用户贡献资源</h2>
        <div className="grid">
          {resources
            .filter((item) => item.type === "community")
            .map((item) => (
              <article className="resource-item" key={item.id}>
                <span>单独购买</span>
                <h3>{item.title}</h3>
                <p>{item.summary}</p>
                <Link className="text-link" href={`/resources/${item.id}`}>查看详情</Link>
              </article>
            ))}
        </div>
      </section>

      <section className="card section" id="membership">
        <h2>会员套餐</h2>
        <div className="grid">
          {plans.map((plan) => (
            <article className="resource-item" key={plan.code}>
              <span>{plan.name}</span>
              <h3>{plan.priceLabel}</h3>
              <p>{plan.description}</p>
              <Link className="text-link" href="/membership">进入会员中心</Link>
            </article>
          ))}
        </div>
      </section>

      <section className="card section" id="seller">
        <h2>卖家入驻说明</h2>
        <div className="grid">
          <article className="resource-item">
            <span>步骤 1</span>
            <h3>提交卖家资料</h3>
            <p>完善联系方式、结算方式和基础资质，等待平台审核。</p>
          </article>
          <article className="resource-item">
            <span>步骤 2</span>
            <h3>上传资源信息</h3>
            <p>填写标题、简介、分类、网盘链接和售价，不填写提取码。</p>
          </article>
          <article className="resource-item">
            <span>步骤 3</span>
            <h3>订单完成后结算</h3>
            <p>买家确认收货后自动分佣，卖家收益进入可提现余额。</p>
          </article>
        </div>
        <p className="footer-note">用户中心用于买家查看订单与会员；卖家中心用于上传资源、发货和收益管理，两个入口已经拆开。</p>
      </section>
    </main>
  );
}
