import { useContext, useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const MOCK_ALERTS = [
    {
        id: "1",
        studentName: "Ahmed Mohamed",
        reason: "low_attendance",
        riskLevel: "high",
        classInfo: "Math G7 Mon/Wed",
        createdAt: "Today, 9:00 AM",
    },
    {
        id: "2",
        studentName: "Sara Khalid",
        reason: "overdue_fee",
        riskLevel: "high",
        classInfo: "English B2 Wed/Fri",
        createdAt: "Today, 9:00 AM",
    },
    {
        id: "3",
        studentName: "Omar Tarek",
        reason: "combined",
        riskLevel: "medium",
        classInfo: "Physics G9 Sun/Tue",
        createdAt: "Yesterday, 9:00 AM",
    },
];

const reasonLabels = {
    low_attendance: "Low Attendance",
    low_grades: "Low Grades",
    overdue_fee: "Overdue Fee",
    combined: "Combined Risk",
};

function Topbar() {
    const { user } = useContext(AuthContext);
    const location = useLocation();
    const [open, setOpen] = useState(false);
    const [alerts, setAlerts] = useState(MOCK_ALERTS);
    const dropdownRef = useRef(null);

    const pageTitles = {
        "/": "Dashboard",
        "/students": "Students",
        "/teacher": "Teachers",
        "/classes": "Classes",
        "/subjects": "Subjects",
        "/payments": "Payments",
        "/users": "Staff Users",
        "/settings": "Settings",
        "/grade": "Grades",
    };

    const title = pageTitles[location.pathname] || "AcademiQ";

    const today = new Date().toLocaleDateString("en-EG", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSend = (id) => {
        setAlerts((prev) => prev.filter((a) => a.id !== id));
    };

    const handleDismiss = (id) => {
        setAlerts((prev) => prev.filter((a) => a.id !== id));
    };

    return (
        <header className="topbar">
            <div>
                <h1 className="topbar-title">{title}</h1>
            </div>

            <div className="topbar-actions">

                {/* Bell + Dropdown */}
                <div className="relative" ref={dropdownRef}>
                    <button
                        className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
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

                        {alerts.length > 0 && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-danger rounded-full text-white text-[10px] font-bold flex items-center justify-center">
                                {alerts.length > 9 ? "9+" : alerts.length}
                            </span>
                        )}
                    </button>

                    {open && (
                        <div className="absolute right-0 top-12 z-50 w-80 bg-white border border-gray-200 shadow-xl rounded-xl overflow-hidden">

                            {/* Header */}
                            <div className="card-body rounded-b-none bg-card flex items-center justify-between py-3">
                                <div>
                                    <h2 className="heading-2">Alerts</h2>
                                    <p className="subheading">{today}</p>
                                </div>
                                {alerts.length > 0
                                    ? <span className="badge-danger-dark">{alerts.length} Pending</span>
                                    : <span className="badge-warning">All Clear</span>
                                }
                            </div>

                            {/* Alert list */}
                            <div className="max-h-96 overflow-y-auto">
                                {alerts.length === 0 ? (
                                    <div className="p-6 text-center">
                                        <p className="text-body text-gray-400 text-sm">
                                            No pending alerts 🎉
                                        </p>
                                    </div>
                                ) : (
                                    alerts.map((alert) => (
                                        <div
                                            key={alert.id}
                                            className="card-danger my-0 rounded-none border-0 border-b border-gray-100 last:border-0"
                                        >
                                            <div className="flex items-start w-full">
                                                <section className="stat-icon-wrap-danger shrink-0">
                                                    <svg
                                                        className="w-6 h-6 text-danger fill-current"
                                                        viewBox="0 0 56 56"
                                                        xmlns="http://www.w3.org/2000/svg"
                                                    >
                                                        <path d="M 27.9999 51.9063 C 41.0546 51.9063 51.9063 41.0781 51.9063 28 C 51.9063 14.9453 41.0312 4.0937 27.9765 4.0937 C 14.8983 4.0937 4.0937 14.9453 4.0937 28 C 4.0937 41.0781 14.9218 51.9063 27.9999 51.9063 Z M 27.9999 47.9219 C 16.9374 47.9219 8.1014 39.0625 8.1014 28 C 8.1014 16.9609 16.9140 8.0781 27.9765 8.0781 C 39.0155 8.0781 47.8983 16.9609 47.9219 28 C 47.9454 39.0625 39.0390 47.9219 27.9999 47.9219 Z M 27.9765 32.2422 C 29.1014 32.2422 29.7343 31.6094 29.7577 30.3906 L 30.1093 18.0156 C 30.1327 16.8203 29.1952 15.9297 27.9530 15.9297 C 26.6874 15.9297 25.7968 16.7968 25.8202 17.9922 L 26.1249 30.3906 C 26.1483 31.5859 26.8046 32.2422 27.9765 32.2422 Z M 27.9765 39.8594 C 29.3124 39.8594 30.5077 38.7812 30.5077 37.4219 C 30.5077 36.0390 29.3358 34.9844 27.9765 34.9844 C 26.5936 34.9844 25.4452 36.0625 25.4452 37.4219 C 25.4452 38.7578 26.6171 39.8594 27.9765 39.8594 Z" />
                                                    </svg>
                                                </section>

                                                <section className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-start gap-2">
                                                        <p className="heading-3 mt-1 truncate">{alert.studentName}</p>
                                                        {alert.riskLevel === "high"
                                                            ? <span className="badge-danger-dark shrink-0">High</span>
                                                            : <span className="badge-warning shrink-0">Medium</span>
                                                        }
                                                    </div>
                                                    <span className="badge-warning">{reasonLabels[alert.reason]}</span>
                                                    <p className="subheading">{alert.classInfo}</p>
                                                    <p className="text-xs text-gray-400 mt-1">{alert.createdAt}</p>

                                                    {/* Actions */}
                                                    <div className="flex gap-2 mt-3">
                                                        <button
                                                            className="btn-primary text-xs py-1 px-3"
                                                            onClick={() => handleSend(alert.id)}
                                                        >
                                                            Send
                                                        </button>
                                                        <button
                                                            className="btn-secondary text-xs py-1 px-3"
                                                            onClick={() => handleDismiss(alert.id)}
                                                        >
                                                            Dismiss
                                                        </button>
                                                    </div>
                                                </section>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                        </div>
                    )}
                </div>

                {/* User info */}
                <div className="flex items-center gap-3">
                    <div className="text-right">
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