import api from '../api/axios';

export const getOrganizationUsers = async () => {
    try {
        const { data } = await api.get('/api/users/organization');
        return data.map(u => ({
            value: u._id,
            label: `${u.firstName || ''} ${u.lastName || ''} (${u.username || u.email || 'no identifier'})`,
        }));
    } catch (err) {
        console.error("Failed to load organization users:", err?.response?.data || err);
        return [];
    }
};