import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    ShieldCheck,
    Settings,
    Timer,
    Globe,
    PanelLeftClose,
    PanelLeft,
    Moon,
    Sun,
    LogOut,
    Building2,
    ChevronUp,
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { logoutUser } from '../../services/userService';

const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Users', path: '/dashboard/users', icon: Users },
    { name: 'Roles & Permissions', path: '/dashboard/roles', icon: ShieldCheck },
    { name: 'Lead Sources', path: '/dashboard/lead-sources', icon: Globe },
    { name: 'Permissions Catalog', path: '/dashboard/permissions-catalog', icon: ShieldCheck },
    { name: 'Teams', path: '/dashboard/teams', icon: Settings },
];

export default function AppSidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) {
    const { theme, toggleTheme } = useTheme();
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const navigate = useNavigate();

    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setUserMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const closeMobile = () => setMobileOpen(false);

    const handleSignOut = async () => {
        setUserMenuOpen(false);
        try {
            await logoutUser();
        } catch (err) {
            // Even if the server call fails, clear the local session below
        } finally {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken')
            localStorage.removeItem('csrfToken');
            navigate('/login', { replace: true });
        }
    };

    return (
        <aside
            className={`
                fixed inset-y-0 left-0 z-40 flex flex-col justify-between
                h-screen w-64 border-r border-sidebar-border bg-sidebar text-sidebar-foreground
                transition-all duration-300 select-none
                ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
                md:sticky md:top-0 md:translate-x-0
                ${collapsed ? 'md:w-16' : 'md:w-64'}
            `}
        >
            {/* Header / Logo */}
            <div>
                <div className="h-16 flex items-center justify-between px-3 border-b border-sidebar-border">
                    {(!collapsed || mobileOpen) && (
                        <div className="flex items-center gap-2.5 font-bold text-base tracking-tight px-2 min-w-0">
                            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shrink-0">
                                <Building2 className="h-4 w-4" />
                            </div>
                            <span className="truncate">Merchant Portal</span>
                        </div>
                    )}

                    {/* Desktop collapse button */}
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="hidden md:flex p-1.5 rounded-md text-muted-foreground cursor-pointer hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    >
                        {collapsed ? <PanelLeft className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
                    </button>

                    {/* Mobile close button */}
                    <button
                        onClick={closeMobile}
                        className="md:hidden p-1.5 rounded-md text-muted-foreground hover:bg-sidebar-accent"
                        aria-label="Close menu"
                    >
                        <PanelLeftClose className="h-5 w-5" />
                    </button>
                </div>

                {/*  */}

                {/* Navigation */}
                <nav className="p-2 space-y-1 mt-2">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isCollapsedDesktop = collapsed && !mobileOpen;
                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                end={item.path === '/dashboard'}
                                onClick={closeMobile}
                                title={item.name}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive
                                        ? 'bg-blue-600 text-white shadow-sm'
                                        : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                                    } ${isCollapsedDesktop ? 'md:justify-center md:px-0' : ''}`
                                }
                            >
                                <Icon className="h-5 w-5 shrink-0" />
                                <span className={`truncate ${collapsed && !mobileOpen ? 'md:hidden' : ''}`}>
                                    {item.name}
                                </span>
                            </NavLink>
                        );
                    })}
                </nav>
            </div>

            {/* Bottom controls */}
            <div className="p-2 border-t border-sidebar-border space-y-1">
                {/* Theme switch */}
                <button
                    onClick={toggleTheme}
                    className="w-full h-9 flex items-center gap-3 px-2.5 rounded-md text-base cursor-pointer text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                >
                    {theme === 'dark' ? (
                        <Sun className="h-5 w-5 shrink-0" />
                    ) : (
                        <Moon className="h-5 w-5 shrink-0" />
                    )}
                    <span className={`truncate ${collapsed && !mobileOpen ? 'md:hidden' : ''}`}>
                        {theme === 'dark' ? 'Light mode' : 'Dark mode'}
                    </span>
                </button>

                {/* Profile + menu */}
                <div ref={menuRef} className="relative">
                    {userMenuOpen && (
                        <div className="absolute bottom-full left-0 right-0 mb-2 p-1.5 rounded-lg border border-border bg-popover text-popover-foreground shadow-lg ring-1 ring-black/5 z-50">
                            <div className="px-2.5 py-2 mb-1 border-b border-border">
                                <p className="text-sm font-medium truncate">Syed Jawad</p>
                                <p className="text-xs text-muted-foreground truncate">admin@boltfg.com</p>
                            </div>
                            <button
                                onClick={handleSignOut}
                                className="w-full h-9 flex items-center gap-2.5 px-2.5 rounded-md text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
                            >
                                <LogOut className="h-4 w-4 shrink-0" />
                                Sign out
                            </button>
                        </div>
                    )}

                    <button
                        onClick={() => setUserMenuOpen((o) => !o)}
                        className={`w-full h-12 flex items-center cursor-pointer gap-3 px-2 rounded-md hover:bg-sidebar-accent transition-colors ${userMenuOpen ? 'bg-sidebar-accent' : ''
                            }`}
                    >
                        <div className="h-9 w-9 rounded-full bg-blue-600 text-white text-sm font-semibold flex items-center justify-center shrink-0">
                            SJ
                        </div>
                        <div className={`flex-1 min-w-0 text-left ${collapsed && !mobileOpen ? 'md:hidden' : ''}`}>
                            <p className="text-base font-medium truncate leading-tight">Syed Jawad</p>
                            <p className="text-sm text-muted-foreground truncate">Administrator</p>
                        </div>
                        <ChevronUp
                            className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${userMenuOpen ? 'rotate-180' : ''
                                } ${collapsed && !mobileOpen ? 'md:hidden' : ''}`}
                        />
                    </button>
                </div>
            </div>
        </aside>
    );
}
