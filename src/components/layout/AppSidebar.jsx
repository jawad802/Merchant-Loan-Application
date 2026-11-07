import { useEffect, useRef, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    ShieldCheck,
    Settings,
    Globe,
    PanelLeftClose,
    PanelLeft,
    Moon,
    Sun,
    LogOut,
    Building2,
    ChevronUp,
    Search,
    Calendar,
    LensIcon,
    CableCarIcon,
    TagPlusIcon,
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { logoutUser } from '../../services/userService';

// Pages that exist today. Add Leads, Calendar, Lenders, Participants and Settings
// here once their pages are built.
const sections = [
    {
        label: null,
        items: [
            { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, end: true },
            { name: 'Lead Sources', path: '/dashboard/lead-sources', icon: Globe },
        ],
    },
    {
        label: 'Administration',
        items: [
            { name: 'Teams', path: '/dashboard/teams', icon: TagPlusIcon },
            { name: 'Users', path: '/dashboard/users', icon: Users },
            { name: 'Roles & Permissions', path: '/dashboard/roles', icon: ShieldCheck },
            { name: 'Permissions Catalog', path: '/dashboard/permissions-catalog', icon: CableCarIcon },
            { name: "Calendar", path: "/dashboard/calendar", icon: Calendar },
            { name: "Lenders", path: "/dashboard/lenders", icon: LensIcon },
        ],
    },
];

export default function AppSidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) {
    const { theme, toggleTheme } = useTheme();
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [query, setQuery] = useState('');
    const navigate = useNavigate();
    const menuRef = useRef(null);

    // Labels show on mobile when the drawer is open, and on desktop when not collapsed.
    const showLabels = !collapsed || mobileOpen;

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
        } catch {
            // Even if the server call fails, clear the local session below.
        } finally {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('csrfToken');
            navigate('/login', { replace: true });
        }
    };

    const matches = (name) => name.toLowerCase().includes(query.trim().toLowerCase());

    return (
        <aside
            className={`
                fixed inset-y-0 left-0 z-40 flex h-screen w-64 flex-col justify-between
                bg-sidebar text-sidebar-foreground select-none transition-all duration-300
                ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
                md:sticky md:top-0 md:translate-x-0
                ${collapsed ? 'md:w-20' : 'md:w-64'}
            `}
        >
            <div className="min-h-0 flex-1 overflow-y-auto">
                {/* Logo and collapse controls */}
                <div className="flex h-16 items-center justify-between px-4">
                    <div className="flex min-w-0 items-center gap-2.5">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15">
                            <Building2 className="h-5 w-5" />
                        </div>
                        {showLabels && (
                            <div className="flex min-w-0 items-center gap-2">
                                <span className="truncate text-base font-bold">Bolt FG</span>
                                <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-semibold uppercase">
                                    dev
                                </span>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="hidden cursor-pointer rounded-md p-1.5 text-blue-100/80 transition-colors hover:bg-white/10 hover:text-white md:flex"
                        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    >
                        {collapsed ? <PanelLeft className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
                    </button>

                    <button
                        onClick={closeMobile}
                        className="rounded-md p-1.5 text-blue-100/80 hover:bg-white/10 md:hidden"
                        aria-label="Close menu"
                    >
                        <PanelLeftClose className="h-5 w-5" />
                    </button>
                </div>

                {/* Search */}
                {showLabels && (
                    <div className="px-3 pb-2">
                        <div className="relative">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-200/70" />
                            <input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search menu…"
                                className="h-9 w-full rounded-lg bg-white/10 pl-9 pr-3 text-sm text-white placeholder:text-blue-200/70 focus:outline-none focus:ring-2 focus:ring-white/30"
                            />
                        </div>
                    </div>
                )}

                {/* Navigation */}
                <nav className="space-y-5 px-3 pt-3">
                    {sections.map((section) => {
                        const items = section.items.filter((item) => matches(item.name));
                        if (items.length === 0) return null;

                        return (
                            <div key={section.label ?? 'main'} className="space-y-1">
                                {section.label && showLabels && (
                                    <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-blue-200/70">
                                        {section.label}
                                    </p>
                                )}
                                {items.map((item) => {
                                    const Icon = item.icon;
                                    return (
                                        <NavLink
                                            key={item.path}
                                            to={item.path}
                                            end={item.end}
                                            onClick={closeMobile}
                                            title={item.name}
                                            className={({ isActive }) =>
                                                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${isActive
                                                    ? 'bg-blue-600 text-white shadow-md'
                                                    : 'text-blue-100/80 hover:bg-white/10 hover:text-white'
                                                } ${!showLabels ? 'md:justify-center md:px-0' : ''}`
                                            }
                                        >
                                            <Icon className="h-5 w-5 shrink-0" />
                                            {showLabels && <span className="truncate">{item.name}</span>}
                                        </NavLink>
                                    );
                                })}
                            </div>
                        );
                    })}
                </nav>
            </div>

            {/* Bottom controls */}
            <div className="space-y-1 border-t border-white/10 p-3">
                <button
                    onClick={toggleTheme}
                    className="flex h-9 w-full cursor-pointer items-center gap-3 rounded-md px-2.5 text-sm text-blue-100/80 transition-colors hover:bg-white/10 hover:text-white"
                >
                    {theme === 'dark' ? <Sun className="h-5 w-5 shrink-0" /> : <Moon className="h-5 w-5 shrink-0" />}
                    {showLabels && <span className="truncate">{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>}
                </button>

                <div ref={menuRef} className="relative">
                    {userMenuOpen && (
                        <div className="absolute bottom-full left-0 right-0 z-50 mb-2 rounded-lg border border-border bg-popover p-1.5 text-popover-foreground shadow-lg">
                            <div className="mb-1 border-b border-border px-2.5 py-2">
                                <p className="truncate text-sm font-medium">Syed Jawad</p>
                                <p className="truncate text-xs text-muted-foreground">admin@boltfg.com</p>
                            </div>
                            <button
                                onClick={handleSignOut}
                                className="flex h-9 w-full items-center gap-2.5 rounded-md px-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
                            >
                                <LogOut className="h-4 w-4 shrink-0" />
                                Sign out
                            </button>
                        </div>
                    )}

                    <button
                        onClick={() => setUserMenuOpen((o) => !o)}
                        className={`flex h-12 w-full cursor-pointer items-center gap-3 rounded-lg px-2 transition-colors hover:bg-white/10 ${userMenuOpen ? 'bg-white/10' : ''
                            }`}
                    >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20 text-sm font-semibold">
                            SJ
                        </div>
                        {showLabels && (
                            <>
                                <div className="min-w-0 flex-1 text-left">
                                    <p className="truncate text-sm font-medium leading-tight">Syed Jawad</p>
                                    <p className="truncate text-xs text-blue-200/70">Administrator</p>
                                </div>
                                <ChevronUp
                                    className={`h-4 w-4 shrink-0 text-blue-200/70 transition-transform ${userMenuOpen ? 'rotate-180' : ''
                                        }`}
                                />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </aside>
    );
}

