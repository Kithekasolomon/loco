import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CForm,
  CFormLabel,
  CFormInput,
  CFormSelect,
  CButton,
  CSpinner,
  CAlert,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilArrowLeft, cilSave } from '@coreui/icons'
import api from '../../../../api/axios'
import { useAuth } from '../../../../context/AuthContext'
const EditProject = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  const [project, setProject] = useState(null)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const [formData, setFormData] = useState({
    name: '',
    location: '',
    projectLead: '',
    timelineStart: '',
    timelineEnd: '',
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projRes, usersRes] = await Promise.all([
          api.get(`/api/projects/${id}`),
          api.get('/api/users'),
        ])
        setProject(projRes.data.project)
        setUsers(usersRes.data)
        setFormData({
          name: projRes.data.project.name,
          location: projRes.data.project.location,
          projectLead: projRes.data.project.projectLead._id,
          timelineStart: projRes.data.project.timelineStart.split('T')[0],
          timelineEnd: projRes.data.project.timelineEnd.split('T')[0],
        })
      } catch (err) {
        setError('Failed to load project data')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setSubmitting(true)
      setError(null)
      setSuccess(null)

      await api.put(`/api/projects/request-edit/${id}`, formData)

      setSuccess('Edit request submitted successfully! Awaiting Super Admin approval.')
      setTimeout(() => navigate('/projects'), 2000)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit edit request')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-5">
        <CSpinner /> Loading...
      </div>
    )
  }

  return (
    <CRow>
      <CCol lg={8} className="mx-auto">
        <CCard className="shadow-sm">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <Link to="/projects">
              <CButton color="light" size="sm">
                <CIcon icon={cilArrowLeft} /> Back
              </CButton>
            </Link>
            <strong>Edit Project Request</strong>
            <div />
          </CCardHeader>
          <CCardBody>
            {error && (
              <CAlert color="danger" dismissible onClose={() => setError(null)}>
                {error}
              </CAlert>
            )}
            {success && (
              <CAlert color="success" dismissible onClose={() => setSuccess(null)}>
                {success}
              </CAlert>
            )}

            <CForm onSubmit={handleSubmit}>
              <CRow className="g-3">
                <CCol md={12}>
                  <CFormLabel>Project Name</CFormLabel>
                  <CFormInput
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </CCol>
                <CCol md={12}>
                  <CFormLabel>Location</CFormLabel>
                  <CFormInput
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    required
                  />
                </CCol>
                <CCol md={6}>
                  <CFormLabel>Timeline Start</CFormLabel>
                  <CFormInput
                    type="date"
                    value={formData.timelineStart}
                    onChange={(e) => setFormData({ ...formData, timelineStart: e.target.value })}
                    required
                  />
                </CCol>
                <CCol md={6}>
                  <CFormLabel>Timeline End</CFormLabel>
                  <CFormInput
                    type="date"
                    value={formData.timelineEnd}
                    min={formData.timelineStart}
                    onChange={(e) => setFormData({ ...formData, timelineEnd: e.target.value })}
                    required
                  />
                </CCol>
                <CCol md={12}>
                  <CFormLabel>Project Lead</CFormLabel>
                  <CFormSelect
                    value={formData.projectLead}
                    onChange={(e) => setFormData({ ...formData, projectLead: e.target.value })}
                    required
                  >
                    <option value="">Select lead...</option>
                    {users.map((u) => (
                      <option key={u._id} value={u._id}>
                        {u.firstName} {u.lastName} (@{u.username})
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>
              </CRow>

              <div className="mt-4 text-end">
                <CButton color="primary" type="submit" disabled={submitting}>
                  <CIcon icon={cilSave} className="me-2" />
                  {submitting ? 'Submitting...' : 'Submit Edit Request'}
                </CButton>
              </div>
            </CForm>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  )
}

export default EditProject
