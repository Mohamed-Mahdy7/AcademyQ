import { useAlerts } from "../../context/AlertContext"
import AlertRow from "../../components/ai/AlertRow"

const RISK_FILTERS = ["all", "high", "medium", "low"]

const AlertInboxPage = () => {
    const {
        alerts,
        loading,
        error,
        filter,
        setFilter,
        fetchAlerts,
        highCount,
        mediumCount,
        lowCount,
    } = useAlerts()

    const handleRiskFilter = (riskLevel) => {
        const next = { ...filter, riskLevel }
        setFilter(next)
        fetchAlerts(next)
    }

    return (
        <>
            {/* Page header */}
            <div className="mb-6">
                <h1 className="heading-1">Alert Inbox</h1>
                <p className="subheading">
                    AI-generated retention alerts — review and send to parents
                </p>
            </div>

            {/* Summary chips */}
            <div className="flex flex-wrap gap-3 mb-6">
                <div className="card px-4 py-3 flex items-center gap-2">
                    <span className="badge badge-danger">{highCount}</span>
                    <span className="text-body text-sm">High Risk</span>
                </div>
                <div className="card px-4 py-3 flex items-center gap-2">
                    <span className="badge badge-warning">{mediumCount}</span>
                    <span className="text-body text-sm">Medium Risk</span>
                </div>
                <div className="card px-4 py-3 flex items-center gap-2">
                    <span className="badge badge-success">{lowCount}</span>
                    <span className="text-body text-sm">Low Risk</span>
                </div>
                <div className="card px-4 py-3 flex items-center gap-2">
                    <span className="font-semibold text-sm text-navy">{alerts.length}</span>
                    <span className="text-body text-sm">Open Alerts</span>
                </div>
            </div>

            {/* Filter tabs */}
            <div className="flex gap-2 mb-5 flex-wrap">
                {RISK_FILTERS.map((f) => (
                    <button
                        key={f}
                        onClick={() => handleRiskFilter(f)}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${
                            filter.riskLevel === f
                                ? "bg-navy-mid text-white border-navy-mid"
                                : "bg-white text-gray-500 border-border hover:border-blue"
                        }`}
                    >
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                ))}

                {/* Toggle: show reviewed */}
                <button
                    onClick={() => {
                        const next = {
                            ...filter,
                            reviewed: filter.reviewed === "false" ? undefined : "false",
                        }
                        setFilter(next)
                        fetchAlerts(next)
                    }}
                    className={`ml-auto px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${
                        filter.reviewed !== "false"
                            ? "bg-navy-mid text-white border-navy-mid"
                            : "bg-white text-gray-500 border-border hover:border-blue"
                    }`}
                >
                    {filter.reviewed === "false" ? "Show Reviewed" : "Hide Reviewed"}
                </button>
            </div>

            {/* Error state */}
            {error && (
                <div className="alert alert-danger mb-4">
                    <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                        <p className="alert-title">Failed to load alerts</p>
                        <p className="alert-desc">{error}</p>
                    </div>
                    <button className="btn-danger-outline ml-auto text-xs px-3 py-1" onClick={() => fetchAlerts()}>
                        Retry
                    </button>
                </div>
            )}

            {/* Loading skeleton */}
            {loading && !error && (
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="card p-4">
                            <div className="flex items-center gap-4">
                                <div className="skeleton skeleton-avatar w-9 h-9" />
                                <div className="flex-1 space-y-2">
                                    <div className="skeleton skeleton-text w-40" />
                                    <div className="skeleton skeleton-text-sm w-24" />
                                </div>
                                <div className="skeleton skeleton-btn w-16 h-6" />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Alert list */}
            {!loading && !error && (
                alerts.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">
                            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h3 className="empty-state-title">All clear!</h3>
                        <p className="empty-state-desc">
                            {filter.riskLevel !== "all"
                                ? `No ${filter.riskLevel}-risk alerts pending.`
                                : "No pending alerts. All students are on track 🎉"}
                        </p>
                    </div>
                ) : (
                    alerts.map((alert) => (
                        <AlertRow key={alert.id} alert={alert} />
                    ))
                )
            )}
        </>
    )
}

export default AlertInboxPage