import { useState } from "react";
import { useNavigate } from "react-router-dom";
import GenerateSessionsModal from "./GenerateSessionsModal";

export default function SessionsTab({ sessions, classId, classStartDate, classEndDate, onSessionsGenerated }) {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);

  const handleSuccess = (result) => {
    const { sessions_created, skipped } = result;
    if (onSessionsGenerated) onSessionsGenerated();
    alert(`${sessions_created} sessions created, ${skipped} skipped.`);
    // Zahwa's toast system would be better here — use it if available
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="heading-3">Session History</h3>
        <div className="flex gap-2">
          <button
            className="btn-secondary"
            onClick={() => setShowModal(true)}
          >
            Generate Sessions
          </button>
          <button
            className="btn-primary"
            onClick={() => navigate(`/classes/${classId}/attendance`)}
          >
            + New Session
          </button>
        </div>
      </div>

      <table className="table">
        <thead className="table-thead">
          <tr>
            <th>Session #</th>
            <th>Date</th>
            <th>Attendance</th>
            <th>Turnout</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          {sessions.length === 0 ? (
            <tr>
              <td colSpan={5}>
                <div className="empty-state">
                  <p className="empty-state-title">No sessions yet</p>
                  <p className="empty-state-desc">
                    Generate sessions from the class schedule or create one manually.
                  </p>
                </div>
              </td>
            </tr>
          ) : (
            sessions.map((session) => {
              const total = session.total_enrolled || 0;
              const present = session.present_count || 0;
              const absent = session.absent_count || 0;
              const turnout = total > 0
                ? Math.round((present / total) * 100)
                : 0;

              return (
                <tr
                  key={session.id}
                  className="table-row"
                  onClick={() => navigate(
                    `/classes/${classId}/attendance?date=${session.session_date}`
                  )}
                >
                  <td className="table-cell font-medium">
                    Session {session.session_num}
                  </td>
                  <td className="table-cell">{session.session_date}</td>
                  <td className="table-cell">
                    <span className="text-success font-semibold">{present}</span>
                    <span className="text-blue mx-1">/</span>
                    <span className="text-danger font-semibold">{absent}</span>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center gap-2">
                      <div className="progress-md w-24">
                        <div
                          className="progress-fill-navy"
                          style={{ width: `${turnout}%` }}
                        />
                      </div>
                      <span className="text-sm text-blue">{turnout}%</span>
                    </div>
                  </td>
                  <td className="table-cell-muted">{session.notes || "—"}</td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      {showModal && (
        <GenerateSessionsModal
          classId={classId}
          classStartDate={classStartDate}
          classEndDate={classEndDate}
          onClose={() => setShowModal(false)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}