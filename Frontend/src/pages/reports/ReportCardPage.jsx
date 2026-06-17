import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getReport } from "../../services/reportService";
import ReportCard from "../../components/reports/ReportCard";

function ReportCardPage() {
    const { reportId } = useParams();
    const navigate = useNavigate();
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReport = async () => {
            try {
                const res = await getReport(reportId);
                setReport(res.data);
            } catch (err) {
                console.error("Error loading report:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchReport();
    }, [reportId]);

    if (loading) return <p className="p-6 text-sm text-blue">Loading...</p>;
    if (!report) return <p className="p-6 text-sm text-danger">Report not found.</p>;

    return (
        <div className="page-body max-w-3xl">

            {/* Page Header */}
            <div className="flex items-center gap-3 mb-6">
                <button
                    className="btn-icon"
                    onClick={() => navigate(-1)}
                >
                    ←
                </button>
                <div>
                    <h1 className="heading-1">Report Card</h1>
                    <p className="subheading">
                        {report.student_name} — {report.month}
                    </p>
                </div>
            </div>

            <ReportCard report={report} />

        </div>
    );
}

export default ReportCardPage;