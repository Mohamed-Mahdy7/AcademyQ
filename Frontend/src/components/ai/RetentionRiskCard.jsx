import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import api from "../../api";

export default function RetentionRiskCard({ refreshTrigger }) {
  const navigate = useNavigate();
  const { t } = useTranslation("dashboard");
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get("/api/alerts/stats/")
      .then(res => setStats(res.data))
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, [refreshTrigger]);

  return (
    <div className="kpi-card">
      <div className="flex items-center justify-between mb-2">
        <p className="kpi-label">{t("retention_risk.label")}</p>
        <svg className="w-5 h-5 text-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.437L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      </div>

      {loading ? (
        <p className="kpi-value">—</p>
      ) : (
        <>
          <p className="kpi-value">{stats?.total_open ?? 0}</p>
          <p className="text-caption mb-3">{t("retention_risk.open_alerts")}</p>

          <div className="flex items-center gap-2 mb-4 flex-wrap">
            {stats?.high_risk_count > 0 && (
              <span className="badge-danger">
                ● {t("retention_risk.high_risk", { count: stats.high_risk_count })}
              </span>
            )}
            {stats?.medium_risk_count > 0 && (
              <span className="badge-warning">
                ● {t("retention_risk.medium_risk", { count: stats.medium_risk_count })}
              </span>
            )}
            {!stats?.high_risk_count && !stats?.medium_risk_count && (
              <span className="badge-success">● {t("retention_risk.all_clear")}</span>
            )}
          </div>

          <button
            className="text-sm text-blue font-medium hover:underline"
            onClick={() => navigate("/alerts")}
          >
            {t("retention_risk.view_inbox")}
          </button>
        </>
      )}
    </div>
  );
}