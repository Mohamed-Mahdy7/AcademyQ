import { useContext } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

function ProtectedRoute({ children }) {
    const { user, loading } = useContext(AuthContext);
    const location = useLocation();

    if (loading) return null;
    if (!user) return <Navigate to="/login" replace />

    if (user.role === "S") {
        const allowPath = `/student/${user.id}`;
        if (!location.pathname.startsWith(allowPath)) {
            return <Navigate to={allowPath} replace />
        }
    }

    return <Outlet />
}

export default ProtectedRoute;