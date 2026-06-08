import { useEffect, useState } from "react";
import axios from "axios";

export default function ClassGradeSummaryTab({ classId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!classId) return;

    setLoading(true);

    axios
      .get(`/api/grades/class-summary?class_id=${classId}`)
      .then((res) => {
        setData(res.data);
      })
      .finally(() => setLoading(false));
  }, [classId]);

  if (loading) return <div className="p-4">Loading class summary...</div>;

  if (!data || data.empty) {
    return <div className="p-4 text-gray-500">No grades for this class</div>;
  }

  const getColor = (avg) => {
    if (avg >= 70) return "text-green-600";
    if (avg >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  const getTrend = (trend) => {
    if (trend === "improving") return "📈 Improving";
    if (trend === "declining") return "📉 Declining";
    return "➖ Stable";
  };

  return (
    <div className="p-4">
      <table className="w-full border">
        <thead className="bg-gray-200">
          <tr>
            <th className="p-2">Student</th>
            <th>Average</th>
            <th>Assessments</th>
            <th>Trend</th>
          </tr>
        </thead>

        <tbody>
          {data.students.map((s) => (
            <tr key={s.student_id} className="border-t">
              <td className="p-2">{s.student_name}</td>

              <td className={getColor(s.average)}>
                {s.average}%
              </td>

              <td>{s.assessments}</td>

              <td>{getTrend(s.trend)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}