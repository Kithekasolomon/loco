import React, { useState, useEffect } from 'react'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CButton,
  CButtonGroup,
  CBadge,
  CSpinner,
  CAlert,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CForm,
  CFormLabel,
  CFormInput,
  CFormSelect,
  CTooltip,
  CInputGroup,
  CInputGroupText,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilPlus,
  cilZoom,
  cilPencil,
  cilTrash,
  cilCalendar,
  cilUser,
  cilLocationPin,
  cilCheckCircle,
  cilXCircle,
  cilBuilding,
  cilClock,
} from '@coreui/icons'
import { Link, useNavigate } from 'react-router-dom'
import api from '../../../../api/axios'
import { useAuth } from '../../../../context/AuthContext'

const ProjectList = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  const isSuperAdmin =
    user?.role?.name?.toUpperCase() === 'SUPER_ADMIN' ||
    user?.roleName?.toUpperCase() === 'SUPER_ADMIN'

  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  // Create Project Modal
  const [createModalVisible, setCreateModalVisible] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    projectLead: '',
    timelineStart: '',
    timelineEnd: '',
  })
  const [submitting, setSubmitting] = useState(false)

  // Users for project lead dropdown
  const [users, setUsers] = useState([])

  // Fetch projects
  const fetchProjects = async () => {
    try {
      setLoading(true)
      setError(null)
      const { data } = await api.get('/api/projects')
      setProjects(data)
    } catch (err) {
      console.error('Failed to fetch projects:', err)
      setError('Failed to load projects. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Fetch users (for project lead selection)
  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/api/users')
      setUsers(data)
    } catch (err) {
      console.error('Failed to fetch users:', err)
    }
  }

  useEffect(() => {
    fetchProjects()
    if (isSuperAdmin || user?.role?.name === 'ADMIN') {
      fetchUsers()
    }
  }, [isSuperAdmin])

  // Handle Create Project Request
  const handleCreateProject = async (e) => {
    e.preventDefault()
    try {
      setSubmitting(true)
      setError(null)
      setSuccess(null)

      await api.post('/api/projects/request-create', formData)

      setSuccess('Project creation request submitted! Awaiting Super Admin approval.')
      setCreateModalVisible(false)
      setFormData({
        name: '',
        location: '',
        projectLead: '',
        timelineStart: '',
        timelineEnd: '',
      })

      fetchProjects()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit request.')
    } finally {
      setSubmitting(false)
    }
  }

  // Handle Delete Request
  const handleDeleteRequest = async (projectId, projectName) => {
    if (!window.confirm(`Are you sure you want to request deletion of "${projectName}"?`)) {
      return
    }

    try {
      await api.delete(`/api/projects/request-delete/${projectId}`)
      setSuccess('Delete request sent for approval.')
      fetchProjects()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send delete request.')
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const getStatusBadge = (start, end) => {
    const now = new Date()
    const startDate = new Date(start)
    const endDate = new Date(end)

    if (now < startDate)
      return (
        <CBadge color="secondary" className="px-2" style={{ fontSize: '0.7rem' }}>
          Upcoming
        </CBadge>
      )
    if (now > endDate)
      return (
        <CBadge color="danger" className="px-2" style={{ fontSize: '0.7rem' }}>
          Completed
        </CBadge>
      )
    return (
      <CBadge color="success" className="px-2" style={{ fontSize: '0.7rem' }}>
        Ongoing
      </CBadge>
    )
  }

  const calculateDaysRemaining = (end) => {
    const now = new Date()
    const endDate = new Date(end)
    const diff = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24))
    return diff
  }

  return (
    <div className="animated fadeIn">
      {/* Alerts */}
      {error && (
        <CAlert color="danger" dismissible onClose={() => setError(null)} className="mb-3">
          <strong>Error!</strong> {error}
        </CAlert>
      )}
      {success && (
        <CAlert color="success" dismissible onClose={() => setSuccess(null)} className="mb-3">
          <strong>Success!</strong> {success}
        </CAlert>
      )}

      <CRow>
        <CCol xs={12}>
          {/* Header Card */}
          <CCard
            className="mb-3 border-0 shadow-sm"
            style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
          >
            <CCardBody className="p-3">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h5 className="text-white mb-1 fw-bold d-flex align-items-center">
                    <div className="bg-white bg-opacity-25 rounded-3 p-2 me-2">
                      <CIcon icon={cilBuilding} />
                    </div>
                    Projects Management
                  </h5>
                  <p className="text-white text-opacity-75 mb-0" style={{ fontSize: '0.75rem' }}>
                    {projects.length} {projects.length === 1 ? 'project' : 'projects'} • Manage and
                    track all construction projects
                  </p>
                </div>
                <CButton
                  color="light"
                  onClick={() => setCreateModalVisible(true)}
                  className="shadow-sm fw-semibold"
                  style={{ fontSize: '0.813rem' }}
                >
                  <CIcon icon={cilPlus} className="me-1" size="sm" />
                  New Project
                </CButton>
              </div>
            </CCardBody>
          </CCard>

          {/* Projects Table Card */}
          <CCard className="border-0 shadow-sm">
            <CCardBody className="p-0">
              {loading ? (
                <div className="d-flex justify-content-center align-items-center py-5">
                  <div className="text-center">
                    <CSpinner color="primary" style={{ width: '2.5rem', height: '2.5rem' }} />
                    <p className="mt-3 text-muted" style={{ fontSize: '0.813rem' }}>
                      Loading projects...
                    </p>
                  </div>
                </div>
              ) : projects.length === 0 ? (
                <div className="text-center py-5">
                  <div className="mb-3" style={{ fontSize: '4rem', opacity: '0.1' }}>
                    <CIcon icon={cilBuilding} />
                  </div>
                  <h6 className="text-muted mb-2">No Projects Yet</h6>
                  <p className="text-muted mb-4" style={{ fontSize: '0.813rem' }}>
                    Create your first project to get started
                  </p>
                  <CButton color="primary" size="sm" onClick={() => setCreateModalVisible(true)}>
                    <CIcon icon={cilPlus} className="me-1" size="sm" />
                    Create First Project
                  </CButton>
                </div>
              ) : (
                <div className="table-responsive">
                  <CTable hover className="mb-0" style={{ fontSize: '0.75rem' }}>
                    <CTableHead style={{ backgroundColor: '#f8f9fa' }}>
                      <CTableRow>
                        <CTableHeaderCell
                          className="fw-semibold py-2"
                          style={{ fontSize: '0.7rem' }}
                        >
                          Project
                        </CTableHeaderCell>
                        <CTableHeaderCell
                          className="fw-semibold py-2"
                          style={{ fontSize: '0.7rem' }}
                        >
                          Location
                        </CTableHeaderCell>
                        <CTableHeaderCell
                          className="fw-semibold py-2"
                          style={{ fontSize: '0.7rem' }}
                        >
                          Project Lead
                        </CTableHeaderCell>
                        <CTableHeaderCell
                          className="fw-semibold py-2"
                          style={{ fontSize: '0.7rem' }}
                        >
                          Timeline
                        </CTableHeaderCell>
                        <CTableHeaderCell
                          className="fw-semibold py-2"
                          style={{ fontSize: '0.7rem' }}
                        >
                          Status
                        </CTableHeaderCell>
                        <CTableHeaderCell
                          className="fw-semibold py-2"
                          style={{ fontSize: '0.7rem' }}
                        >
                          Created By
                        </CTableHeaderCell>
                        <CTableHeaderCell
                          className="fw-semibold py-2 text-center"
                          style={{ fontSize: '0.7rem' }}
                        >
                          Actions
                        </CTableHeaderCell>
                      </CTableRow>
                    </CTableHead>
                    <CTableBody>
                      {projects.map((project) => {
                        const daysRemaining = calculateDaysRemaining(project.timelineEnd)
                        return (
                          <CTableRow key={project._id} className="align-middle">
                            <CTableDataCell className="py-2">
                              <div className="d-flex align-items-center">
                                <div
                                  className="rounded-2 d-flex align-items-center justify-content-center me-2"
                                  style={{
                                    width: '32px',
                                    height: '32px',
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    color: 'white',
                                    fontSize: '0.75rem',
                                    fontWeight: 'bold',
                                  }}
                                >
                                  {project.name.charAt(0)}
                                </div>
                                <div>
                                  <div className="fw-semibold text-dark">{project.name}</div>
                                </div>
                              </div>
                            </CTableDataCell>
                            <CTableDataCell className="py-2">
                              <div className="d-flex align-items-center text-muted">
                                <CIcon icon={cilLocationPin} size="sm" className="me-1" />
                                <span>{project.location}</span>
                              </div>
                            </CTableDataCell>
                            <CTableDataCell className="py-2">
                              <div className="d-flex align-items-center">
                                <div
                                  className="rounded-circle d-flex align-items-center justify-content-center me-2 bg-light"
                                  style={{
                                    width: '28px',
                                    height: '28px',
                                    fontSize: '0.7rem',
                                    fontWeight: 'bold',
                                  }}
                                >
                                  {project.projectLead?.firstName?.charAt(0)}
                                  {project.projectLead?.lastName?.charAt(0)}
                                </div>
                                <div>
                                  <div className="fw-medium">
                                    {project.projectLead?.firstName} {project.projectLead?.lastName}
                                  </div>
                                  <small className="text-muted" style={{ fontSize: '0.65rem' }}>
                                    @{project.projectLead?.username}
                                  </small>
                                </div>
                              </div>
                            </CTableDataCell>
                            <CTableDataCell className="py-2">
                              <div>
                                <div className="d-flex align-items-center mb-1">
                                  <CIcon icon={cilCalendar} size="sm" className="text-muted me-1" />
                                  <span style={{ fontSize: '0.7rem' }}>
                                    {formatDate(project.timelineStart)} →{' '}
                                    {formatDate(project.timelineEnd)}
                                  </span>
                                </div>
                                {daysRemaining > 0 && (
                                  <small
                                    className="text-muted d-flex align-items-center"
                                    style={{ fontSize: '0.65rem' }}
                                  >
                                    <CIcon icon={cilClock} size="sm" className="me-1" />
                                    {daysRemaining} days remaining
                                  </small>
                                )}
                              </div>
                            </CTableDataCell>
                            <CTableDataCell className="py-2">
                              {getStatusBadge(project.timelineStart, project.timelineEnd)}
                            </CTableDataCell>
                            <CTableDataCell className="py-2">
                              <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                                {project.createdBy?.username || 'System'}
                              </div>
                            </CTableDataCell>
                            <CTableDataCell className="text-center py-2">
                              <CButtonGroup size="sm">
                                <CTooltip content="View Project">
                                  <CButton
                                    color="info"
                                    variant="ghost"
                                    as={Link}
                                    to={`/projects/view/${project._id}`}
                                    className="px-2"
                                  >
                                    <CIcon icon={cilZoom} size="sm" />
                                  </CButton>
                                </CTooltip>

                                {!isSuperAdmin && (
                                  <>
                                    <CTooltip content="Edit Project">
                                      <CButton
                                        color="warning"
                                        variant="ghost"
                                        onClick={() => navigate(`/projects/edit/${project._id}`)}
                                        className="px-2"
                                      >
                                        <CIcon icon={cilPencil} size="sm" />
                                      </CButton>
                                    </CTooltip>
                                    <CTooltip content="Delete Project">
                                      <CButton
                                        color="danger"
                                        variant="ghost"
                                        onClick={() =>
                                          handleDeleteRequest(project._id, project.name)
                                        }
                                        className="px-2"
                                      >
                                        <CIcon icon={cilTrash} size="sm" />
                                      </CButton>
                                    </CTooltip>
                                  </>
                                )}

                                {isSuperAdmin && (
                                  <>
                                    <CTooltip content="Edit Project">
                                      <CButton
                                        color="warning"
                                        variant="ghost"
                                        onClick={() => navigate(`/projects/edit/${project._id}`)}
                                        className="px-2"
                                      >
                                        <CIcon icon={cilPencil} size="sm" />
                                      </CButton>
                                    </CTooltip>
                                    <CTooltip content="Delete Project">
                                      <CButton
                                        color="danger"
                                        variant="ghost"
                                        onClick={() =>
                                          handleDeleteRequest(project._id, project.name)
                                        }
                                        className="px-2"
                                      >
                                        <CIcon icon={cilTrash} size="sm" />
                                      </CButton>
                                    </CTooltip>
                                  </>
                                )}
                              </CButtonGroup>
                            </CTableDataCell>
                          </CTableRow>
                        )
                      })}
                    </CTableBody>
                  </CTable>
                </div>
              )}
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* Create Project Modal */}
      <CModal
        visible={createModalVisible}
        onClose={() => setCreateModalVisible(false)}
        size="lg"
        backdrop="static"
      >
        <CModalHeader
          className="border-bottom-0 pb-2"
          style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
        >
          <CModalTitle className="text-white fw-bold d-flex align-items-center">
            <div className="bg-white bg-opacity-25 rounded-3 p-2 me-2">
              <CIcon icon={cilPlus} />
            </div>
            Create New Project
          </CModalTitle>
        </CModalHeader>
        <CForm onSubmit={handleCreateProject}>
          <CModalBody className="pt-4 pb-3">
            <div className="bg-light rounded-3 p-3 mb-4" style={{ fontSize: '0.75rem' }}>
              <CIcon icon={cilCheckCircle} className="text-success me-2" />
              Your request will be sent to the Super Admin for approval
            </div>

            <CRow className="g-3">
              <CCol md={12}>
                <CFormLabel className="fw-semibold" style={{ fontSize: '0.813rem' }}>
                  Project Name <span className="text-danger">*</span>
                </CFormLabel>
                <CInputGroup>
                  <CInputGroupText className="bg-light border-end-0">
                    <CIcon icon={cilBuilding} size="sm" />
                  </CInputGroupText>
                  <CFormInput
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter project name"
                    className="border-start-0"
                    style={{ fontSize: '0.813rem' }}
                  />
                </CInputGroup>
              </CCol>

              <CCol md={12}>
                <CFormLabel className="fw-semibold" style={{ fontSize: '0.813rem' }}>
                  Location <span className="text-danger">*</span>
                </CFormLabel>
                <CInputGroup>
                  <CInputGroupText className="bg-light border-end-0">
                    <CIcon icon={cilLocationPin} size="sm" />
                  </CInputGroupText>
                  <CFormInput
                    required
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Enter project location"
                    className="border-start-0"
                    style={{ fontSize: '0.813rem' }}
                  />
                </CInputGroup>
              </CCol>

              <CCol md={6}>
                <CFormLabel className="fw-semibold" style={{ fontSize: '0.813rem' }}>
                  Start Date <span className="text-danger">*</span>
                </CFormLabel>
                <CInputGroup>
                  <CInputGroupText className="bg-light border-end-0">
                    <CIcon icon={cilCalendar} size="sm" />
                  </CInputGroupText>
                  <CFormInput
                    type="date"
                    required
                    value={formData.timelineStart}
                    onChange={(e) => setFormData({ ...formData, timelineStart: e.target.value })}
                    className="border-start-0"
                    style={{ fontSize: '0.813rem' }}
                  />
                </CInputGroup>
              </CCol>

              <CCol md={6}>
                <CFormLabel className="fw-semibold" style={{ fontSize: '0.813rem' }}>
                  End Date <span className="text-danger">*</span>
                </CFormLabel>
                <CInputGroup>
                  <CInputGroupText className="bg-light border-end-0">
                    <CIcon icon={cilCalendar} size="sm" />
                  </CInputGroupText>
                  <CFormInput
                    type="date"
                    required
                    value={formData.timelineEnd}
                    min={formData.timelineStart}
                    onChange={(e) => setFormData({ ...formData, timelineEnd: e.target.value })}
                    className="border-start-0"
                    style={{ fontSize: '0.813rem' }}
                  />
                </CInputGroup>
                {formData.timelineStart && formData.timelineEnd && (
                  <small className="text-muted d-block mt-1" style={{ fontSize: '0.7rem' }}>
                    Duration:{' '}
                    {Math.ceil(
                      (new Date(formData.timelineEnd) - new Date(formData.timelineStart)) /
                        (1000 * 60 * 60 * 24),
                    )}{' '}
                    days
                  </small>
                )}
              </CCol>

              <CCol md={12}>
                <CFormLabel className="fw-semibold" style={{ fontSize: '0.813rem' }}>
                  Project Lead <span className="text-danger">*</span>
                </CFormLabel>
                <CInputGroup>
                  <CInputGroupText className="bg-light border-end-0">
                    <CIcon icon={cilUser} size="sm" />
                  </CInputGroupText>
                  <CFormSelect
                    required
                    value={formData.projectLead}
                    onChange={(e) => setFormData({ ...formData, projectLead: e.target.value })}
                    className="border-start-0"
                    style={{ fontSize: '0.813rem' }}
                  >
                    <option value="">Select project lead...</option>
                    {users.map((u) => (
                      <option key={u._id} value={u._id}>
                        {u.firstName} {u.lastName} (@{u.username})
                      </option>
                    ))}
                  </CFormSelect>
                </CInputGroup>
              </CCol>
            </CRow>
          </CModalBody>
          <CModalFooter className="border-top-0 pt-2">
            <CButton
              color="light"
              onClick={() => setCreateModalVisible(false)}
              style={{ fontSize: '0.813rem' }}
            >
              Cancel
            </CButton>
            <CButton
              color="primary"
              type="submit"
              disabled={submitting}
              className="px-4"
              style={{ fontSize: '0.813rem' }}
            >
              {submitting ? (
                <>
                  <CSpinner size="sm" className="me-2" />
                  Submitting...
                </>
              ) : (
                <>
                  <CIcon icon={cilCheckCircle} className="me-2" size="sm" />
                  Submit Request
                </>
              )}
            </CButton>
          </CModalFooter>
        </CForm>
      </CModal>
    </div>
  )
}

export default ProjectList
