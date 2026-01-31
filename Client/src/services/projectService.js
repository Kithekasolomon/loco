import api from '../api/axios';

const BASE = '/api/projects';

export const getProjects = async () => {
    try {
        const { data } = await api.get(BASE);
        return data;
    } catch (err) {
        console.error('Failed to fetch projects:', err);
        throw err.response?.data?.message || 'Failed to load projects';
    }
};

export const getProjectById = async (projectId) => {
    try {
        const { data } = await api.get(`${BASE}/${projectId}`);
        return data;
    } catch (err) {
        throw err.response?.data?.message || 'Failed to load project details';
    }
};

export const createProject = async (projectData) => {
    try {
        const { data } = await api.post(BASE, projectData);
        return data;
    } catch (err) {
        throw err.response?.data?.message || 'Failed to create project';
    }
};

export default {
    getProjects,
    getProjectById,
    createProject,
};