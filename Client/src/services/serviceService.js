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
        const { data } = await api.get(`/api/requests/${id}`);
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
        return data.url; // cloudinary url
    } catch (err) {
        throw err?.response?.data || { message: 'Upload failed' };
    }
};

// Submit technician progress update (with files)
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

// Get all updates for a request
export const getRequestUpdates = async (requestId) => {
    try {
        const res = await api.get(`/api/admin/requests/${requestId}/updates`);
        return res.data;
    } catch (err) {
        console.error('Failed to load updates:', err);
        return [];
    }
};