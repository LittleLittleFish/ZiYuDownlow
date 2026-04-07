import Link from "next/link";
import { notFound } from "next/navigation";
import { getResourceDetail } from "../../../lib/api";
import { PurchaseAction } from "../../../components/resources/purchase-action";

export const dynamic = "force-dynamic";

export default async function ResourceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const resource = await getResourceDetail(id);

  if (!resource) {
    notFound();
  }

  return (
    <main>
      <section className="detail-hero card">
        <div>
          <p className="eyebrow">{resource.badge}</p>
          <h1>{resource.title}</h1>
          <p className="subcopy">{resource.description}</p>
        </div>
        <aside className="detail-side card inset-card">
          <div className="detail-price">{resource.priceLabel}</div>
          <div className="muted">分类：{resource.category}</div>
          <div className="muted">提供方：{resource.sellerName}</div>
          <div className="divider" />
          <PurchaseAction resourceId={resource.id} resourceType={resource.type} />
        </aside>
      </section>

      <section className="detail-grid">
        <article className="card section-block">
          <h2>资源亮点</h2>
          <ul className="detail-list">
            {resource.highlights.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
        <article className="card section-block">
          <h2>交付流程</h2>
          <ol className="detail-list ordered">
            {resource.deliveryFlow.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </article>
      </section>

      <section className="detail-grid">
        <article className="card section-block">
          <h2>平台边界</h2>
          <p>{resource.sourcePolicy}</p>
        </article>
        <article className="card section-block">
          <h2>联系说明</h2>
          <p>{resource.contactHint}</p>
        </article>
      </section>
    </main>
  );
}
