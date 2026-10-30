import api from '@/services/api';

// POST /permission/getAll: flat list with assignedRoles per permission.
export async function getPermissions({ page = 1, limit = 100 } = {}) {
    const res = await api.post('/permission/getAll', {
        filters: { rules: [] },
        sort: { permissionSequence: 1 },
        page,
        limit,
    });
    return res.data.data.permissions ?? [];
}

// GET /permission/getAll/drd: grouped by module, for checkbox lists.
// This response has no `success` wrapper; the array is directly in `data`.
export async function getPermissionGroups() {
    const res = await api.get('/permission/getAll/drd');
    return res.data.data ?? [];
}

// Flat array of keys, e.g. ["view_users", "add_user", ...], for saving a role.
export async function getPermissionKeys() {
    const groups = await getPermissionGroups();
    return groups.flatMap((g) => (g.subPermissions ?? []).map((p) => p.permissionKey));
}
