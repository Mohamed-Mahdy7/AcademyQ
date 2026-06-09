import { useEffect, useState } from "react";
import axios from "axios";

export default function GradeHistoryTab({ enrollmentId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!enrollmentId) return;

    setLoading(true);

    axios
      .get(`/api/grades/history?enrollment_id=${enrollmentId}`)
      .then((res) => {
        setData(res.data);
      })
      .finally(() => setLoading(false));
  }, [enrollmentId]);

  if (loading) return <div className="p-4">Loading grades...</div>;

  if (!data || data.empty) {
    return <div className="p-4 text-gray-500">No grades yet</div>;
  }

  return (
    <div className="p-4 space-y-4">
      {/* Summary Header */}
      <div className="bg-gray-100 p-3 rounded">
        <h3 className="font-bold">
          Average: {data.average}%
        </h3>
        <p>Total assessments: {data.total}</p>
      </div>

      {/* Table */}
      <div className="overflow-auto">
        <table className="w-full border">
          <thead className="bg-gray-200">
            <tr>
              <th className="p-2">Assessment</th>
              <th>Score</th>
              <th>%</th>
              <th>Session</th>
              <th>Date</th>
            </tr>
          </thead>

          <tbody>
            {data.grades.map((g) => (
              <tr key={g.id} className="border-t">
                <td className="p-2">{g.assessment_name}</td>
                <td>{g.score}/{g.max_score}</td>
                <td>{g.percentage}%</td>
                <td>{g.session}</td>
                <td>{g.assigned_on}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}