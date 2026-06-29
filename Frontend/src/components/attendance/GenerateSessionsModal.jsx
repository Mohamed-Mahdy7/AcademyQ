import { useState } from "react";
import { useTranslation } from "react-i18next";
import api from "../../api";
import { toast } from "../../lib/toastBus";

export default function GenerateSessionsModal({ classId, classStartDate, classEndDate, onClose, onSuccess }) {
  const { t } = useTranslation(["attendance", "common"]);
  const [startDate, setStartDate] = useState(classStartDate || "");
  const [endDate, setEndDate] = useState(classEndDate || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGenerate = async () => {
    if (!startDate || !endDate) {
      setError(t("both_dates_required"));
      return;
    }
    if (endDate < startDate) {
      setError(t("end_before_start"));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.post(`/api/classes/${classId}/generate-sessions/`, {
        start_date: startDate,
        end_date: endDate,
      });
      const { sessions_created, skipped_existing, skipped_limit } = res.data;
      if (sessions_created === 0) {
        toast.warning(t("no_sessions_created"), t("no_sessions_created_desc"));
      } else {
        const parts = [];
        if (skipped_existing > 0) parts.push(t("skipped_existed", { count: skipped_existing }));
        if (skipped_limit > 0) parts.push(t("skipped_limit", { count: skipped_limit }));
        toast.success(
          t("sessions_generated"),
          `${sessions_created === 1
            ? t("sessions_generated_desc", { count: sessions_created })
            : t("sessions_generated_desc_plural", { count: sessions_created })
          }${parts.length > 0 ? `. ${t("notes")}: ${parts.join(", ")}` : ""}.`
        );
      }
      onSuccess(res.data);
    } catch (err) {
      const data = err.response?.data;
      const fields = data?.fields;
      if (fields?.class_id) {
            setError(fields.class_id[0]);
        } else if (fields?.start_date) {
            setError(fields.start_date[0]);
        } else if (fields?.end_date) {
            setError(fields.end_date[0]);
        } else {
            setError(data?.detail || "Failed to generate sessions.");
        }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-md">
        <div className="modal-header">
          <h3 className="modal-title">{t("generate_sessions_title")}</h3>
          <button className="btn-icon modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {error && (
            <div className="alert alert-danger mb-4">
              <span className="alert-desc">{error}</span>
            </div>
          )}
          <div className="form-field">
            <label className="form-label">{t("start_date")} <span className="form-required">*</span></label>
            <input type="date" className="form-input" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="form-field">
            <label className="form-label">{t("end_date")} <span className="form-required">*</span></label>
            <input type="date" className="form-input" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
          <div className="alert alert-info">
            <span className="alert-desc">{t("generate_sessions_info")}</span>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-muted" onClick={onClose} disabled={loading}>{t("cancel")}</button>
          <button className="btn-primary" onClick={handleGenerate} disabled={loading}>
            {loading ? <><span className="btn-spinner" />{t("generating")}</> : t("generate_sessions")}
          </button>
        </div>
      </div>
    </div>
  );
}