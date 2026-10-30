import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getLeadStatusCounts, getRecentLeads } from '@/services/leadService';

function errorMessage(err, fallback) {
    if (err?.response?.status === 403) return "You don't have permission to view lead data.";
    return err?.response?.data?.message || fallback;
}

function StatCard({ label, value, note, loading }) {
    return (
        <Card className="shadow-sm">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-foreground">{loading ? '...' : value}</div>
                <p className="mt-1 text-xs text-muted-foreground">{note}</p>
            </CardContent>
        </Card>
    );
}

export default function DashboardHome() {
    const [statuses, setStatuses] = useState([]);
    const [total, setTotal] = useState(0);
    const [recent, setRecent] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const [counts, leads] = await Promise.all([
                getLeadStatusCounts(),
                getRecentLeads({ limit: 5 }),
            ]);
            setStatuses(counts.statuses ?? []);
            setTotal(counts.total ?? 0);
            setRecent(leads);
        } catch (err) {
            setError(errorMessage(err, 'Could not load dashboard numbers.'));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const countOf = (key) => statuses.find((s) => s.status === key)?.count ?? 0;
    const labelOf = (key) => statuses.find((s) => s.status === key)?.label ?? key;

    const cards = [
        { label: 'Total Leads', value: total, note: 'All leads' },
        { label: 'New Leads', value: countOf('no_attempt'), note: 'No contact yet' },
        { label: 'Submitted', value: countOf('submitted'), note: 'Sent for approval' },
        { label: 'Funded', value: countOf('funded'), note: 'Deals funded' },
    ];

    return (
        <div className="space-y-6 p-4 md:p-6">
            <div>
                <h1 className="text-2xl font-semibold">Dashboard</h1>
                <p className="text-sm text-muted-foreground">Lead pipeline at a glance.</p>
            </div>

            {error && (
                <div
                    role="alert"
                    className="flex items-center justify-between gap-3 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
                >
                    <span>{error}</span>
                    <button onClick={load} className="text-xs font-medium underline">
                        Retry
                    </button>
                </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 md:gap-6">
                {cards.map((c) => (
                    <StatCard key={c.label} {...c} loading={loading} />
                ))}
            </div>

            <Card className="shadow-sm">
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
                                    <tr className="border-b text-left text-muted-foreground">
                                        <th className="py-2 pr-4 font-medium">Name</th>
                                        <th className="py-2 pr-4 font-medium">Status</th>
                                        <th className="py-2 pr-4 font-medium">Requested</th>
                                        <th className="py-2 font-medium">Created</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recent.map((lead) => (
                                        <tr key={lead._id} className="border-b">
                                            <td className="py-3 pr-4 font-medium">
                                                {lead.businessName ?? lead.name ?? '—'}
                                            </td>
                                            <td className="py-3 pr-4">{labelOf(lead.status)}</td>
                                            <td className="py-3 pr-4">
                                                {lead.requestedAmount != null
                                                    ? `$${Number(lead.requestedAmount).toLocaleString()}`
                                                    : '—'}
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
