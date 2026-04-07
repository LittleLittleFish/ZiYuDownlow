export default function AdminSettingsPage() {
  return (
    <main className="content">
      <section className="panel settings-grid">
        <article>
          <h2>平台分佣</h2>
          <p>默认平台抽佣 30%，卖家分成 70%，后续可从系统设置模块动态调整。</p>
        </article>
        <article>
          <h2>会员规则</h2>
          <p>会员只作用于官方资源，用户贡献资源不进入会员权益池。</p>
        </article>
        <article>
          <h2>提现规则</h2>
          <p>最低提现金额 10 元，MVP 阶段采用人工审核和人工打款登记。</p>
        </article>
        <article>
          <h2>风控底线</h2>
          <p>平台不存储提取码，所有退款、提现、审核操作都需要审计日志和后台可追溯记录。</p>
        </article>
      </section>
    </main>
  );
}
