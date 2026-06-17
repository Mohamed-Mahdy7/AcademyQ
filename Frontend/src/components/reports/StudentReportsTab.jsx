import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getEnrollments } from "../../services/enrollmentService";
import { getReports } from "../../services/reportService";
import GenerateReportForm from "./GenerateReportForm";

const RISK_BADGE = {
    high: "badge-danger",
    medium: "badge-warning",
    low: "badge-success",
};

function StudentReportsTab({ studentId }) {
    const [reports, setReports] = useState([]);
    const [enrollments, setEnrollments] = useState([]);
    const [selectedEnrollmentId, setSelectedEnrollmentId] = useState("");
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const loadData = async () => {
        setLoading(true);
        try {
            const [reportsRes, enrollmentsRes] = await Promise.all([
                getReports({ student_id: studentId }),
                getEnrollments({ student_id: studentId }),
            ]);
            setReports(reportsRes.data);
            setEnrollments(enrollmentsRes.data);
            if (enrollmentsRes.data.length > 0 && !selectedEnrollmentId) {
                setSelectedEnrollmentId(enrollmentsRes.data[0].id);
            }
        } catch (err) {
            console.error("Error loading reports:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [studentId]);

    const handleGenerated = (newReport) => {
        setReports((prev) => {
            const exists = prev.find((r) => r.id === newReport.id);
            if (exists) {
                return prev.map((r) => (r.id === newReport.id ? newReport : r));
            }
            return [newReport, ...prev];
        });
    };

    if (loading) return <p className="text-sm text-blue">Loading reports...</p>;

    return (
        <div>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <h3 className="heading-3">Report History ({reports.length})</h3>

                {enrollments.length > 0 ? (
                    <div className="flex items-center gap-3">
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
                        <GenerateReportForm
                            enrollmentId={selectedEnrollmentId}
                            onGenerated={handleGenerated}
                        />
                    </div>
                ) : (
                    <p className="text-sm text-blue">
                        No enrollments found for this student.
                    </p>
                )}
            </div>

            <table className="table">
                <thead className="table-thead">
                    <tr>
                        <th>Class</th>
                        <th>Month</th>
                        <th>Risk Level</th>
                        <th>Risk Score</th>
                        <th>Generated At</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {reports.length === 0 ? (
                        <tr>
                            <td colSpan={6}>
                                <div className="empty-state">
                                    <p className="empty-state-title">No reports yet</p>
                                    <p className="empty-state-desc">
                                        Generate a report to get started.
                                    </p>
                                </div>
                            </td>
                        </tr>
                    ) : (
                        reports.map((report) => (
                            <tr key={report.id} className="table-row">
                                <td className="table-cell font-medium">
                                    {report.class_name}
                                </td>
                                <td className="table-cell">{report.month}</td>
                                <td className="table-cell">
                                    <span className={RISK_BADGE[report.risk_level] || "badge-muted"}>
                                        {report.risk_level}
                                    </span>
                                </td>
                                <td className="table-cell">
                                    {report.risk_score}/100
                                </td>
                                <td className="table-cell-muted">
                                    {new Date(report.generated_at).toLocaleDateString()}
                                </td>
                                <td className="table-actions">
                                    <button
                                        className="btn-secondary"
                                        onClick={() => navigate(`/reports/${report.id}`)}
                                    >
                                        View
                                    </button>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}

export default StudentReportsTab;