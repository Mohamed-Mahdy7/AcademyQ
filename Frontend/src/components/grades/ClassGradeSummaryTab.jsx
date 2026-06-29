import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getClassSummary, getGrades } from "../../services/gradesService";

export default function ClassGradeSummaryTab({ classId, enrollments = [], sessions = [] }) {
  const navigate = useNavigate();
  const { t } = useTranslation(["grades", "common"]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentGrades, setStudentGrades] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    if (!classId) return;
    setLoading(true);
    getClassSummary(classId)
      .then((res) => {
        setData(res.data);
        const students = res.data?.students ?? [];
        if (students.length && !selectedStudent) setSelectedStudent(students[0]);
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [classId]);

  useEffect(() => {
    if (!selectedStudent) return;
    const enrollment = enrollments.find(e => e.student_id === selectedStudent.student_id);
    if (!enrollment) { setStudentGrades([]); return; }
    getGrades(enrollment.id)
      .then((res) => {
        const grades = res.data.results ?? res.data;
        setStudentGrades(grades.slice().reverse());
      })
      .catch(() => setStudentGrades([]));
  }, [selectedStudent?.student_id]);

  if (loading) return <p className="text-body-muted p-4">{t("loading")}</p>;

  if (!data?.students?.length) return (
    <div className="empty-state">
      <p className="empty-state-title">{t("no_grades_class")}</p>
      <p className="empty-state-desc">{t("no_grades_class_desc")}</p>
    </div>
  );

  const getTrend = (trend) => {
    if (trend === "improving") return <span className="badge-success">{t("improving")}</span>;
    if (trend === "declining") return <span className="badge-danger">{t("declining")}</span>;
    if (trend === "stable") return <span className="badge-muted">{t("stable")}</span>;
    return <span className="badge-muted">—</span>;
  };

  const getPctBadge = (pct) => {
    if (pct === null || pct === undefined) return "badge-muted";
    if (pct >= 70) return "badge-grade-good";
    if (pct >= 50) return "badge-grade-warn";
    return "badge-grade-bad";
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="heading-3 mb-4">{t("class_performance")}</h3>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="table min-w-[700px]">
            <thead className="table-thead">
              <tr>
                <th>{t("student_name")}</th>
                <th>{t("assessments")}</th>
                <th>{t("average")}</th>
                <th>{t("latest_score")}</th>
                <th>{t("trend")}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data.students.map((s) => (
                <tr key={s.student_id} className="table-row">
                  <td className="table-cell font-medium">{s.student_name}</td>
                  <td className="table-cell">{s.assessments}</td>
                  <td className="table-cell">
                    <div className="flex items-center gap-2">
                      <div className="progress-md w-24">
                        <div className="progress-fill-navy" style={{ width: `${s.average}%` }} />
                      </div>
                      <span className="text-sm text-blue">{s.average}%</span>
                    </div>
                  </td>
                  <td className="table-cell">
                    {s.latest_score_pct !== null ? `${s.latest_score_pct}%` : "—"}
                  </td>
                  <td className="table-cell">{getTrend(s.trend)}</td>
                  <td className="table-actions">
                    <button className="btn-secondary" onClick={() => navigate(`/student/${s.student_id}`)}>
                      {t("view_details")}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h3 className="heading-3">{t("student_grade_details")}</h3>
          <div className="relative w-full sm:w-auto">
            <button
              className="form-select w-full sm:min-w-44 flex items-center justify-between"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              {selectedStudent?.student_name ?? t("select_student_dropdown")}
              <span className="text-blue ms-2">▾</span>
            </button>
            {dropdownOpen && (
              <div className="dropdown end-0 mt-1 w-full">
                {data.students.map((s) => (
                  <div key={s.student_id} className="dropdown-item"
                    onClick={() => { setSelectedStudent(s); setDropdownOpen(false); }}>
                    {s.student_name}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {studentGrades.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state-title">{t("no_grade_records")}</p>
            <p className="empty-state-desc">{t("no_grade_records_desc", { name: selectedStudent?.student_name })}</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="table min-w-[400px]">
              <thead className="table-thead">
                <tr>
                  <th>{t("session_num")}</th>
                  <th>{t("score")}</th>
                  <th>{t("percentage")}</th>
                </tr>
              </thead>
              <tbody>
                {studentGrades.map((g) => {
                  const pct = g.max_score ? Math.round((g.score / g.max_score) * 100) : 0;
                  return (
                    <tr key={g.id} className="table-row">
                      <td className="table-cell font-medium">
                        {g.session_num ? t("session_label", { 
                            num: g.session_num, 
                            date: sessions.find(s => s.id === g.session)?.session_date ?? "" 
                        }) : "—"}
                      </td>
                      <td className="table-cell">{t("score_display", { score: g.score, max: g.max_score })}</td>
                      <td className="table-cell">
                        <div className="flex items-center gap-2">
                          <div className="progress-md w-24">
                            <div className="progress-fill-navy" style={{ width: `${pct}%` }} />
                          </div>
                          <span className={`text-sm ${getPctBadge(pct)}`}>{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}