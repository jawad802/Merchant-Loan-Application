import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function DashboardHome() {
    const [stats, setStats] = useState({ total: 0, pending: 0, active: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            setLoading(true);
            setError('');
            try {
                const records = await getMerchants();
                const active = Array.isArray(records)
                    ? records.filter((m) => m.statusInfo?.isActive).length
                    : 0;

                if (!cancelled) {
                    setStats({
                        total: Array.isArray(records) ? records.length : 0,
                        active,
                        pending: (Array.isArray(records) ? records.length : 0) - active,
                    });
                }
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err.response?.status === 403
                            ? "You don't have permission to view merchant stats."
                            : 'Could not load dashboard numbers.'
                    );
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        load();
        return () => {
            cancelled = true;
        };
    }, []);

    const display = (value) => (loading ? '...' : value);

    const cards = [
        { label: 'Total Merchants', value: display(stats.total), note: 'All registered merchants' },
        { label: 'Pending Review', value: display(stats.pending), note: 'Not yet active' },
        { label: 'Active Merchants', value: display(stats.active), note: 'Currently active' },
    ];

    return (
        <div className="space-y-6">
            {error && (
                <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
                {cards.map((c) => (
                    <Card key={c.label} className="shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">{c.label}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-foreground">{c.value}</div>
                            <p className="text-xs text-muted-foreground mt-1">{c.note}</p>
                        </CardContent>
                    </Card>
                ))}

                <Card className="shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">System Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">Operational</div>
                        <p className="text-xs text-muted-foreground mt-1">All APIs connected</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
