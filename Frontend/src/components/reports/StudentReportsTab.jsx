import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getEnrollments } from "../../services/enrollmentService";
import { getReports, deleteReport } from "../../services/reportService";
import GenerateReportForm from "./GenerateReportForm";

const RISK_BADGE = {
    high: "badge-danger",
    medium: "badge-warning",
    low: "badge-success",
};

function StudentReportsTab({ studentId }) {
    const { t } = useTranslation(["reports", "common"]);
    const [reports, setReports] = useState([]);
    const [enrollments, setEnrollments] = useState([]);
    const [selectedEnrollmentId, setSelectedEnrollmentId] = useState("");
    const [loading, setLoading] = useState(true);
    const [feedback, setFeedback] = useState(null);
    const [deleteTargetId, setDeleteTargetId] = useState(null);
    const navigate = useNavigate();

    const loadData = async () => {
        setLoading(true);
        try {
            const enrollmentsRes = await getEnrollments({ student_id: studentId });
            const fetchedEnrollments = enrollmentsRes.data;
            setEnrollments(fetchedEnrollments);

            if (fetchedEnrollments.length === 0) {
                setReports([]);
                setLoading(false);
                return;
            }

            if (!selectedEnrollmentId) {
                setSelectedEnrollmentId(fetchedEnrollments[0].id);
            }

            const reportsResults = await Promise.all(
                fetchedEnrollments.map((e) => getReports({ enrollment_id: e.id }))
            );
            const allReports = reportsResults.flatMap((r) => r.data);
            setReports(allReports);
        } catch {
            // interceptor handles it
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [studentId]);

    const handleGenerated = (newReport) => {
        setReports((prev) => {
            const existing = prev.find((r) => r.id === newReport.id);
            if (existing) {
                setFeedback({
                    type: "info",
                    message: t("report_regenerated", { month: newReport.month }),
                });
                return prev.map((r) => (r.id === newReport.id ? newReport : r));
            }
            setFeedback({
                type: "success",
                message: t("report_generated", { month: newReport.month }),
            });
            return [newReport, ...prev];
        });
    };

    const handleDeleteConfirm = async () => {
        try {
            await deleteReport(deleteTargetId);
            setReports((prev) => prev.filter((r) => r.id !== deleteTargetId));
            setFeedback({ type: "success", message: t("report_deleted") });
        } catch (err) {
            setFeedback({
                type: "error",
                message: err.response?.data?.detail || t("failed_to_delete_report"),
            });
        } finally {
            setDeleteTargetId(null);
        }
    };

    if (loading)
        return <p className="text-sm text-blue">{t("loading_reports")}</p>;

    return (
        <div>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <h3 className="heading-3">
                    {t("report_history")} ({reports.length})
                </h3>

                {enrollments.length > 0 ? (
                    <div className="flex items-end gap-3 flex-wrap">
                        <div className="form-field">
                            <label className="form-label">{t("class")}</label>
                            <select
                                className="form-select"
                                value={selectedEnrollmentId}
                                onChange={(e) => setSelectedEnrollmentId(e.target.value)}
                            >
                                {enrollments.map((e) => (
                                    <option key={e.id} value={e.id}>
                                        {e.class_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <GenerateReportForm
                            enrollmentId={selectedEnrollmentId}
                            onGenerated={handleGenerated}
                        />
                    </div>
                ) : (
                    <p className="text-sm text-blue">{t("no_enrollments")}</p>
                )}
            </div>

            {feedback && (
                <div className={
                    feedback.type === "error"
                        ? "alert-danger mb-4"
                        : feedback.type === "info"
                            ? "alert-warning mb-4"
                            : "alert-success mb-4"
                }>
                    <p className="alert-desc">{feedback.message}</p>
                </div>
            )}

            <table className="table">
                <thead className="table-thead">
                    <tr>
                        <th>{t("class")}</th>
                        <th>{t("month")}</th>
                        <th>{t("risk_level")}</th>
                        <th>{t("risk_score")}</th>
                        <th>{t("generated_at")}</th>
                        <th>
                            <div className="flex justify-end">{t("common:actions")}</div>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {reports.length === 0 ? (
                        <tr>
                            <td colSpan={6}>
                                <div className="empty-state">
                                    <p className="empty-state-title">{t("no_reports_yet")}</p>
                                    <p className="empty-state-desc">{t("no_reports_desc")}</p>
                                </div>
                            </td>
                        </tr>
                    ) : (
                        reports.map((report) => (
                            <tr key={report.id} className="table-row">
                                <td className="table-cell font-medium">{report.class_name}</td>
                                <td className="table-cell">{report.month}</td>
                                <td className="table-cell">
                                    <span className={RISK_BADGE[report.risk_level] || "badge-muted"}>
                                        {report.risk_level}
                                    </span>
                                </td>
                                <td className="table-cell">{report.risk_score}/100</td>
                                <td className="table-cell-muted">
                                    {new Date(report.generated_at).toLocaleDateString()}
                                </td>
                                <td className="table-actions">
                                    <button
                                        className="btn-secondary"
                                        onClick={() => navigate(`/reports/${report.id}`)}
                                    >
                                        {t("view")}
                                    </button>
                                    <button
                                        className="btn-danger-outline"
                                        onClick={() => setDeleteTargetId(report.id)}
                                    >
                                        {t("common:delete")}
                                    </button>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>

            {deleteTargetId && (
                <div className="modal-backdrop">
                    <div className="modal-sm">
                        <div className="modal-header">
                            <h3 className="modal-title">{t("delete_report")}</h3>
                        </div>
                        <div className="modal-body">
                            <p className="text-body">{t("delete_report_confirm")}</p>
                        </div>
                        <div className="modal-footer">
                            <button
                                className="btn-muted"
                                onClick={() => setDeleteTargetId(null)}
                            >
                                {t("common:cancel")}
                            </button>
                            <button className="btn-danger" onClick={handleDeleteConfirm}>
                                {t("common:delete")}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default StudentReportsTab;