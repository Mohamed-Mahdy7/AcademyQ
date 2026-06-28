import { useEffect, useState, useContext } from "react";
import { useTranslation } from "react-i18next";
import { PaymentContext } from "../../context/PaymentContext";
import { EnrollmentContext } from "../../context/EnrollmentContext";
import { NotificationsContext } from "../../context/NotificationsContext";
import CardHeading from "../CardHeader";
import ActivityCardInfo from "./ActivityCardInfo";

const PaymentSvg = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="12" y1="1" x2="12" y2="23"/>
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>
);

const EnrollmentSvg = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
);

const NotificationSvg = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
);

function formatDate(dateStr, i18n) {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    const locale = i18n.language === "ar" ? "ar-EG" : "en-US";
    return d.toLocaleString(locale, {
        month: "numeric",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    });
}

export default function ActivityCard() {
    const { t, i18n } = useTranslation("dashboard");
    const { payments, listPayments } = useContext(PaymentContext);
    const { enrollments, listEnrollments } = useContext(EnrollmentContext);
    const { notifications, getNotifications } = useContext(NotificationsContext);

    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            listPayments(),
            listEnrollments(),
            getNotifications(),
        ]).finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        const items = [];

        // Payments
        payments.forEach((p) => {
            if (p.status !== "completed") return;
            items.push({
                id: `payment-${p.id}`,
                timestamp: p.paid_on || p.created_at,
                svg: PaymentSvg,
                heading: t("activity.payment_recorded", {
                    amount: parseFloat(p.amount || 0).toFixed(0),
                    name: p.student_name || "a student"
                }),
            });
        });

        // Enrollments
        enrollments.forEach((e) => {
            items.push({
                id: `enrollment-${e.id}`,
                timestamp: e.created_at || e.start_date,
                svg: EnrollmentSvg,
                heading: t("activity.student_enrolled", {
                    name: e.student_name || "A student",
                    class: e.class_name || "a class"
                }),
            });
        });

        // Notifications
        notifications.forEach((n) => {
            items.push({
                id: `notification-${n.id}`,
                timestamp: n.created_at,
                svg: NotificationSvg,
                heading: n.notification_type === "payment_reminder"
                    ? t("activity.reminder_sent", { name: n.student_name || "a parent" })
                    : t("activity.alert_sent", { name: n.student_name || "a parent" }),
            });
        });

        // Sort newest first, take top 5
        const sorted = items
            .filter((i) => i.timestamp)
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 5);

        setActivities(sorted);
    }, [payments, enrollments, notifications, t]);

    return (
        <div>
            <CardHeading
                heading={t("activity.title")}
                subheading={t("activity.subtitle")}
            />
            <section className="card-body rounded-t-none h-4/5">
                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex gap-3">
                                <div className="skeleton skeleton-avatar w-9 h-9" />
                                <div className="flex-1 space-y-2">
                                    <div className="skeleton skeleton-text w-3/4" />
                                    <div className="skeleton skeleton-text-sm w-1/3" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : activities.length === 0 ? (
                    <p className="text-caption">{t("activity.empty")}</p>
                ) : (
                    activities.map((a) => (
                        <ActivityCardInfo
                            key={a.id}
                            svg={a.svg}
                            heading={a.heading}
                            subheading={formatDate(a.timestamp, i18n)}
                        />
                    ))
                )}
            </section>
        </div>
    );
}