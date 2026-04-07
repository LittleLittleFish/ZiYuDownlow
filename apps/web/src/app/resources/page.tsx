import Link from "next/link";
import { getResourceList } from "../../lib/api";

export const dynamic = "force-dynamic";

export default async function ResourcesPage() {
  const resources = await getResourceList();

  return (
    <main>
      <section className="page-header card">
        <p className="eyebrow">资源目录</p>
        <h1>官方资源与用户贡献资源分区展示</h1>
        <p className="subcopy">官方资源可由会员获取，用户贡献资源保持单独购买，平台只负责担保、结算和规则治理。</p>
      </section>

      <section className="resource-list-grid">
        {resources.map((resource) => (
          <article className="card resource-tile" key={resource.id}>
            <div className={`tone tone-${resource.coverTone}`} />
            <div className="resource-meta-row">
              <span className="pill">{resource.badge}</span>
              <span className="muted">{resource.category}</span>
            </div>
            <h2>{resource.title}</h2>
            <p>{resource.summary}</p>
            <div className="resource-meta-row">
              <strong>{resource.priceLabel}</strong>
              <span className="muted">{resource.sellerName}</span>
            </div>
            <Link className="button primary" href={`/resources/${resource.id}`}>查看详情</Link>
          </article>
        ))}
      </section>
    </main>
  );
}
