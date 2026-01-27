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

const Invoices = () => {
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchInvoices()
  }, [])

  const fetchInvoices = async () => {
    try {
      const res = await api.get('/api/invoices')
      setInvoices(res.data)
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
      case 'SENT': case 'OVERDUE': return <CBadge color="danger">Overdue</CBadge>
      default: return <CBadge color="secondary">Draft</CBadge>
    }
  }

  return (
    <>
      <CCard className="mb-4">
        <CCardHeader>
          <div className="d-flex justify-content-between">
            <h5>Invoices</h5>
            <Link to="/invoices/create">
              <CButton color="primary">New Invoice</CButton>
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
                  <CTableHeaderCell>Invoice #</CTableHeaderCell>
                  <CTableHeaderCell>Customer</CTableHeaderCell>
                  <CTableHeaderCell>Date</CTableHeaderCell>
                  <CTableHeaderCell>Due Date</CTableHeaderCell>
                  <CTableHeaderCell>Total</CTableHeaderCell>
                  <CTableHeaderCell>Status</CTableHeaderCell>
                  <CTableHeaderCell>Actions</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {invoices.map((inv) => (
                  <CTableRow key={inv._id}>
                    <CTableDataCell>
                      <Link to={`/invoices/${inv._id}`}>{inv.invoiceNumber}</Link>
                    </CTableDataCell>
                    <CTableDataCell>{inv.customer?.displayName || 'N/A'}</CTableDataCell>
                    <CTableDataCell>{new Date(inv.invoiceDate).toLocaleDateString()}</CTableDataCell>
                    <CTableDataCell>{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : '-'}</CTableDataCell>
                    <CTableDataCell>KES {inv.total?.toLocaleString()}</CTableDataCell>
                    <CTableDataCell>{getStatusBadge(inv.status)}</CTableDataCell>
                    <CTableDataCell>
                      <Link to={`/invoices/${inv._id}`}>
                        <CButton size="sm" color="info">View</CButton>
                      </Link>
                    </CTableDataCell>
                  </CTableRow>
                ))}
              </CTableBody>
            </CTable>
          )}
        </CCardBody>
      </CCard>
    </>
  )
}

export default Invoices