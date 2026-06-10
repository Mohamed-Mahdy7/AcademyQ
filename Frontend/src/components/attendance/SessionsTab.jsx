import { useNavigate } from "react-router-dom";
import { useSearchParams } from "react-router-dom";

export default function SessionsTab({ sessions, classId }) {
    const navigate = useNavigate();

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h3 className="heading-3">Session History</h3>
                <button
                    className="btn-primary"
                    onClick={() => navigate(`/classes/${classId}/attendance`)}
                >
                    + New Session
                </button>
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
                                        Create the first session to get started.
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
                                    <td className="table-cell">
                                        {session.session_date}
                                    </td>
                                    <td className="table-cell">
                                        <span className="text-success font-semibold">
                                            {present}
                                        </span>
                                        <span className="text-blue mx-1">/</span>
                                        <span className="text-danger font-semibold">
                                            {absent}
                                        </span>
                                    </td>
                                    <td className="table-cell">
                                        <div className="flex items-center gap-2">
                                            <div className="progress-md w-24">
                                                <div
                                                    className="progress-fill-navy"
                                                    style={{ width: `${turnout}%` }}
                                                />
                                            </div>
                                            <span className="text-sm text-blue">
                                                {turnout}%
                                            </span>
                                        </div>
                                    </td>
                                    <td className="table-cell-muted">
                                        {session.notes || "—"}
                                    </td>
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </table>
        </div>
    );
}