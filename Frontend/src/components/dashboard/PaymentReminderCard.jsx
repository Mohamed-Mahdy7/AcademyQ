import { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { NotificationsContext } from "../../context/NotificationsContext";

export default function PaymentReminderCard() {
    const { t } = useTranslation("dashboard");
    const { stats, getStats } = useContext(NotificationsContext);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        getStats().finally(() => setLoading(false));
    }, []);

    return (
        <div className="kpi-card">
            <div className="flex items-center justify-between mb-2">
                <p className="kpi-label">{t("payment_reminders.label")}</p>
                <svg className="w-5 h-5 text-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-6l-4 4v-4z" />
                </svg>
            </div>

            {loading ? (
                <p className="kpi-value">—</p>
            ) : (
                <>
                    <p className="kpi-value">{stats?.sent_this_week ?? 0}</p>
                    <p className="text-caption mb-3">{t("payment_reminders.sent_this_week")}</p>

                    <div className="space-y-1 mb-4 text-sm">
                        <div className="flex justify-between text-caption">
                            <span>{t("payment_reminders.day_0")}</span>
                            <span className="font-medium text-navy">{stats?.sent_today ?? 0}</span>
                        </div>
                        <div className="flex justify-between text-caption">
                            <span>{t("payment_reminders.day_3")}</span>
                            <span className="font-medium text-navy">{stats?.sent_this_week ?? 0}</span>
                        </div>
                        <div className="flex justify-between text-caption">
                            <span>{t("payment_reminders.day_7")}</span>
                            <span className="font-medium text-navy">{stats?.failed_this_week ?? 0}</span>
                        </div>
                    </div>

                    <button
                        className="text-sm text-blue font-medium hover:underline"
                        onClick={() => navigate("/notifications")}
                    >
                        {t("payment_reminders.view_history")}
                    </button>
                </>
            )}
        </div>
    );
}