import { useContext } from "react";
import { useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

function Topbar() {
    const { user } = useContext(AuthContext);
    const location = useLocation();

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

    const title =
        pageTitles[location.pathname] ||
        "AcademiQ";

    return (
        <header className="topbar">
            <div>
                <h1 className="topbar-title">
                    {title}
                </h1>
            </div>

            <div className="topbar-actions">

                <div className="flex items-center gap-3">
                    <div className="text-right">
                        <p className="text-sm font-medium text-navy">
                            {user?.full_name}
                        </p>

                        <p className="text-xs text-blue">
                            {user?.role_display || user?.role}
                        </p>
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