import { Outlet } from "react-router-dom";
import { useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function MainLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="page-shell">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <main className="page-main">
                <Topbar onMenuClick={() => setSidebarOpen(true)} />

                <div className="page-body">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}