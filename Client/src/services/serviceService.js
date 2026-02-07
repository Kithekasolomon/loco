import api from '../api/axios';

export const getServices = async () => {
    try {
        const { data } = await api.get('/api/services');
        return data;
    } catch (err) {
        console.error('Failed to load services:', err);
        throw err?.response?.data || { message: 'Network error' };
    }
};

export const getMyRequests = async () => {
    try {
        const { data } = await api.get('/api/requests');
        return data;
    } catch (err) {
        console.error('Failed to load requests:', err);
        throw err?.response?.data || { message: 'Network error' };
    }
};

export const createRequest = async (payload) => {
    try {
        const { data } = await api.post('/api/requests', payload);
        return data;
    } catch (err) {
        throw err?.response?.data || { message: 'Failed to create request' };
    }
};

export const getRequestById = async (id) => {
    try {
        const { data } = await  api.get(`/api/service-requests/${id}`)

        return data;
    } catch (err) {
        throw err?.response?.data || { message: 'Request not found' };
    }
};

export const cancelRequest = async (id, reason) => {
    try {
        const { data } = await api.patch(`/api/requests/${id}/cancel`, { reason });
        return data;
    } catch (err) {
        throw err?.response?.data || { message: 'Cannot cancel' };
    }
};

export const completeRequest = async (id, rating, comment) => {
    try {
        const payload = {};
        if (rating) payload.rating = rating;
        if (comment) payload.reviewComment = comment;
        const { data } = await api.patch(`/api/requests/${id}/complete`, payload);
        return data;
    } catch (err) {
        throw err?.response?.data || { message: 'Cannot mark complete' };
    }
};

export const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
        const { data } = await api.post('/api/upload/service-request-image', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return data.url; 
    } catch (err) {
        throw err?.response?.data || { message: 'Upload failed' };
    }
};

export const submitProgressUpdate = async (requestId, data) => {
    const formData = new FormData();
    formData.append('message', data.message);
    formData.append('markAsReady', data.markAsReady);

    if (data.files && data.files.length > 0) {
        data.files.forEach(file => {
            formData.append('files', file);
        });
    }

    try {
        const res = await api.post(`/admin/requests/${requestId}/update`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return res.data;
    } catch (err) {
        throw err?.response?.data || { message: 'Failed to submit update' };
    }
};

export const getRequestUpdates = async (requestId) => {
    try {
        const res = await api.get(`/api/admin/requests/${requestId}/updates`);
        return res.data;
    } catch (err) {
        console.error('Failed to load updates:', err);
        return [];
    }
};
export const requestAssignTechnician = async (requestId, assignedTo) => {
    try {
        const { data } = await api.patch(`/api/requests/${requestId}/assign-self`, { assignedTo });
        return data;
    } catch (err) {
        throw err?.response?.data || { message: 'Failed to request technician assignment' };
    }
};

export const requestConfirmCompletion = async (requestId, payload = {}) => {
    const formData = new FormData();
    if (payload.note) formData.append('note', payload.note);
    if (payload.paymentMethod) formData.append('paymentMethod', payload.paymentMethod);
    if (payload.transactionRef) formData.append('transactionRef', payload.transactionRef);
    if (payload.proofFile) formData.append('file', payload.proofFile);

    try {
        const { data } = await api.patch(`/api/requests/${requestId}/confirm-completion`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return data;
    } catch (err) {
        throw err?.response?.data || { message: 'Failed to submit completion confirmation' };
    }
};

export const getCurrentUser = async () => {
    try {
        const { data } = await api.get('/api/auth/me');
        return data;
    } catch (err) {
        return null;
    }
};
// frontend - serviceService.js
export const getOrganizationUsers = async (roleFilter = null) => {
    let url = '/api/users/organization';
    if (roleFilter) url += `?role=${roleFilter}`;
    const { data } = await api.get(url);
    return data.map(u => ({
        value: u._id,
        label: `${u.firstName || ''} ${u.lastName || ''} (${u.username || u.email || 'no id'})`
    }));
};
// serviceService.js
export const getTechnicians = async () => {
    const { data } = await api.get('/api/users/organization?role=TECHNICIAN');
    return data; // already [{value, label}, ...]
};