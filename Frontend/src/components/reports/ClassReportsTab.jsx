import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { generateBulkReports } from "../../services/reportService";

function ClassReportsTab({ classId, enrollments = [] }) {
    const [loading, setLoading] = useState(false);
    const [feedback, setFeedback] = useState(null);
    const navigate = useNavigate();

    const activeEnrollments = enrollments.filter((e) => e.status === "active");

    const currentMonth = (() => {
        const today = new Date();
        return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
    })();

    const handleGenerateForClass = async () => {
        if (activeEnrollments.length === 0) {
            setFeedback({
                type: "error",
                message: "No active students enrolled. Enroll students first to generate reports.",
            });
            return;
        }

        setLoading(true);
        setFeedback(null);
        try {
            const res = await generateBulkReports(classId, currentMonth);
            setFeedback({
                type: "success",
                message: res.data.detail,
            });
        } catch (err) {
            setFeedback({
                type: "error",
                message:
                    err.response?.data?.detail ||
                    "Failed to queue report generation.",
            });
        } finally {
            setLoading(false);
        }
    };

    const initials = (name) =>
        name
            .split(" ")
            .map((n) => n[0])
            .slice(0, 2)
            .join("")
            .toUpperCase();

    return (
        <div>
            <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="heading-3">Bulk AI Report Generation</h3>
                        <span className="badge-info">Powered by AI</span>
                    </div>
                    <p className="text-caption">
                        Queue AI retention reports for all {activeEnrollments.length} enrolled
                        students at once. Reports are generated in the background via Celery tasks.
                    </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                    <button
                        className="btn-primary"
                        onClick={handleGenerateForClass}
                        disabled={loading}
                    >
                        {loading ? (
                            <span className="flex items-center gap-2">
                                <span className="btn-spinner" />
                                Queuing...
                            </span>
                        ) : (
                            "⚡ Generate for Class"
                        )}
                    </button>
                </div>
            </div>

            {feedback && (
                <div className={feedback.type === "success" ? "alert-success mb-4" : "alert-danger mb-4"}>
                    <p className="alert-desc">{feedback.message}</p>
                </div>
            )}

            <div className="table-wrap">
                <div className="card-header">
                    <h2 className="card-header-title">
                        Students In This Class — {activeEnrollments.length} Total
                    </h2>
                </div>

                {activeEnrollments.length === 0 ? (
                    <div className="empty-state">
                        <p className="empty-state-title">No active students</p>
                        <p className="empty-state-desc">
                            Enroll students in this class to generate reports.
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-border">
                        {activeEnrollments.map((enrollment) => (
                            <div
                                key={enrollment.id}
                                className="flex items-center justify-between px-5 py-4"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="avatar-circle">
                                        {initials(enrollment.student_name)}
                                    </div>
                                    <div>
                                        <p className="text-base font-semibold text-navy">
                                            {enrollment.student_name}
                                        </p>
                                        <p className="text-caption">
                                            {enrollment.status} ·{" "}
                                            {enrollment.payments?.[0]?.amount
                                                ? `${enrollment.payments[0].amount} EGP/mo`
                                                : "—"}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    className="link-action"
                                    onClick={() => navigate(`/student/${enrollment.student_id}`)}
                                >
                                    View Profile →
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default ClassReportsTab;