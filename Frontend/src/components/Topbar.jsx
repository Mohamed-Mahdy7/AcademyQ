import { useContext, useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { useAlerts } from "../context/AlertContext";
import { useTranslation } from "react-i18next";
import RiskBadge from "./ai/RiskBadge";
import LanguageSwitcher from "./languageSwitcher";

const reasonLabels = {
    low_attendance: "Low Attendance",
    low_grades: "Low Grades",
    overdue_fee: "Overdue Fee",
    combined: "Combined Risk",
};

function Topbar({onMenuClick}) {
    const { user } = useContext(AuthContext);
    const { t } = useTranslation("layout")
    const location = useLocation();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const dropdownRef = useRef(null);

    const [dropdownDismissed, setDropdownDismissed] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('dropdown_dismissed_alerts') || '[]');
        } catch {
            return [];
        }
    });

    const { alerts, loading, fetchAlerts } = useAlerts();

    const pageTitles = {
        "/dashboard": t("page_dashboard"),
        "/students": t("page_students"),
        "/teacher": t("page_teachers"),
        "/classes": t("page_classes"),
        "/subjects": t("page_subjects"),
        "/payments": t("page_payments"),
        "/users": t("page_staff"),
        "/settings": t("page_settings"),
        "/alerts": t("page_alert"),
        "/notifications": t("page_notification"),
    };

    const title = pageTitles[location.pathname] || "AcademiQ";

    const today = new Date().toLocaleDateString("en-EG", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    useEffect(() => {
        fetchAlerts({ risk_level: "all", is_dismissed: "false" });
    }, []);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const undismissedAlerts = alerts.filter((a) => !a.is_dismissed);

    const dropdownAlerts = undismissedAlerts.filter(
        (a) => !dropdownDismissed.includes(a.id)
    );

    function handleDropdownDismiss(id) {
        setDropdownDismissed((prev) => {
            const updated = [...prev, id];
            localStorage.setItem('dropdown_dismissed_alerts', JSON.stringify(updated));
            return updated;
        });
    }
    return (
        <header className="topbar">
            <div className="flex items-center gap-3">
                <button className="topbar-menu-btn" onClick={onMenuClick} aria-label="Open menu">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
                <h1 className="topbar-title">{title}</h1>
            </div>
            <LanguageSwitcher />
            <div className="topbar-actions">

                {/* Bell + Dropdown */}
                <div className="relative" ref={dropdownRef}>
                    <button
                        className="relative w-9 h-9 flex items-center justify-center rounded-full bg-white shadow-xs drop-shadow-xs drop-shadow-gray-700 hover:bg-gray-100 transition-colors"
                        onClick={() => setOpen((prev) => !prev)}
                    >
                        <svg
                            className="w-5 h-5 text-navy"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                        </svg>

                        {dropdownAlerts.length > 0 && (
                            <span className="absolute -top-1 -end-1 w-4 h-4 bg-danger rounded-full text-white text-[10px] font-bold flex items-center justify-center">
                                {dropdownAlerts.length > 9 ? "9+" : dropdownAlerts.length}
                            </span>
                        )}
                    </button>

                    {open && (
                        <div className="absolute end-0 top-12 z-50 w-80 bg-white border border-border shadow-dropdown rounded-xl overflow-hidden">

                            {/* Header */}
                            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
                                <div>
                                    <h2 className="heading-3">Retention Alerts</h2>
                                    <p className="text-caption">{today}</p>
                                </div>
                                {dropdownAlerts.length > 0
                                    ? <span className="badge-danger-dark">{dropdownAlerts.length} open</span>
                                    : <span className="badge-success">All Clear</span>
                                }
                            </div>

                            {/* Alert list */}
                            <div className="max-h-96 overflow-y-auto divide-y divide-border">
                                {loading ? (
                                    <div className="p-4 space-y-3">
                                        {[1, 2, 3].map((i) => (
                                            <div key={i} className="flex items-center gap-3">
                                                <div className="skeleton skeleton-avatar w-8 h-8 rounded-full" />
                                                <div className="flex-1 space-y-1.5">
                                                    <div className="skeleton skeleton-text w-32" />
                                                    <div className="skeleton skeleton-text-sm w-20" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : dropdownAlerts.length === 0 ? (
                                    <div className="p-6 text-center">
                                        <p className="text-sm text-blue">No pending alerts 🎉</p>
                                    </div>
                                ) : (
                                    dropdownAlerts.map((alert) => (
                                        <div
                                            key={alert.id}
                                            className="flex items-start gap-3 px-4 py-3 hover:bg-sky-pale transition-colors"
                                        >
                                            <div className="avatar avatar-sm flex-shrink-0">
                                                {(alert.student_name || "")
                                                    .split(" ")
                                                    .slice(0, 2)
                                                    .map((w) => w[0])
                                                    .join("")
                                                    .toUpperCase()}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2">
                                                    <p className="text-sm font-semibold text-navy truncate">
                                                        {alert.student_name}
                                                    </p>
                                                    <RiskBadge riskLevel={alert.risk_level} />
                                                </div>
                                                <p className="text-caption truncate">
                                                    {reasonLabels[alert.primary_reason] || alert.primary_reason}
                                                </p>
                                                <p className="text-caption truncate">{alert.class_name}</p>
                                            </div>

                                            <button
                                                className="text-blue hover:text-danger transition-colors flex-shrink-0 mt-0.5"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDropdownDismiss(alert.id);
                                                }}
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>

                            <button
                                className="w-full flex items-center justify-between px-4 py-3 border-t border-border text-sm font-medium text-navy-mid hover:bg-sky-pale transition-colors"
                                onClick={() => {
                                    setOpen(false);
                                    navigate("/alerts");
                                }}
                            >
                                <span>View all alerts</span>
                                <svg className="w-4 h-4 rtl:-scale-x-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>
                    )}
                </div>

                {/* User info */}
                <div className="flex items-center gap-3">
                    <div className="text-end">
                        <p className="text-sm font-medium text-navy">{user?.full_name}</p>
                        <p className="text-xs text-blue">{user?.role_display || user?.role}</p>
                    </div>
                    <div className="topbar-avatar">
                        {user?.full_name?.[0]?.toUpperCase() || "U"}
                    </div>
                </div>
            </div>
        </header>
    );
}

export default Topbar;