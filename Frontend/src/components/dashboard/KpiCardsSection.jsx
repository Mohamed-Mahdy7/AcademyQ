import { useEffect, useState, useContext } from "react";
import { getStudentsRequest } from "../../services/studentService";
import { getClasses } from "../../services/classService";
import { PaymentContext } from "../../context/PaymentContext";
import api from "../../api";
import KpiCard from "../KpiCard";
import { useTranslation } from "react-i18next";

export default function KpiCardsSection() {
    const { t } = useTranslation("dashboard");
    const [activeStudents, setActiveStudents] = useState(null);
    const [totalEnrollments, setTotalEnrollments] = useState(null);
    const [activeClasses, setActiveClasses] = useState(null);
    const [loadingStudents, setLoadingStudents] = useState(true);
    const [loadingClasses, setLoadingClasses] = useState(true);
    const [attendanceRate, setAttendanceRate] = useState(null);
    const [loadingAttendance, setLoadingAttendance] = useState(true);

    const { summary, fetchSummary, summaryLoading } = useContext(PaymentContext);

    useEffect(() => {
        getStudentsRequest()
            .then((res) => {
                const data = res.data.results ?? res.data;
                const active = data.filter((s) => s.status === "A");
                setActiveStudents(active.length);
                setTotalEnrollments(data.length);
            })
            .catch((err) => console.error("Failed to load students", err))
            .finally(() => setLoadingStudents(false));
    }, []);

    useEffect(() => {
        getClasses()
            .then((res) => {
                const data = res.data.results ?? res.data;
                const active = data.filter((c) => c.is_active);
                setActiveClasses(active.length);
            })
            .catch((err) => console.error("Failed to load classes", err))
            .finally(() => setLoadingClasses(false));
    }, []);

    useEffect(() => {
        fetchSummary();
    }, []);

    useEffect(() => {
        api.get("/api/dashboard/attendance-summary/")
            .then((res) => setAttendanceRate(res.data.attendance_pct_28d))
            .catch((err) => console.error("Failed to load attendance", err))
            .finally(() => setLoadingAttendance(false));
    }, []);

    return (
        <div className="stat-grid mb-6">

            <KpiCard
                title={t("kpi.active_students")}
                svg={
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                        <circle cx="9" cy="7" r="4"/>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                }
                value={loadingStudents ? "..." : (activeStudents ?? "—")}
                caption={loadingStudents ? "" : t("kpi.total_students", { count: totalEnrollments ?? 0 })}
            />

            <KpiCard
                title={t("kpi.active_classes")}
                svg={
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                    </svg>
                }
                value={loadingClasses ? "..." : (activeClasses ?? "—")}
                caption={t("kpi.across_subjects")}
            />

            <KpiCard
                title={t("kpi.monthly_revenue")}
                svg={
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="1" x2="12" y2="23"/>
                        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                    </svg>
                }
                value={
                    summaryLoading
                        ? "..."
                        : summary
                        ? `${parseFloat(summary.revenue_collected).toLocaleString()} EGP`
                        : "—"
                }
                caption={
                    summary
                        ? t("kpi.collection_rate", { rate: summary.collection_rate_pct })
                        : t("common:loading")
                }
            />

            {/* Card 4 — Attendance Rate (now live) */}
            <KpiCard
                title={t("kpi.attendance_rate")}
                svg={
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                    </svg>
                }
                value={
                    loadingAttendance
                        ? "..."
                        : attendanceRate !== null
                        ? `${attendanceRate}%`
                        : "—"
                }
                caption={
                    loadingAttendance
                        ? ""
                        : attendanceRate !== null
                        ? t("kpi.last_28_days")
                        : t("kpi.no_data")
                }
            />

        </div>
    );
}