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
  CForm,
  CFormInput,
  CFormSelect,
  CBadge,
} from '@coreui/react'
import api from '../../../../api/axios' // your axios instance
import { useAuth } from '../../../../context/AuthContext'

const UserList = () => {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState([])
  const [roles, setRoles] = useState([])
  const [visible, setVisible] = useState(false)
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
      const res = await api.get('/api/users') // You need to add this route
      setUsers(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  const fetchRoles = async () => {
    try {
      const res = await api.get('/api/roles')
      setRoles(res.data)
    } catch (err) {
      console.error(err)
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
      setVisible(false)
      setFormData({ firstName: '', lastName: '', email: '', phone: '', username: '', role: '' })
      fetchUsers()
    } catch (err) {
      alert('Error: ' + (err.response?.data?.msg || 'Failed'))
    }
  }

  const handleDeactivate = async (userId) => {
    if (window.confirm('Send deactivation request?')) {
      await api.put(`/api/users/deactivate/${userId}`)
      alert('Deactivation request sent')
      fetchUsers()
    }
  }

  const handleRestore = async (userId) => {
    if (window.confirm('Send restore request?')) {
      await api.put(`/api/users/restore/${userId}`)
      alert('Restore request sent')
      fetchUsers()
    }
  }

  return (
    <>
      <CRow>
        <CCol xs={12}>
          <CCard className="mb-4">
            <CCardHeader>
              <strong>User Management</strong>
              <CButton color="primary" className="float-end" onClick={() => setVisible(true)}>
                Add New User
              </CButton>
            </CCardHeader>
            <CCardBody>
              <CTable hover responsive>
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell>Name</CTableHeaderCell>
                    <CTableHeaderCell>Username</CTableHeaderCell>
                    <CTableHeaderCell>Email</CTableHeaderCell>
                    <CTableHeaderCell>Role</CTableHeaderCell>
                    <CTableHeaderCell>Status</CTableHeaderCell>
                    <CTableHeaderCell>Actions</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {users.map((user) => (
                    <CTableRow key={user._id}>
                      <CTableDataCell>{`${user.firstName} ${user.lastName}`}</CTableDataCell>
                      <CTableDataCell>{user.username}</CTableDataCell>
                      <CTableDataCell>{user.email}</CTableDataCell>
                      <CTableDataCell>{user.role?.name || 'N/A'}</CTableDataCell>
                      <CTableDataCell>
                        <CBadge color={user.isActive ? 'success' : 'danger'}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </CBadge>
                      </CTableDataCell>
                      <CTableDataCell>
                        {!user.isActive && (
                          <CButton
                            size="sm"
                            color="success"
                            onClick={() => handleRestore(user._id)}
                          >
                            Restore
                          </CButton>
                        )}
                        {user.isActive && user.role?.name !== 'SUPER_ADMIN' && (
                          <CButton
                            size="sm"
                            color="danger"
                            className="ms-2"
                            onClick={() => handleDeactivate(user._id)}
                          >
                            Deactivate
                          </CButton>
                        )}
                      </CTableDataCell>
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* Create User Modal */}
      <CModal visible={visible} onClose={() => setVisible(false)}>
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
                />
              </CCol>
              <CCol md={6}>
                <CFormInput
                  label="Last Name"
                  className="mb-3"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                />
              </CCol>
            </CRow>
            <CFormInput
              label="Username"
              className="mb-3"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            />
            <CFormInput
              label="Email"
              type="email"
              className="mb-3"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <CFormInput
              label="Phone"
              className="mb-3"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
            <CFormSelect
              label="Role"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
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
          <CButton color="secondary" onClick={() => setVisible(false)}>
            Cancel
          </CButton>
          <CButton color="primary" onClick={handleCreateUser}>
            Create User
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  )
}

export default UserList
