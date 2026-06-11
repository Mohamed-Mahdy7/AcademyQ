import { useEffect, useState } from "react";
import { useGrades } from "../../context/gradecontext";

export default function GradeHistoryTab({ enrollmentId }) {
  const { loadGrades } = useGrades();
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!enrollmentId) {
      setLoading(false);
      return;
    }
    loadGrades(enrollmentId)
      .then((data) => setGrades(data?.results ?? data ?? []))
      .catch(() => setGrades([]))
      .finally(() => setLoading(false));
  }, [enrollmentId]);

  if (!enrollmentId) return (
    <div className="empty-state">
      <p className="empty-state-title">No enrollment selected</p>
    </div>
  );

  if (loading) return <p className="text-body-muted p-4">Loading grades...</p>;

  if (!grades.length) return (
    <div className="empty-state">
      <p className="empty-state-title">No grades yet</p>
      <p className="empty-state-desc">Grades will appear here once added.</p>
    </div>
  );

  return (
    <div className="table-wrap">
      <table className="table">
        <thead className="table-thead">
          <tr>
            <th>Subject</th>
            <th>Score</th>
            <th>%</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {grades.map((g) => {
            const pct = g.max_score
              ? Math.round((g.score / g.max_score) * 100)
              : 0;
            return (
              <tr key={g.id} className="table-row">
                <td className="table-cell">{g.subject_name}</td>
                <td className="table-cell">{g.score}/{g.max_score}</td>
                <td className="table-cell">
                  <span className={
                    pct >= 70 ? "badge-grade-good" :
                    pct >= 50 ? "badge-grade-warn" :
                    "badge-grade-bad"
                  }>
                    {pct}%
                  </span>
                </td>
                <td className="table-cell-muted">{g.assigned_at}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}