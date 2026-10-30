import React, { useEffect, useMemo, useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, ShieldCheck, Trash2 } from 'lucide-react';
import {
    getRoleById,
    updateRole,
    updateRolePermissions,
    deleteRole,
} from '../../services/roleService';
import { getPermissionGroups } from '../../services/permissionService';

const FIELDS = ['name', 'type', 'level', 'dataScope'];
const VERBS = ['view_', 'add_', 'edit_', 'delete_', 'manage_', 'assign_', 'change_'];

function moduleOf(permission) {
    const verb = VERBS.find((v) => permission.startsWith(v));
    const base = verb ? permission.slice(verb.length) : permission;
    return base.replace(/s$/, '');
}

function groupPermissions(list) {
    const groups = {};
    list.forEach((p) => {
        const key = moduleOf(p);
        (groups[key] ||= []).push(p);
    });
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
}

function readableError(err, fallback) {
    if (err.response?.status === 403) return "You don't have permission to change roles.";
    if (err.response?.status === 401) return 'Your session expired. Please log in again.';
    return err.response?.data?.error || fallback;
}

const selectClass =
    'w-full h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500';

export default function RoleDetailDialog({ roleId, catalog = [], open, onOpenChange, onChanged }) {
    const [original, setOriginal] = useState(null);
    const [form, setForm] = useState(null);
    const [selected, setSelected] = useState(new Set());
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [catalogKeys, setCatalogKeys] = useState([]);

    useEffect(() => {
        if (!open || !roleId) return;
        let cancelled = false;

        const load = async () => {
            setLoading(true);
            setError('');
            setOriginal(null);
            setForm(null);
            try {
                const role = await getRoleById(roleId);
                if (cancelled || !role) return;
                const base = {
                    name: role.name || '',
                    type: role.type || 'user',
                    level: String(role.level ?? ''),
                    dataScope: role.dataScope || 'own',
                };
                setOriginal({ ...base, permissions: role.permissions || [], isDeletable: role.isDeletable });
                setForm(base);
                setSelected(new Set(role.permissions || []));
            } catch (err) {
                if (!cancelled) setError(readableError(err, 'Could not load this role.'));
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        load();
        return () => {
            cancelled = true;
        };
    }, [open, roleId]);

    useEffect(() => {
        if (!open) return;
        getPermissionGroups()
            .then((groups) => {
                const keys = groups.flatMap((g) => [
                    g.permissionKey,
                    ...(g.subPermissions || []).map((p) => p.permissionKey),
                ]);
                setCatalogKeys(keys);
            })
            .catch(() => setCatalogKeys([]));
    }, [open]);

    const options = useMemo(
        () => [...new Set([...catalogKeys, ...catalog, ...(original?.permissions || [])])].sort(),
        [catalogKeys, catalog, original]
    );

    const fieldsChanged =
        !!form && !!original && FIELDS.some((k) => String(form[k]) !== String(original[k]));
    const permsChanged =
        !!original &&
        (original.permissions.length !== selected.size || original.permissions.some((p) => !selected.has(p)));
    const dirty = fieldsChanged || permsChanged;

    const togglePerm = (p) =>
        setSelected((prev) => {
            const next = new Set(prev);
            next.has(p) ? next.delete(p) : next.add(p);
            return next;
        });

    const toggleGroup = (list) =>
        setSelected((prev) => {
            const next = new Set(prev);
            const allOn = list.every((p) => next.has(p));
            list.forEach((p) => (allOn ? next.delete(p) : next.add(p)));
            return next;
        });

    const handleSave = async () => {
        setSaving(true);
        setError('');
        try {
            if (fieldsChanged) {
                const patch = {};
                FIELDS.forEach((k) => {
                    if (String(form[k]) !== String(original[k])) {
                        patch[k] = k === 'level' ? Number(form[k]) : form[k];
                    }
                });
                await updateRole(roleId, patch);
            }
            if (permsChanged) {
                await updateRolePermissions(roleId, [...selected]);
            }
            onChanged?.();
            onOpenChange(false);
        } catch (err) {
            setError(readableError(err, 'Could not save changes.'));
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm(`Delete role "${original.name}"? This cannot be undone.`)) return;
        setSaving(true);
        setError('');
        try {
            await deleteRole(roleId);
            onChanged?.();
            onOpenChange(false);
        } catch (err) {
            setError(readableError(err, 'Could not delete role.'));
        } finally {
            setSaving(false);
        }
    };

    const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[680px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-primary" />
                        {original?.name || 'Role details'}
                    </DialogTitle>
                    <DialogDescription>
                        Edit the role's details and what it can access.
                    </DialogDescription>
                </DialogHeader>

                {error && (
                    <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="py-10 text-center text-muted-foreground flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" /> Loading role...
                    </div>
                ) : form ? (
                    <div className="space-y-6 py-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5 sm:col-span-2">
                                <label className="text-xs font-medium text-muted-foreground">Role name</label>
                                <Input value={form.name} onChange={update('name')} required />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-muted-foreground">Type</label>
                                <select className={selectClass} value={form.type} onChange={update('type')}>
                                    <option value="user">User</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-muted-foreground">Level</label>
                                <Input type="number" min="1" value={form.level} onChange={update('level')} />
                            </div>
                            <div className="space-y-1.5 sm:col-span-2">
                                <label className="text-xs font-medium text-muted-foreground">Data scope</label>
                                <select className={selectClass} value={form.dataScope} onChange={update('dataScope')}>
                                    <option value="own">Own records</option>
                                    <option value="team">Team</option>
                                    <option value="all">All</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-semibold">Permissions</h4>
                                <span className="text-xs text-muted-foreground">{selected.size} selected</span>
                            </div>

                            {options.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No permissions available.</p>
                            ) : (
                                groupPermissions(options).map(([module, list]) => {
                                    const allOn = list.every((p) => selected.has(p));
                                    return (
                                        <div key={module} className="space-y-2 p-3 rounded-lg border bg-muted/30">
                                            <div className="flex items-center justify-between">
                                                <p className="text-xs font-semibold capitalize text-foreground">
                                                    {module.replace(/_/g, ' ')}
                                                </p>
                                                <button
                                                    type="button"
                                                    onClick={() => toggleGroup(list)}
                                                    className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
                                                >
                                                    {allOn ? 'Clear all' : 'Select all'}
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                                {list.map((p) => (
                                                    <label
                                                        key={p}
                                                        className="flex items-center gap-2 text-xs px-2 py-1.5 rounded-md border bg-background cursor-pointer hover:bg-muted/50"
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={selected.has(p)}
                                                            onChange={() => togglePerm(p)}
                                                            className="h-3.5 w-3.5 accent-blue-600"
                                                        />
                                                        <span className="font-mono">{p}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        <div className="pt-4 border-t flex items-center justify-between gap-2">
                            {original?.isDeletable ? (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={handleDelete}
                                    disabled={saving}
                                    className="text-destructive hover:bg-destructive/10 gap-1.5"
                                >
                                    <Trash2 className="h-4 w-4" /> Delete role
                                </Button>
                            ) : (
                                <span className="text-xs text-muted-foreground">System role, cannot be deleted</span>
                            )}
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={() => onOpenChange(false)}>
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleSave}
                                    disabled={!dirty || saving}
                                    className="bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                    {saving ? 'Saving...' : 'Save changes'}
                                </Button>
                            </div>
                        </div>
                    </div>
                ) : null}
            </DialogContent>
        </Dialog>
    );
}
