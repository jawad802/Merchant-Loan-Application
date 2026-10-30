import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pencil, Plus, Search, Trash2, UserMinus, UserPlus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    addTeamMembers,
    createTeam,
    deleteTeam,
    getTeamById,
    getTeams,
    removeTeamMembers,
    updateTeam,
} from '@/services/teamService';
import { getUsers } from '@/services/userService';

const selectClass =
    'h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500';

function errorMessage(err, fallback) {
    if (err?.response?.status === 403) return 'You do not have permission to do this.';
    return err?.response?.data?.message || fallback;
}

// Users come back with personalInfo { firstName, lastName }, then username, then email.
function personName(u) {
    const p = u?.personalInfo;
    const full = [p?.firstName, p?.lastName].filter(Boolean).join(' ');
    return full || u?.username || u?.email || 'Unnamed';
}

function toUserList(res) {
    return [res, res?.data, res?.users, res?.data?.users].find(Array.isArray) ?? [];
}

function memberCount(team) {
    return team.memberCount ?? team.members?.length ?? 0;
}

function formatDate(value) {
    return value ? new Date(value).toLocaleDateString() : '—';
}

function StatCard({ label, value }) {
    return (
        <Card className="shadow-sm">
            <CardContent className="p-5">
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="mt-2 text-3xl font-semibold">{value}</p>
            </CardContent>
        </Card>
    );
}

export default function Teams() {
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [query, setQuery] = useState('');
    const [createOpen, setCreateOpen] = useState(false);
    const [selectedId, setSelectedId] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            setTeams(await getTeams());
        } catch (err) {
            setError(errorMessage(err, 'Could not load teams.'));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const visible = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return teams;
        return teams.filter(
            (t) =>
                t.name?.toLowerCase().includes(q) ||
                personName(t.managerId).toLowerCase().includes(q)
        );
    }, [teams, query]);

    const totalMembers = useMemo(() => teams.reduce((n, t) => n + memberCount(t), 0), [teams]);
    const emptyTeams = useMemo(() => teams.filter((t) => memberCount(t) === 0).length, [teams]);

    return (
        <div className="space-y-6 p-4 md:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold">Teams</h1>
                    <p className="text-sm text-muted-foreground">
                        Group users into teams and choose who manages each one.
                    </p>
                </div>
                <Button onClick={() => setCreateOpen(true)} className="bg-blue-600 text-white hover:bg-blue-700">
                    <Plus className="mr-1 h-4 w-4" />
                    New team
                </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
                <StatCard label="Total teams" value={teams.length} />
                <StatCard label="Members across teams" value={totalMembers} />
                <StatCard label="Teams with no members" value={emptyTeams} />
            </div>

            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle>All teams</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            className="pl-9"
                            placeholder="Search by team name or manager…"
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
                        <p className="py-8 text-center text-sm text-muted-foreground">Loading teams…</p>
                    ) : visible.length === 0 && !error ? (
                        <p className="py-8 text-center text-sm text-muted-foreground">
                            {query ? 'No teams match your search.' : 'No teams yet. Create the first one.'}
                        </p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b text-left text-muted-foreground">
                                        <th className="py-2 pr-4 font-medium">Team</th>
                                        <th className="py-2 pr-4 font-medium">Manager</th>
                                        <th className="py-2 pr-4 font-medium">Members</th>
                                        <th className="py-2 pr-4 font-medium">Created</th>
                                        <th className="py-2 text-right font-medium">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {visible.map((team) => (
                                        <tr
                                            key={team._id}
                                            className="cursor-pointer border-b hover:bg-muted/50"
                                            onClick={() => setSelectedId(team._id)}
                                        >
                                            <td className="py-3 pr-4 font-medium">{team.name}</td>
                                            <td className="py-3 pr-4 text-muted-foreground">{personName(team.managerId)}</td>
                                            <td className="py-3 pr-4">{memberCount(team)}</td>
                                            <td className="py-3 pr-4 text-muted-foreground">{formatDate(team.createdAt)}</td>
                                            <td className="py-3 text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    aria-label={`Edit ${team.name}`}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedId(team._id);
                                                    }}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            <CreateTeamDialog open={createOpen} onOpenChange={setCreateOpen} onCreated={load} />

            <TeamDialog
                teamId={selectedId}
                open={Boolean(selectedId)}
                onOpenChange={(open) => !open && setSelectedId(null)}
                onChanged={load}
            />
        </div>
    );
}

function CreateTeamDialog({ open, onOpenChange, onCreated }) {
    const [name, setName] = useState('');
    const [managerId, setManagerId] = useState('');
    const [users, setUsers] = useState([]);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!open) return;
        setName('');
        setManagerId('');
        setError('');
        getUsers({ page: 1, limit: 100 })
            .then((list) => setUsers(toUserList(list)))
            .catch(() => setUsers([]));
    }, [open]);

    async function handleSubmit(e) {
        e.preventDefault();
        setBusy(true);
        setError('');
        try {
            await createTeam({ name: name.trim(), managerId });
            onCreated();
            onOpenChange(false);
        } catch (err) {
            setError(errorMessage(err, 'Could not create team.'));
        } finally {
            setBusy(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>New team</DialogTitle>
                    <DialogDescription>Name the team and choose its manager.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <label className="block text-sm font-medium">
                        Team name
                        <Input className="mt-1" required value={name} onChange={(e) => setName(e.target.value)} />
                    </label>
                    <label className="block text-sm font-medium">
                        Manager
                        <select
                            required
                            className={`mt-1 ${selectClass}`}
                            value={managerId}
                            onChange={(e) => setManagerId(e.target.value)}
                        >
                            <option value="">Select a manager…</option>
                            {users.map((u) => (
                                <option key={u._id} value={u._id}>
                                    {personName(u)}
                                </option>
                            ))}
                        </select>
                    </label>
                    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={busy || !name.trim() || !managerId}
                            className="bg-blue-600 text-white hover:bg-blue-700"
                        >
                            {busy ? 'Creating…' : 'Create team'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function TeamDialog({ teamId, open, onOpenChange, onChanged }) {
    const [team, setTeam] = useState(null);
    const [name, setName] = useState('');
    const [users, setUsers] = useState([]);
    const [pickUserId, setPickUserId] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');

    const members = team?.members ?? [];
    const excludedIds = new Set([...members.map((m) => m._id), team?.managerId?._id]);
    const candidates = users.filter((u) => !excludedIds.has(u._id));
    const dirty = team && name.trim() !== (team.name ?? '');

    function applyTeam(fresh) {
        setTeam(fresh);
        setName(fresh?.name ?? '');
    }

    useEffect(() => {
        if (!open || !teamId) return;
        setTeam(null);
        setError('');
        setNotice('');
        setPickUserId('');
        getTeamById(teamId)
            .then(applyTeam)
            .catch((err) => setError(errorMessage(err, 'Could not load team.')));
        getUsers({ page: 1, limit: 100 })
            .then((list) => setUsers(toUserList(list)))
            .catch(() => setUsers([]));
    }, [open, teamId]);

    // Runs a write, then reloads the team so the dialog shows the saved state.
    async function run(action, after) {
        setBusy(true);
        setError('');
        setNotice('');
        try {
            const result = await action();
            applyTeam(await getTeamById(teamId));
            onChanged?.();
            after?.(result);
        } catch (err) {
            setError(errorMessage(err, 'Something went wrong. Please try again.'));
        } finally {
            setBusy(false);
        }
    }

    async function handleDelete() {
        if (!window.confirm(`Delete team "${team.name}"? This cannot be undone.`)) return;
        setBusy(true);
        setError('');
        try {
            await deleteTeam(teamId);
            onChanged?.();
            onOpenChange(false);
        } catch (err) {
            setError(errorMessage(err, 'Could not delete team.'));
        } finally {
            setBusy(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>{team?.name ?? 'Team'}</DialogTitle>
                    <DialogDescription>Edit the name and manage members.</DialogDescription>
                </DialogHeader>

                {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
                {notice && <p className="text-sm text-amber-700 dark:text-amber-300">{notice}</p>}
                {!team && !error && <p className="text-sm text-muted-foreground">Loading…</p>}

                {team && (
                    <div className="space-y-6">
                        <section className="space-y-3">
                            <label className="block text-sm font-medium">
                                Team name
                                <Input className="mt-1" value={name} onChange={(e) => setName(e.target.value)} />
                            </label>
                            <p className="text-sm text-muted-foreground">
                                Manager: <span className="text-foreground">{personName(team.managerId)}</span>
                            </p>
                            {dirty && (
                                <Button
                                    size="sm"
                                    disabled={busy || !name.trim()}
                                    onClick={() => run(() => updateTeam(teamId, { name: name.trim() }))}
                                >
                                    Save name
                                </Button>
                            )}
                        </section>

                        <section className="space-y-3">
                            <h3 className="text-sm font-semibold">Members ({members.length})</h3>
                            {members.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No members yet.</p>
                            ) : (
                                <ul className="divide-y rounded-md border">
                                    {members.map((m) => (
                                        <li key={m._id} className="flex items-center justify-between px-3 py-2 text-sm">
                                            <span>{personName(m)}</span>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                aria-label={`Remove ${personName(m)}`}
                                                disabled={busy}
                                                onClick={() =>
                                                    run(
                                                        () => removeTeamMembers(teamId, [m._id]),
                                                        (result) => {
                                                            if (result?.removed === 0) setNotice(`${personName(m)} was not removed.`);
                                                        }
                                                    )
                                                }
                                            >
                                                <UserMinus className="h-4 w-4" />
                                            </Button>
                                        </li>
                                    ))}
                                </ul>
                            )}

                            <div className="flex gap-2">
                                <select
                                    aria-label="Select user to add"
                                    className={`flex-1 ${selectClass}`}
                                    value={pickUserId}
                                    onChange={(e) => setPickUserId(e.target.value)}
                                >
                                    <option value="">Select a user to add…</option>
                                    {candidates.map((u) => (
                                        <option key={u._id} value={u._id}>
                                            {personName(u)}
                                        </option>
                                    ))}
                                </select>
                                <Button
                                    disabled={busy || !pickUserId}
                                    onClick={() => run(() => addTeamMembers(teamId, [pickUserId]), () => setPickUserId(''))}
                                >
                                    <UserPlus className="mr-1 h-4 w-4" />
                                    Add
                                </Button>
                            </div>
                        </section>
                    </div>
                )}

                <DialogFooter className="sm:justify-between">
                    <Button variant="destructive" disabled={busy || !team} onClick={handleDelete}>
                        <Trash2 className="mr-1 h-4 w-4" />
                        Delete team
                    </Button>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
