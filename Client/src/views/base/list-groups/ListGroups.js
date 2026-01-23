// src/views/audit/AuditLog.jsx
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
  CSpinner,
  CFormSelect,
  CFormInput,
  CInputGroup,
  CInputGroupText,
  CButtonGroup,
  CAlert,
  CPagination,
  CPaginationItem,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CListGroup,
  CListGroupItem,
  CDropdown,
  CDropdownToggle,
  CDropdownMenu,
  CDropdownItem,
  CAvatar,
  CTooltip,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilSearch,
  cilReload,
  cilCloudDownload,
  cilFilter,
  cilX,
  cilInfo,
  cilCheckCircle,
  cilXCircle,
  cilHistory,
  cilCalendar,
  cilUser,
  cilLocationPin,
  cilOptions,
} from '@coreui/icons'
import api from '../../../api/axios'
import { useAuth } from '../../../context/AuthContext'

const ListGroups = () => {
  const { user } = useAuth()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  // Pagination
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    limit: 20,
  })

  // Filters
  const [filters, setFilters] = useState({
    action: '',
    status: '',
    performedBy: '',
    startDate: '',
    endDate: '',
  })

  // Search
  const [searchTerm, setSearchTerm] = useState('')

  // Selected log for details
  const [selectedLog, setSelectedLog] = useState(null)
  const [detailsModalVisible, setDetailsModalVisible] = useState(false)

  const isSuperAdmin = user?.role?.name === 'SUPER_ADMIN'

  const fetchLogs = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = {
        page: pagination.currentPage,
        limit: pagination.limit,
        action: filters.action,
        status: filters.status,
        performedBy: filters.performedBy,
        startDate: filters.startDate,
        endDate: filters.endDate,
        search: searchTerm,
      }

      // Remove empty params
      Object.keys(params).forEach((key) => {
        if (params[key] === '' || params[key] === null || params[key] === undefined) {
          delete params[key]
        }
      })

      const { data } = await api.get('/api/audit/logs', { params })
      setLogs(data.data || [])
      setPagination(data.pagination || pagination)
    } catch (err) {
      console.error('Failed to fetch audit logs:', err)
      setError('Failed to load audit logs. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const exportCSV = async () => {
    try {
      setExporting(true)
      const response = await api.get('/api/audit/export-csv', {
        params: {
          action: filters.action,
          status: filters.status,
          performedBy: filters.performedBy,
          startDate: filters.startDate,
          endDate: filters.endDate,
        },
        responseType: 'blob',
      })

      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `audit-logs-${new Date().toISOString().split('T')[0]}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)

      setSuccess('Audit logs exported successfully!')
    } catch (err) {
      setError('Failed to export audit logs. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [pagination.currentPage, filters])

  const handlePageChange = (page) => {
    setPagination({ ...pagination, currentPage: page })
  }

  const clearFilters = () => {
    setFilters({
      action: '',
      status: '',
      performedBy: '',
      startDate: '',
      endDate: '',
    })
    setSearchTerm('')
    setPagination({ ...pagination, currentPage: 1 })
  }

  const hasActiveFilters =
    filters.action ||
    filters.status ||
    filters.performedBy ||
    filters.startDate ||
    filters.endDate ||
    searchTerm

  const openDetailsModal = (log) => {
    setSelectedLog(log)
    setDetailsModalVisible(true)
  }

  const getActionBadgeColor = (action) => {
    const actionMap = {
      LOGIN: 'success',
      LOGOUT: 'secondary',
      CREATE_USER: 'primary',
      EDIT_USER: 'warning',
      DELETE_USER: 'danger',
      DEACTIVATE_USER: 'danger',
      RESTORE_USER: 'success',
      RESTORE_USER_REQUEST: 'info',
      CREATE_ROLE: 'primary',
      UPDATE_ROLE: 'warning',
      DELETE_ROLE: 'danger',
      APPROVAL_APPROVED: 'success',
      APPROVAL_DENIED: 'danger',
    }

    // Check for partial matches
    for (const [key, color] of Object.entries(actionMap)) {
      if (action.includes(key)) return color
    }

    return 'secondary'
  }

  const formatActionName = (action) => {
    return action
      .replace(/_/g, ' ')
      .toLowerCase()
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  const getInitials = (firstName, lastName) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase()
  }

  // Get unique action types for filter
  const uniqueActions = [...new Set(logs.map((log) => log.action))].sort()

  return (
    <>
      <CRow>
        <CCol xs={12}>
          <CCard className="mb-4 shadow-sm">
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <div>
                <strong>
                  <CIcon icon={cilHistory} className="me-2" />
                  Audit Logs
                </strong>
                <CBadge color="primary" className="ms-2">
                  {pagination.totalItems} {pagination.totalItems === 1 ? 'Entry' : 'Entries'}
                </CBadge>
              </div>
              <div className="d-flex gap-2">
                <CButton color="light" onClick={fetchLogs} disabled={loading}>
                  <CIcon icon={cilReload} className="me-1" />
                  Refresh
                </CButton>
                {isSuperAdmin && (
                  <CButton
                    color="success"
                    onClick={exportCSV}
                    disabled={exporting || logs.length === 0}
                  >
                    {exporting ? (
                      <CSpinner size="sm" className="me-1" />
                    ) : (
                      <CIcon icon={cilCloudDownload} className="me-1" />
                    )}
                    Export CSV
                  </CButton>
                )}
              </div>
            </CCardHeader>

            <CCardBody>
              {/* Alerts */}
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

              {/* Search & Filters */}
              <CRow className="mb-3">
                <CCol md={12} className="mb-3">
                  <CInputGroup>
                    <CInputGroupText>
                      <CIcon icon={cilSearch} />
                    </CInputGroupText>
                    <CFormInput
                      placeholder="Search by username, email, IP address..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                      <CButton color="light" onClick={() => setSearchTerm('')}>
                        <CIcon icon={cilX} />
                      </CButton>
                    )}
                  </CInputGroup>
                </CCol>
              </CRow>

              <CRow className="mb-3">
                <CCol md={3}>
                  <CFormSelect
                    value={filters.action}
                    onChange={(e) => setFilters({ ...filters, action: e.target.value })}
                  >
                    <option value="">All Actions</option>
                    {uniqueActions.map((action) => (
                      <option key={action} value={action}>
                        {formatActionName(action)}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>
                <CCol md={2}>
                  <CFormSelect
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  >
                    <option value="">All Status</option>
                    <option value="SUCCESS">Success</option>
                    <option value="FAILED">Failed</option>
                  </CFormSelect>
                </CCol>
                <CCol md={2}>
                  <CFormInput
                    type="date"
                    placeholder="Start Date"
                    value={filters.startDate}
                    onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                  />
                </CCol>
                <CCol md={2}>
                  <CFormInput
                    type="date"
                    placeholder="End Date"
                    value={filters.endDate}
                    onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                  />
                </CCol>
                <CCol md={3}>
                  <div className="d-flex gap-2">
                    <CButton
                      color="primary"
                      className="flex-grow-1"
                      onClick={() => setPagination({ ...pagination, currentPage: 1 })}
                    >
                      <CIcon icon={cilFilter} className="me-1" />
                      Apply
                    </CButton>
                    {hasActiveFilters && (
                      <CButton color="light" onClick={clearFilters}>
                        <CIcon icon={cilX} />
                      </CButton>
                    )}
                  </div>
                </CCol>
              </CRow>

              {/* Active Filters Display */}
              {hasActiveFilters && (
                <div className="mb-3 d-flex flex-wrap gap-2">
                  <small className="text-muted align-self-center">Active Filters:</small>
                  {filters.action && (
                    <CBadge color="primary" className="py-1 px-2">
                      Action: {formatActionName(filters.action)}
                      <CIcon
                        icon={cilX}
                        size="sm"
                        className="ms-1"
                        style={{ cursor: 'pointer' }}
                        onClick={() => setFilters({ ...filters, action: '' })}
                      />
                    </CBadge>
                  )}
                  {filters.status && (
                    <CBadge color="primary" className="py-1 px-2">
                      Status: {filters.status}
                      <CIcon
                        icon={cilX}
                        size="sm"
                        className="ms-1"
                        style={{ cursor: 'pointer' }}
                        onClick={() => setFilters({ ...filters, status: '' })}
                      />
                    </CBadge>
                  )}
                  {filters.startDate && (
                    <CBadge color="primary" className="py-1 px-2">
                      From: {filters.startDate}
                      <CIcon
                        icon={cilX}
                        size="sm"
                        className="ms-1"
                        style={{ cursor: 'pointer' }}
                        onClick={() => setFilters({ ...filters, startDate: '' })}
                      />
                    </CBadge>
                  )}
                  {filters.endDate && (
                    <CBadge color="primary" className="py-1 px-2">
                      To: {filters.endDate}
                      <CIcon
                        icon={cilX}
                        size="sm"
                        className="ms-1"
                        style={{ cursor: 'pointer' }}
                        onClick={() => setFilters({ ...filters, endDate: '' })}
                      />
                    </CBadge>
                  )}
                  {searchTerm && (
                    <CBadge color="primary" className="py-1 px-2">
                      Search: "{searchTerm}"
                      <CIcon
                        icon={cilX}
                        size="sm"
                        className="ms-1"
                        style={{ cursor: 'pointer' }}
                        onClick={() => setSearchTerm('')}
                      />
                    </CBadge>
                  )}
                </div>
              )}

              {/* Table */}
              {loading ? (
                <div className="text-center py-5">
                  <CSpinner color="primary" />
                  <p className="mt-2 text-muted">Loading audit logs...</p>
                </div>
              ) : logs.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <CIcon icon={cilHistory} size="3xl" className="mb-3 opacity-50" />
                  <p>
                    {hasActiveFilters
                      ? 'No audit logs match your filters.'
                      : 'No audit logs found.'}
                  </p>
                </div>
              ) : (
                <>
                  <div className="table-responsive">
                    <CTable hover align="middle" className="mb-0">
                      <CTableHead>
                        <CTableRow>
                          <CTableHeaderCell>Timestamp</CTableHeaderCell>
                          <CTableHeaderCell>Action</CTableHeaderCell>
                          <CTableHeaderCell>Performed By</CTableHeaderCell>
                          <CTableHeaderCell>Target User</CTableHeaderCell>
                          <CTableHeaderCell>Status</CTableHeaderCell>
                          <CTableHeaderCell>Method</CTableHeaderCell>
                          <CTableHeaderCell className="text-center">Details</CTableHeaderCell>
                        </CTableRow>
                      </CTableHead>
                      <CTableBody>
                        {logs.map((log) => (
                          <CTableRow key={log._id}>
                            <CTableDataCell>
                              <div>
                                <CIcon icon={cilCalendar} className="text-muted me-1" size="sm" />
                                {new Date(log.createdAt).toLocaleDateString()}
                              </div>
                              <small className="text-muted">
                                {new Date(log.createdAt).toLocaleTimeString()}
                              </small>
                            </CTableDataCell>
                            <CTableDataCell>
                              <CBadge color={getActionBadgeColor(log.action)} className="py-1 px-2">
                                {formatActionName(log.action)}
                              </CBadge>
                            </CTableDataCell>
                            <CTableDataCell>
                              {log.performedBy ? (
                                <div className="d-flex align-items-center">
                                  <CAvatar color="primary" size="sm" className="me-2">
                                    {getInitials(
                                      log.performedBy.firstName,
                                      log.performedBy.lastName,
                                    )}
                                  </CAvatar>
                                  <div>
                                    <div className="fw-semibold">
                                      {log.performedBy.firstName} {log.performedBy.lastName}
                                    </div>
                                    <small className="text-muted">
                                      @{log.performedBy.username}
                                    </small>
                                  </div>
                                </div>
                              ) : (
                                <span className="text-muted">System</span>
                              )}
                            </CTableDataCell>
                            <CTableDataCell>
                              {log.targetUser ? (
                                <div>
                                  <div className="fw-semibold">
                                    {log.targetUser.firstName} {log.targetUser.lastName}
                                  </div>
                                  <small className="text-muted">@{log.targetUser.username}</small>
                                </div>
                              ) : (
                                <span className="text-muted">—</span>
                              )}
                            </CTableDataCell>
                            <CTableDataCell>
                              <CBadge color={log.status === 'SUCCESS' ? 'success' : 'danger'}>
                                <CIcon
                                  icon={log.status === 'SUCCESS' ? cilCheckCircle : cilXCircle}
                                  size="sm"
                                  className="me-1"
                                />
                                {log.status}
                              </CBadge>
                            </CTableDataCell>
                            <CTableDataCell>
                              {log.metadata?.method && (
                                <CBadge
                                  color={
                                    log.metadata.method === 'GET'
                                      ? 'success'
                                      : log.metadata.method === 'POST'
                                        ? 'primary'
                                        : log.metadata.method === 'PUT'
                                          ? 'warning'
                                          : log.metadata.method === 'DELETE'
                                            ? 'danger'
                                            : 'secondary'
                                  }
                                  className="py-1"
                                >
                                  {log.metadata.method}
                                </CBadge>
                              )}
                            </CTableDataCell>
                            <CTableDataCell className="text-center">
                              <CButton
                                color="light"
                                size="sm"
                                onClick={() => openDetailsModal(log)}
                              >
                                <CIcon icon={cilInfo} />
                              </CButton>
                            </CTableDataCell>
                          </CTableRow>
                        ))}
                      </CTableBody>
                    </CTable>
                  </div>

                  {/* Pagination */}
                  {pagination.totalPages > 1 && (
                    <div className="d-flex justify-content-between align-items-center mt-3">
                      <small className="text-muted">
                        Showing {(pagination.currentPage - 1) * pagination.limit + 1} to{' '}
                        {Math.min(pagination.currentPage * pagination.limit, pagination.totalItems)}{' '}
                        of {pagination.totalItems} entries
                      </small>
                      <CPagination>
                        <CPaginationItem
                          disabled={pagination.currentPage === 1}
                          onClick={() => handlePageChange(pagination.currentPage - 1)}
                        >
                          Previous
                        </CPaginationItem>

                        {[...Array(pagination.totalPages)].map((_, index) => {
                          const page = index + 1
                          // Show first, last, current, and pages around current
                          if (
                            page === 1 ||
                            page === pagination.totalPages ||
                            (page >= pagination.currentPage - 1 &&
                              page <= pagination.currentPage + 1)
                          ) {
                            return (
                              <CPaginationItem
                                key={page}
                                active={page === pagination.currentPage}
                                onClick={() => handlePageChange(page)}
                              >
                                {page}
                              </CPaginationItem>
                            )
                          } else if (
                            page === pagination.currentPage - 2 ||
                            page === pagination.currentPage + 2
                          ) {
                            return (
                              <CPaginationItem key={page} disabled>
                                ...
                              </CPaginationItem>
                            )
                          }
                          return null
                        })}

                        <CPaginationItem
                          disabled={pagination.currentPage === pagination.totalPages}
                          onClick={() => handlePageChange(pagination.currentPage + 1)}
                        >
                          Next
                        </CPaginationItem>
                      </CPagination>
                    </div>
                  )}
                </>
              )}
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* Details Modal */}
      <CModal
        size="lg"
        visible={detailsModalVisible}
        onClose={() => {
          setDetailsModalVisible(false)
          setSelectedLog(null)
        }}
      >
        <CModalHeader>
          <CModalTitle>Audit Log Details</CModalTitle>
        </CModalHeader>
        <CModalBody>
          {selectedLog && (
            <CListGroup flush>
              <CListGroupItem className="d-flex justify-content-between">
                <strong>Timestamp:</strong>
                <span>{new Date(selectedLog.createdAt).toLocaleString()}</span>
              </CListGroupItem>
              <CListGroupItem className="d-flex justify-content-between">
                <strong>Action:</strong>
                <CBadge color={getActionBadgeColor(selectedLog.action)}>
                  {formatActionName(selectedLog.action)}
                </CBadge>
              </CListGroupItem>
              <CListGroupItem className="d-flex justify-content-between">
                <strong>Status:</strong>
                <CBadge color={selectedLog.status === 'SUCCESS' ? 'success' : 'danger'}>
                  {selectedLog.status}
                </CBadge>
              </CListGroupItem>
              <CListGroupItem>
                <strong>Performed By:</strong>
                <div className="mt-2">
                  {selectedLog.performedBy ? (
                    <div>
                      <div>
                        Name: {selectedLog.performedBy.firstName} {selectedLog.performedBy.lastName}
                      </div>
                      <div>Username: @{selectedLog.performedBy.username}</div>
                      <div>Email: {selectedLog.performedBy.email}</div>
                    </div>
                  ) : (
                    <span className="text-muted">System</span>
                  )}
                </div>
              </CListGroupItem>
              {selectedLog.targetUser && (
                <CListGroupItem>
                  <strong>Target User:</strong>
                  <div className="mt-2">
                    <div>
                      Name: {selectedLog.targetUser.firstName} {selectedLog.targetUser.lastName}
                    </div>
                    <div>Username: @{selectedLog.targetUser.username}</div>
                    <div>Email: {selectedLog.targetUser.email}</div>
                  </div>
                </CListGroupItem>
              )}
              {selectedLog.metadata && (
                <CListGroupItem>
                  <strong>Metadata:</strong>
                  <div className="mt-2">
                    {selectedLog.metadata.method && (
                      <div>
                        Method: <CBadge color="primary">{selectedLog.metadata.method}</CBadge>
                      </div>
                    )}
                    {selectedLog.metadata.path && (
                      <div className="mt-1">
                        Path: <code>{selectedLog.metadata.path}</code>
                      </div>
                    )}
                  </div>
                </CListGroupItem>
              )}
              {selectedLog.ipAddress && (
                <CListGroupItem className="d-flex justify-content-between">
                  <strong>IP Address:</strong>
                  <span>
                    <CIcon icon={cilLocationPin} className="me-1" />
                    {selectedLog.ipAddress}
                  </span>
                </CListGroupItem>
              )}
            </CListGroup>
          )}
        </CModalBody>
        <CModalFooter>
          <CButton
            color="secondary"
            onClick={() => {
              setDetailsModalVisible(false)
              setSelectedLog(null)
            }}
          >
            Close
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  )
}

export default ListGroups
