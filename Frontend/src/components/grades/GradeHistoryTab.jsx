 import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useGrades } from "../../context/gradecontext";

export default function GradeHistoryTab() {
  const { id } = useParams();

  const { loadHistory } = useGrades();

  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const result = await loadHistory(id);
        setHistory(result);
      } catch (error) {
        console.error("History error:", error);
        setHistory(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (!id) return <div>Invalid enrollment id</div>;

  if (loading) return <div>Loading grades...</div>;

  if (!history) return <div>No history found</div>;

  return (
    <div>
      <h3>Average: {history.average}%</h3>
      <p>Total: {history.total}</p>

      <table>
        <thead>
          <tr>
            <th>Assessment</th>
            <th>Score</th>
            <th>%</th>
            <th>Session</th>
            <th>Date</th>
          </tr>
        </thead>

        <tbody>
          {history.grades?.map((g) => (
            <tr key={g.id}>
              <td>{g.assessment_name}</td>
              <td>{g.score}/{g.max_score}</td>
              <td>{g.percentage}</td>
              <td>{g.session}</td>
              <td>{g.assigned_on}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}