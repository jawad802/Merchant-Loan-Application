import api from '@/services/api';
export async function getDashboardSummary({ from, to }) {
    const res = await api.post('/dashboard/summary', { from, to });
    return res.data.data;
}