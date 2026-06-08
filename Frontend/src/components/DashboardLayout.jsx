import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

export default function DashboarLayout() {
    return (
        <div className="page-shell">
            <Sidebar />

            <main className="page-main">
                <div className="page-body">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}