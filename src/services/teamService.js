
import api from '@/services/api';

// Paths confirmed from Postman: create, getAll, get, update, delete, members/:id/remove.
// "addMembers" is NOT confirmed yet. Check the "Add members" request URL in Postman.
const ENDPOINTS = {
    list: '/team/getAll',
    create: '/team/create',
    get: (id) => `/team/get/${id}`,
    update: (id) => `/team/update/${id}`,
    remove: (id) => `/team/delete/${id}`,
    addMembers: (id) => `/team/members/${id}/add`,
    removeMembers: (id) => `/team/members/${id}/remove`,
};

// POST /team/getAll: returns data.teams. managerId is a populated user object here.
export async function getTeams({ page = 1, limit = 100 } = {}) {
    const res = await api.post(ENDPOINTS.list, {
        filters: { rules: [] },
        sort: { createdAt: -1 },
        page,
        limit,
    });
    return res.data.data.teams ?? [];
}

// GET /team/get/:id: returns the team with a populated `members` array.
export async function getTeamById(id) {
    const res = await api.get(ENDPOINTS.get(id));
    return res.data.data;
}

// POST /team/create: body is { name, managerId }.
export async function createTeam({ name, managerId }) {
    const res = await api.post(ENDPOINTS.create, { name, managerId });
    return res.data.data;
}

// PUT /team/update/:id: send only the changed fields, e.g. { name }.
export async function updateTeam(id, payload) {
    const res = await api.put(ENDPOINTS.update(id), payload);
    return res.data.data;
}

// DELETE /team/delete/:id
export async function deleteTeam(id) {
    const res = await api.delete(ENDPOINTS.remove(id));
    return res.data;
}

// PUT /team/members/:id/add (path not confirmed yet)
export async function addTeamMembers(id, userIds) {
    const res = await api.put(ENDPOINTS.addMembers(id), { userIds });
    return res.data;
}

// PUT /team/members/:id/remove: returns { removed, notInTeam }.
export async function removeTeamMembers(id, userIds) {
    const res = await api.put(ENDPOINTS.removeMembers(id), { userIds });
    return res.data.data;
}
