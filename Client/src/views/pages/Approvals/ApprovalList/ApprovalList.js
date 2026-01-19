// src/views/approvals/ApprovalList.jsx
import React, { useState, useEffect } from 'react'
import {
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
  CButton,
  CBadge,
} from '@coreui/react'
import api from '../../../../api/axios'
import { useAuth } from '../../../../contexts/AuthContext'

const ApprovalList = () => {
  const { user } = useAuth()
  const [approvals, setApprovals] = useState([])

  const fetchApprovals = async () => {
    try {
      const res = await api.get('/api/approvals') // Add this route for SUPER_ADMIN only
      setApprovals(res.data.filter((a) => a.status === 'PENDING'))
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    if (user && user.role === 'SUPER_ADMIN') {
      fetchApprovals()
    }
  }, [user])

  const handleReview = async (id, status) => {
    await api.put(`/api/approvals/${id}`, { status })
    alert(`Request ${status}!`)
    fetchApprovals()
  }

  if (user?.role !== 'SUPER_ADMIN') {
    return <div>You don't have access to this page.</div>
  }

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader>
            <strong>Pending Approval Requests</strong>
          </CCardHeader>
          <CCardBody>
            <CTable hover>
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell>Action</CTableHeaderCell>
                  <CTableHeaderCell>Requested By</CTableHeaderCell>
                  <CTableHeaderCell>Details</CTableHeaderCell>
                  <CTableHeaderCell>Date</CTableHeaderCell>
                  <CTableHeaderCell>Actions</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {approvals.map((a) => (
                  <CTableRow key={a._id}>
                    <CTableDataCell>
                      <strong>{a.actionType.replace('_', ' ')}</strong>
                    </CTableDataCell>
                    <CTableDataCell>{a.requestedBy?.username || 'Unknown'}</CTableDataCell>
                    <CTableDataCell>
                      <pre style={{ fontSize: '12px' }}>{JSON.stringify(a.payload, null, 2)}</pre>
                    </CTableDataCell>
                    <CTableDataCell>{new Date(a.createdAt).toLocaleString()}</CTableDataCell>
                    <CTableDataCell>
                      <CButton
                        size="sm"
                        color="success"
                        className="me-2"
                        onClick={() => handleReview(a._id, 'APPROVED')}
                      >
                        Approve
                      </CButton>
                      <CButton
                        size="sm"
                        color="danger"
                        onClick={() => handleReview(a._id, 'DENIED')}
                      >
                        Deny
                      </CButton>
                    </CTableDataCell>
                  </CTableRow>
                ))}
              </CTableBody>
            </CTable>
            {approvals.length === 0 && <p>No pending approvals.</p>}
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  )
}

export default ApprovalList
