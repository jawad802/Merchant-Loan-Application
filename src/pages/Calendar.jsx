import { useEffect, useMemo, useState } from 'react';
import { Activity, CalendarDays, ChevronLeft, ChevronRight, LoaderCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getCalendarActivities } from '@/services/Calendarservice';
import { calendarGridRange, weekRange } from '@/services/Daterange';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MAX_EVENTS_PER_DAY = 3;

// YYYY-MM-DD in local time, used as a key for grouping.
const dayKey = (d) => d.toLocaleDateString('en-CA');

function errorMessage(err, fallback) {
    if (err?.response?.status === 403) return "You don't have permission to view the calendar.";
    return err?.response?.data?.message || fallback;
}

export default function Calendar() {
    const [view, setView] = useState('month');
    const [cursor, setCursor] = useState(() => new Date());
    const [activities, setActivities] = useState([]);
    const [truncated, setTruncated] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [refreshKey, setRefreshKey] = useState(0);

    const range = useMemo(
        () =>
            view === 'month'
                ? calendarGridRange(cursor.getFullYear(), cursor.getMonth())
                : weekRange(cursor),
        [view, cursor]
    );

    useEffect(() => {
        let cancelled = false;
        getCalendarActivities(range)
            .then((data) => {
                if (cancelled) return;
                setActivities(data.activities ?? []);
                setTruncated(Boolean(data.truncated));
            })
            .catch((err) => {
                if (!cancelled) setError(errorMessage(err, 'Could not load the calendar.'));
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [range, refreshKey]);

    // One cell per day: 42 for the month grid, 7 for the week view.
    const days = useMemo(() => {
        const start = new Date(range.from);
        const count = view === 'month' ? 42 : 7;
        return Array.from({ length: count }, (_, i) => {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            return d;
        });
    }, [range.from, view]);

    const eventsByDay = useMemo(() => {
        const map = {};
        for (const a of activities) {
            // Field names are not confirmed yet. Adjust these if the API uses different ones.
            const when = a.scheduledAt ?? a.createdAt ?? a.date;
            if (!when) continue;
            (map[dayKey(new Date(when))] ||= []).push(a);
        }
        return map;
    }, [activities]);

    const todayKey = dayKey(new Date());
    const activeDaysCount = Object.keys(eventsByDay).length;

    const shift = (dir) => {
        setLoading(true);
        setError('');
        setCursor((c) => {
            const d = new Date(c);
            if (view === 'month') d.setMonth(d.getMonth() + dir);
            else d.setDate(d.getDate() + 7 * dir);
            return d;
        });
    };

    const title =
        view === 'month'
            ? cursor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
            : `${days[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${days[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

    return (
        <div className="mx-auto w-full max-w-[1440px] space-y-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3.5">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/10">
                        <CalendarDays className="size-5" />
                    </div>
                    <div>
                        <p className="mb-0.5 text-xs font-semibold uppercase tracking-[0.12em] text-primary">
                            Workspace
                        </p>
                        <h1 className="text-2xl font-semibold tracking-tight">Calendar</h1>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                            Keep track of lead activity and upcoming follow-ups.
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                    <div className="inline-flex rounded-xl border border-border bg-card p-1 shadow-sm" role="group" aria-label="Calendar view">
                        {['month', 'week'].map((v) => (
                            <button
                                key={v}
                                onClick={() => {
                                    if (view !== v) {
                                        setLoading(true);
                                        setError('');
                                        setView(v);
                                    }
                                }}
                                aria-pressed={view === v}
                                className={`rounded-lg px-3.5 py-2 text-sm font-medium capitalize transition-colors ${view === v ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                    }`}
                            >
                                {v}
                            </button>
                        ))}
                    </div>
                    <Button
                        variant="outline"
                        className="h-10 rounded-xl bg-card px-3.5 shadow-sm"
                        onClick={() => {
                            setLoading(true);
                            setError('');
                            setCursor(new Date());
                        }}
                    >
                        Today
                    </Button>
                </div>
            </div>

            <Card className="rounded-2xl border-border/80 bg-card shadow-sm">
                <CardContent className="p-0">
                    <div className="flex flex-col gap-4 border-b border-border/70 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center rounded-xl border border-border bg-background p-0.5">
                                <Button variant="ghost" size="icon" className="rounded-lg" aria-label="Previous" onClick={() => shift(-1)}>
                                    <ChevronLeft className="size-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="rounded-lg" aria-label="Next" onClick={() => shift(1)}>
                                    <ChevronRight className="size-4" />
                                </Button>
                            </div>
                            <div>
                                <h2 className="text-base font-semibold">{title}</h2>
                                <p className="text-xs text-muted-foreground">
                                    {view === 'month' ? 'Monthly overview' : 'Weekly overview'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 self-start sm:self-auto">
                            <div className="hidden items-center gap-2 text-sm text-muted-foreground sm:flex">
                                <Activity className="size-4" />
                                <span>
                                    <span className="font-semibold text-foreground">{activities.length}</span> activities
                                </span>
                            </div>
                            <div className="h-5 w-px bg-border" />
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <CalendarDays className="size-4" />
                                <span>
                                    <span className="font-semibold text-foreground">{activeDaysCount}</span> active days
                                </span>
                            </div>
                            {loading && <LoaderCircle className="size-4 animate-spin text-primary" aria-label="Loading calendar" />}
                        </div>
                    </div>

                    {error && (
                        <div role="alert" className="m-4 flex items-center justify-between gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                            <span>{error}</span>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                    setLoading(true);
                                    setError('');
                                    setRefreshKey((key) => key + 1);
                                }}
                            >
                                Retry
                            </Button>
                        </div>
                    )}

                    {truncated && (
                        <p className="mx-4 mt-4 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs text-amber-800 dark:text-amber-300 sm:mx-5">
                            Showing only part of this range. Narrow the dates to see more activity.
                        </p>
                    )}

                    <div className="overflow-x-auto p-3 sm:p-5">
                        <div className="min-w-[720px] overflow-hidden rounded-xl border border-border/80">
                            <div className="grid grid-cols-7 border-b border-border bg-muted/40 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                                {DAY_NAMES.map((n) => (
                                    <div key={n} className="px-3 py-3 text-left">
                                        {n}
                                    </div>
                                ))}
                            </div>
                            <div className="grid grid-cols-7">
                                {days.map((d, index) => {
                                    const key = dayKey(d);
                                    const events = eventsByDay[key] ?? [];
                                    const outsideMonth = view === 'month' && d.getMonth() !== cursor.getMonth();
                                    const isToday = key === todayKey;
                                    const isLastRow = index >= days.length - 7;
                                    return (
                                        <div
                                            key={key}
                                            className={`min-h-[112px] border-b border-r border-border/70 p-2.5 transition-colors sm:p-3 ${view === 'week' ? 'min-h-[260px]' : ''
                                                } ${isLastRow ? 'border-b-0' : ''} ${index % 7 === 6 ? 'border-r-0' : ''
                                                } ${outsideMonth ? 'bg-muted/25' : 'bg-card hover:bg-muted/20'
                                                } ${isToday ? 'bg-primary/[0.035]' : ''}`}
                                        >
                                            <div className="mb-2 flex items-center justify-between">
                                                <span
                                                    className={`flex size-7 items-center justify-center rounded-full text-xs font-medium ${isToday
                                                        ? 'bg-primary font-semibold text-primary-foreground shadow-sm'
                                                        : outsideMonth
                                                            ? 'text-muted-foreground/60'
                                                            : 'text-foreground'
                                                        }`}
                                                >
                                                    {d.getDate()}
                                                </span>
                                                {isToday && (
                                                    <span className="text-[10px] font-semibold uppercase tracking-wide text-primary">
                                                        Today
                                                    </span>
                                                )}
                                            </div>
                                            <div className="space-y-1.5">
                                                {events.slice(0, MAX_EVENTS_PER_DAY).map((a, i) => {
                                                    const when = a.scheduledAt ?? a.createdAt ?? a.date;
                                                    return (
                                                        <div
                                                            key={a._id ?? i}
                                                            className="overflow-hidden rounded-md border-l-2 border-primary/70 bg-primary/[0.07] px-2 py-1.5 text-[11px] leading-tight text-primary"
                                                            title={a.title ?? a.leadName ?? a.type}
                                                        >
                                                            {when && (
                                                                <span className="mb-0.5 block font-medium opacity-75">
                                                                    {new Date(when).toLocaleTimeString([], {
                                                                        hour: 'numeric',
                                                                        minute: '2-digit',
                                                                    })}
                                                                </span>
                                                            )}
                                                            <span className="block truncate font-medium text-foreground/90">
                                                                {a.title ?? a.leadName ?? a.type ?? 'Activity'}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                                {events.length > MAX_EVENTS_PER_DAY && (
                                                    <p className="px-1 text-[11px] font-medium text-muted-foreground">
                                                        +{events.length - MAX_EVENTS_PER_DAY} more
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {!loading && !error && activities.length === 0 && (
                        <div className="mx-4 mb-4 flex items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/20 px-4 py-3 text-sm text-muted-foreground sm:mx-5">
                            <Activity className="size-4" />
                            No activity in this range.
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
