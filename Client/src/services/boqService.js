// src/services/boqService.js
import api from '../api/axios'

export const getBoqCategories = async (projectId) => {
  try {
    const { data } = await api.get(`/api/boq-categories/project/${projectId}/categories`)
    return data
  } catch (err) {
    console.error('Failed to fetch categories:', err)
    throw err
  }
}

export const createBoqCategory = async (projectId, name) => {
  try {
    const { data } = await api.post(`/api/boq-categories/project/${projectId}/categories`, {
      name: name.trim(),
    })
    return data
  } catch (err) {
    console.error('Failed to create category:', err)
    throw err.response?.data?.message || 'Failed to create category'
  }
}

export const getBoqItemsForCategory = async (projectId, categoryName) => {
 
  try {
    const { data } = await api.get(`/api/boq/project/${projectId}/categories`)
    return data.items.filter((item) => item.category === categoryName) || []
  } catch (err) {
    return []
  }
}
