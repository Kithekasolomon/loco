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
} from '@coreui/react'
import api from '../../../../api/axios'

const UserRoles = () => {
  const [roles, setRoles] = useState([])
  const [permissions, setPermissions] = useState([])
  const [visible, setVisible] = useState(false)
  const [roleName, setRoleName] = useState('')
  const [selectedPerms, setSelectedPerms] = useState([])

  const fetchRoles = async () => {
    const res = await api.get('/api/roles')
    setRoles(res.data)
  }

  const fetchPermissions = async () => {
    const res = await api.get('/api/permissions/map') // your route
    setPermissions(res.data)
  }

  useEffect(() => {
    fetchRoles()
    fetchPermissions()
  }, [])

  const handleCreateRole = async () => {
    try {
      await api.post('/api/roles', {
        name: roleName.toUpperCase(),
        permissions: selectedPerms,
      })
      alert('Role created successfully!')
      setVisible(false)
      setRoleName('')
      setSelectedPerms([])
      fetchRoles()
    } catch (err) {
      alert('Error: ' + err.response?.data?.msg)
    }
  }

  const togglePermission = (perm) => {
    setSelectedPerms((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm],
    )
  }

  return (
    <>
      <CRow>
        <CCol xs={12}>
          <CCard className="mb-4">
            <CCardHeader>
              <strong>Role Management</strong>
              <CButton color="primary" className="float-end" onClick={() => setVisible(true)}>
                Create New Role
              </CButton>
            </CCardHeader>
            <CCardBody>
              <CTable hover>
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell>Role Name</CTableHeaderCell>
                    <CTableHeaderCell>Permissions Count</CTableHeaderCell>
                    <CTableHeaderCell>Created At</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {roles.map((role) => (
                    <CTableRow key={role._id}>
                      <CTableDataCell>
                        <strong>{role.name}</strong>
                      </CTableDataCell>
                      <CTableDataCell>{role.permissions.length}</CTableDataCell>
                      <CTableDataCell>
                        {new Date(role.createdAt).toLocaleDateString()}
                      </CTableDataCell>
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* Create Role Modal */}
      <CModal size="lg" visible={visible} onClose={() => setVisible(false)}>
        <CModalHeader>
          <CModalTitle>Create New Role</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <CFormInput
            label="Role Name"
            placeholder="e.g., HR, TEAM_LEAD"
            value={roleName}
            onChange={(e) => setRoleName(e.target.value)}
            className="mb-4"
          />

          <h5>Select Permissions</h5>
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {permissions.map((p) => (
              <CFormCheck
                key={p.permission}
                label={`${p.method} ${p.path} → ${p.permission}`}
                checked={selectedPerms.includes(p.permission)}
                onChange={() => togglePermission(p.permission)}
              />
            ))}
          </div>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setVisible(false)}>
            Cancel
          </CButton>
          <CButton color="primary" onClick={handleCreateRole}>
            Create Role
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  )
}

export default UserRoles
