import React, { useEffect, useState } from 'react';
import PageHeader from '@/components/common/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import RoleDetailDialog from '@/components/roles/RoleDetailDialog';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Plus, Search, ShieldCheck } from 'lucide-react';
import { getRoles, createRole } from '../services/roleService';

const emptyForm = { name: '', type: 'user', level: '', dataScope: 'own' };

export default function RolesPermissions() {
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [reloadKey, setReloadKey] = useState(0);
    const [selectedRoleId, setSelectedRoleId] = useState(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            setLoading(true);
            setError('');
            try {
                const list = await getRoles();
                if (!cancelled) setRoles(list);
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err.response?.status === 403
                            ? "You don't have permission to view roles."
                            : 'Could not load roles.'
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
    }, [reloadKey]);

    const term = searchTerm.toLowerCase();
    const filtered = roles.filter(
        (r) => (r.name || '').toLowerCase().includes(term) || (r.type || '').toLowerCase().includes(term)
    );

    const adminCount = roles.filter((r) => r.type === 'admin').length;
    const userCount = roles.filter((r) => r.type === 'user').length;

    const stats = [
        { label: 'Total roles', value: roles.length, note: 'All roles in the system' },
        { label: 'Admin roles', value: adminCount, note: 'Type: admin' },
        { label: 'User roles', value: userCount, note: 'Type: user' },
    ];

    const catalog = [...new Set(roles.flatMap((r) => r.permissions || []))].sort();

    return (
        <div className="space-y-6">
            <PageHeader
                title="Roles & Permissions"
                description="Create roles and control what each one can access."
                action={
                    <Button
                        onClick={() => setIsDialogOpen(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white p-5 flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" /> Add role
                    </Button>
                }
            />

            {error && (
                <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {stats.map((s) => (
                    <Card key={s.label} className="shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-foreground">{loading ? '...' : s.value}</div>
                            <p className="text-xs text-muted-foreground mt-1">{s.note}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card className="shadow-sm">
                <CardContent className="p-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by role name or type..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 focus-visible:ring-blue-500"
                        />
                    </div>
                </CardContent>
            </Card>

            <Card className="shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead className="text-muted-foreground font-semibold">Role</TableHead>
                            <TableHead className="text-muted-foreground font-semibold">Type</TableHead>
                            <TableHead className="text-muted-foreground font-semibold">Level</TableHead>
                            <TableHead className="text-muted-foreground font-semibold">Permissions</TableHead>
                            <TableHead className="text-muted-foreground font-semibold">Data scope</TableHead>
                            <TableHead className="text-right text-muted-foreground font-semibold">Actions</TableHead>
                            <TableHead className="text-right text-muted-foreground font-semibold">Created</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    Loading roles...
                                </TableCell>
                            </TableRow>
                        ) : filtered.length > 0 ? (
                            filtered.map((r) => (
                                <TableRow key={r._id} className="hover:bg-muted/50 transition-colors">
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20 flex items-center justify-center shrink-0">
                                                <ShieldCheck className="w-4 h-4" />
                                            </div>
                                            <span className="font-semibold text-foreground">{r.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span
                                            className={`px-2.5 py-1 rounded-full text-xs font-medium border ${r.type === 'admin'
                                                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                                                : 'bg-muted text-muted-foreground border-border'
                                                }`}
                                        >
                                            {r.type}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">{r.level}</TableCell>
                                    <TableCell className="text-muted-foreground">{r.permissions?.length ?? 0}</TableCell>
                                    <TableCell className="text-muted-foreground capitalize">{r.dataScope || 'own'}</TableCell>
                                    <TableCell className="text-right text-sm text-muted-foreground">
                                        {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—'}
                                    </TableCell>

                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-blue-600 dark:text-blue-400 hover:text-blue-500 hover:bg-blue-500/10"
                                            onClick={() => {
                                                setSelectedRoleId(r._id);
                                                setIsDetailOpen(true);
                                            }}
                                        >
                                            Edit
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    No roles found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </Card>

            <CreateRoleDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                onCreated={() => setReloadKey((k) => k + 1)}
            />
            <RoleDetailDialog
                roleId={selectedRoleId}
                catalog={catalog}
                open={isDetailOpen}
                onOpenChange={setIsDetailOpen}
                onChanged={() => setReloadKey((k) => k + 1)}
            />

        </div>
    );
}

function CreateRoleDialog({ open, onOpenChange, onCreated }) {
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        try {
            await createRole({
                name: form.name.trim(),
                type: form.type,
                level: Number(form.level),
                permissions: [], // permission checklist comes after the Permissions catalog is integrated
                dataScope: form.dataScope,
            });
            setForm(emptyForm);
            onCreated?.();
            onOpenChange(false);
        } catch (err) {
            setError(
                err.response?.data?.error ||
                (err.response?.status === 403 ? "You don't have permission to create roles." : 'Could not create role.')
            );
        } finally {
            setSaving(false);
        }
    };

    const selectClass =
        'w-full h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500';

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                    <DialogTitle>Add role</DialogTitle>
                    <DialogDescription>Create a role. You can set its permissions next.</DialogDescription>
                </DialogHeader>

                {error && (
                    <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4 py-2">
                    <div className="space-y-1.5">
                        <label htmlFor='Role name' className="text-xs font-medium text-muted-foreground">Role name</label>
                        <Input required value={form.name} onChange={update('name')} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label htmlFor='Type' className="text-xs font-medium text-muted-foreground">Type</label>
                            <select className={selectClass} value={form.type} onChange={update('type')}>
                                <option value="user">User</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label htmlFor='Level' className="text-xs font-medium text-muted-foreground">Level</label>
                            <Input type="number" required min="1" value={form.level} onChange={update('level')} />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label htmlFor='Data scope' className="text-xs font-medium text-muted-foreground">Data scope</label>
                        <select className={selectClass} value={form.dataScope} onChange={update('dataScope')}>
                            <option value="own">Own records</option>
                            <option value="team">Team</option>
                            <option value="all">All</option>
                        </select>
                    </div>

                    <div className="pt-4 border-t flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white">
                            {saving ? 'Creating...' : 'Create role'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

