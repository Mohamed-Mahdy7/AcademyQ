function ReportCard({ report }) {
    const riskBadge = {
        high: "badge-danger",
        medium: "badge-warning",
        low: "badge-success",
    }[report.risk_level] || "badge-muted";

    return (
        <div className="card-body">

            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div>
                    <h2 className="heading-2">{report.student_name}</h2>
                    <p className="subheading">{report.class_name} — {report.month}</p>
                </div>
                <span className={riskBadge}>
                    {report.risk_level} risk
                </span>
            </div>

            <div className="divider" />

            {/* KPI Row */}
            <div className="stat-grid mb-6">
                <div className="kpi-card">
                    <p className="kpi-label">Risk Score</p>
                    <p className="kpi-value">{report.risk_score}/100</p>
                </div>
                <div className="kpi-card">
                    <p className="kpi-label">Risk Level</p>
                    <p className="kpi-value capitalize">{report.risk_level}</p>
                </div>
                <div className="kpi-card">
                    <p className="kpi-label">Month</p>
                    <p className="kpi-value">{report.month}</p>
                </div>
                <div className="kpi-card">
                    <p className="kpi-label">Generated At</p>
                    <p className="text-sm font-semibold text-navy mt-1">
                        {new Date(report.generated_at).toLocaleDateString()}
                    </p>
                </div>
            </div>

            {/* Risk Progress Bar */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-1.5">
                    <p className="text-label">Risk Score</p>
                    <p className="text-xs text-blue">{report.risk_score}/100</p>
                </div>
                <div className="progress-lg">
                    <div
                        className={
                            report.risk_level === "high"
                                ? "progress-fill-danger"
                                : report.risk_level === "medium"
                                    ? "progress-fill-warning"
                                    : "progress-fill-success"
                        }
                        style={{ width: `${report.risk_score}%` }}
                    />
                </div>
            </div>

            <div className="divider" />

            {/* Summary Text */}
            <div>
                <h3 className="heading-3 mb-3">AI Summary</h3>
                <p className="text-body whitespace-pre-line">
                    {report.summary_text}
                </p>
            </div>

        </div>
    );
}

export default ReportCard;