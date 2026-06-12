import { useEffect, useState } from "react";
import api from "../../api";

export default function AttendanceTab({ studentId }) {
  const [enrollments, setEnrollments] = useState([]);
  const [stats, setStats] = useState({});
  const [history, setHistory] = useState({});
  const [expanded, setExpanded] = useState(null);
  const [loading, setLoading] = useState(true);

  // fetch all enrollments for this student
  useEffect(() => {
    if (!studentId) return;
    api.get(`/api/enrollments/?student_id=${studentId}`)
      .then(res => {
        const data = res.data.results ?? res.data;
        setEnrollments(data);
        // fetch stats for each enrollment's class
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
    if (expanded === classId) {
      setExpanded(null);
      return;
    }
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

  if (loading) return <p className="text-body-muted p-4">Loading attendance...</p>;

  if (!enrollments.length) return (
    <div className="empty-state">
      <p className="empty-state-title">No enrollments found</p>
      <p className="empty-state-desc">
        Attendance will appear here once the student is enrolled in a class.
      </p>
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
            {/* Class row */}
            <div
              className="card-header cursor-pointer"
              onClick={() => handleExpand(e.class_id)}
            >
              <div className="flex items-center gap-3">
                <span className="heading-4">{e.class_name}</span>
                <span className={`badge ${e.status === 'active' ? 'badge-success' : 'badge-muted'}`}>
                  {e.status}
                </span>
              </div>

              <div className="flex items-center gap-4">
                {classStats ? (
                  <>
                    <span className="text-caption">
                      {classStats.present_count}/{classStats.total_sessions} sessions
                    </span>
                    <span className={getPctBadge(classStats.attendance_pct)}>
                      {classStats.attendance_pct}%
                    </span>
                  </>
                ) : (
                  <span className="text-caption">Loading...</span>
                )}
                <span className="text-blue text-sm">
                  {isExpanded ? "▲" : "▼"}
                </span>
              </div>
            </div>

            {/* Expanded history */}
            {isExpanded && (
              <div className="p-4">
                {!classHistory.length ? (
                  <p className="text-body-muted text-sm">No sessions recorded yet.</p>
                ) : (
                  <table className="table">
                    <thead className="table-thead">
                      <tr>
                        <th>Session #</th>
                        <th>Date</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {classHistory.map((record, idx) => (
                        <tr key={idx} className="table-row">
                          <td className="table-cell">
                            Session {record.session_num}
                          </td>
                          <td className="table-cell">{record.session_date}</td>
                          <td className="table-cell">
                            {record.present ? (
                              <span className="badge-success">Present</span>
                            ) : (
                              <span className="badge-danger">Absent</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}