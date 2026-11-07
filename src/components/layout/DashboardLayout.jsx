import { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Bell, Menu } from 'lucide-react';
import AppSidebar from './AppSidebar';

export default function DashboardLayout() {
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
        return <Navigate to="/login" replace />;
    }

    return (
        <div className="flex min-h-screen bg-background text-foreground">
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

            <div className="flex min-w-0 flex-1 flex-col">
                {/* Mobile top bar */}
                <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-card px-4 md:hidden">
                    <button
                        onClick={() => setMobileOpen(true)}
                        className="rounded-md p-2 hover:bg-muted"
                        aria-label="Open menu"
                    >
                        <Menu className="h-5 w-5" />
                    </button>
                    <span className="font-semibold">Merchant Portal</span>
                </header>

                {/* Desktop top bar */}
                <header className="sticky top-0 z-20 hidden h-16 items-center justify-end gap-3 border-b border-border bg-card/80 px-6 backdrop-blur md:flex">
                    <button
                        className="relative rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        aria-label="Notifications"
                    >
                        <Bell className="h-5 w-5" />
                    </button>
                    <div className="flex items-center gap-2.5 rounded-full border border-border py-1 pl-1 pr-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
                            SJ
                        </div>
                        <span className="text-sm font-medium">Syed Jawad</span>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
