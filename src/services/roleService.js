import API from './api';

export async function getRoles({ page = 1, limit = 20 } = {}) {
    const { data } = await API.post('/role/getAll', {
        filters: { rules: [] },
        sort: { createdAt: -1 },
        page,
        limit,
    });
    return data?.data?.roles ?? [];
}

export async function createRole(payload) {
    const { data } = await API.post('/role/create', payload);
    return data;
}

export async function getRoleById(id) {
    const { data } = await API.get(`/role/get/${id}`);
    return data?.data ?? null;
}

// Shape is a guess from the drd response; confirm before relying on it.
export async function getRolesDropdown() {
    const { data } = await API.get('/role/getAll/drd');
    return data?.data?.roles ?? [];
}

export async function updateRole(id, payload) {
    const { data } = await API.put(`/role/update/${id}`, payload);
    return data?.role ?? null;
}

export async function updateRolePermissions(id, permissions) {
    const { data } = await API.put(`/role/updatePermissions/${id}`, { permissions });
    return data?.role ?? null;
}

export async function deleteRole(id) {
    const { data } = await API.delete(`/role/delete/${id}`);
    return data;
}

export async function getMyPermissions() {
    const { data } = await API.get('/role/getPermission');
    return data?.rolePermissions ?? [];
}
