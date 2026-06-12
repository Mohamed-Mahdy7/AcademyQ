import { Link, useNavigate, NavLink } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

const Sidebar = () => {
    const {user, logout} = useContext(AuthContext);
    const navigate = useNavigate();

    async function handleLogout() {
        await logout();
        navigate("/login")
    }

    return(
        <>
            <aside className="sidebar">
            <div className="sidebar-header">
                <div className="sidebar-logo">
                    A
                </div>

                <div>
                    <p className="sidebar-academy-name">
                        AcademiQ
                    </p>
                    <p className="sidebar-academy-sub">
                        Academy Management
                    </p>
                </div>
            </div>

            <nav className="sidebar-nav">
                <p className="sidebar-section-label">
                    Management
                </p>

                <NavLink
                    to="/"
                    end
                    className={({ isActive }) =>
                        isActive
                            ? "sidebar-link-active"
                            : "sidebar-link"
                    }
                >
                    Dashboard
                </NavLink>

                <NavLink
                    to="/students"
                    className={({ isActive }) =>
                        isActive
                            ? "sidebar-link-active"
                            : "sidebar-link"
                    }
                >
                    Students
                </NavLink>

                <NavLink
                    to="/classes"
                    className={({ isActive }) =>
                        isActive
                            ? "sidebar-link-active"
                            : "sidebar-link"
                    }
                >
                    Classes
                </NavLink>

                <NavLink
                    to="/teacher"
                    className={({ isActive }) =>
                        isActive
                            ? "sidebar-link-active"
                            : "sidebar-link"
                    }
                >
                    Teachers
                </NavLink>

                <NavLink
                    to="/subjects"
                    className={({ isActive }) =>
                        isActive
                            ? "sidebar-link-active"
                            : "sidebar-link"
                    }
                >
                    Subjects
                </NavLink>

                <NavLink
                    to="/payments"
                    className={({ isActive }) =>
                        isActive
                            ? "sidebar-link-active"
                            : "sidebar-link"
                    }
                >
                    Payments
                </NavLink>

                <NavLink
                    to="/users"
                    className={({ isActive }) =>
                        isActive
                            ? "sidebar-link-active"
                            : "sidebar-link"
                    }
                >
                    Staff Users
                </NavLink>

                <NavLink
                    to="/settings"
                    className={({ isActive }) =>
                        isActive
                            ? "sidebar-link-active"
                            : "sidebar-link"
                    }
                >
                    Settings
                </NavLink>
            </nav>

            {/* Footer */}
            <div className="sidebar-footer">
                <div className="sidebar-user">
                    <div className="avatar-sm">
                        {user?.full_name?.[0]?.toUpperCase() || "U"}
                    </div>

                    <div className="min-w-0">
                        <p className="sidebar-user-name">
                            {user?.full_name}
                        </p>

                        <p className="sidebar-user-role">
                            {user?.role}
                        </p>
                    </div>
                </div>

                <button
                    onClick={handleLogout}
                    className="btn-danger w-full mt-3"
                >
                    Logout
                </button>
            </div>
        </aside>
        </>
    );
}

export default Sidebar