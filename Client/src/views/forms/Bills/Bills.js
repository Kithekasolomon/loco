// src/views/bills/Bills.js
import React, { useEffect, useState } from 'react'
import {
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
  CBadge,
  CSpinner,
} from '@coreui/react'
import { Link } from 'react-router-dom'
import api from '../../../api/axios'

const Bills = () => {
  const [bills, setBills] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBills()
  }, [])

  const fetchBills = async () => {
    try {
      const res = await api.get('/api/bills')
      setBills(res.data)
      setLoading(false)
    } catch (err) {
      console.error(err)
      setLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PAID': return <CBadge color="success">Paid</CBadge>
      case 'PARTIALLY_PAID': return <CBadge color="warning">Partially Paid</CBadge>
      case 'OVERDUE': return <CBadge color="danger">Overdue</CBadge>
      default: return <CBadge color="secondary">Unpaid</CBadge>
    }
  }

  return (
    <>
      <CCard className="mb-4">
        <CCardHeader>
          <div className="d-flex justify-content-between align-items-center">
            <h5>Bills</h5>
            <Link to="/bills/create">
              <CButton color="primary">New Bill</CButton>
            </Link>
          </div>
        </CCardHeader>
        <CCardBody>
          {loading ? (
            <CSpinner />
          ) : (
            <CTable hover responsive>
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell>Bill #</CTableHeaderCell>
                  <CTableHeaderCell>Vendor</CTableHeaderCell>
                  <CTableHeaderCell>Date</CTableHeaderCell>
                  <CTableHeaderCell>Due Date</CTableHeaderCell>
                  <CTableHeaderCell>Total</CTableHeaderCell>
                  <CTableHeaderCell>Status</CTableHeaderCell>
                  <CTableHeaderCell>Actions</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {bills.length === 0 ? (
                  <CTableRow>
                    <CTableDataCell colSpan="7" className="text-center">
                      No bills found
                    </CTableDataCell>
                  </CTableRow>
                ) : (
                  bills.map((bill) => (
                    <CTableRow key={bill._id}>
                      <CTableDataCell>
                        <Link to={`/bills/${bill._id}`}>{bill.billNumber}</Link>
                      </CTableDataCell>
                      <CTableDataCell>{bill.vendor?.displayName || 'N/A'}</CTableDataCell>
                      <CTableDataCell>{new Date(bill.billDate).toLocaleDateString()}</CTableDataCell>
                      <CTableDataCell>{bill.dueDate ? new Date(bill.dueDate).toLocaleDateString() : '-'}</CTableDataCell>
                      <CTableDataCell>KES {bill.total?.toLocaleString()}</CTableDataCell>
                      <CTableDataCell>{getStatusBadge(bill.status)}</CTableDataCell>
                      <CTableDataCell>
                        <Link to={`/bills/${bill._id}`}>
                          <CButton size="sm" color="info">View</CButton>
                        </Link>
                      </CTableDataCell>
                    </CTableRow>
                  ))
                )}
              </CTableBody>
            </CTable>
          )}
        </CCardBody>
      </CCard>
    </>
  )
}

export default Bills