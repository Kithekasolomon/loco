import api from '../api/axios';

const BASE = '/api/daily-reports';
// 1. Create draft
export const createDailyReportDraft = async (projectId, payload) => {
    try {
        const { data } = await api.post(`${BASE}/projects/${projectId}/daily-reports`, payload);
        return data.data;
    } catch (err) {
        throw err.response?.data?.message || 'Failed to create draft';
    }
};


// 2. Update draft
export const updateDailyReportDraft = async (reportId, payload) => {
    try {
        const { data } = await api.put(`${BASE}/daily-reports/${reportId}`, payload);
        return data.data;
    } catch (err) {
        throw err.response?.data?.message || 'Failed to update draft';
    }
};

// 3. Submit for approval
export const submitDailyReport = async (reportId) => {
    try {
        const { data } = await api.post(`${BASE}/daily-reports/${reportId}/submit`);
        return data;
    } catch (err) {
        throw err.response?.data?.message || 'Failed to submit report';
    }
};

// 4. Review (approve/reject)
export const reviewDailyReport = async (reportId, { status, adminComment }) => {
    try {
        const { data } = await api.put(`${BASE}/daily-reports/${reportId}/review`, {
            status,
            adminComment,
        });
        return data;
    } catch (err) {
        throw err.response?.data?.message || 'Failed to review report';
    }
};

// 5. Get all reports for project (with filters)
export const getProjectDailyReports = async (projectId, params = {}) => {
    try {
        console.log(`Fetching reports for project: ${projectId}`, params);
        const { data } = await api.get(`/api/daily-reports/projects/${projectId}/daily-reports`, { params });
        console.log("Reports response:", data);
        return data;
    } catch (err) {
        console.error("getProjectDailyReports failed:", {
            status: err.response?.status,
            data: err.response?.data,
            message: err.message,
        });
        throw err.response?.data?.message || err.message || 'Failed to fetch reports';
    }
};

// 6. Get my reports
export const getMyDailyReports = async () => {
    try {
        const { data } = await api.get(`${BASE}/my`);
        return data;
    } catch (err) {
        throw err.response?.data?.message || 'Failed to fetch my reports';
    }
};

// 7. Get weekly aggregate
export const getWeeklyAggregate = async (projectId, { year, week }) => {
    try {
        const { data } = await api.get(`/api/daily-reports/projects/${projectId}/weekly-report`, {
            params: { year, week },
        });
        return data;
    } catch (err) {
        throw err.response?.data?.message || 'Failed to fetch weekly summary';
    }
};

// 8. Upload photos / receipts
export const uploadReportFiles = async (reportId, files, type = 'sitePhotos', expenseId = null) => {
    const formData = new FormData();

    if (Array.isArray(files)) {
        files.forEach(file => formData.append('files', file));
    } else {
        formData.append('file', files);
    }

    formData.append('type', type);
    if (expenseId) formData.append('expenseId', expenseId);

    try {
        const { data } = await api.post(
            `${BASE}/daily-reports/${reportId}/upload`,
            formData,
            {
                headers: { 'Content-Type': 'multipart/form-data' },
            }
        );
        return data;
    } catch (err) {
        throw err.response?.data?.message || 'File upload failed';
    }
};