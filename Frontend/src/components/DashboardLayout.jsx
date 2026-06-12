import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function MainLayout() {
    return (
        <div className="page-shell">
            <Sidebar />

            <main className="page-main">
                <Topbar title="Dashboard" />

                <div className="page-body">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}