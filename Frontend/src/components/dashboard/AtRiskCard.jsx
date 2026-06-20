import { useContext, useEffect, useMemo } from "react";
import { AlertContext } from "../../context/AlertContext";
import { PaymentContext } from "../../context/PaymentContext";
import CardHeading from "../CardHeader";
import DangerCard from "../DangerCard";

export default function AtRiskCard() {
    const { alerts, fetchAlerts, loading } = useContext(AlertContext);
    const { payments, listPayments } = useContext(PaymentContext);

    useEffect(() => {
        fetchAlerts({ risk_level: "all", is_dismissed: "false" });
        listPayments({ status: "pending" });
    }, []);

    // Map of student_name -> overdue amount, built from pending overdue payments
    const overdueByStudent = useMemo(() => {
        const map = {};
        const today = new Date();
        payments.forEach((p) => {
            if (p.status !== "pending" || !p.due_date) return;
            if (new Date(p.due_date) >= today) return;
            const name = p.student_name;
            if (!name) return;
            map[name] = (map[name] || 0) + parseFloat(p.amount || 0);
        });
        return map;
    }, [payments]);

    // Top 2 highest-risk open alerts
    const topAlerts = [...alerts]
        .sort((a, b) => b.risk_score - a.risk_score)
        .slice(0, 2);

    // function handleContact(alert) {
    //     const email = alert.parent_email;
    //     if (email) {
    //         window.location.href = `mailto:${email}?subject=${encodeURIComponent(
    //             `Regarding ${alert.student_name}`
    //         )}`;
    //     } else {
    //         alert("No parent email on file for this student.");
    //     }
    // }

    return (
        <div>
            <CardHeading
                heading="At-Risk Students"
                subheading="Students requiring immediate attention"
            />
            <section className="card-body rounded-t-none h-4/5">
                {loading ? (
                    <div className="space-y-3">
                        {[1, 2].map((i) => (
                            <div key={i} className="skeleton h-24 rounded-xl" />
                        ))}
                    </div>
                ) : topAlerts.length === 0 ? (
                    <p className="text-caption">No at-risk students right now 🎉</p>
                ) : (
                    topAlerts.map((alert) => {
                        const overdue = overdueByStudent[alert.student_name];
                        return (
                            <DangerCard
                                key={alert.id}
                                name={alert.student_name || "Unknown student"}
                                warning={alert.primary_reason}
                                danger={overdue ? `Overdue: ${overdue.toFixed(2)} EGP` : null}
                                //button="Contact"
                                info={alert.class_name}
                                //onContact={() => handleContact(alert)}
                            />
                        );
                    })
                )}
            </section>
        </div>
    );
}