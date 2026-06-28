import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import api from "../../api";
import { toast } from "../../lib/toastBus";

export default function RetentionScanCard({ onScanComplete }) {
  const { t, i18n } = useTranslation("dashboard");
  const [lastScan, setLastScan] = useState(null);
  const [running, setRunning] = useState(false);
  const [rateLimited, setRateLimited] = useState(() => {
    const stored = localStorage.getItem("scan_rate_limited_until");
    if (!stored) return false;
    return new Date(stored) > new Date();
  });

  useEffect(() => {
    api.get("/api/agent/scans/")
      .then(res => {
        const logs = res.data.results ?? res.data;
        setLastScan(logs[0] ?? null);
      })
      .catch(() => {});
  }, []);

  const handleRunScan = async () => {
    setRunning(true);
    try {
      const res = await api.post("/api/agent/run-scan/");
      setLastScan(res.data);
      if (onScanComplete) onScanComplete();
      toast.success(
        t("retention_scan.toast_complete"),
        t("retention_scan.toast_complete_desc", { count: res.data.students_scanned })
      );
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      if (err.response?.status === 429) {
        const detail = err.response?.data?.detail || t("retention_scan.toast_limit_desc");
        toast.warning(t("retention_scan.toast_rate_limited"), detail);
        setRateLimited(true);
        // persist until midnight
        const midnight = new Date();
        midnight.setHours(24, 0, 0, 0);
        localStorage.setItem("scan_rate_limited_until", midnight.toISOString());
      } else {
        toast.danger(t("retention_scan.toast_failed"), t("retention_scan.toast_failed_desc"));
      }
    } finally {
      setRunning(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return t("retention_scan.never");
    const locale = i18n.language === "ar" ? "ar-EG" : "en-GB";
    return new Date(dateStr).toLocaleDateString(locale, {
      day: "numeric",
      month: "short"
    });
  };

  const nextSunday = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = day === 0 ? 7 : 7 - day;
    const next = new Date(today);
    next.setDate(today.getDate() + diff);
    const locale = i18n.language === "ar" ? "ar-EG" : "en-GB";
    return next.toLocaleDateString(locale, { day: "numeric", month: "short" });
  };

  return (
    <div className="kpi-card">
      <div className="flex items-center justify-between mb-2">
        <p className="kpi-label">{t("retention_scan.label")}</p>
        <svg className="w-5 h-5 text-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </div>

      <p className="text-base font-semibold text-navy mb-1">{t("retention_scan.title")}</p>
      <p className="text-caption">{t("retention_scan.last_run", { date: formatDate(lastScan?.started_at) })}</p>
      <p className="text-caption mb-4">{t("retention_scan.next", { date: nextSunday() })}</p>

      <button
        className="btn-primary w-full"
        onClick={handleRunScan}
        disabled={running || rateLimited}
      >
        {running
          ? t("retention_scan.running")
          : rateLimited
          ? t("retention_scan.limit_reached")
          : t("retention_scan.run_now")}
      </button>
    </div>
  );
}