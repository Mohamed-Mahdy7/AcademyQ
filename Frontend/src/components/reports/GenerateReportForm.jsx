import { useState } from "react";
import { useTranslation } from "react-i18next";
import { generateReport } from "../../services/reportService";

function GenerateReportForm({ enrollmentId, onGenerated }) {
    const { t } = useTranslation(["reports", "common"]);
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
                err.response?.data?.detail || t("failed_to_generate_report")
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex items-end gap-3">
            <div className="form-field">
                <label className="form-label">{t("month")}</label>
                <input
                    type="month"
                    className="form-input"
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    required
                />
            </div>
            {error && <p className="form-error mb-2">{error}</p>}
            <div className="form-field">
                <label className="form-label opacity-0 select-none">‎</label>
                <button
                    type="submit"
                    className="btn-primary px-6 whitespace-nowrap"
                    disabled={loading}
                >
                    {loading ? (
                        <span className="flex items-center gap-2">
                            <span className="btn-spinner" />
                            {t("generating")}
                        </span>
                    ) : (
                        t("generate_report")
                    )}
                </button>
            </div>
        </form>
    );
}

export default GenerateReportForm;