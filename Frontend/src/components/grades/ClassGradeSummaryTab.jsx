// src/components/grades/ClassGradeSummaryTab.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getClassSummary, getGrades } from "../../services/gradesService";

export default function ClassGradeSummaryTab({ classId, enrollments = [] }) {
  const navigate = useNavigate();
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
        if (students.length && !selectedStudent) {
          setSelectedStudent(students[0]);
        }
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [classId]);

  useEffect(() => {
    if (!selectedStudent) return;
    const enrollment = enrollments.find(
      (e) => e.student_id === selectedStudent.student_id
    );
    if (!enrollment) {
      setStudentGrades([]);
      return;
    }
    getGrades(enrollment.id)
      .then((res) => {
        const grades = res.data.results ?? res.data;
        setStudentGrades(grades.slice().reverse()); // newest first
      })
      .catch(() => setStudentGrades([]));
  }, [selectedStudent, enrollments]);

  if (loading) return <p className="text-body-muted p-4">Loading...</p>;

  if (!data?.students?.length) return (
    <div className="empty-state">
      <p className="empty-state-title">No grades for this class</p>
      <p className="empty-state-desc">Grades will appear here once added.</p>
    </div>
  );

  const getTrend = (trend) => {
    if (trend === "improving") return <span className="badge-success">↑ Improving</span>;
    if (trend === "declining") return <span className="badge-danger">↓ Declining</span>;
    if (trend === "stable") return <span className="badge-muted">→ Stable</span>;
    return <span className="badge-muted">—</span>;
  };

  const getPctBadge = (pct) => {
    if (pct === null || pct === undefined) return "—";
    if (pct >= 70) return "badge-grade-good";
    if (pct >= 50) return "badge-grade-warn";
    return "badge-grade-bad";
  };

  return (
    <div className="space-y-6">

      {/* Class Performance Overview */}
      <div>
        <h3 className="heading-3 mb-4">Class Performance Overview</h3>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="table min-w-[700px]">
            <thead className="table-thead">
              <tr>
                <th>Student Name</th>
                <th>Assessments</th>
                <th>Average</th>
                <th>Latest Score</th>
                <th>Trend</th>
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
                        <div
                          className="progress-fill-navy"
                          style={{ width: `${s.average}%` }}
                        />
                      </div>
                      <span className="text-sm text-blue">{s.average}%</span>
                    </div>
                  </td>
                  <td className="table-cell">
                    {s.latest_score_pct !== null ? `${s.latest_score_pct}%` : "—"}
                  </td>
                  <td className="table-cell">{getTrend(s.trend)}</td>
                  <td className="table-actions">
                    <button
                      className="btn-secondary"
                      onClick={() => navigate(`/student/${s.student_id}`)}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Grade Details */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="heading-3">Student Grade Details</h3>

          <div className="relative">
            <button
              className="form-select w-full sm:min-w-44 flex items-center justify-between"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              {selectedStudent?.student_name ?? "Select Student"}
              <span className="text-blue ml-2">▾</span>
            </button>

            {dropdownOpen && (
              <div className="dropdown right-0 mt-1 w-full">
                {data.students.map((s) => (
                  <div
                    key={s.student_id}
                    className="dropdown-item"
                    onClick={() => {
                      setSelectedStudent(s);
                      setDropdownOpen(false);
                    }}
                  >
                    {s.student_name}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {studentGrades.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state-title">No grade records</p>
            <p className="empty-state-desc">
              {selectedStudent?.student_name} has no recorded grades yet.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="table min-w-[700px]">
              <thead className="table-thead">
                <tr>
                  <th>Session #</th>
                  <th>Score</th>
                  <th>Percentage</th>
                </tr>
              </thead>
              <tbody>
                {studentGrades.map((g) => {
                  const pct = g.max_score
                    ? Math.round((g.score / g.max_score) * 100)
                    : 0;
                  return (
                    <tr key={g.id} className="table-row">
                      <td className="table-cell font-medium">
                        {g.session_num ? `Session ${g.session_num}` : "—"}
                      </td>
                      <td className="table-cell">
                        {g.score} / {g.max_score}
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center gap-2">
                          <div className="progress-md w-24">
                            <div
                              className="progress-fill-navy"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-sm text-blue">{pct}%</span>
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