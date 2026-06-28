import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import api from "../../api";

export default function AttendanceTab({ studentId }) {
  const { t, i18n } = useTranslation("attendance");
  const isRTL = i18n.language === "ar";
  const [enrollments, setEnrollments] = useState([]);
  const [stats, setStats] = useState({});
  const [history, setHistory] = useState({});
  const [expanded, setExpanded] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!studentId) return;
    api.get(`/api/enrollments/?student_id=${studentId}`)
      .then(res => {
        const data = res.data.results ?? res.data;
        setEnrollments(data);
        data.forEach(e => {
          api.get(`/api/students/${studentId}/attendance/stats/?class_id=${e.class_id}`)
            .then(r => setStats(prev => ({ ...prev, [e.class_id]: r.data })))
            .catch(() => {});
        });
      })
      .catch(() => setEnrollments([]))
      .finally(() => setLoading(false));
  }, [studentId]);

  const handleExpand = (classId) => {
    if (expanded === classId) { setExpanded(null); return; }
    setExpanded(classId);
    if (!history[classId]) {
      api.get(`/api/students/${studentId}/attendance/history/?class_id=${classId}`)
        .then(r => setHistory(prev => ({ ...prev, [classId]: r.data })))
        .catch(() => setHistory(prev => ({ ...prev, [classId]: [] })));
    }
  };

  const getPctBadge = (pct) => {
    if (pct >= 80) return "badge-pct-good";
    if (pct >= 70) return "badge-pct-warn";
    return "badge-pct-bad";
  };

  const formatDate = (dateStr) => new Date(dateStr + "T00:00:00").toLocaleDateString(
    isRTL ? "ar-EG" : "en-GB",
    { day: "numeric", month: "short" }
  );

  if (loading) return <p className="text-body-muted p-4">{t("loading_attendance")}</p>;

  if (!enrollments.length) return (
    <div className="empty-state">
      <p className="empty-state-title">{t("no_enrollments_found")}</p>
      <p className="empty-state-desc">{t("no_enrollments_desc")}</p>
    </div>
  );

  return (
    <div className="space-y-3">
      {enrollments.map((e) => {
        const classStats = stats[e.class_id];
        const classHistory = history[e.class_id] || [];
        const isExpanded = expanded === e.class_id;

        return (
          <div key={e.id} className="card">
            <div className="card-header cursor-pointer" onClick={() => handleExpand(e.class_id)}>
              <div className="flex items-center gap-3">
                <span className="heading-4">{e.class_name}</span>
                <span className={`badge ${e.status === "active" ? "badge-success" : "badge-muted"}`}>
                  {e.status}
                </span>
              </div>
              <div className="flex items-center gap-4">
                {classStats ? (
                  <>
                    <span className="text-caption">
                      {classStats.present_count}/{classStats.total_sessions}
                    </span>
                    <span className={getPctBadge(classStats.attendance_pct)}>
                      {classStats.attendance_pct}%
                    </span>
                  </>
                ) : (
                  <span className="text-caption">{t("loading")}</span>
                )}
                <span className="text-blue text-sm">{isExpanded ? "▲" : "▼"}</span>
              </div>
            </div>

            {isExpanded && (
              <div className="p-4">
                {!classHistory.length ? (
                  <p className="text-body-muted text-sm">{t("no_sessions_recorded")}</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="table min-w-[300px]">
                      <thead className="table-thead">
                        <tr>
                          <th>{t("session_number")}</th>
                          <th>{t("date")}</th>
                          <th>{t("attendance")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {classHistory.map((record, idx) => (
                          <tr key={idx} className="table-row">
                            <td className="table-cell">{t("session_label", { num: record.session_num })}</td>
                            <td className="table-cell">{formatDate(record.session_date)}</td>
                            <td className="table-cell">
                              {record.present ? (
                                <span className="badge-success">{t("present")}</span>
                              ) : (
                                <span className="badge-danger">{t("absent")}</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}