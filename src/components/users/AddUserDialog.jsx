import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createUser } from '../../services/userService';

const emptyForm = {
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    mobile: '',
    roleId: '6ad61afff9314473b152d15c',
};

export default function AddUserDialog({ open, onOpenChange, onCreated }) {
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        try {
            await createUser({
                username: form.username.trim(),
                email: form.email.trim(),
                password: form.password,
                personalInfo: {
                    firstName: form.firstName.trim(),
                    lastName: form.lastName.trim(),
                    mobile: form.mobile.trim(),
                },
                roleId: form.roleId.trim(),
                allowedIps: [],
            });
            setForm(emptyForm);
            onCreated?.();
            onOpenChange(false);
        } catch (err) {
            setError(
                err.response?.status === 403
                    ? "You don't have permission to create users."
                    : err.response?.data?.error || 'Could not create user.'
            );
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Add user</DialogTitle>
                    <DialogDescription>Create a new portal user and assign a role.</DialogDescription>
                </DialogHeader>

                {error && (
                    <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
                    <Field label="First name"><Input required value={form.firstName} onChange={update('firstName')} /></Field>
                    <Field label="Last name"><Input required value={form.lastName} onChange={update('lastName')} /></Field>
                    <Field label="Username"><Input required value={form.username} onChange={update('username')} /></Field>
                    <Field label="Email"><Input type="email" required value={form.email} onChange={update('email')} /></Field>
                    <Field label="Password"><Input type="password" required value={form.password} onChange={update('password')} /></Field>
                    <Field label="Mobile"><Input value={form.mobile} onChange={update('mobile')} /></Field>
                    <div className="sm:col-span-2">
                        <Field label="Role ID">
                            <Input required value={form.roleId} onChange={update('roleId')} />
                        </Field>
                    </div>

                    <div className="sm:col-span-2 pt-4 border-t flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white">
                            {saving ? 'Creating...' : 'Create user'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function Field({ label, children }) {
    return (
        <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">{label}</label>
            {children}
        </div>
    );
}