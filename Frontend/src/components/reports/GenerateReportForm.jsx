import { useState } from "react";
import { generateReport } from "../../services/reportService";

function GenerateReportForm({ enrollmentId, onGenerated }) {
    const today = new Date();
    const defaultMonth = `${today.getFullYear()}-${String(
        today.getMonth() + 1
    ).padStart(2, "0")}`;
    const [month, setMonth] = useState(defaultMonth);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const res = await generateReport(enrollmentId, month);
            onGenerated?.(res.data);
        } catch (err) {
            setError(
                err.response?.data?.detail ||
                "Failed to generate report. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex items-end gap-3">
            <div className="form-field">
                <label className="form-label">Month</label>
                <input
                    type="month"
                    className="form-input"
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    required
                />
            </div>
            {error && <p className="form-error mb-2">{error}</p>}
            <button
                type="submit"
                className="btn-primary px-6 whitespace-nowrap"
                disabled={loading}
            >
                {loading ? (
                    <span className="flex items-center gap-2">
                        <span className="btn-spinner" />
                        Generating...
                    </span>
                ) : (
                    "Generate Report"
                )}
            </button>
        </form>
    );
}

export default GenerateReportForm;