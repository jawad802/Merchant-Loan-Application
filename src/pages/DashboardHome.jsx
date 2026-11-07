import { useCallback, useEffect, useMemo, useState } from 'react';
import { BadgeCheck, ChevronLeft, ChevronRight, Send, UserPlus, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getDashboardSummary } from '@/services/dashboardService';
import { getRecentLeads } from '@/services/leadService';
import { monthRange } from '@/services/Daterange';

// Colour per status, used by the status tiles.
const STATUS_STYLE = {
    no_attempt: { dot: 'bg-slate-400', tint: 'bg-slate-50 dark:bg-slate-800/40' },
    app_out: { dot: 'bg-sky-500', tint: 'bg-sky-50 dark:bg-sky-950/40' },
    docs_in: { dot: 'bg-sky-500', tint: 'bg-sky-50 dark:bg-sky-950/40' },
    submitted: { dot: 'bg-indigo-500', tint: 'bg-indigo-50 dark:bg-indigo-950/40' },
    approved: { dot: 'bg-teal-500', tint: 'bg-teal-50 dark:bg-teal-950/40' },
    contract_requested: { dot: 'bg-violet-500', tint: 'bg-violet-50 dark:bg-violet-950/40' },
    contract_out: { dot: 'bg-violet-500', tint: 'bg-violet-50 dark:bg-violet-950/40' },
    contract_in: { dot: 'bg-violet-500', tint: 'bg-violet-50 dark:bg-violet-950/40' },
    funded: { dot: 'bg-emerald-500', tint: 'bg-emerald-50 dark:bg-emerald-950/40' },
    declined: { dot: 'bg-red-500', tint: 'bg-red-50 dark:bg-red-950/40' },
    dnc: { dot: 'bg-orange-500', tint: 'bg-orange-50 dark:bg-orange-950/40' },
    default: { dot: 'bg-rose-500', tint: 'bg-rose-50 dark:bg-rose-950/40' },
};
const FALLBACK_STYLE = { dot: 'bg-slate-400', tint: 'bg-muted' };

// Donut groups: each one sums one or more statuses.
const DONUT_GROUPS = [
    { label: 'Funded', color: '#10b981', keys: ['funded'] },
    { label: 'Approved', color: '#14b8a6', keys: ['approved'] },
    {
        label: 'In progress',
        color: '#3b82f6',
        keys: ['app_out', 'docs_in', 'submitted', 'contract_requested', 'contract_out', 'contract_in'],
    },
    { label: 'New', color: '#94a3b8', keys: ['no_attempt'] },
    { label: 'Declined / DNC / Default', color: '#ef4444', keys: ['declined', 'dnc', 'default'] },
];

const TAG_STYLE = [
    { key: 'hot', label: 'Hot', tone: 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300' },
    { key: 'warm', label: 'Warm', tone: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300' },
    { key: 'cold', label: 'Cold', tone: 'bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-300' },
    { key: 'none', label: 'No tag', tone: 'bg-muted text-muted-foreground' },
];

function errorMessage(err, fallback) {
    if (err?.response?.status === 403) return "You don't have permission to view dashboard data.";
    return err?.response?.data?.message || fallback;
}

const money = (n) => `$${Number(n ?? 0).toLocaleString()}`;

function StatCard({ icon: Icon, label, value, note, tone, loading }) {
    return (
        <Card className="rounded-2xl border shadow-sm">
            <CardContent className="flex items-start gap-4 p-5">
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tone}`}>
                    <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                    <p className="text-sm text-muted-foreground">{label}</p>
                    <p className="mt-1 text-2xl font-semibold">{loading ? '…' : value}</p>
                    <p className="text-xs text-muted-foreground">{note}</p>
                </div>
            </CardContent>
        </Card>
    );
}

function Donut({ groups, total }) {
    const r = 40;
    const circumference = 2 * Math.PI * r;
    let offset = 0;

    return (
        <div className="flex flex-col items-center gap-6 sm:flex-row">
            <div className="relative h-36 w-36 shrink-0">
                <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                    <circle cx="50" cy="50" r={r} fill="none" stroke="currentColor" strokeOpacity="0.1" strokeWidth="12" />
                    {total > 0 &&
                        groups.map((g) => {
                            const length = (g.value / total) * circumference;
                            const segment = (
                                <circle
                                    key={g.label}
                                    cx="50"
                                    cy="50"
                                    r={r}
                                    fill="none"
                                    stroke={g.color}
                                    strokeWidth="12"
                                    strokeDasharray={`${length} ${circumference - length}`}
                                    strokeDashoffset={-offset}
                                />
                            );
                            offset += length;
                            return segment;
                        })}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-semibold">{total}</span>
                    <span className="text-xs text-muted-foreground">Total leads</span>
                </div>
            </div>

            <ul className="w-full space-y-2.5 text-sm">
                {groups.map((g) => (
                    <li key={g.label} className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: g.color }} />
                        <span className="text-muted-foreground">{g.label}</span>
                        <span className="ml-auto font-medium">{g.value}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default function DashboardHome() {
    const [cursor, setCursor] = useState(() => new Date());
    const [summary, setSummary] = useState(null);
    const [recent, setRecent] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // The summary covers one calendar month at a time.
    const range = useMemo(() => monthRange(cursor.getFullYear(), cursor.getMonth()), [cursor]);
    const rangeLabel = useMemo(() => {
        const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
        const last = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
        const fmt = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        return `${fmt(first)} – ${fmt(last)}`;
    }, [cursor]);

    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const [data, leads] = await Promise.all([getDashboardSummary(range), getRecentLeads({ limit: 5 })]);
            setSummary(data);
            setRecent(leads);
        } catch (err) {
            setError(errorMessage(err, 'Could not load dashboard numbers.'));
        } finally {
            setLoading(false);
        }
    }, [range]);

    useEffect(() => {
        load();
    }, [load]);

    const statuses = summary?.statuses ?? [];
    const countOf = (key) => statuses.find((s) => s.status === key)?.count ?? 0;
    const labelOf = (key) => statuses.find((s) => s.status === key)?.label ?? key;
    const groups = DONUT_GROUPS.map((g) => ({
        label: g.label,
        color: g.color,
        value: g.keys.reduce((sum, k) => sum + countOf(k), 0),
    }));

    const total = summary?.totalLeads ?? 0;
    const tags = summary?.tags ?? {};
    const pipeline = summary?.openPipeline ?? { count: 0, requestedAmount: 0 };
    const period = summary?.period ?? {};

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold">Dashboard</h1>
                    <p className="text-sm text-muted-foreground">Overview of your leads and pipeline.</p>
                </div>
                <div className="flex items-center gap-1 rounded-lg border border-border bg-card px-1 py-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Previous month"
                        onClick={() => setCursor((c) => new Date(c.getFullYear(), c.getMonth() - 1, 1))}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="min-w-[10rem] text-center text-sm font-medium">{rangeLabel}</span>
                    <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Next month"
                        onClick={() => setCursor((c) => new Date(c.getFullYear(), c.getMonth() + 1, 1))}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {error && (
                <div
                    role="alert"
                    className="flex items-center justify-between gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
                >
                    <span>{error}</span>
                    <button onClick={load} className="text-xs font-medium underline">
                        Retry
                    </button>
                </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                    icon={Users}
                    label="Total Leads"
                    value={total}
                    note="Total leads in system"
                    tone="bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-300"
                    loading={loading}
                />
                <StatCard
                    icon={Send}
                    label="Open Pipeline"
                    value={pipeline.count}
                    note={`${money(pipeline.requestedAmount)} requested amount`}
                    tone="bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300"
                    loading={loading}
                />
                <StatCard
                    icon={UserPlus}
                    label="New Leads (this period)"
                    value={period.newLeads?.count ?? 0}
                    note={`${money(period.newLeads?.requestedAmount)} requested amount`}
                    tone="bg-violet-100 text-violet-600 dark:bg-violet-950 dark:text-violet-300"
                    loading={loading}
                />
                <StatCard
                    icon={BadgeCheck}
                    label="Unassigned Leads"
                    value={summary?.unassigned ?? 0}
                    note="Leads not assigned to any user"
                    tone="bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300"
                    loading={loading}
                />
            </div>

            <div className="grid gap-4 xl:grid-cols-3">
                <Card className="rounded-2xl border shadow-sm xl:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-base">Leads by status</CardTitle>
                        <p className="text-sm text-muted-foreground">Distribution across pipeline stages</p>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <p className="py-6 text-center text-sm text-muted-foreground">Loading…</p>
                        ) : (
                            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
                                {statuses.map((s) => {
                                    const style = STATUS_STYLE[s.status] ?? FALLBACK_STYLE;
                                    return (
                                        <div key={s.status} className={`rounded-xl border p-4 ${style.tint}`}>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <span className={`h-2 w-2 rounded-full ${style.dot}`} />
                                                {labelOf(s.status)}
                                            </div>
                                            <p className="mt-2 text-xl font-semibold">{s.count}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="rounded-2xl border shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-base">Status share</CardTitle>
                        <p className="text-sm text-muted-foreground">Share of leads by stage group</p>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <p className="py-6 text-center text-sm text-muted-foreground">Loading…</p>
                        ) : (
                            <Donut groups={groups} total={total} />
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
                <Card className="rounded-2xl border shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-base">Leads by tag</CardTitle>
                        <p className="text-sm text-muted-foreground">Distribution of leads by tag</p>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-3">
                        {TAG_STYLE.map((t) => (
                            <div key={t.key} className={`rounded-xl p-4 ${t.tone}`}>
                                <p className="text-xs">{t.label}</p>
                                <p className="mt-1 text-xl font-semibold">{tags[t.key] ?? 0}</p>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <Card className="rounded-2xl border shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-base">Pipeline summary</CardTitle>
                        <p className="text-sm text-muted-foreground">Open pipeline leads and requested amount</p>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-xl bg-indigo-50 p-4 dark:bg-indigo-950/40">
                            <p className="text-3xl font-semibold">{pipeline.count}</p>
                            <p className="text-sm text-muted-foreground">Open pipeline leads</p>
                            <p className="mt-3 text-lg font-semibold">{money(pipeline.requestedAmount)}</p>
                            <p className="text-sm text-muted-foreground">Requested amount</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-2xl border shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-base">This period summary</CardTitle>
                        <p className="text-sm text-muted-foreground">{rangeLabel}</p>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-1">
                        <div className="rounded-xl bg-violet-50 p-4 dark:bg-violet-950/40">
                            <p className="text-xs text-muted-foreground">New leads</p>
                            <p className="mt-1 text-xl font-semibold">{period.newLeads?.count ?? 0}</p>
                            <p className="text-xs text-muted-foreground">{money(period.newLeads?.requestedAmount)}</p>
                        </div>
                        <div className="rounded-xl bg-emerald-50 p-4 dark:bg-emerald-950/40">
                            <p className="text-xs text-muted-foreground">Funded</p>
                            <p className="mt-1 text-xl font-semibold">{period.funded?.count ?? 0}</p>
                            <p className="text-xs text-muted-foreground">{money(period.funded?.requestedAmount)}</p>
                        </div>
                        <div className="rounded-xl bg-red-50 p-4 dark:bg-red-950/40">
                            <p className="text-xs text-muted-foreground">Declined</p>
                            <p className="mt-1 text-xl font-semibold">{period.declined ?? 0}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="rounded-2xl border shadow-sm">
                <CardHeader>
                    <CardTitle className="text-base">Recent leads</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <p className="py-6 text-center text-sm text-muted-foreground">Loading…</p>
                    ) : recent.length === 0 ? (
                        <p className="py-6 text-center text-sm text-muted-foreground">No leads yet.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                                        <th className="py-2 pr-4 font-medium">Name</th>
                                        <th className="py-2 pr-4 font-medium">Status</th>
                                        <th className="py-2 pr-4 font-medium">Requested</th>
                                        <th className="py-2 font-medium">Created</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recent.map((lead) => (
                                        <tr key={lead._id} className="border-b last:border-0">
                                            <td className="py-3 pr-4 font-medium">{lead.businessName ?? lead.name ?? '—'}</td>
                                            <td className="py-3 pr-4">{labelOf(lead.status)}</td>
                                            <td className="py-3 pr-4">
                                                {lead.requestedAmount != null ? money(lead.requestedAmount) : '—'}
                                            </td>
                                            <td className="py-3 text-muted-foreground">
                                                {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : '—'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
