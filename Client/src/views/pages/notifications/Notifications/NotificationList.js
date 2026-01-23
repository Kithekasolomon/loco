// src/views/notifications/NotificationList.jsx
import React, { useState, useEffect, useCallback } from 'react'
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
  CSpinner,
  CAlert,
  CButtonGroup,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilCheckCircle,
  cilXCircle,
  cilUserPlus,
  cilUserX,
  cilPencil,
  cilLockLocked,
  cilLockUnlocked,
  cilBell,
} from '@coreui/icons'
import api from '../../../../api/axios'
import { initSocket } from '../../../../services/socket'
import { useAuth } from '../../../../context/AuthContext'

const NotificationList = () => {
  const { user } = useAuth()
  const [approvalsData, setApprovalsData] = useState({
    items: [],
    groupedByType: {},
    pending: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [processingId, setProcessingId] = useState(null)
  const [notifications, setNotifications] = useState([]) 
  const [grouped, setGrouped] = useState({})

  const isSuperAdmin = user?.role?.name === 'SUPER_ADMIN'

  const getActionStyle = (actionType) => {
    const map = {
      CREATE_USER: { icon: cilUserPlus, color: 'primary', label: 'New User Creation' },
      EDIT_USER: { icon: cilPencil, color: 'warning', label: 'User Edit' },
      DEACTIVATE_USER: { icon: cilLockLocked, color: 'danger', label: 'Deactivation' },
      RESTORE_USER: { icon: cilLockUnlocked, color: 'success', label: 'Restore User' },
    }
    return map[actionType] || { icon: cilBell, color: 'info', label: actionType }
  }

  const getStatusBadge = (status) => {
    const map = {
      PENDING: { color: 'warning', text: 'Pending' },
      APPROVED: { color: 'success', text: 'Approved' },
      DENIED: { color: 'danger', text: 'Denied' },
    }
    return map[status] || { color: 'secondary', text: status }
  }

  const fetchApprovals = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const endpoint = isSuperAdmin ? '/api/approvals' : '/api/approvals/my'
      const { data } = await api.get(endpoint)

      // Handle both old flat array and new structured response
      const allApprovals = Array.isArray(data) ? data : data.items || []

      setNotifications(allApprovals)
      // Optional: keep track of grouped data if you want to show clusters later
      setGrouped(data.groupedByType || {})
    } catch (err) {
      console.error('Failed to load approvals:', err)
      setError('Failed to load approval requests. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [isSuperAdmin])

  const handleApprovalAction = async (approvalId, status) => {
    try {
      setProcessingId(approvalId)
      setError(null)
      setSuccess(null)

      await api.put(`/api/approvals/${approvalId}`, { status }) // ← Correct endpoint & format

      setSuccess(`Request ${status.toLowerCase()} successfully`)
      fetchApprovals()
    } catch (err) {
      console.error(`Failed to process approval:`, err)
      setError(err.response?.data?.msg || 'Action failed')
    } finally {
      setProcessingId(null)
    }
  }

  useEffect(() => {
    fetchApprovals()

    const socket = initSocket()
    if (socket) {
      socket.on('approval:new', fetchApprovals)
      socket.on('approval:status', fetchApprovals)

      // Optional: Listen for audit events (can be used for toast or counter)
      socket.on('audit:new', (auditEvent) => {
        console.log('New audit event:', auditEvent.action)
        // You could add a toast here with react-hot-toast or similar:
        // toast(`New audit: ${auditEvent.action}`, { icon: '📝' })
      })
    }

    return () => {
      if (socket) {
        socket.off('approval:new')
        socket.off('approval:status')
        socket.off('audit:new')
      }
    }
  }, [fetchApprovals])

  const pendingCount = approvalsData.pending || 0

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4 shadow-sm">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>
              Approval Requests
              {pendingCount > 0 && (
                <CBadge color="warning" shape="rounded-pill" className="ms-2">
                  {pendingCount} Pending
                </CBadge>
              )}
            </strong>
            <CButton size="sm" color="primary" onClick={fetchApprovals} disabled={loading}>
              {loading ? <CSpinner size="sm" /> : 'Refresh'}
            </CButton>
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

            {loading ? (
              <div className="text-center py-5">
                <CSpinner color="primary" />
                <p className="mt-2 text-muted">Loading approval requests...</p>
              </div>
            ) : Object.keys(approvalsData.groupedByType).length === 0 ? (
              <div className="text-center py-5 text-muted">
                <CIcon icon={cilBell} size="3xl" className="mb-3 opacity-50" />
                <p>No approval requests found.</p>
              </div>
            ) : (
              <>
                {isSuperAdmin &&
                  Object.entries(approvalsData.groupedByType).map(([type, items]) => (
                    <div key={type} className="mb-5">
                      <h5 className="mb-3 border-bottom pb-2">
                        {type.replace(/_/g, ' ')}
                        <CBadge color="info" shape="rounded-pill" className="ms-2">
                          {items.length}
                        </CBadge>
                      </h5>

                      <div className="table-responsive">
                        <CTable hover align="middle" className="mb-0">
                          <CTableHead>
                            <CTableRow>
                              <CTableHeaderCell>Requested By</CTableHeaderCell>
                              <CTableHeaderCell>Status</CTableHeaderCell>
                              <CTableHeaderCell>Created At</CTableHeaderCell>
                              <CTableHeaderCell>Actions</CTableHeaderCell>
                            </CTableRow>
                          </CTableHead>
                          <CTableBody>
                            {items.map((approval) => {
                              const { icon, color, label } = getActionStyle(approval.actionType)
                              const statusBadge = getStatusBadge(approval.status)
                              const isProcessing = processingId === approval._id

                              return (
                                <CTableRow key={approval._id}>
                                  <CTableDataCell>
                                    <div>
                                      <div className="fw-semibold">
                                        {approval.requestedBy?.username || 'Unknown'}
                                      </div>
                                      <small className="text-muted">
                                        {approval.requestedBy?.email || ''}
                                      </small>
                                    </div>
                                  </CTableDataCell>
                                  <CTableDataCell>
                                    <CBadge color={statusBadge.color}>{statusBadge.text}</CBadge>
                                  </CTableDataCell>
                                  <CTableDataCell>
                                    {new Date(approval.createdAt).toLocaleString()}
                                  </CTableDataCell>
                                  <CTableDataCell>
                                    {approval.status === 'PENDING' ? (
                                      <CButtonGroup size="sm">
                                        <CButton
                                          color="success"
                                          variant="outline"
                                          onClick={() =>
                                            handleApprovalAction(approval._id, 'APPROVED')
                                          }
                                          disabled={isProcessing}
                                        >
                                          {isProcessing ? (
                                            <CSpinner size="sm" />
                                          ) : (
                                            <>
                                              <CIcon icon={cilCheckCircle} className="me-1" />
                                              Approve
                                            </>
                                          )}
                                        </CButton>
                                        <CButton
                                          color="danger"
                                          variant="outline"
                                          onClick={() =>
                                            handleApprovalAction(approval._id, 'DENIED')
                                          }
                                          disabled={isProcessing}
                                        >
                                          {isProcessing ? (
                                            <CSpinner size="sm" />
                                          ) : (
                                            <>
                                              <CIcon icon={cilXCircle} className="me-1" />
                                              Deny
                                            </>
                                          )}
                                        </CButton>
                                      </CButtonGroup>
                                    ) : (
                                      <span className="text-muted">Processed</span>
                                    )}
                                  </CTableDataCell>
                                </CTableRow>
                              )
                            })}
                          </CTableBody>
                        </CTable>
                      </div>
                    </div>
                  ))}
              </>
            )}
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  )
}

export default NotificationList
