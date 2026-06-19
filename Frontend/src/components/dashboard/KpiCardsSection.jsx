import { useEffect, useState, useContext } from "react";
import { getStudentsRequest } from "../../services/studentService";
import { getClasses } from "../../services/classService";
import { PaymentContext } from "../../context/PaymentContext";
import KpiCard from "../KpiCard";

export default function KpiCardsSection() {
    const [activeStudents, setActiveStudents] = useState(null);
    const [totalEnrollments, setTotalEnrollments] = useState(null);
    const [activeClasses, setActiveClasses] = useState(null);
    const [loadingStudents, setLoadingStudents] = useState(true);
    const [loadingClasses, setLoadingClasses] = useState(true);

    const { summary, fetchSummary, summaryLoading } = useContext(PaymentContext);

    // Fetch students
    useEffect(() => {
        getStudentsRequest()
            .then((res) => {
                const data = res.data.results ?? res.data;
                const active = data.filter((s) => s.is_active);
                setActiveStudents(active.length);
                setTotalEnrollments(data.length);
            })
            .catch((err) => console.error("Failed to load students", err))
            .finally(() => setLoadingStudents(false));
    }, []);

    // Fetch classes
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

    // Fetch payment summary for current month
    useEffect(() => {
        fetchSummary();
    }, []);

    return (
        <div className="stat-grid mb-6">

            {/* Card 1 — Active Students */}
            <KpiCard
                title="ACTIVE STUDENTS"
                svg={
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                        <circle cx="9" cy="7" r="4"/>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                }
                value={loadingStudents ? "..." : (activeStudents ?? "—")}
                caption={loadingStudents ? "" : `${totalEnrollments ?? 0} total students`}
            />

            {/* Card 2 — Active Classes */}
            <KpiCard
                title="ACTIVE CLASSES"
                svg={
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                    </svg>
                }
                value={loadingClasses ? "..." : (activeClasses ?? "—")}
                caption="Across all subjects"
            />

            {/* Card 3 — Monthly Revenue */}
            <KpiCard
                title="MONTHLY REVENUE"
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
                        ? `${summary.collection_rate_pct}% collection rate`
                        : "Loading..."
                }
            />

            {/* Card 4 — Attendance Rate (static until endpoint exists) */}
            <KpiCard
                title="ATTENDANCE RATE"
                svg={
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                    </svg>
                }
                value="—"
                caption="Coming soon"
            />

        </div>
    );
}