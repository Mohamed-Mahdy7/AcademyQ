import { useEffect, useState } from "react";
import api from "../../api";
import { getGrades } from "../../services/gradesService";

export default function GradeHistoryTab({ studentId }) {
  const [enrollments, setEnrollments] = useState([]);
  const [grades, setGrades] = useState({});
  const [expanded, setExpanded] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!studentId) return;
    api.get(`/api/enrollments/?student_id=${studentId}`)
      .then(res => {
        const data = res.data.results ?? res.data;
        setEnrollments(data);
      })
      .catch(() => setEnrollments([]))
      .finally(() => setLoading(false));
  }, [studentId]);

  const handleExpand = (enrollmentId) => {
    if (expanded === enrollmentId) {
      setExpanded(null);
      return;
    }
    setExpanded(enrollmentId);
    if (!grades[enrollmentId]) {
      getGrades(enrollmentId)
        .then(res => {
          const data = res.data.results ?? res.data;
          setGrades(prev => ({ ...prev, [enrollmentId]: data.slice().reverse() }));
        })
        .catch(() => setGrades(prev => ({ ...prev, [enrollmentId]: [] })));
    }
  };

  const getPctBadge = (pct) => {
    if (pct >= 70) return "badge-grade-good";
    if (pct >= 50) return "badge-grade-warn";
    return "badge-grade-bad";
  };

  if (loading) return <p className="text-body-muted p-4">Loading grades...</p>;

  if (!enrollments.length) return (
    <div className="empty-state">
      <p className="empty-state-title">No enrollments found</p>
      <p className="empty-state-desc">
        Grades will appear here once the student is enrolled in a class.
      </p>
    </div>
  );

  return (
    <div className="space-y-3">
      {enrollments.map((e) => {
        const enrollmentGrades = grades[e.id] || [];
        const isExpanded = expanded === e.id;

        const count = enrollmentGrades.length;
        const average = count
          ? Math.round(
              enrollmentGrades.reduce((sum, g) => {
                const pct = g.max_score ? (g.score / g.max_score) * 100 : 0;
                return sum + pct;
              }, 0) / count
            )
          : null;

        return (
          <div key={e.id} className="card">
            <div
              className="card-header cursor-pointer"
              onClick={() => handleExpand(e.id)}
            >
              <div className="flex items-center gap-3">
                <span className="heading-4">{e.class_name}</span>
                <span className={`badge ${e.status === 'active' ? 'badge-success' : 'badge-muted'}`}>
                  {e.status}
                </span>
              </div>

              <div className="flex items-center gap-4">
                {isExpanded && average !== null && (
                  <span className={getPctBadge(average)}>
                    {average}% avg
                  </span>
                )}
                <span className="text-blue text-sm">
                  {isExpanded ? "▲" : "▼"}
                </span>
              </div>
            </div>

            {isExpanded && (
              <div className="p-4">
                {enrollmentGrades.length === 0 ? (
                  <p className="text-body-muted text-sm">No grades recorded yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="table min-w-[400px]">
                      <thead className="table-thead">
                        <tr>
                          <th>Session #</th>
                          <th>Subject</th>
                          <th>Score</th>
                          <th>%</th>
                          <th>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {enrollmentGrades.map((g) => {
                          const pct = g.max_score
                            ? Math.round((g.score / g.max_score) * 100)
                            : 0;
                          return (
                            <tr key={g.id} className="table-row">
                              <td className="table-cell">
                                {g.session_num ? `Session ${g.session_num}` : "—"}
                              </td>
                              <td className="table-cell">{g.subject_name}</td>
                              <td className="table-cell">{g.score}/{g.max_score}</td>
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