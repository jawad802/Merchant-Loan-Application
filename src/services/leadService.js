import api from '@/services/api';

// POST /lead/statusCounts: { statuses: [{ status, label, count }], total }
export async function getLeadStatusCounts(filters = {}) {
    const res = await api.post('/lead/statusCounts', { filters });
    return res.data.data;
}

// POST /lead/getAll: newest leads first.
export async function getRecentLeads({ limit = 5 } = {}) {
    const res = await api.post('/lead/getAll', {
        filters: {},
        sortBy: 'createdAt',
        sortOrder: 'desc',
        page: 1,
        limit,
    });
    return res.data.data.leads ?? [];
}
