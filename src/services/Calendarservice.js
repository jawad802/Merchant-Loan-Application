import api from '@/services/api';
 
export async function getCalendarActivities({ from, to }) {
    const res = await api.get('/lead/calendar', { params: { from, to } });
    return res.data.data;
}