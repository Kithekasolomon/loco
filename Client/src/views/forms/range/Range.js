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
  CBadge,
  CButton,
  CButtonGroup,
  CSpinner,
  CAlert,
  CFormLabel,
  CFormSelect,
  CFormInput,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CTooltip,
  CInputGroup,
  CInputGroupText,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilCheckCircle,
  cilXCircle,
  cilInfo,
  cilUserPlus,
  cilUserX,
  cilFilter,
  cilSearch,
  cilShieldAlt,
  cilClock,
  cilTask,
} from '@coreui/icons'
import api from '../../../api/axios'
import { useAuth } from '../../../context/AuthContext'

const Range = () => {
  const { user } = useAuth()
  const isSuperAdmin =
    user?.role?.name?.toUpperCase() === 'SUPER_ADMIN' ||
    user?.role?.toUpperCase() === 'SUPER_ADMIN' ||
    user?.roleName?.toUpperCase() === 'SUPER_ADMIN'

  const [approvals, setApprovals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [processingId, setProcessingId] = useState(null)

  // Filters
  const [filterStatus, setFilterStatus] = useState('PENDING')
  const [filterType, setFilterType] = useState('')

  // Review modal
  const [modalVisible, setModalVisible] = useState(false)
  const [selectedApproval, setSelectedApproval] = useState(null)
  const [reviewComment, setReviewComment] = useState('')

  // Fetch approvals
  useEffect(() => {
    const fetchApprovals = async () => {
      try {
        setLoading(true)
        setError(null)
        const endpoint = isSuperAdmin ? '/api/approvals' : '/api/approvals/my'
        const { data } = await api.get(endpoint)

        const approvalsArray = Array.isArray(data) ? data : data.items || []
        setApprovals(approvalsArray)
      } catch (err) {
        console.error('Failed to fetch approvals:', err)
        setError('Failed to load approval requests. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchApprovals()
  }, [isSuperAdmin])

  // Client-side filtering
  const filteredApprovals = approvals.filter((approval) => {
    const matchStatus = filterStatus === 'ALL' || approval.status === filterStatus
    const matchType = !filterType || approval.actionType.includes(filterType.toUpperCase())
    return matchStatus && matchType
  })

  const getActionInfo = (approval) => {
    const type = approval.actionType
    let icon = cilInfo
    let color = 'info'
    let label = type.replace(/_/g, ' ').toLowerCase()

    if (type === 'CREATE_USER') {
      icon = cilUserPlus
      color = 'primary'
      label = 'Create New User'
    } else if (type === 'RESTORE_USER') {
      icon = cilUserX
      color = 'success'
      label = 'Restore User'
    } else if (type === 'DEACTIVATE_USER') {
      icon = cilUserX
      color = 'danger'
      label = 'Deactivate User'
    }

    return { icon, color, label }
  }

  const getPayloadSummary = (payload) => {
    if (!payload) return '—'
    if (payload.userId) return `User ID: ${payload.userId}`
    if (payload.username) {
      return `${payload.firstName || ''} ${payload.lastName || ''} (${payload.username})`
    }
    return JSON.stringify(payload)
  }

  const openReviewModal = (approval) => {
    if (!isSuperAdmin) return
    setSelectedApproval(approval)
    setReviewComment('')
    setModalVisible(true)
  }

  const handleReview = async (status) => {
    if (!selectedApproval) return

    try {
      setProcessingId(selectedApproval._id)
      setError(null)
      setSuccess(null)

      await api.put(`/api/approvals/${selectedApproval._id}`, {
        status,
        comment: reviewComment.trim() || undefined,
      })

      setApprovals((prev) =>
        prev.map((a) => (a._id === selectedApproval._id ? { ...a, status } : a)),
      )

      setSuccess(`Request ${status.toLowerCase()} successfully!`)
      setModalVisible(false)
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to process review')
    } finally {
      setProcessingId(null)
    }
  }

  const getStatusCounts = () => {
    return {
      pending: approvals.filter((a) => a.status === 'PENDING').length,
      approved: approvals.filter((a) => a.status === 'APPROVED').length,
      denied: approvals.filter((a) => a.status === 'DENIED').length,
    }
  }

  const counts = getStatusCounts()

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
                      <CIcon icon={cilShieldAlt} />
                    </div>
                    Approval Requests
                    {isSuperAdmin && (
                      <CBadge color="light" className="ms-2 px-2" style={{ fontSize: '0.7rem' }}>
                        Super Admin
                      </CBadge>
                    )}
                  </h5>
                  <p className="text-white text-opacity-75 mb-0" style={{ fontSize: '0.75rem' }}>
                    {approvals.length} {approvals.length === 1 ? 'request' : 'requests'} • Review
                    and manage approval workflows
                  </p>
                </div>
              </div>
            </CCardBody>
          </CCard>

          {/* Stats Cards */}
          <CRow className="mb-3 g-3">
            <CCol lg={4}>
              <CCard
                className="border-0 shadow-sm h-100"
                style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}
              >
                <CCardBody className="p-3 text-white">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <div
                        className="text-white text-opacity-75 mb-1"
                        style={{ fontSize: '0.7rem', fontWeight: '500' }}
                      >
                        Pending Requests
                      </div>
                      <h5 className="mb-0 fw-bold">{counts.pending}</h5>
                    </div>
                    <div className="bg-white bg-opacity-25 rounded-3 p-2">
                      <CIcon icon={cilClock} />
                    </div>
                  </div>
                  <div className="text-white text-opacity-75" style={{ fontSize: '0.7rem' }}>
                    Awaiting review
                  </div>
                </CCardBody>
              </CCard>
            </CCol>

            <CCol lg={4}>
              <CCard
                className="border-0 shadow-sm h-100"
                style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}
              >
                <CCardBody className="p-3 text-white">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <div
                        className="text-white text-opacity-75 mb-1"
                        style={{ fontSize: '0.7rem', fontWeight: '500' }}
                      >
                        Approved
                      </div>
                      <h5 className="mb-0 fw-bold">{counts.approved}</h5>
                    </div>
                    <div className="bg-white bg-opacity-25 rounded-3 p-2">
                      <CIcon icon={cilCheckCircle} />
                    </div>
                  </div>
                  <div className="text-white text-opacity-75" style={{ fontSize: '0.7rem' }}>
                    Successfully approved
                  </div>
                </CCardBody>
              </CCard>
            </CCol>

            <CCol lg={4}>
              <CCard
                className="border-0 shadow-sm h-100"
                style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
              >
                <CCardBody className="p-3 text-white">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <div
                        className="text-white text-opacity-75 mb-1"
                        style={{ fontSize: '0.7rem', fontWeight: '500' }}
                      >
                        Denied
                      </div>
                      <h5 className="mb-0 fw-bold">{counts.denied}</h5>
                    </div>
                    <div className="bg-white bg-opacity-25 rounded-3 p-2">
                      <CIcon icon={cilXCircle} />
                    </div>
                  </div>
                  <div className="text-white text-opacity-75" style={{ fontSize: '0.7rem' }}>
                    Rejected requests
                  </div>
                </CCardBody>
              </CCard>
            </CCol>
          </CRow>

          {/* Filters & Table Card */}
          <CCard className="border-0 shadow-sm">
            <CCardHeader className="bg-white border-bottom p-3">
              <CRow className="g-3 align-items-end">
                <CCol md={4}>
                  <CFormLabel className="fw-semibold mb-1" style={{ fontSize: '0.75rem' }}>
                    <CIcon icon={cilFilter} size="sm" className="me-1" />
                    Status Filter
                  </CFormLabel>
                  <CFormSelect
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    style={{ fontSize: '0.813rem' }}
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="PENDING">Pending</option>
                    <option value="APPROVED">Approved</option>
                    <option value="DENIED">Denied</option>
                  </CFormSelect>
                </CCol>
                <CCol md={4}>
                  <CFormLabel className="fw-semibold mb-1" style={{ fontSize: '0.75rem' }}>
                    <CIcon icon={cilSearch} size="sm" className="me-1" />
                    Action Type
                  </CFormLabel>
                  <CInputGroup>
                    <CInputGroupText className="bg-light border-end-0">
                      <CIcon icon={cilTask} size="sm" />
                    </CInputGroupText>
                    <CFormInput
                      placeholder="e.g. CREATE_USER, RESTORE_USER"
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      className="border-start-0"
                      style={{ fontSize: '0.813rem' }}
                    />
                  </CInputGroup>
                </CCol>
                <CCol md={4}>
                  <div className="text-muted text-end" style={{ fontSize: '0.7rem' }}>
                    Showing {filteredApprovals.length} of {approvals.length} requests
                  </div>
                </CCol>
              </CRow>
            </CCardHeader>

            <CCardBody className="p-0">
              {loading ? (
                <div className="d-flex justify-content-center align-items-center py-5">
                  <div className="text-center">
                    <CSpinner color="primary" style={{ width: '2.5rem', height: '2.5rem' }} />
                    <p className="mt-3 text-muted" style={{ fontSize: '0.813rem' }}>
                      Loading approval requests...
                    </p>
                  </div>
                </div>
              ) : filteredApprovals.length === 0 ? (
                <div className="text-center py-5">
                  <div className="mb-3" style={{ fontSize: '4rem', opacity: '0.1' }}>
                    <CIcon icon={cilShieldAlt} />
                  </div>
                  <h6 className="text-muted mb-2">No Approval Requests Found</h6>
                  <p className="text-muted mb-0" style={{ fontSize: '0.813rem' }}>
                    {filterStatus !== 'ALL' || filterType
                      ? 'Try adjusting your filters'
                      : 'All approval requests will appear here'}
                  </p>
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
                          Action Type
                        </CTableHeaderCell>
                        <CTableHeaderCell
                          className="fw-semibold py-2"
                          style={{ fontSize: '0.7rem' }}
                        >
                          Requested By
                        </CTableHeaderCell>
                        <CTableHeaderCell
                          className="fw-semibold py-2"
                          style={{ fontSize: '0.7rem' }}
                        >
                          Details
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
                          Created
                        </CTableHeaderCell>
                        {isSuperAdmin && (
                          <CTableHeaderCell
                            className="fw-semibold py-2 text-center"
                            style={{ fontSize: '0.7rem' }}
                          >
                            Actions
                          </CTableHeaderCell>
                        )}
                      </CTableRow>
                    </CTableHead>
                    <CTableBody>
                      {filteredApprovals.map((approval) => {
                        const { icon, color, label } = getActionInfo(approval)
                        const isProcessing = processingId === approval._id

                        return (
                          <CTableRow key={approval._id} className="align-middle">
                            <CTableDataCell className="py-2">
                              <div className="d-flex align-items-center">
                                <div
                                  className={`rounded-2 d-flex align-items-center justify-content-center me-2 text-${color}`}
                                  style={{
                                    width: '32px',
                                    height: '32px',
                                    background: `var(--cui-${color})`,
                                    opacity: '0.15',
                                  }}
                                >
                                  <CIcon icon={icon} size="sm" style={{ color: `var(--cui-${color})` }} />
                                </div>
                                <div>
                                  <div className="fw-semibold">{label}</div>
                                  <small className="text-muted" style={{ fontSize: '0.65rem' }}>
                                    {approval.actionType}
                                  </small>
                                </div>
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
                                  {approval.requestedBy?.username?.charAt(0).toUpperCase() || '?'}
                                </div>
                                <span>{approval.requestedBy?.username || '—'}</span>
                              </div>
                            </CTableDataCell>
                            <CTableDataCell className="py-2">
                              <div>{getPayloadSummary(approval.payload)}</div>
                              {approval.payload?.email && (
                                <small className="text-muted d-block" style={{ fontSize: '0.65rem' }}>
                                  {approval.payload.email}
                                </small>
                              )}
                            </CTableDataCell>
                            <CTableDataCell className="py-2">
                              <CBadge
                                color={
                                  approval.status === 'PENDING'
                                    ? 'warning'
                                    : approval.status === 'APPROVED'
                                      ? 'success'
                                      : 'danger'
                                }
                                className="px-2"
                                style={{ fontSize: '0.7rem' }}
                              >
                                {approval.status}
                              </CBadge>
                            </CTableDataCell>
                            <CTableDataCell className="py-2">
                              <div style={{ fontSize: '0.7rem' }}>
                                {new Date(approval.createdAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}
                              </div>
                              <small className="text-muted" style={{ fontSize: '0.65rem' }}>
                                {new Date(approval.createdAt).toLocaleTimeString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </small>
                            </CTableDataCell>

                            {isSuperAdmin && approval.status === 'PENDING' && (
                              <CTableDataCell className="text-center py-2">
                                <CButtonGroup size="sm">
                                  <CTooltip content="Approve Request">
                                    <CButton
                                      color="success"
                                      variant="ghost"
                                      disabled={isProcessing}
                                      onClick={() => openReviewModal(approval)}
                                      className="px-2"
                                    >
                                      <CIcon icon={cilCheckCircle} size="sm" />
                                    </CButton>
                                  </CTooltip>
                                  <CTooltip content="Deny Request">
                                    <CButton
                                      color="danger"
                                      variant="ghost"
                                      disabled={isProcessing}
                                      onClick={() => openReviewModal(approval)}
                                      className="px-2"
                                    >
                                      <CIcon icon={cilXCircle} size="sm" />
                                    </CButton>
                                  </CTooltip>
                                </CButtonGroup>
                              </CTableDataCell>
                            )}
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

      {/* Review Modal */}
      <CModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        size="lg"
        backdrop="static"
      >
        <CModalHeader
          className="border-bottom-0 pb-2"
          style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
        >
          <CModalTitle className="text-white fw-bold d-flex align-items-center">
            <div className="bg-white bg-opacity-25 rounded-3 p-2 me-2">
              <CIcon icon={cilShieldAlt} />
            </div>
            Review Approval Request
          </CModalTitle>
        </CModalHeader>
        <CModalBody className="pt-4 pb-3">
          {selectedApproval && (
            <>
              {/* Info Cards */}
              <CRow className="g-3 mb-3">
                <CCol md={6}>
                  <div className="bg-light rounded-3 p-3">
                    <small className="text-muted d-block mb-1" style={{ fontSize: '0.7rem' }}>
                      Action Type
                    </small>
                    <div className="d-flex align-items-center">
                      <CIcon
                        icon={getActionInfo(selectedApproval).icon}
                        className={`text-${getActionInfo(selectedApproval).color} me-2`}
                      />
                      <strong style={{ fontSize: '0.813rem' }}>
                        {getActionInfo(selectedApproval).label}
                      </strong>
                    </div>
                  </div>
                </CCol>
                <CCol md={6}>
                  <div className="bg-light rounded-3 p-3">
                    <small className="text-muted d-block mb-1" style={{ fontSize: '0.7rem' }}>
                      Requested By
                    </small>
                    <strong style={{ fontSize: '0.813rem' }}>
                      {selectedApproval.requestedBy?.username || '—'}
                    </strong>
                  </div>
                </CCol>
                <CCol md={12}>
                  <div className="bg-light rounded-3 p-3">
                    <small className="text-muted d-block mb-1" style={{ fontSize: '0.7rem' }}>
                      <CIcon icon={cilClock} size="sm" className="me-1" />
                      Submission Date
                    </small>
                    <strong style={{ fontSize: '0.813rem' }}>
                      {new Date(selectedApproval.createdAt).toLocaleString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </strong>
                  </div>
                </CCol>
              </CRow>

              {/* Payload Details */}
              <div className="mb-3">
                <CFormLabel className="fw-semibold mb-2" style={{ fontSize: '0.813rem' }}>
                  Request Details
                </CFormLabel>
                <pre
                  className="bg-light p-3 rounded border mb-0"
                  style={{
                    fontSize: '0.75rem',
                    maxHeight: '200px',
                    overflowY: 'auto',
                  }}
                >
                  {JSON.stringify(selectedApproval.payload, null, 2)}
                </pre>
              </div>

              {/* Comment Section */}
              <div>
                <CFormLabel className="fw-semibold mb-2" style={{ fontSize: '0.813rem' }}>
                  Review Comment <span className="text-muted">(optional)</span>
                </CFormLabel>
                <textarea
                  className="form-control"
                  rows={3}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Add your review comment or reason for decision..."
                  style={{ fontSize: '0.813rem' }}
                />
              </div>
            </>
          )}
        </CModalBody>
        <CModalFooter className="border-top-0 pt-2">
          <CButton
            color="light"
            onClick={() => setModalVisible(false)}
            style={{ fontSize: '0.813rem' }}
          >
            Cancel
          </CButton>
          <CButton
            color="success"
            disabled={processingId}
            onClick={() => handleReview('APPROVED')}
            className="px-4"
            style={{ fontSize: '0.813rem' }}
          >
            {processingId ? (
              <>
                <CSpinner size="sm" className="me-2" />
                Processing...
              </>
            ) : (
              <>
                <CIcon icon={cilCheckCircle} size="sm" className="me-2" />
                Approve
              </>
            )}
          </CButton>
          <CButton
            color="danger"
            disabled={processingId}
            onClick={() => handleReview('DENIED')}
            className="px-4"
            style={{ fontSize: '0.813rem' }}
          >
            {processingId ? (
              <>
                <CSpinner size="sm" className="me-2" />
                Processing...
              </>
            ) : (
              <>
                <CIcon icon={cilXCircle} size="sm" className="me-2" />
                Deny
              </>
            )}
          </CButton>
        </CModalFooter>
      </CModal>
    </div>
  )
}

export default Range