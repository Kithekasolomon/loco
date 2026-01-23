// src/views/pages/projectManagement/BoqView/hooks/useBoqData.js
import { useState, useEffect } from 'react'
import api from '../../../../../api/axios'
import { getBoqCategories } from '../../../../../services/boqService'

export const useBoqData = (projectId) => {
  const [project, setProject] = useState(null)
  const [categories, setCategories] = useState([]) // real categories + items
  const [grandSummary, setGrandSummary] = useState({
    totalContractSum: 0,
    valuedToDate: 0,
    percentageComplete: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchData = async () => {
    if (!projectId) return

    try {
      setLoading(true)
      setError(null)

      // Fetch project + BOQ summary (still useful)
      const projectRes = await api.get(`/api/projects/${projectId}`)
      setProject(projectRes.data.project)
      setGrandSummary(projectRes.data.boq?.summary || grandSummary)

      // Fetch real categories (with order)
      const catRes = await getBoqCategories(projectId)

      // Enrich each category with its items (from the same project endpoint for now)
      const enriched = await Promise.all(
        catRes.map(async (cat) => {
          const items =
            projectRes.data.boq?.items?.filter((item) => item.category === cat.name) || []

          const total = items.reduce((sum, i) => sum + (i.total || 0), 0)
          const valued = items.reduce((sum, i) => sum + (i.valuedAmount || 0), 0)
          const percentage = total > 0 ? Number(((valued / total) * 100).toFixed(2)) : 0

          return {
            _id: cat._id,
            name: cat.name,
            order: cat.order || 9999,
            items,
            summary: { total, valued, percentage },
          }
        }),
      )

      // Sort by order
      enriched.sort((a, b) => a.order - b.order)

      setCategories(enriched)
    } catch (err) {
      console.error('BOQ data fetch failed:', err)
      setError('Failed to load BOQ categories and items')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [projectId])

  return {
    project,
    categories,
    grandSummary,
    loading,
    error,
    fetchData,
    setCategories,
  }
}
