import { useCallback, useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getLenders } from '@/services/Lenderservice';

function errorMessage(err, fallback) {
    if (err?.response?.status === 403) return "You don't have permission to view lenders.";
    return err?.response?.data?.message || fallback;
}

function StatCard({ label, value }) {
    return (
        <Card className="rounded-2xl border shadow-sm">
            <CardContent className="p-5">
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="mt-2 text-3xl font-semibold">{value}</p>
            </CardContent>
        </Card>
    );
}

export default function Lenders() {
    const [lenders, setLenders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [query, setQuery] = useState('');

    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const { lenders: list } = await getLenders();
            setLenders(list);
        } catch (err) {
            setError(errorMessage(err, 'Could not load lenders.'));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const visible = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return lenders;
        return lenders.filter(
            (l) => l.name?.toLowerCase().includes(q) || l.email?.toLowerCase().includes(q)
        );
    }, [lenders, query]);

    const activeCount = lenders.filter((l) => l.isActive).length;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold">Lenders</h1>
                <p className="text-sm text-muted-foreground">Funding partners that leads are sent to.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
                <StatCard label="Total lenders" value={lenders.length} />
                <StatCard label="Active" value={activeCount} />
                <StatCard label="Inactive" value={lenders.length - activeCount} />
            </div>

            <Card className="rounded-2xl border shadow-sm">
                <CardContent className="space-y-4 p-5">
                    <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            className="pl-9"
                            placeholder="Search by name or email…"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                    </div>

                    {error && (
                        <div
                            role="alert"
                            className="flex items-center justify-between gap-3 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
                        >
                            <span>{error}</span>
                            <Button size="sm" variant="outline" onClick={load}>
                                Retry
                            </Button>
                        </div>
                    )}

                    {loading ? (
                        <p className="py-8 text-center text-sm text-muted-foreground">Loading lenders…</p>
                    ) : visible.length === 0 && !error ? (
                        <p className="py-8 text-center text-sm text-muted-foreground">
                            {query ? 'No lenders match your search.' : 'No lenders yet.'}
                        </p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                                        <th className="py-2 pr-4 font-medium">Name</th>
                                        <th className="py-2 pr-4 font-medium">Email</th>
                                        <th className="py-2 pr-4 font-medium">Status</th>
                                        <th className="py-2 font-medium">Created</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {visible.map((l) => (
                                        <tr key={l._id} className="border-b last:border-0">
                                            <td className="py-3 pr-4 font-medium">{l.name}</td>
                                            <td className="py-3 pr-4 text-muted-foreground">{l.email || '—'}</td>
                                            <td className="py-3 pr-4">
                                                <span
                                                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${l.isActive
                                                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                                            : 'bg-muted text-muted-foreground'
                                                        }`}
                                                >
                                                    {l.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="py-3 text-muted-foreground">
                                                {l.createdAt ? new Date(l.createdAt).toLocaleDateString() : '—'}
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
