import React, { useEffect, useState } from 'react';
import PageHeader from '@/components/common/PageHeader';
import AddUserDialog from '@/components/users/AddUserDialog';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Plus, Search, Mail, ShieldCheck, Pencil, KeyRound, UserCog, Trash2 } from 'lucide-react';
import {
    getUsers,
    getUserById,
    updateUser,
    changeUserPassword,
    assignUserRole,
    deleteUser,
} from '../services/userService';

const MIN_PASSWORD_LENGTH = 8;

const errorBox =
    'p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md';

export default function Users() {
    // ---- list state ----
    const [users, setUsers] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [reloadKey, setReloadKey] = useState(0);

    // ---- edit user dialog state (GET /user/get/:id + PUT /user/update/:id) ----
    const [editOpen, setEditOpen] = useState(false);
    const [editUserId, setEditUserId] = useState(null);
    const [editAccount, setEditAccount] = useState(null);
    const [editForm, setEditForm] = useState({ firstName: '', lastName: '', mobile: '' });
    const [editLoading, setEditLoading] = useState(false);
    const [editSaving, setEditSaving] = useState(false);
    const [editError, setEditError] = useState('');

    // ---- change password dialog state (PUT /user/change_password/:id) ----
    const [pwOpen, setPwOpen] = useState(false);
    const [pwUser, setPwUser] = useState(null);
    const [pwValue, setPwValue] = useState('');
    const [pwConfirm, setPwConfirm] = useState('');
    const [pwSaving, setPwSaving] = useState(false);
    const [pwError, setPwError] = useState('');

    // ---- assign role dialog state (PUT /user/assign_role/:id) ----
    const [roleOpen, setRoleOpen] = useState(false);
    const [roleUser, setRoleUser] = useState(null);
    const [selectedRoleId, setSelectedRoleId] = useState('');
    const [roleSaving, setRoleSaving] = useState(false);
    const [roleError, setRoleError] = useState('');

    // ---- delete dialog state (DELETE /user/delete/:id) ----
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState('');

    const reload = () => setReloadKey((k) => k + 1);

    // GET /user/drd
    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            setLoading(true);
            setError('');
            try {
                const result = await getUsers();
                if (!cancelled) {
                    setUsers(result.users);
                    setTotalCount(result.totalCount);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err.response?.status === 403
                            ? "You don't have permission to view users."
                            : 'Could not load users. Check your connection.'
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

    // Auto-hide success banner
    useEffect(() => {
        if (!success) return;
        const t = setTimeout(() => setSuccess(''), 4000);
        return () => clearTimeout(t);
    }, [success]);

    // ---------- Edit user ----------
    const openEdit = async (userId) => {
        setEditUserId(userId);
        setEditOpen(true);
        setEditError('');
        setEditAccount(null);
        setEditForm({ firstName: '', lastName: '', mobile: '' });
        setEditLoading(true);
        try {
            // GET /user/get/:userId
            const user = await getUserById(userId);
            setEditAccount({ username: user.username, email: user.email });
            setEditForm({
                firstName: user.personalInfo?.firstName ?? '',
                lastName: user.personalInfo?.lastName ?? '',
                mobile: user.personalInfo?.mobile ?? '',
            });
        } catch (err) {
            setEditError(err.response?.data?.message || 'Could not load this user.');
        } finally {
            setEditLoading(false);
        }
    };

    const handleEditChange = (field) => (e) =>
        setEditForm((prev) => ({ ...prev, [field]: e.target.value }));

    const saveEdit = async () => {
        if (!editForm.firstName.trim() || !editForm.lastName.trim()) {
            setEditError('First name and last name are required.');
            return;
        }
        setEditSaving(true);
        setEditError('');
        try {
            // PUT /user/update/:userId
            await updateUser(editUserId, {
                personalInfo: {
                    firstName: editForm.firstName.trim(),
                    lastName: editForm.lastName.trim(),
                    mobile: editForm.mobile.trim(),
                },
            });
            setEditOpen(false);
            setSuccess('User updated successfully');
            reload();
        } catch (err) {
            setEditError(err.response?.data?.message || 'Could not save changes. Try again.');
        } finally {
            setEditSaving(false);
        }
    };

    // ---------- Change password ----------
    const openPassword = (user) => {
        setPwUser(user);
        setPwValue('');
        setPwConfirm('');
        setPwError('');
        setPwOpen(true);
    };

    const savePassword = async () => {
        if (pwValue.length < MIN_PASSWORD_LENGTH) {
            setPwError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
            return;
        }
        if (pwValue !== pwConfirm) {
            setPwError('Passwords do not match.');
            return;
        }
        setPwSaving(true);
        setPwError('');
        try {
            // PUT /user/change_password/:userId
            const result = await changeUserPassword(pwUser._id, pwValue);
            setPwOpen(false);
            setSuccess(result?.message || 'Password changed successfully');
        } catch (err) {
            setPwError(err.response?.data?.message || 'Could not change the password. Try again.');
        } finally {
            setPwSaving(false);
        }
    };

    // ---------- Assign role ----------
    const openAssignRole = (user) => {
        setRoleUser(user);
        setSelectedRoleId(user.roleId?._id || '');
        setRoleError('');
        setRoleOpen(true);
    };

    const saveRole = async () => {
        if (!selectedRoleId) {
            setRoleError('Select a role.');
            return;
        }
        setRoleSaving(true);
        setRoleError('');
        try {
            // PUT /user/assign_role/:userId
            const result = await assignUserRole(roleUser._id, selectedRoleId);
            setRoleOpen(false);
            setSuccess(result?.message || 'Role assigned successfully');
            reload();
        } catch (err) {
            setRoleError(err.response?.data?.message || 'Could not assign the role. Try again.');
        } finally {
            setRoleSaving(false);
        }
    };

    // ---------- Delete user ----------
    const openDelete = (user) => {
        setDeleteTarget(user);
        setDeleteError('');
        setDeleteOpen(true);
    };

    const confirmDelete = async () => {
        setDeleting(true);
        setDeleteError('');
        try {
            // DELETE /user/delete/:userId
            const result = await deleteUser(deleteTarget._id);
            setDeleteOpen(false);
            setSuccess(result?.message || 'User deleted successfully');
            reload();
        } catch (err) {
            setDeleteError(err.response?.data?.message || 'Could not delete the user. Try again.');
        } finally {
            setDeleting(false);
        }
    };

    // ---------- Derived list data ----------
    const term = searchTerm.toLowerCase();
    const filtered = users.filter((u) => {
        const name = `${u.personalInfo?.firstName ?? ''} ${u.personalInfo?.lastName ?? ''}`.toLowerCase();
        return (
            name.includes(term) ||
            (u.username || '').toLowerCase().includes(term) ||
            (u.email || '').toLowerCase().includes(term)
        );
    });

    // Role choices, built from the roles already attached to users.
    // (Swap this for a getRoles() call if you want roles that have no users yet.)
    const roleOptions = Array.from(
        new Map(users.filter((u) => u.roleId?._id).map((u) => [u.roleId._id, u.roleId.name])).entries()
    ).map(([id, name]) => ({ id, name }));

    const activeCount = users.filter((u) => u.isActive).length;
    const inactiveCount = users.length - activeCount;

    const stats = [
        { label: 'Total users', value: totalCount, note: 'Registered accounts' },
        { label: 'Active', value: activeCount, note: 'Can sign in' },
        { label: 'Inactive', value: inactiveCount, note: 'Access disabled' },
    ];

    const nameOf = (u) => `${u?.personalInfo?.firstName ?? ''} ${u?.personalInfo?.lastName ?? ''}`.trim();
    const pwName = `${pwUser?.personalInfo?.firstName ?? ''} ${pwUser?.personalInfo?.lastName ?? ''}`.trim();

    return (
        <div className="space-y-6">
            <PageHeader
                title="Users"
                description="Manage portal users, their roles, and access."
                action={
                    <Button
                        onClick={() => setIsDialogOpen(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white p-5 flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" /> Add user
                    </Button>
                }
            />

            {error && <div className={errorBox}>{error}</div>}

            {success && (
                <div className="p-3 text-sm text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-md">
                    {success}
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
                            placeholder="Search by name, username, or email..."
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
                            <TableHead className="text-muted-foreground font-semibold">User</TableHead>
                            <TableHead className="text-muted-foreground font-semibold">Email</TableHead>
                            <TableHead className="text-muted-foreground font-semibold">Role</TableHead>
                            <TableHead className="text-muted-foreground font-semibold">Status</TableHead>
                            <TableHead className="text-muted-foreground font-semibold">Created</TableHead>
                            <TableHead className="text-right text-muted-foreground font-semibold">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    Loading users...
                                </TableCell>
                            </TableRow>
                        ) : filtered.length > 0 ? (
                            filtered.map((u) => {
                                const first = u.personalInfo?.firstName || '';
                                const last = u.personalInfo?.lastName || '';
                                const initials = `${first.charAt(0)}${last.charAt(0)}` || '?';
                                return (
                                    <TableRow key={u._id} className="hover:bg-muted/50 transition-colors">
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20 flex items-center justify-center font-bold text-xs shrink-0">
                                                    {initials}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-foreground">
                                                        {first} {last}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">@{u.username}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            <span className="flex items-center gap-1.5">
                                                <Mail className="w-3.5 h-3.5" /> {u.email}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20">
                                                <ShieldCheck className="w-3 h-3" /> {u.roleId?.name || 'No role'}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <span
                                                className={`px-2.5 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1.5 border ${u.isActive
                                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                                    : 'bg-muted text-muted-foreground border-border'
                                                    }`}
                                            >
                                                <span
                                                    className={`w-1.5 h-1.5 rounded-full ${u.isActive ? 'bg-emerald-500' : 'bg-muted-foreground'
                                                        }`}
                                                />
                                                {u.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    title="Edit user"
                                                    aria-label={`Edit ${first} ${last}`}
                                                    onClick={() => openEdit(u._id)}
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    title="Change password"
                                                    aria-label={`Change password for ${first} ${last}`}
                                                    onClick={() => openPassword(u)}
                                                >
                                                    <KeyRound className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    title="Assign role"
                                                    aria-label={`Assign role to ${first} ${last}`}
                                                    onClick={() => openAssignRole(u)}
                                                >
                                                    <UserCog className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    title="Delete user"
                                                    aria-label={`Delete ${first} ${last}`}
                                                    className="text-destructive hover:text-destructive"
                                                    onClick={() => openDelete(u)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    No users found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </Card>

            <AddUserDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                onCreated={reload}
            />

            {/* Edit user dialog */}
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Edit user</DialogTitle>
                        <DialogDescription>
                            {editAccount
                                ? `${editAccount.username} · ${editAccount.email}`
                                : 'Update personal details.'}
                        </DialogDescription>
                    </DialogHeader>

                    {editError && <div className={errorBox}>{editError}</div>}

                    {editLoading ? (
                        <p className="py-6 text-center text-sm text-muted-foreground">Loading user...</p>
                    ) : (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium" htmlFor="edit-first">First name</label>
                                    <Input id="edit-first" value={editForm.firstName} onChange={handleEditChange('firstName')} />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium" htmlFor="edit-last">Last name</label>
                                    <Input id="edit-last" value={editForm.lastName} onChange={handleEditChange('lastName')} />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium" htmlFor="edit-mobile">Mobile</label>
                                <Input id="edit-mobile" value={editForm.mobile} onChange={handleEditChange('mobile')} />
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditOpen(false)} disabled={editSaving}>
                            Cancel
                        </Button>
                        <Button
                            onClick={saveEdit}
                            disabled={editLoading || editSaving}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            {editSaving ? 'Saving...' : 'Save changes'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Change password dialog */}
            <Dialog open={pwOpen} onOpenChange={setPwOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Change password</DialogTitle>
                        <DialogDescription>
                            Set a new password for {pwName || pwUser?.username}.
                        </DialogDescription>
                    </DialogHeader>

                    {pwError && <div className={errorBox}>{pwError}</div>}

                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium" htmlFor="new-password">New password</label>
                            <Input
                                id="new-password"
                                type="password"
                                autoComplete="new-password"
                                value={pwValue}
                                onChange={(e) => setPwValue(e.target.value)}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium" htmlFor="confirm-password">Confirm password</label>
                            <Input
                                id="confirm-password"
                                type="password"
                                autoComplete="new-password"
                                value={pwConfirm}
                                onChange={(e) => setPwConfirm(e.target.value)}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setPwOpen(false)} disabled={pwSaving}>
                            Cancel
                        </Button>
                        <Button
                            onClick={savePassword}
                            disabled={pwSaving}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            {pwSaving ? 'Saving...' : 'Update password'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Assign role dialog */}
            <Dialog open={roleOpen} onOpenChange={setRoleOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Assign role</DialogTitle>
                        <DialogDescription>
                            Choose a role for {nameOf(roleUser) || roleUser?.username}.
                        </DialogDescription>
                    </DialogHeader>

                    {roleError && <div className={errorBox}>{roleError}</div>}

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium" htmlFor="assign-role">Role</label>
                        <select
                            id="assign-role"
                            value={selectedRoleId}
                            onChange={(e) => setSelectedRoleId(e.target.value)}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                        >
                            <option value="" disabled>Select a role</option>
                            {roleOptions.map((r) => (
                                <option key={r.id} value={r.id}>{r.name}</option>
                            ))}
                        </select>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRoleOpen(false)} disabled={roleSaving}>
                            Cancel
                        </Button>
                        <Button
                            onClick={saveRole}
                            disabled={roleSaving}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            {roleSaving ? 'Saving...' : 'Assign role'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete user dialog */}
            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Delete user</DialogTitle>
                        <DialogDescription>
                            Delete {nameOf(deleteTarget) || deleteTarget?.username} ({deleteTarget?.email})?
                            They will no longer be able to sign in.
                        </DialogDescription>
                    </DialogHeader>

                    {deleteError && <div className={errorBox}>{deleteError}</div>}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={deleting}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={confirmDelete} disabled={deleting}>
                            {deleting ? 'Deleting...' : 'Delete user'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
