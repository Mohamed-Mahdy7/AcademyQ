import { useEffect, useState } from "react";
import { getClassSummary } from "../../services/grades";

export default function ClassGradeSummaryTab({ classId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!classId) return;
    setLoading(true);
    getClassSummary(classId)
      .then((res) => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [classId]);

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

  return (
    <div className="table-wrap">
      <table className="table">
        <thead className="table-thead">
          <tr>
            <th>Student</th>
            <th>Average</th>
            <th>Assessments</th>
            <th>Trend</th>
          </tr>
        </thead>
        <tbody>
          {data.students.map((s) => (
            <tr key={s.student_id} className="table-row">
              <td className="table-cell font-medium">{s.student_name}</td>
              <td className="table-cell">
                <span className={
                  s.average >= 70 ? "badge-grade-good" :
                  s.average >= 50 ? "badge-grade-warn" :
                  "badge-grade-bad"
                }>
                  {s.average}%
                </span>
              </td>
              <td className="table-cell">{s.assessments}</td>
              <td className="table-cell">{getTrend(s.trend)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}