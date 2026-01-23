// src/views/roles/UserRoles.jsx
import React, { useState, useEffect } from 'react'
import {
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CFormInput,
  CFormCheck,
  CBadge,
  CDropdown,
  CDropdownToggle,
  CDropdownMenu,
  CDropdownItem,
  CSpinner,
  CAlert,
  CInputGroup,
  CInputGroupText,
  CCollapse,
  CListGroup,
  CListGroupItem,
  CButtonGroup,
  CTooltip,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilShieldAlt,
  cilPlus,
  cilPencil,
  cilTrash,
  cilOptions,
  cilReload,
  cilSearch,
  cilChevronBottom,
  cilChevronTop,
  cilCheckCircle,
  cilLockLocked,
  cilInfo,
} from '@coreui/icons'
import api from '../../../../api/axios'
import { useAuth } from '../../../../context/AuthContext'

const UserRoles = () => {
  const { user: currentUser } = useAuth()
  const [roles, setRoles] = useState([])
  const [permissions, setPermissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  // Modals
  const [createModalVisible, setCreateModalVisible] = useState(false)
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [deleteModalVisible, setDeleteModalVisible] = useState(false)
  const [viewModalVisible, setViewModalVisible] = useState(false)

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('')
  const [permissionSearch, setPermissionSearch] = useState('')

  // Selected role
  const [selectedRole, setSelectedRole] = useState(null)

  // Form data
  const [roleName, setRoleName] = useState('')
  const [selectedPerms, setSelectedPerms] = useState([])

  // Expanded rows
  const [expandedRows, setExpandedRows] = useState([])

  // Permission selection
  const [selectAll, setSelectAll] = useState(false)

  const isSuperAdmin = currentUser?.role?.name === 'SUPER_ADMIN'

  const fetchRoles = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await api.get('/api/roles')
      setRoles(res.data)
    } catch (err) {
      console.error('Failed to fetch roles:', err)
      setError('Failed to load roles. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const fetchPermissions = async () => {
    try {
      const res = await api.get('/api/permissions/map')
      setPermissions(res.data)
    } catch (err) {
      console.error('Failed to fetch permissions:', err)
    }
  }

  useEffect(() => {
    fetchRoles()
    fetchPermissions()
  }, [])

  // CREATE
  const handleCreateRole = async () => {
    try {
      if (!roleName.trim()) {
        setError('Role name is required')
        return
      }
      if (selectedPerms.length === 0) {
        setError('Please select at least one permission')
        return
      }

      await api.post('/api/roles', {
        name: roleName.toUpperCase().replace(/\s+/g, '_'),
        permissions: selectedPerms,
      })

      setSuccess('Role created successfully!')
      setCreateModalVisible(false)
      resetForm()
      fetchRoles()
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to create role')
    }
  }

  // UPDATE
  const handleUpdateRole = async () => {
    try {
      if (!roleName.trim()) {
        setError('Role name is required')
        return
      }
      if (selectedPerms.length === 0) {
        setError('Please select at least one permission')
        return
      }

      await api.put(`/api/roles/${selectedRole._id}`, {
        name: roleName.toUpperCase().replace(/\s+/g, '_'),
        permissions: selectedPerms,
      })

      setSuccess('Role updated successfully!')
      setEditModalVisible(false)
      resetForm()
      setSelectedRole(null)
      fetchRoles()
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to update role')
    }
  }

  // DELETE
  const handleDeleteRole = async () => {
    try {
      await api.delete(`/api/roles/${selectedRole._id}`)
      setSuccess('Role deleted successfully!')
      setDeleteModalVisible(false)
      setSelectedRole(null)
      fetchRoles()
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to delete role')
    }
  }

  const resetForm = () => {
    setRoleName('')
    setSelectedPerms([])
    setPermissionSearch('')
    setSelectAll(false)
  }

  const openEditModal = (role) => {
    setSelectedRole(role)
    setRoleName(role.name)
    setSelectedPerms(role.permissions.includes('*') ? ['*'] : role.permissions)
    setEditModalVisible(true)
  }

  const openViewModal = (role) => {
    setSelectedRole(role)
    setViewModalVisible(true)
  }

  const openDeleteModal = (role) => {
    setSelectedRole(role)
    setDeleteModalVisible(true)
  }

  const togglePermission = (perm) => {
    setSelectedPerms((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm],
    )
  }

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedPerms([])
    } else {
      setSelectedPerms(filteredPermissions.map((p) => p.permission))
    }
    setSelectAll(!selectAll)
  }

  const toggleRowExpand = (roleId) => {
    setExpandedRows((prev) =>
      prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId],
    )
  }

  // Filter roles
  const filteredRoles = roles.filter((role) =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Filter permissions
  const filteredPermissions = permissions.filter(
    (p) =>
      permissionSearch === '' ||
      p.permission.toLowerCase().includes(permissionSearch.toLowerCase()) ||
      p.method.toLowerCase().includes(permissionSearch.toLowerCase()) ||
      p.path.toLowerCase().includes(permissionSearch.toLowerCase()),
  )

  // Group permissions by method
  const groupedPermissions = filteredPermissions.reduce((acc, perm) => {
    const method = perm.method
    if (!acc[method]) acc[method] = []
    acc[method].push(perm)
    return acc
  }, {})

  const getMethodColor = (method) => {
    const colors = {
      GET: 'success',
      POST: 'primary',
      PUT: 'warning',
      DELETE: 'danger',
      PATCH: 'info',
    }
    return colors[method] || 'secondary'
  }

  const formatPermissionName = (perm) => {
    return perm.replace(/_/g, ' ').toLowerCase()
  }

  return (
    <>
      <CRow>
        <CCol xs={12}>
          <CCard className="mb-4 shadow-sm">
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <div>
                <strong>Role Management</strong>
                <CBadge color="primary" className="ms-2">
                  {filteredRoles.length} {filteredRoles.length === 1 ? 'Role' : 'Roles'}
                </CBadge>
              </div>
              <div className="d-flex gap-2">
                <CButton color="light" onClick={fetchRoles} disabled={loading}>
                  <CIcon icon={cilReload} className="me-1" />
                  Refresh
                </CButton>
                <CButton color="primary" onClick={() => setCreateModalVisible(true)}>
                  <CIcon icon={cilPlus} className="me-2" />
                  Create Role
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
                <CAlert color="success" dismissible onClose={() => setSuccess(null)}>
                  {success}
                </CAlert>
              )}

              {/* Search */}
              <CRow className="mb-3">
                <CCol md={6}>
                  <CInputGroup>
                    <CInputGroupText>
                      <CIcon icon={cilSearch} />
                    </CInputGroupText>
                    <CFormInput
                      placeholder="Search roles..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </CInputGroup>
                </CCol>
              </CRow>

              {/* Table */}
              {loading ? (
                <div className="text-center py-5">
                  <CSpinner color="primary" />
                  <p className="mt-2 text-muted">Loading roles...</p>
                </div>
              ) : filteredRoles.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <CIcon icon={cilShieldAlt} size="3xl" className="mb-3 opacity-50" />
                  <p>{searchTerm ? 'No roles match your search.' : 'No roles found.'}</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <CTable hover align="middle" className="mb-0">
                    <CTableHead>
                      <CTableRow>
                        <CTableHeaderCell style={{ width: '40px' }}></CTableHeaderCell>
                        <CTableHeaderCell>Role Name</CTableHeaderCell>
                        <CTableHeaderCell>Permissions</CTableHeaderCell>
                        <CTableHeaderCell>Created By</CTableHeaderCell>
                        <CTableHeaderCell>Created At</CTableHeaderCell>
                        <CTableHeaderCell className="text-center">Actions</CTableHeaderCell>
                      </CTableRow>
                    </CTableHead>
                    <CTableBody>
                      {filteredRoles.map((role) => {
                        const isExpanded = expandedRows.includes(role._id)
                        const hasAllPermissions = role.permissions.includes('*')
                        const permCount = hasAllPermissions ? 'All' : role.permissions.length

                        return (
                          <React.Fragment key={role._id}>
                            <CTableRow>
                              <CTableDataCell>
                                <CButton
                                  color="ghost"
                                  size="sm"
                                  onClick={() => toggleRowExpand(role._id)}
                                >
                                  <CIcon icon={isExpanded ? cilChevronTop : cilChevronBottom} />
                                </CButton>
                              </CTableDataCell>
                              <CTableDataCell>
                                <div className="d-flex align-items-center">
                                  <CIcon icon={cilShieldAlt} className="text-primary me-2" />
                                  <strong>{role.name}</strong>
                                  {role.name === 'SUPER_ADMIN' && (
                                    <CBadge color="danger" className="ms-2">
                                      System
                                    </CBadge>
                                  )}
                                </div>
                              </CTableDataCell>
                              <CTableDataCell>
                                <CBadge color={hasAllPermissions ? 'danger' : 'info'}>
                                  {permCount}{' '}
                                  {hasAllPermissions
                                    ? 'Permissions'
                                    : `Permission${role.permissions.length !== 1 ? 's' : ''}`}
                                </CBadge>
                              </CTableDataCell>
                              <CTableDataCell>
                                {role.createdBy?.username || 'System'}
                              </CTableDataCell>
                              <CTableDataCell>
                                {new Date(role.createdAt).toLocaleDateString()}
                              </CTableDataCell>
                              <CTableDataCell className="text-center">
                                <CDropdown variant="btn-group">
                                  <CDropdownToggle color="light" size="sm">
                                    <CIcon icon={cilOptions} />
                                  </CDropdownToggle>
                                  <CDropdownMenu>
                                    <CDropdownItem onClick={() => openViewModal(role)}>
                                      <CIcon icon={cilInfo} className="me-2" />
                                      View Details
                                    </CDropdownItem>

                                    {role.name !== 'SUPER_ADMIN' && isSuperAdmin && (
                                      <>
                                        <CDropdownItem onClick={() => openEditModal(role)}>
                                          <CIcon icon={cilPencil} className="me-2" />
                                          Edit
                                        </CDropdownItem>
                                        <CDropdownItem divider />
                                        <CDropdownItem
                                          className="text-danger"
                                          onClick={() => openDeleteModal(role)}
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

                            {/* Expanded Row */}
                            {isExpanded && (
                              <CTableRow>
                                <CTableDataCell colSpan="6" className="bg-light">
                                  <div className="p-3">
                                    <h6 className="mb-3">Permissions:</h6>
                                    {hasAllPermissions ? (
                                      <CAlert color="warning" className="mb-0">
                                        <CIcon icon={cilLockLocked} className="me-2" />
                                        This role has all permissions (*)
                                      </CAlert>
                                    ) : (
                                      <div className="d-flex flex-wrap gap-2">
                                        {role.permissions.map((perm, idx) => (
                                          <CBadge key={idx} color="secondary" className="py-1 px-2">
                                            {perm}
                                          </CBadge>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </CTableDataCell>
                              </CTableRow>
                            )}
                          </React.Fragment>
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

      {/* CREATE Modal */}
      <CModal
        size="xl"
        visible={createModalVisible}
        onClose={() => {
          setCreateModalVisible(false)
          resetForm()
        }}
        scrollable
      >
        <CModalHeader>
          <CModalTitle>Create New Role</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <CFormInput
            label="Role Name *"
            placeholder="e.g., HR, TEAM_LEAD, MANAGER"
            value={roleName}
            onChange={(e) => setRoleName(e.target.value)}
            className="mb-4"
          />

          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="mb-0">Select Permissions</h5>
            <div className="d-flex gap-2">
              <CInputGroup style={{ width: '300px' }}>
                <CInputGroupText>
                  <CIcon icon={cilSearch} />
                </CInputGroupText>
                <CFormInput
                  placeholder="Search permissions..."
                  value={permissionSearch}
                  onChange={(e) => setPermissionSearch(e.target.value)}
                  size="sm"
                />
              </CInputGroup>
              <CButton color="primary" size="sm" onClick={toggleSelectAll}>
                {selectAll ? 'Deselect All' : 'Select All'}
              </CButton>
            </div>
          </div>

          <CBadge color="info" className="mb-3">
            {selectedPerms.length} permission{selectedPerms.length !== 1 ? 's' : ''} selected
          </CBadge>

          <div style={{ maxHeight: '400px', overflowY: 'auto' }} className="border rounded p-3">
            {Object.keys(groupedPermissions).length === 0 ? (
              <p className="text-muted text-center py-3">No permissions found</p>
            ) : (
              Object.keys(groupedPermissions).map((method) => (
                <div key={method} className="mb-4">
                  <h6 className="mb-2">
                    <CBadge color={getMethodColor(method)} className="me-2">
                      {method}
                    </CBadge>
                    Methods
                  </h6>
                  <CListGroup flush>
                    {groupedPermissions[method].map((p) => (
                      <CListGroupItem key={p.permission} className="border-0 py-2 px-3">
                        <CFormCheck
                          label={
                            <div>
                              <strong>{p.permission}</strong>
                              <div className="text-muted small">
                                {method} {p.path}
                              </div>
                            </div>
                          }
                          checked={selectedPerms.includes(p.permission)}
                          onChange={() => togglePermission(p.permission)}
                        />
                      </CListGroupItem>
                    ))}
                  </CListGroup>
                </div>
              ))
            )}
          </div>
        </CModalBody>
        <CModalFooter>
          <CButton
            color="secondary"
            onClick={() => {
              setCreateModalVisible(false)
              resetForm()
            }}
          >
            Cancel
          </CButton>
          <CButton color="primary" onClick={handleCreateRole}>
            <CIcon icon={cilCheckCircle} className="me-2" />
            Create Role
          </CButton>
        </CModalFooter>
      </CModal>

      {/* EDIT Modal */}
      <CModal
        size="xl"
        visible={editModalVisible}
        onClose={() => {
          setEditModalVisible(false)
          resetForm()
          setSelectedRole(null)
        }}
        scrollable
      >
        <CModalHeader>
          <CModalTitle>Edit Role</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <CFormInput
            label="Role Name *"
            placeholder="e.g., HR, TEAM_LEAD, MANAGER"
            value={roleName}
            onChange={(e) => setRoleName(e.target.value)}
            className="mb-4"
          />

          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="mb-0">Select Permissions</h5>
            <div className="d-flex gap-2">
              <CInputGroup style={{ width: '300px' }}>
                <CInputGroupText>
                  <CIcon icon={cilSearch} />
                </CInputGroupText>
                <CFormInput
                  placeholder="Search permissions..."
                  value={permissionSearch}
                  onChange={(e) => setPermissionSearch(e.target.value)}
                  size="sm"
                />
              </CInputGroup>
              <CButton color="primary" size="sm" onClick={toggleSelectAll}>
                {selectAll ? 'Deselect All' : 'Select All'}
              </CButton>
            </div>
          </div>

          <CBadge color="info" className="mb-3">
            {selectedPerms.length} permission{selectedPerms.length !== 1 ? 's' : ''} selected
          </CBadge>

          <div style={{ maxHeight: '400px', overflowY: 'auto' }} className="border rounded p-3">
            {Object.keys(groupedPermissions).length === 0 ? (
              <p className="text-muted text-center py-3">No permissions found</p>
            ) : (
              Object.keys(groupedPermissions).map((method) => (
                <div key={method} className="mb-4">
                  <h6 className="mb-2">
                    <CBadge color={getMethodColor(method)} className="me-2">
                      {method}
                    </CBadge>
                    Methods
                  </h6>
                  <CListGroup flush>
                    {groupedPermissions[method].map((p) => (
                      <CListGroupItem key={p.permission} className="border-0 py-2 px-3">
                        <CFormCheck
                          label={
                            <div>
                              <strong>{p.permission}</strong>
                              <div className="text-muted small">
                                {method} {p.path}
                              </div>
                            </div>
                          }
                          checked={selectedPerms.includes(p.permission)}
                          onChange={() => togglePermission(p.permission)}
                        />
                      </CListGroupItem>
                    ))}
                  </CListGroup>
                </div>
              ))
            )}
          </div>
        </CModalBody>
        <CModalFooter>
          <CButton
            color="secondary"
            onClick={() => {
              setEditModalVisible(false)
              resetForm()
              setSelectedRole(null)
            }}
          >
            Cancel
          </CButton>
          <CButton color="primary" onClick={handleUpdateRole}>
            <CIcon icon={cilCheckCircle} className="me-2" />
            Update Role
          </CButton>
        </CModalFooter>
      </CModal>

      {/* VIEW Modal */}
      <CModal
        size="lg"
        visible={viewModalVisible}
        onClose={() => {
          setViewModalVisible(false)
          setSelectedRole(null)
        }}
      >
        <CModalHeader>
          <CModalTitle>Role Details</CModalTitle>
        </CModalHeader>
        <CModalBody>
          {selectedRole && (
            <>
              <div className="mb-4">
                <h5>{selectedRole.name}</h5>
                <small className="text-muted">
                  Created {new Date(selectedRole.createdAt).toLocaleString()}
                  {selectedRole.createdBy && ` by ${selectedRole.createdBy.username}`}
                </small>
              </div>

              <h6 className="mb-3">Permissions:</h6>
              {selectedRole.permissions.includes('*') ? (
                <CAlert color="warning">
                  <CIcon icon={cilLockLocked} className="me-2" />
                  This role has all permissions (*)
                </CAlert>
              ) : (
                <div className="d-flex flex-wrap gap-2">
                  {selectedRole.permissions.map((perm, idx) => (
                    <CBadge key={idx} color="secondary" className="py-2 px-3">
                      {perm}
                    </CBadge>
                  ))}
                </div>
              )}
            </>
          )}
        </CModalBody>
        <CModalFooter>
          <CButton
            color="secondary"
            onClick={() => {
              setViewModalVisible(false)
              setSelectedRole(null)
            }}
          >
            Close
          </CButton>
        </CModalFooter>
      </CModal>

      {/* DELETE Confirmation Modal */}
      <CModal
        visible={deleteModalVisible}
        onClose={() => {
          setDeleteModalVisible(false)
          setSelectedRole(null)
        }}
      >
        <CModalHeader>
          <CModalTitle>Confirm Delete</CModalTitle>
        </CModalHeader>
        <CModalBody>
          Are you sure you want to delete the role <strong>{selectedRole?.name}</strong>? This
          action cannot be undone and may affect users assigned to this role.
        </CModalBody>
        <CModalFooter>
          <CButton
            color="secondary"
            onClick={() => {
              setDeleteModalVisible(false)
              setSelectedRole(null)
            }}
          >
            Cancel
          </CButton>
          <CButton color="danger" onClick={handleDeleteRole}>
            Delete Role
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  )
}

export default UserRoles
