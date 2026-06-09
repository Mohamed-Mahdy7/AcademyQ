export default function PaymentSummaryCards({ summary, loading }) {
  if (loading) {
    return (
      <div className="stat-grid mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton skeleton-card rounded-xl" />
        ))}
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className="stat-grid mb-6">

      {/* Expected revenue */}
      <div className="kpi-card">
        <div className="flex items-center justify-between mb-2">
          <p className="kpi-label">Expected revenue</p>
          <div className="stat-icon-wrap">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="1" x2="12" y2="23"/>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
          </div>
        </div>
        <p className="kpi-value">{parseFloat(summary.revenue_expected).toLocaleString()}</p>
        <p className="kpi-sub">EGP · this month</p>
      </div>

      {/* Collected */}
      <div className="kpi-card">
        <div className="flex items-center justify-between mb-2">
          <p className="kpi-label">Collected</p>
          <div className="stat-icon-wrap">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
        </div>
        <p className="kpi-value text-success">
          {parseFloat(summary.revenue_collected).toLocaleString()}
        </p>
        <p className="kpi-sub">EGP · {summary.collection_rate_pct}% collection rate</p>
      </div>

      {/* Outstanding */}
      <div className="kpi-card">
        <div className="flex items-center justify-between mb-2">
          <p className="kpi-label">Outstanding</p>
          <div className="stat-icon-wrap-warn">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
        </div>
        <p className="kpi-value text-warning">
          {parseFloat(summary.overdue_total).toLocaleString()}
        </p>
        <p className="kpi-sub">EGP · {summary.overdue_count} overdue payments</p>
      </div>

      {/* Collection rate */}
      <div className="kpi-card">
        <div className="flex items-center justify-between mb-2">
          <p className="kpi-label">Collection rate</p>
          <div className="stat-icon-wrap">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
              <polyline points="16 7 22 7 22 13"/>
            </svg>
          </div>
        </div>
        <p className="kpi-value">{summary.collection_rate_pct}%</p>
        <div className="progress progress-md mt-3">
          <div
            className={`progress-fill ${
              summary.collection_rate_pct >= 80
                ? "progress-fill-success"
                : summary.collection_rate_pct >= 60
                ? "progress-fill-warning"
                : "progress-fill-danger"
            }`}
            style={{ width: `${summary.collection_rate_pct}%` }}
          />
        </div>
      </div>

    </div>
  );
}