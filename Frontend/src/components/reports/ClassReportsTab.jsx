import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { generateBulkReports } from "../../services/reportService";

const getInitials = (name) =>
    name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();

function ClassReportsTab({ classId, enrollments = [] }) {
    const { t } = useTranslation(["classes", "common"]);
    const [loading, setLoading] = useState(false);
    const [feedback, setFeedback] = useState(null);
    const navigate = useNavigate();

    const activeEnrollments = useMemo(
        () => enrollments.filter((e) => e.status === "active"),
        [enrollments]
    );

    const currentMonth = useMemo(() => {
        const today = new Date();
        return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
    }, []);

    const handleGenerateForClass = async () => {
        if (activeEnrollments.length === 0) {
            setFeedback({ type: "error", message: t("no_active_students_feedback") });
            return;
        }
        setLoading(true);
        setFeedback(null);
        try {
            const res = await generateBulkReports(classId, currentMonth);
            setFeedback({ type: "success", message: res.data.detail });
        } catch (err) {
            setFeedback({
                type: "error",
                message: err.response?.data?.detail || t("failed_to_queue_reports"),
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="heading-3">{t("bulk_ai_report")}</h3>
                        <span className="badge-info">{t("powered_by_ai")}</span>
                    </div>
                    <p className="text-caption">
                        {t("ai_report_desc", { count: activeEnrollments.length })}
                    </p>
                </div>
                <button
                    className="btn-primary"
                    onClick={handleGenerateForClass}
                    disabled={loading}
                >
                    {loading ? (
                        <span className="flex items-center gap-2">
                            <span className="btn-spinner" />
                            {t("queuing")}
                        </span>
                    ) : (
                        `⚡ ${t("generate_for_class")}`
                    )}
                </button>
            </div>

            {feedback && (
                <div className={feedback.type === "success" ? "alert-success mb-4" : "alert-danger mb-4"}>
                    <p className="alert-desc">{feedback.message}</p>
                </div>
            )}

            <div className="table-wrap">
                <div className="card-header">
                    <h2 className="card-header-title">
                        {t("students_in_class", { count: activeEnrollments.length })}
                    </h2>
                </div>

                {activeEnrollments.length === 0 ? (
                    <div className="empty-state">
                        <p className="empty-state-title">{t("no_active_students")}</p>
                        <p className="empty-state-desc">{t("no_active_students_desc")}</p>
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
                                        {getInitials(enrollment.student_name)}
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
                                    className="btn-secondary"
                                    onClick={() => navigate(`/student/${enrollment.student_id}`)}
                                >
                                    {t("common:view_profile")} →
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