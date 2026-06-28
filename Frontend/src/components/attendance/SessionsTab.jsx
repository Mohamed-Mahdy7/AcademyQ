import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import GenerateSessionsModal from "./GenerateSessionsModal";

export default function SessionsTab({ sessions, classId, classStartDate, classEndDate, onSessionsGenerated }) {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation("attendance");
  const [showModal, setShowModal] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const isRTL = i18n.language === "ar";

  const handleSuccess = () => {
    if (onSessionsGenerated) onSessionsGenerated();
  };

  const handleDelete = async (e, sessionId) => {
    e.stopPropagation();
    if (!window.confirm(t("delete_session_confirm"))) return;
    setDeleting(sessionId);
    try {
      await api.delete(`/api/sessions/${sessionId}/`);
      if (onSessionsGenerated) onSessionsGenerated();
    } catch {
      toast.danger(t("failed_delete_session"));
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h3 className="heading-3">{t("session_history")}</h3>
        <div className="flex gap-2 flex-wrap">
          <button className="btn-secondary" onClick={() => setShowModal(true)}>
            {t("generate_sessions")}
          </button>
          <button className="btn-primary" onClick={() => navigate(`/classes/${classId}/attendance`)}>
            {t("new_session")}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="table min-w-[600px]">
          <thead className="table-thead">
            <tr>
              <th>{t("session_number")}</th>
              <th>{t("date")}</th>
              <th>{t("attendance")}</th>
              <th className="hidden sm:table-cell">{t("turnout")}</th>
              <th>{t("notes")}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {sessions.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <div className="empty-state">
                    <p className="empty-state-title">{t("no_sessions_yet")}</p>
                    <p className="empty-state-desc">{t("no_sessions_desc")}</p>
                  </div>
                </td>
              </tr>
            ) : (
              sessions.map((session) => {
                const total = session.total_enrolled || 0;
                const present = session.present_count || 0;
                const absent = session.absent_count || 0;
                const turnout = total > 0 ? Math.round((present / total) * 100) : 0;
                return (
                  <tr
                    key={session.id}
                    className="table-row"
                    onClick={() => navigate(`/classes/${classId}/attendance?date=${session.session_date}`)}
                  >
                    <td className="table-cell font-medium">
                      {t("session_label", { num: session.session_num })}
                    </td>
                    <td className="table-cell">
                      {new Date(session.session_date).toLocaleDateString(
                        isRTL ? "ar-EG" : "en-GB",
                        { day: "numeric", month: "short", year: "numeric" }
                      )}
                    </td>
                    <td className="table-cell">
                      <span className="text-success font-semibold">{present}</span>
                      <span className="text-blue mx-1">/</span>
                      <span className="text-danger font-semibold">{absent}</span>
                    </td>
                    <td className="table-cell hidden sm:table-cell">
                      <div className="flex items-center gap-2">
                        <div className="progress-md w-24">
                          <div className="progress-fill-navy" style={{ width: `${turnout}%` }} />
                        </div>
                        <span className="text-sm text-blue">{turnout}%</span>
                      </div>
                    </td>
                    <td className="table-cell-muted">{session.notes || "—"}</td>
                    <td className="table-actions">
                      <button
                        className="btn-danger-outline"
                        onClick={(e) => handleDelete(e, session.id)}
                        disabled={deleting === session.id}
                      >
                        {deleting === session.id ? t("deleting") : t("delete")}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <GenerateSessionsModal
          classId={classId}
          classStartDate={classStartDate}
          classEndDate={classEndDate}
          onClose={() => setShowModal(false)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}