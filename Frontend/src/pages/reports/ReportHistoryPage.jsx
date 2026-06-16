import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getReports } from "../../services/reportService";
import GenerateReportForm from "../../components/reports/GenerateReportForm";

const RISK_BADGE = {
    high: "badge-danger",
    medium: "badge-warning",
    low: "badge-success",
};

function ReportHistoryPage() {
    const [searchParams] = useSearchParams();
    const studentId = searchParams.get("student_id");
    const enrollmentId = searchParams.get("enrollment_id");

    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const loadReports = async () => {
        setLoading(true);
        try {
            const params = {};
            if (studentId) params.student_id = studentId;
            if (enrollmentId) params.enrollment_id = enrollmentId;
            const res = await getReports(params);
            setReports(res.data);
        } catch (err) {
            console.error("Error loading reports:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadReports();
    }, [studentId, enrollmentId]);

    const handleGenerated = (newReport) => {
        setReports((prev) => {
            const exists = prev.find((r) => r.id === newReport.id);
            if (exists) {
                return prev.map((r) => (r.id === newReport.id ? newReport : r));
            }
            return [newReport, ...prev];
        });
    };

    return (
        <div className="page-body">

            {/* Page Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="heading-1">Report History</h1>
                    <p className="subheading">
                        AI-generated monthly performance reports
                    </p>
                </div>
                {enrollmentId && (
                    <GenerateReportForm
                        enrollmentId={enrollmentId}
                        onGenerated={handleGenerated}
                    />
                )}
            </div>

            {/* Reports Table */}
            <div className="table-wrap">
                <div className="card-header">
                    <h2 className="card-header-title">
                        All Reports ({reports.length})
                    </h2>
                </div>

                <table className="table">
                    <thead className="table-thead">
                        <tr>
                            <th>Student</th>
                            <th>Class</th>
                            <th>Month</th>
                            <th>Risk Level</th>
                            <th>Risk Score</th>
                            <th>Generated At</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={7}>
                                    <p className="p-6 text-sm text-blue text-center">
                                        Loading...
                                    </p>
                                </td>
                            </tr>
                        ) : reports.length === 0 ? (
                            <tr>
                                <td colSpan={7}>
                                    <div className="empty-state">
                                        <p className="empty-state-title">
                                            No reports yet
                                        </p>
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
                                        {report.student_name}
                                    </td>
                                    <td className="table-cell-muted">
                                        {report.class_name}
                                    </td>
                                    <td className="table-cell">
                                        {report.month}
                                    </td>
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
                                            onClick={() =>
                                                navigate(`/reports/${report.id}`)
                                            }
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

        </div>
    );
}

export default ReportHistoryPage;