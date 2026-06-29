import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import api from "../../api";
import { getGrades } from "../../services/gradesService";

export default function GradeHistoryTab({ studentId }) {
  const { t } = useTranslation("grades");
  const [enrollments, setEnrollments] = useState([]);
  const [grades, setGrades] = useState({});
  const [expanded, setExpanded] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState({});

  useEffect(() => {
    if (!studentId) return;
    api.get(`/api/enrollments/?student_id=${studentId}`)
      .then(res => setEnrollments(res.data.results ?? res.data))
      .catch(() => setEnrollments([]))
      .finally(() => setLoading(false));
  }, [studentId]);

  const handleExpand = (enrollmentId) => {
    if (expanded === enrollmentId) { setExpanded(null); return; }
    setExpanded(enrollmentId);
    if (!grades[enrollmentId]) {
        const enrollment = enrollments.find(e => e.id === enrollmentId);
        
        // Fetch both grades and sessions together
        Promise.all([
            getGrades(enrollmentId),
            api.get(`/api/sessions/?class_id=${enrollment?.class_id}`)
        ])
        .then(([gradesRes, sessionsRes]) => {
            const data = gradesRes.data.results ?? gradesRes.data;
            setGrades(prev => ({ ...prev, [enrollmentId]: data.slice().reverse() }));
            const sessionData = sessionsRes.data.results ?? sessionsRes.data;
            setSessions(prev => ({ ...prev, [enrollmentId]: sessionData }));
        })
        .catch(() => {
            setGrades(prev => ({ ...prev, [enrollmentId]: [] }));
            setSessions(prev => ({ ...prev, [enrollmentId]: [] }));
        });
      }
  };

  const getPctBadge = (pct) => {
    if (pct >= 70) return "badge-grade-good";
    if (pct >= 50) return "badge-grade-warn";
    return "badge-grade-bad";
  };

  if (loading) return <p className="text-body-muted p-4">{t("loading_grades")}</p>;

  if (!enrollments.length) return (
    <div className="empty-state">
      <p className="empty-state-title">{t("no_grades_enrolled")}</p>
      <p className="empty-state-desc">{t("no_grades_enrolled_desc")}</p>
    </div>
  );

  return (
    <div className="space-y-3">
      {enrollments.map((e) => {
        const enrollmentGrades = grades[e.id] || [];
        const isExpanded = expanded === e.id;
        const count = enrollmentGrades.length;
        const average = count
          ? Math.round(enrollmentGrades.reduce((sum, g) => {
              return sum + (g.max_score ? (g.score / g.max_score) * 100 : 0);
            }, 0) / count)
          : null;

        return (
          <div key={e.id} className="card">
            <div className="card-header cursor-pointer" onClick={() => handleExpand(e.id)}>
              <div className="flex items-center gap-3">
                <span className="heading-4">{e.class_name}</span>
                <span className={`badge ${e.status === "active" ? "badge-success" : "badge-muted"}`}>
                  {e.status}
                </span>
              </div>
              <div className="flex items-center gap-4">
                {isExpanded && average !== null && (
                  <span className={getPctBadge(average)}>{t("avg_label", { avg: average })}</span>
                )}
                <span className="text-blue text-sm">{isExpanded ? "▲" : "▼"}</span>
              </div>
            </div>

            {isExpanded && (
              <div className="p-4">
                {enrollmentGrades.length === 0 ? (
                  <p className="text-body-muted text-sm">{t("no_grades_yet")}</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="table min-w-[400px]">
                      <thead className="table-thead">
                        <tr>
                          <th>{t("session_num")}</th>
                          <th>{t("subject")}</th>
                          <th>{t("score")}</th>
                          <th>{t("percentage")}</th>
                          <th>{t("assigned_date")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {enrollmentGrades.map((g) => {
                          const pct = g.max_score ? Math.round((g.score / g.max_score) * 100) : 0;
                          return (
                            <tr key={g.id} className="table-row">
                              <td className="table-cell">
                                  {g.session_num ? t("session_label", { 
                                      num: g.session_num, 
                                      date: (sessions[e.id] ?? []).find(s => s.id === g.session)?.session_date ?? ""
                                  }) : "—"}
                              </td>
                              <td className="table-cell">{g.subject_name}</td>
                              <td className="table-cell">{t("score_display", { score: g.score, max: g.max_score })}</td>
                              <td className="table-cell">
                                <span className={getPctBadge(pct)}>{pct}%</span>
                              </td>
                              <td className="table-cell-muted">{g.assigned_at}</td>
                            </tr>
                          );
                        })}
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