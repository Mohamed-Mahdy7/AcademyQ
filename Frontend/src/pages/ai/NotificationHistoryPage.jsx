import { useContext, useEffect, useState } from "react";
import { NotificationsContext } from "../../context/NotificationsContext";
import { useTranslation } from "react-i18next";

const STATUS_COLORS = {
    sent: "badge-success",
    failed: "badge-danger",
    pending: "badge-warning",
};

// const CHANNEL_LABELS = {
//     email: "Email",
// };

function NotificationHistoryPage() {
    const { t, i18n } = useTranslation("notification");
    const { notifications, stats, getNotifications, getStats } =
        useContext(NotificationsContext);

    const [channelFilter, setChannelFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            setLoading(true);
            await Promise.all([
                getNotifications({ channel: channelFilter, status: statusFilter }),
                getStats(),
            ]);
            setLoading(false);
        }
        load();
    }, [channelFilter, statusFilter]);

    function formatDate(dateStr, locale) {
        if (!dateStr) return "—";
        const d = new Date(dateStr);
        const lang = locale === "ar" ? "ar-EG" : "en-EG";
        return d.toLocaleDateString(lang, {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    }

    return (
        <div className="page-body">

            {/* Header */}
            <div className="mb-6">
                <h1 className="heading-1">{t("page.title")}</h1>
                <p className="subheading">
                    {t("page.subtitle")}
                </p>
            </div>

            {/* Stats */}
            <div className="stat-grid mb-6">
                <div className="kpi-card">
                    <p className="kpi-label">{t("kpi.sent_today")}</p>
                    <p className="kpi-value">
                        {loading ? "—" : (stats?.sent_today ?? 0)}
                    </p>
                </div>
                <div className="kpi-card">
                    <p className="kpi-label">{t("kpi.this_week")}</p>
                    <p className="kpi-value">
                        {loading ? "—" : (stats?.sent_this_week ?? 0)} 
                    </p>
                </div>
                <div className="kpi-card">
                    <p className="kpi-label">{t("kpi.failed")}</p>
                    <p className="kpi-value text-danger">
                        {loading ? "—" : (stats?.failed_this_week ?? 0)} 
                    </p>
                </div>
                <div className="kpi-card">
                    <p className="kpi-label">{t("kpi.delivery_rate")}</p>
                    <p className="kpi-value text-success">
                        {loading ? "—" : `${stats?.delivery_rate_pct ?? 0}%`} 
                    </p>
                </div>
            </div>

            {/* Table */}
            <div className="table-wrap">

                {/* Filter bar inside card header */}
                <div className="card-header">
                    <h2 className="card-header-title">{t("table.title")}</h2>
                    <div className="flex items-center gap-2">
                        <select
                            className="filter-select"
                            value={channelFilter}
                            onChange={(e) => setChannelFilter(e.target.value)}
                        >
                            <option value="">{t("table.filter_channels")}</option>
                            <option value="email">{t("table.filter_email")}</option>
                        </select>
                        <select
                            className="filter-select"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="">{t("table.filter_statuses")}</option>
                            <option value="sent">{t("table.filter_sent")}</option>
                            <option value="failed">{t("table.filter_failed")}</option>
                            <option value="pending">{t("table.filter_pending")}</option>
                        </select>
                    </div>
                </div>

                {loading ? (
                    <div className="p-8 space-y-3">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="skeleton skeleton-text w-full" />
                        ))}
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path strokeLinecap="round" strokeLinejoin="round"
                                    d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                            </svg>
                        </div>
                        <p className="empty-state-title">{t("table.empty_title")}</p>
                        <p className="empty-state-desc">
                            {t("table.empty_desc")}
                        </p>
                    </div>
                ) : (
                    <table className="table">
                        <thead className="table-thead">
                            <tr>
                                <th>{t("table.header_recipient")}</th>
                                <th>{t("table.header_channel")}</th>
                                <th>{t("table.header_message")}</th>
                                <th>{t("table.header_status")}</th>
                                <th>{t("table.header_sent_at")}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {notifications.map((n) => (
                                <tr key={n.id} className="table-row">
                                    <td className="table-cell">
                                        <p className="font-medium text-navy">{n.student_name}</p>
                                        <p className="text-xs text-blue">{n.parent_email || n.student_email}</p>
                                    </td>
                                    <td className="table-cell-muted">
                                        <span className="badge-info">
                                            {t(`channel.${n.channel}`) || n.channel}
                                        </span>
                                    </td>
                                    <td className="table-cell" style={{ maxWidth: "320px" }}>
                                        <p className="text-sm text-navy truncate max-w-xs">
                                            {n.message}
                                        </p>
                                    </td>
                                    <td className="table-cell">
                                        <span className={STATUS_COLORS[n.status] || "badge-muted"}>
                                            {t(`status.${n.status}`) || n.status}
                                        </span>
                                    </td>
                                    <td className="table-cell-muted text-xs">
                                        {formatDate(n.sent_at, i18n.language)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

export default NotificationHistoryPage;