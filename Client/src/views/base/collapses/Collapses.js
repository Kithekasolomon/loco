// src/views/users/UserList.jsx
import React, { useState, useEffect } from 'react'
import {
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CCollapse,
  CAccordion,
  CAccordionItem,
  CAccordionHeader,
  CAccordionBody,
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
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilUser, cilUserPlus, cilLockLocked, cilLockUnlocked } from '@coreui/icons'
import api from '../../../api/axios'
import { useAuth } from '../../../context/AuthContext'

const Collapses = () => {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState([])
  const [roles, setRoles] = useState([])
  const [activeAccordion, setActiveAccordion] = useState(null) // for single open
  const [modalVisible, setModalVisible] = useState(false)

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    username: '',
    role: '',
  })

  const fetchUsers = async () => {
    try {
      const res = await api.get('/api/users')
      setUsers(res.data)
    } catch (err) {
      console.error('Failed to fetch users:', err)
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

  const handleCreateUser = async () => {
    try {
      await api.post('/api/users/create', formData)
      alert('User creation request sent! Awaiting SUPER_ADMIN approval.')
      setModalVisible(false)
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        username: '',
        role: '',
      })
      fetchUsers()
    } catch (err) {
      alert('Error: ' + (err.response?.data?.msg || 'Failed to submit'))
    }
  }

  const handleDeactivate = async (userId) => {
    if (window.confirm('Send deactivation request for this user?')) {
      await api.put(`/api/users/deactivate/${userId}`)
      alert('Deactivation request sent')
      fetchUsers()
    }
  }

  const handleRestore = async (userId) => {
    if (window.confirm('Send restore request for this user?')) {
      await api.put(`/api/users/restore/${userId}`)
      alert('Restore request sent')
      fetchUsers()
    }
  }

  const getInitials = (first, last) => {
    return `${first?.[0] || ''}${last?.[0] || ''}`.toUpperCase()
  }

  return (
    <>
      <CRow>
        <CCol xs={12}>
          <CCard className="mb-4">
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <strong>User Management</strong>
              <CButton color="primary" onClick={() => setModalVisible(true)}>
                <CIcon icon={cilUserPlus} className="me-2" />
                Add New User
              </CButton>
            </CCardHeader>
            <CCardBody>
              {users.length === 0 ? (
                <p className="text-center text-muted py-4">No users found.</p>
              ) : (
                <CAccordion activeItemKey={activeAccordion}>
                  {users.map((user, index) => (
                    <CAccordionItem itemKey={index} key={user._id}>
                      <CAccordionHeader
                        onClick={() => setActiveAccordion(activeAccordion === index ? null : index)}
                      >
                        <div className="d-flex align-items-center w-100">
                          <CAvatar color={user.isActive ? 'success' : 'secondary'} className="me-3">
                            {user.firstName && user.lastName ? (
                              getInitials(user.firstName, user.lastName)
                            ) : (
                              <CIcon icon={cilUser} />
                            )}
                          </CAvatar>
                          <div className="flex-grow-1">
                            <strong>
                              {user.firstName} {user.lastName}
                            </strong>
                            <small className="text-muted d-block">
                              @{user.username} • {user.email}
                            </small>
                          </div>
                          <div className="d-flex align-items-center gap-3">
                            <CBadge color={user.isActive ? 'success' : 'danger'}>
                              {user.isActive ? 'Active' : 'Inactive'}
                            </CBadge>
                            <CBadge color="info">{user.role?.name || 'No Role'}</CBadge>
                          </div>
                        </div>
                      </CAccordionHeader>
                      <CAccordionBody>
                        <div className="ps-5">
                          <p>
                            <strong>Phone:</strong> {user.phone || 'Not provided'}
                          </p>
                          <p>
                            <strong>Created By:</strong> {user.createdBy?.username || 'System'}
                          </p>
                          <p>
                            <strong>Created At:</strong>{' '}
                            {new Date(user.createdAt).toLocaleDateString()}
                          </p>

                          <div className="mt-3">
                            {user.isActive ? (
                              user.role?.name !== 'SUPER_ADMIN' && (
                                <CButton
                                  color="danger"
                                  size="sm"
                                  onClick={() => handleDeactivate(user._id)}
                                >
                                  <CIcon icon={cilLockLocked} className="me-2" />
                                  Deactivate User
                                </CButton>
                              )
                            ) : (
                              <CButton
                                color="success"
                                size="sm"
                                onClick={() => handleRestore(user._id)}
                              >
                                <CIcon icon={cilLockUnlocked} className="me-2" />
                                Restore User
                              </CButton>
                            )}
                          </div>
                        </div>
                      </CAccordionBody>
                    </CAccordionItem>
                  ))}
                </CAccordion>
              )}
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* Create User Modal */}
      <CModal visible={modalVisible} onClose={() => setModalVisible(false)} size="lg">
        <CModalHeader>
          <CModalTitle>Create New User</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <CForm>
            <CRow>
              <CCol md={6}>
                <CFormInput
                  label="First Name"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="mb-3"
                />
              </CCol>
              <CCol md={6}>
                <CFormInput
                  label="Last Name"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="mb-3"
                />
              </CCol>
            </CRow>
            <CFormInput
              label="Username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="mb-3"
            />
            <CFormInput
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="mb-3"
            />
            <CFormInput
              label="Phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="mb-3"
            />
            <CFormSelect
              label="Role"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })} // value is now _id
            >
              <option value="">Select a role</option>
              {roles.map((role) => (
                <option key={role._id} value={role._id}>
                  {' '}
                  {/* ← value = _id, not name */}
                  {role.name}
                </option>
              ))}
            </CFormSelect>
          </CForm>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setModalVisible(false)}>
            Cancel
          </CButton>
          <CButton color="primary" onClick={handleCreateUser}>
            Create User (Send for Approval)
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  )
}

export default Collapses
