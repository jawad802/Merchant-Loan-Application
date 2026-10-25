import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Menu } from 'lucide-react';
import AppSidebar from './AppSidebar';

export default function DashboardLayout() {
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
        return <Navigate to="/login" replace />;
    }

    return (
        <div className="min-h-screen flex bg-background text-foreground">
            {/* Dark backdrop behind the sidebar on mobile */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 z-30 bg-black/50 md:hidden"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            <AppSidebar
                collapsed={collapsed}
                setCollapsed={setCollapsed}
                mobileOpen={mobileOpen}
                setMobileOpen={setMobileOpen}
            />

            <div className="flex-1 flex flex-col min-w-0">
                {/* Mobile top bar with menu button */}
                <header className="md:hidden sticky top-0 z-20 h-14 flex items-center gap-3 px-4 border-b border-sidebar-border bg-sidebar text-sidebar-foreground">
                    <button
                        onClick={() => setMobileOpen(true)}
                        className="p-2 rounded-md hover:bg-accent"
                        aria-label="Open menu"
                    >
                        <Menu className="h-5 w-5" />
                    </button>
                    <span className="font-semibold">Merchant Portal</span>
                </header>

                <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
