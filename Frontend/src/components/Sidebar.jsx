import { NavLink, useNavigate } from "react-router-dom";
import { useContext } from "react";
import { useTranslation } from "react-i18next";
import { AuthContext } from "../context/AuthContext";
import { AcademyContext} from "../context/AcademyContext";

const Sidebar = ({ isOpen, onClose }) => {
    const { t } = useTranslation("layout");
    const { user, logout } = useContext(AuthContext);
    const { academy } = useContext(AcademyContext);
    const navigate = useNavigate();

    async function handleLogout() {
        await logout();
        navigate("/login");
    }

    const links = [
        { to: "/dashboard", end: true, label: t("page_dashboard") },
        { to: "/students", label: t("page_students") },
        { to: "/classes", label: t("page_classes") },
        { to: "/teacher", label: t("page_teachers") },
        { to: "/subjects", label: t("page_subjects") },
        { to: "/payments", label: t("page_payments") },
        { to: "/users", label: t("page_staff") },
        { to: "/settings", label: t("page_settings") },
    ];

    return (
        <>
            {isOpen && <div className="sidebar-backdrop" onClick={onClose} />}

            <aside className={isOpen ? "sidebar sidebar-open" : "sidebar"}>
                <div className="sidebar-header">
                    <div className="sidebar-logo">{academy?.name?.[0]?.toUpperCase()}</div>
                    <div>
                        <p className="sidebar-academy-name">{academy?.name}</p>
                        <p className="sidebar-academy-sub">{t("acadmey_management")}</p>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    <p className="sidebar-section-label">{t("nav_management")}</p>

                    {links.map((link) => (
                        <NavLink
                            key={link.to}
                            to={link.to}
                            end={link.end}
                            onClick={onClose}
                            className={({ isActive }) => isActive ? "sidebar-link-active" : "sidebar-link"}
                        >
                            {link.label}
                        </NavLink>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <div className="sidebar-user">
                        <div className="avatar-sm">{user?.full_name?.[0]?.toUpperCase() || "U"}</div>
                        <div className="min-w-0">
                            <p className="sidebar-user-name">{user?.full_name}</p>
                            <p className="sidebar-user-role">{user?.role_display || user?.role}</p>
                        </div>
                    </div>
                    <button onClick={handleLogout} className="btn-danger w-full mt-3">
                        {t("common:logout")}
                    </button>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;