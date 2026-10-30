
import api from '@/services/api';

// POST /leadSource/getAll
export async function getLeadSources({ provider = '', page = 1, limit = 50 } = {}) {
    const rules = provider ? [{ field: 'provider', op: 'eq', data: provider }] : [];
    const res = await api.post('/leadSource/getAll', {
        filters: { rules },
        sort: { createdAt: -1 },
        page,
        limit,
    });
    return res.data.data.leadSources ?? [];
}

// GET /leadSource/get/:id (does not include the webhook token)
export async function getLeadSourceById(id) {
    const res = await api.get(`/leadSource/get/${id}`);
    return res.data.data;
}

// POST /leadSource/create
// Returns the webhook path and secret ONLY in this response. Show it once.
export async function createLeadSource(payload) {
    const res = await api.post('/leadSource/create', payload);
    return { message: res.data.message, data: res.data.data };
}

// PUT /leadSource/update/:id. Send only the fields you change.
export async function updateLeadSource(id, payload) {
    const res = await api.put(`/leadSource/update/${id}`, payload);
    return res.data.data;
}

// DELETE /leadSource/delete/:id
export async function deleteLeadSource(id) {
    const res = await api.delete(`/leadSource/delete/${id}`);
    return res.data;
}

