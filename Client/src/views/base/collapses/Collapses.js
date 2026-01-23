// src/views/users/UserList.jsx
import React, { useState, useEffect } from 'react'
import {
  CButton,
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
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CForm,
  CFormInput,
  CFormSelect,
  CAvatar,
  CDropdown,
  CDropdownToggle,
  CDropdownMenu,
  CDropdownItem,
  CSpinner,
  CAlert,
  CInputGroup,
  CInputGroupText,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilUser,
  cilUserPlus,
  cilLockLocked,
  cilLockUnlocked,
  cilPencil,
  cilTrash,
  cilOptions,
  cilSearch,
  cilReload,
  cilX,
} from '@coreui/icons'
import api from '../../../api/axios'
import { useAuth } from '../../../context/AuthContext'

const Collapses = () => {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState([])
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  // Modals
  const [createModalVisible, setCreateModalVisible] = useState(false)
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [deleteModalVisible, setDeleteModalVisible] = useState(false)

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  // Selected user
  const [selectedUser, setSelectedUser] = useState(null)

  // Form data
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    username: '',
    role: '',
  })

  const isSuperAdmin = currentUser?.role?.name === 'SUPER_ADMIN'

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const res = await api.get('/api/users')
      setUsers(res.data)
    } catch (err) {
      setError('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const fetchRoles = async () => {
    try {
      const res = await api.get('/api/roles')
      setRoles(res.data)
    } catch (err) {
      console.error('Failed to fetch roles:', err)
    }
  }

  useEffect(() => {
    fetchUsers()
    fetchRoles()
  }, [])

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      username: '',
      role: '',
    })
  }

  // CREATE - uses approval flow
  const handleCreateUser = async () => {
    setActionLoading(true)
    try {
      await api.post('/api/users/request-create', formData)
      setSuccess('User creation request sent! Awaiting SUPER_ADMIN approval.')
      setCreateModalVisible(false)
      resetForm()
      fetchUsers()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send creation request')
    } finally {
      setActionLoading(false)
    }
  }

  // EDIT - uses approval flow
  const handleEditUser = async () => {
    setActionLoading(true)
    try {
      await api.put(`/api/users/edit/${selectedUser._id}`, formData)
      setSuccess('User update request sent! Awaiting SUPER_ADMIN approval.')
      setEditModalVisible(false)
      resetForm()
      setSelectedUser(null)
      fetchUsers()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send update request')
    } finally {
      setActionLoading(false)
    }
  }

  // DEACTIVATE - approval required
  const handleDeactivate = async (userId) => {
    if (!window.confirm('Send deactivation request?')) return
    setActionLoading(true)
    try {
      await api.put(`/api/users/deactivate/${userId}`)
      setSuccess('Deactivation request sent successfully')
      fetchUsers()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send deactivation request')
    } finally {
      setActionLoading(false)
    }
  }

  // RESTORE - approval required
  const handleRestore = async (userId) => {
    if (!window.confirm('Send restore request?')) return
    setActionLoading(true)
    try {
      await api.put(`/api/users/restore/${userId}`)
      setSuccess('Restore request sent successfully')
      fetchUsers()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send restore request')
    } finally {
      setActionLoading(false)
    }
  }

  // DELETE - only for super admin (direct - no approval yet)
  const handleDeleteUser = async () => {
    if (!isSuperAdmin) return
    if (!window.confirm('Permanently delete this user?')) return

    setActionLoading(true)
    try {
      // If you later want approval for delete, create a new endpoint
      await api.delete(`/api/users/${selectedUser._id}`)
      setSuccess('User deleted successfully')
      setDeleteModalVisible(false)
      setSelectedUser(null)
      fetchUsers()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete user')
    } finally {
      setActionLoading(false)
    }
  }

  const openEditModal = (user) => {
    setSelectedUser(user)
    setFormData({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      phone: user.phone || '',
      username: user.username || '',
      role: user.role?._id || '',
    })
    setEditModalVisible(true)
  }

  const openDeleteModal = (user) => {
    if (!isSuperAdmin) return
    setSelectedUser(user)
    setDeleteModalVisible(true)
  }

  const getInitials = (first = '', last = '') => {
    return `${first[0] || ''}${last[0] || ''}`.toUpperCase() || '?'
  }

  // Filtered users
  const filteredUsers = users.filter((user) => {
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch =
      !searchTerm ||
      user.firstName?.toLowerCase().includes(searchLower) ||
      user.lastName?.toLowerCase().includes(searchLower) ||
      user.username?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower)

    const matchesRole = !filterRole || user.role?._id === filterRole
    const matchesStatus =
      !filterStatus ||
      (filterStatus === 'active' && user.isActive) ||
      (filterStatus === 'inactive' && !user.isActive)

    return matchesSearch && matchesRole && matchesStatus
  })

  const clearFilters = () => {
    setSearchTerm('')
    setFilterRole('')
    setFilterStatus('')
  }

  const hasActiveFilters = searchTerm || filterRole || filterStatus

  return (
    <>
      <CRow>
        <CCol xs={12}>
          <CCard className="mb-4 shadow-sm">
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <div>
                <strong>User Management</strong>
                <CBadge color="primary" shape="rounded-pill" className="ms-2">
                  {filteredUsers.length}
                </CBadge>
              </div>
              <div className="d-flex gap-2">
                <CButton color="light" onClick={fetchUsers} disabled={loading || actionLoading}>
                  <CIcon icon={cilReload} className="me-1" />
                  Refresh
                </CButton>
                <CButton
                  color="primary"
                  onClick={() => setCreateModalVisible(true)}
                  disabled={actionLoading}
                >
                  <CIcon icon={cilUserPlus} className="me-2" />
                  Add User
                </CButton>
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
                <CAlert
                  color="success"
                  dismissible
                  onClose={() => setSuccess(null)}
                  className="mb-3"
                >
                  {success}
                </CAlert>
              )}

              {/* Filters */}
              <CRow className="mb-4 g-3 align-items-end">
                <CCol md={4}>
                  <CInputGroup>
                    <CInputGroupText>
                      <CIcon icon={cilSearch} />
                    </CInputGroupText>
                    <CFormInput
                      placeholder="Search by name, username, email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </CInputGroup>
                </CCol>

                <CCol md={3}>
                  <CFormSelect value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
                    <option value="">All Roles</option>
                    {roles.map((role) => (
                      <option key={role._id} value={role._id}>
                        {role.name}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>

                <CCol md={3}>
                  <CFormSelect
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </CFormSelect>
                </CCol>

                <CCol md={2}>
                  {hasActiveFilters && (
                    <CButton color="light" className="w-100" onClick={clearFilters}>
                      <CIcon icon={cilX} className="me-1" />
                      Clear
                    </CButton>
                  )}
                </CCol>
              </CRow>

              {/* Table */}
              {loading ? (
                <div className="text-center py-5">
                  <CSpinner color="primary" />
                  <p className="mt-2 text-muted">Loading users...</p>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <CIcon icon={cilUser} size="3xl" className="mb-3 opacity-50" />
                  <p>
                    {hasActiveFilters
                      ? 'No users match your filters.'
                      : 'No users found in the system.'}
                  </p>
                </div>
              ) : (
                <div className="table-responsive">
                  <CTable hover responsive className="mb-0">
                    <CTableHead>
                      <CTableRow>
                        <CTableHeaderCell>User</CTableHeaderCell>
                        <CTableHeaderCell>Contact</CTableHeaderCell>
                        <CTableHeaderCell>Role</CTableHeaderCell>
                        <CTableHeaderCell>Status</CTableHeaderCell>
                        <CTableHeaderCell>Created</CTableHeaderCell>
                        <CTableHeaderCell className="text-center">Actions</CTableHeaderCell>
                      </CTableRow>
                    </CTableHead>
                    <CTableBody>
                      {filteredUsers.map((user) => (
                        <CTableRow key={user._id}>
                          <CTableDataCell>
                            <div className="d-flex align-items-center">
                              <CAvatar
                                color={user.isActive ? 'success' : 'danger'}
                                size="md"
                                className="me-3"
                              >
                                {getInitials(user.firstName, user.lastName)}
                              </CAvatar>
                              <div>
                                <div className="fw-semibold">
                                  {user.firstName} {user.lastName}
                                </div>
                                <small className="text-muted">@{user.username || '—'}</small>
                              </div>
                            </div>
                          </CTableDataCell>
                          <CTableDataCell>
                            <div>{user.email}</div>
                            <small className="text-muted">{user.phone || '—'}</small>
                          </CTableDataCell>
                          <CTableDataCell>
                            <CBadge color="info">{user.role?.name || 'No Role'}</CBadge>
                          </CTableDataCell>
                          <CTableDataCell>
                            <CBadge color={user.isActive ? 'success' : 'danger'}>
                              {user.isActive ? 'Active' : 'Inactive'}
                            </CBadge>
                          </CTableDataCell>
                          <CTableDataCell>
                            <div>{new Date(user.createdAt).toLocaleDateString()}</div>
                            <small className="text-muted">
                              by {user.createdBy?.username || 'System'}
                            </small>
                          </CTableDataCell>
                          <CTableDataCell className="text-center">
                            <CDropdown variant="btn-group">
                              <CDropdownToggle color="light" size="sm">
                                <CIcon icon={cilOptions} />
                              </CDropdownToggle>
                              <CDropdownMenu>
                                <CDropdownItem onClick={() => openEditModal(user)}>
                                  <CIcon icon={cilPencil} className="me-2" />
                                  Edit (Request)
                                </CDropdownItem>

                                {user.role?.name !== 'SUPER_ADMIN' && (
                                  <>
                                    {user.isActive ? (
                                      <CDropdownItem
                                        className="text-danger"
                                        onClick={() => handleDeactivate(user._id)}
                                        disabled={actionLoading}
                                      >
                                        <CIcon icon={cilLockLocked} className="me-2" />
                                        Deactivate (Request)
                                      </CDropdownItem>
                                    ) : (
                                      <CDropdownItem
                                        className="text-success"
                                        onClick={() => handleRestore(user._id)}
                                        disabled={actionLoading}
                                      >
                                        <CIcon icon={cilLockUnlocked} className="me-2" />
                                        Restore (Request)
                                      </CDropdownItem>
                                    )}
                                  </>
                                )}

                                {isSuperAdmin && (
                                  <>
                                    <CDropdownItem divider />
                                    <CDropdownItem
                                      className="text-danger"
                                      onClick={() => openDeleteModal(user)}
                                    >
                                      <CIcon icon={cilTrash} className="me-2" />
                                      Delete
                                    </CDropdownItem>
                                  </>
                                )}
                              </CDropdownMenu>
                            </CDropdown>
                          </CTableDataCell>
                        </CTableRow>
                      ))}
                    </CTableBody>
                  </CTable>
                </div>
              )}
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* CREATE Modal */}
      <CModal visible={createModalVisible} onClose={() => setCreateModalVisible(false)} size="lg">
        <CModalHeader>
          <CModalTitle>Create New User</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <CForm>
            <CRow>
              <CCol md={6}>
                <CFormInput
                  label="First Name *"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                />
              </CCol>
              <CCol md={6}>
                <CFormInput
                  label="Last Name *"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                />
              </CCol>
            </CRow>
            <CFormInput
              label="Username *"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
            />
            <CFormInput
              label="Email *"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
            <CFormInput
              label="Phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
            <CFormSelect
              label="Role *"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              required
            >
              <option value="">Select Role</option>
              {roles.map((role) => (
                <option key={role._id} value={role._id}>
                  {role.name}
                </option>
              ))}
            </CFormSelect>
          </CForm>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setCreateModalVisible(false)}>
            Cancel
          </CButton>
          <CButton color="primary" onClick={handleCreateUser} disabled={actionLoading}>
            {actionLoading ? <CSpinner size="sm" /> : 'Send Creation Request'}
          </CButton>
        </CModalFooter>
      </CModal>

      {/* EDIT Modal */}
      <CModal visible={editModalVisible} onClose={() => setEditModalVisible(false)} size="lg">
        <CModalHeader>
          <CModalTitle>Edit User</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <CForm>
            {/* Same form fields as create */}
            <CRow>
              <CCol md={6}>
                <CFormInput
                  label="First Name *"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                />
              </CCol>
              <CCol md={6}>
                <CFormInput
                  label="Last Name *"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                />
              </CCol>
            </CRow>
            <CFormInput
              label="Username *"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
            />
            <CFormInput
              label="Email *"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
            <CFormInput
              label="Phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
            <CFormSelect
              label="Role *"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              required
            >
              <option value="">Select Role</option>
              {roles.map((role) => (
                <option key={role._id} value={role._id}>
                  {role.name}
                </option>
              ))}
            </CFormSelect>
          </CForm>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setEditModalVisible(false)}>
            Cancel
          </CButton>
          <CButton color="primary" onClick={handleEditUser} disabled={actionLoading}>
            {actionLoading ? <CSpinner size="sm" /> : 'Send Update Request'}
          </CButton>
        </CModalFooter>
      </CModal>

      {/* DELETE Confirmation */}
      <CModal visible={deleteModalVisible} onClose={() => setDeleteModalVisible(false)}>
        <CModalHeader>
          <CModalTitle>Confirm Permanent Deletion</CModalTitle>
        </CModalHeader>
        <CModalBody>
          Are you sure you want to <strong>permanently delete</strong>{' '}
          <strong>
            {selectedUser?.firstName} {selectedUser?.lastName}
          </strong>
          ? This action cannot be undone.
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setDeleteModalVisible(false)}>
            Cancel
          </CButton>
          <CButton color="danger" onClick={handleDeleteUser} disabled={actionLoading}>
            {actionLoading ? <CSpinner size="sm" /> : 'Delete Permanently'}
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  )
}

export default Collapses
