import api from '@/services/api';
 
// POST /lender/getAll: returns { lenders, pagination }.
export async function getLenders({ page = 1, limit = 100 } = {}) {
    const res = await api.post('/lender/getAll', {
        filters: { rules: [] },
        sort: { createdAt: -1 },
        page,
        limit,
    });
    return {
        lenders: res.data.data.lenders ?? [],
        pagination: res.data.data.pagination,
    };
}