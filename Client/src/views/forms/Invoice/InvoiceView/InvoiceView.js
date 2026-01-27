// src/views/invoices/InvoiceView.js
import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CTable,
  CSpinner,
  CAlert,
} from '@coreui/react'
import api from '../../../../api/axios'

const InvoiceView = () => {
  const { id } = useParams()
  const [invoice, setInvoice] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const res = await api.get(`/api/invoices/${id}`)
        setInvoice(res.data)
      } catch (err) {
        setError('Failed to load invoice')
      } finally {
        setLoading(false)
      }
    }
    fetchInvoice()
  }, [id])

  if (loading) return <CSpinner />
  if (error) return <CAlert color="danger">{error}</CAlert>
  if (!invoice) return <CAlert color="info">Invoice not found</CAlert>

  return (
    <CCard className="shadow-sm">
      <CCardHeader className="d-flex justify-content-between">
        <h3>Invoice #{invoice.invoiceNumber}</h3>
        <CButton color="success" onClick={() => window.print()}>
          Print / Save PDF
        </CButton>
      </CCardHeader>
      <CCardBody>
        {/* Header */}
        <CRow className="mb-4">
          <CCol md={6}>
            <h5>From:</h5>
            <p>
              <strong>Your Company Name</strong><br />
              Nairobi, Kenya<br />
              KRA PIN: XXXXXXXXXX<br />
              Email: accounts@yourcompany.co.ke
            </p>
          </CCol>
          <CCol md={6} className="text-end">
            <h5>Bill To:</h5>
            <p>
              <strong>{invoice.customer?.displayName}</strong><br />
              {invoice.customer?.companyName}<br />
              {invoice.customer?.billingAddress?.street}<br />
              {invoice.customer?.kraPin && `KRA PIN: ${invoice.customer.kraPin}`}
            </p>
          </CCol>
        </CRow>

        <CRow className="mb-4">
          <CCol md={6}>
            <strong>Invoice Date:</strong> {new Date(invoice.invoiceDate).toLocaleDateString()}<br />
            <strong>Due Date:</strong> {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'Due on Receipt'}
          </CCol>
        </CRow>

        {/* Items Table */}
        <CTable bordered className="mb-4">
          <CTableHead color="light">
            <CTableRow>
              <CTableHeaderCell>Description</CTableHeaderCell>
              <CTableHeaderCell>Qty</CTableHeaderCell>
              <CTableHeaderCell>Rate</CTableHeaderCell>
              <CTableHeaderCell>Amount</CTableHeaderCell>
            </CTableRow>
          </CTableHead>
          <CTableBody>
            {invoice.items.map((item, i) => (
              <CTableRow key={i}>
                <CTableDataCell>{item.description}</CTableDataCell>
                <CTableDataCell>{item.quantity}</CTableDataCell>
                <CTableDataCell>KES {item.rate.toLocaleString()}</CTableDataCell>
                <CTableDataCell>KES {item.amount.toLocaleString()}</CTableDataCell>
              </CTableRow>
            ))}
          </CTableBody>
        </CTable>

        {/* Totals */}
        <CRow>
          <CCol md={6} className="offset-md-6">
            <CTable borderless>
              <CTableBody>
                <CTableRow>
                  <CTableDataCell className="text-end"><strong>Subtotal</strong></CTableDataCell>
                  <CTableDataCell>KES {invoice.subtotal?.toLocaleString()}</CTableDataCell>
                </CTableRow>
                <CTableRow>
                  <CTableDataCell className="text-end"><strong>VAT (16%)</strong></CTableDataCell>
                  <CTableDataCell>KES {invoice.tax?.toLocaleString()}</CTableDataCell>
                </CTableRow>
                <CTableRow>
                  <CTableDataCell className="text-end h5"><strong>Total</strong></CTableDataCell>
                  <CTableDataCell className="h5">KES {invoice.total?.toLocaleString()}</CTableDataCell>
                </CTableRow>
              </CTableBody>
            </CTable>
          </CCol>
        </CRow>

        {invoice.notes && (
          <CRow className="mt-4">
            <CCol>
              <strong>Notes:</strong><br />
              {invoice.notes}
            </CCol>
          </CRow>
        )}
      </CCardBody>
    </CCard>
  )
}

export default InvoiceView