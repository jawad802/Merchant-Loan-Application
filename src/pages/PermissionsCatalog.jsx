import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getPermissions } from '@/services/permissionService';

function errorMessage(err, fallback) {
    if (err?.response?.status === 403) return 'You do not have permission to view the permission catalog.';
    return err?.response?.data?.message || fallback;
}

function StatCard({ label, value }) {
    return (
        <Card>
            <CardContent className="p-5">
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="mt-2 text-3xl font-semibold">{value}</p>
            </CardContent>
        </Card>
    );
}

function RoleBadge({ role }) {
    const isAdmin = role.type === 'admin';
    return (
        <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${isAdmin ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                }`}
        >
            {role.name}
        </span>
    );
}

export default function PermissionsCatalog() {
    const [modules, setModules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [query, setQuery] = useState('');

    async function load() {
        setLoading(true);
        setError('');
        try {
            setModules(await getPermissions());
        } catch (err) {
            setError(errorMessage(err, 'Could not load permissions.'));
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
    }, []);

    const totalPermissions = useMemo(
        () => modules.reduce((sum, m) => sum + (m.subPermissions?.length ?? 0), 0),
        [modules]
    );
    const unassigned = useMemo(
        () =>
            modules.reduce(
                (sum, m) => sum + (m.subPermissions ?? []).filter((p) => !p.assignedRoles?.length).length,
                0
            ),
        [modules]
    );

    // Show a module's full list when its name matches; otherwise filter its permissions.
    const visibleModules = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return modules;
        return modules
            .map((m) => {
                const moduleMatches =
                    m.permissionName?.toLowerCase().includes(q) || m.permissionKey?.toLowerCase().includes(q);
                const subs = (m.subPermissions ?? []).filter(
                    (p) =>
                        moduleMatches ||
                        p.permissionName?.toLowerCase().includes(q) ||
                        p.permissionKey?.toLowerCase().includes(q)
                );
                return { ...m, subPermissions: subs };
            })
            .filter((m) => m.subPermissions.length > 0);
    }, [modules, query]);

    return (
        <div className="space-y-6 p-4 md:p-6">
            <div>
                <h1 className="text-2xl font-semibold">Permissions</h1>
                <p className="text-sm text-muted-foreground">
                    Read-only catalog of what each module can do and which roles hold each permission.
                </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
                <StatCard label="Modules" value={modules.length} />
                <StatCard label="Permissions" value={totalPermissions} />
                <StatCard label="Not assigned to any role" value={unassigned} />
            </div>

            <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    className="pl-9"
                    placeholder="Search by module, permission name or key…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
            </div>

            {error && (
                <div role="alert" className="flex items-center justify-between gap-3 rounded-md border border-destructive/40 p-3 text-sm text-destructive">
                    <span>{error}</span>
                    <Button size="sm" variant="outline" onClick={load}>
                        Retry
                    </Button>
                </div>
            )}

            {loading ? (
                <p className="py-8 text-center text-sm text-muted-foreground">Loading permissions…</p>
            ) : visibleModules.length === 0 && !error ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No permissions match your search.</p>
            ) : (
                <div className="grid gap-4 xl:grid-cols-2">
                    {visibleModules.map((m) => (
                        <Card key={m._id}>
                            <CardHeader className="space-y-2">
                                <div className="flex items-start justify-between gap-3">
                                    <CardTitle>{m.permissionName}</CardTitle>
                                    <span className="font-mono text-xs text-muted-foreground">{m.permissionKey}</span>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {(m.assignedRoles ?? []).length === 0 ? (
                                        <span className="text-xs text-muted-foreground">No roles hold this module</span>
                                    ) : (
                                        m.assignedRoles.map((r) => <RoleBadge key={r._id} role={r} />)
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <ul className="divide-y">
                                    {m.subPermissions.map((p) => {
                                        const none = !p.assignedRoles?.length;
                                        return (
                                            <li key={p._id} className="flex flex-col gap-2 px-6 py-3 sm:flex-row sm:items-start sm:justify-between">
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium">{p.permissionName}</p>
                                                    <p className="font-mono text-xs text-muted-foreground">{p.permissionKey}</p>
                                                </div>
                                                <div className="flex flex-wrap gap-1.5 sm:justify-end">
                                                    {none ? (
                                                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                                                            Not assigned
                                                        </span>
                                                    ) : (
                                                        p.assignedRoles.map((r) => <RoleBadge key={r._id} role={r} />)
                                                    )}
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

