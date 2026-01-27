// src/views/bills/BillView.js
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
    CBadge,
} from '@coreui/react'
import api from '../../../api/axios'

const BillView = () => {
    const { id } = useParams()
    const [bill, setBill] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        const fetchBill = async () => {
            try {
                const res = await api.get(`/api/bills/${id}`)
                setBill(res.data)
            } catch (err) {
                setError('Failed to load bill')
            } finally {
                setLoading(false)
            }
        }
        fetchBill()
    }, [id])

    if (loading) return <div className="text-center py-5"><CSpinner /></div>
    if (error) return <CAlert color="danger">{error}</CAlert>
    if (!bill) return <CAlert color="info">Bill not found</CAlert>

    const getStatusBadge = (status) => {
        switch (status) {
            case 'PAID': return <CBadge color="success">Paid</CBadge>
            case 'PARTIALLY_PAID': return <CBadge color="warning">Partially Paid</CBadge>
            case 'OVERDUE': return <CBadge color="danger">Overdue</CBadge>
            default: return <CBadge color="secondary">Unpaid</CBadge>
        }
    }

    return (
        <CCard className="shadow-sm">
            <CCardHeader className="d-flex justify-content-between align-items-center">
                <h3>Bill #{bill.billNumber}</h3>
                <div>
                    {getStatusBadge(bill.status)}
                    <CButton color="primary" className="ms-3" onClick={() => window.print()}>
                        Print / Save PDF
                    </CButton>
                </div>
            </CCardHeader>
            <CCardBody>
                {/* Header */}
                <CRow className="mb-4">
                    <CCol md={6}>
                        <h5>From (Vendor):</h5>
                        <p>
                            <strong>{bill.vendor?.displayName || 'Unknown Vendor'}</strong><br />
                            {bill.vendor?.companyName}<br />
                            {bill.vendor?.billingAddress?.street}<br />
                            {bill.vendor?.kraPin && `KRA PIN: ${bill.vendor.kraPin}`}
                        </p>
                    </CCol>
                    <CCol md={6} className="text-end">
                        <h5>Bill To:</h5>
                        <p>
                            <strong>Your Company Name Ltd</strong><br />
                            Nairobi, Kenya<br />
                            Email: accounts@yourcompany.co.ke<br />
                            KRA PIN: P051234567X
                        </p>
                    </CCol>
                </CRow>

                <CRow className="mb-4">
                    <CCol md={6}>
                        <strong>Bill Date:</strong> {new Date(bill.billDate).toLocaleDateString()}<br />
                        <strong>Due Date:</strong> {bill.dueDate ? new Date(bill.dueDate).toLocaleDateString() : 'Immediate'}
                    </CCol>
                </CRow>

                {/* Items Table */}
                <CTable bordered className="mb-4">
                    <CTableHead color="light">
                        <CTableRow>
                            <CTableHeaderCell>#</CTableHeaderCell>
                            <CTableHeaderCell>Description</CTableHeaderCell>
                            <CTableHeaderCell>Qty</CTableHeaderCell>
                            <CTableHeaderCell>Rate (KES)</CTableHeaderCell>
                            <CTableHeaderCell>Amount (KES)</CTableHeaderCell>
                        </CTableRow>
                    </CTableHead>
                    <CTableBody>
                        {bill.items.map((item, i) => (
                            <CTableRow key={i}>
                                <CTableDataCell>{i + 1}</CTableDataCell>
                                <CTableDataCell>{item.description}</CTableDataCell>
                                <CTableDataCell>{item.quantity}</CTableDataCell>
                                <CTableDataCell>{item.rate.toLocaleString()}</CTableDataCell>
                                <CTableDataCell>{item.amount.toLocaleString()}</CTableDataCell>
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
                                    <CTableDataCell>KES {bill.subtotal?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</CTableDataCell>
                                </CTableRow>
                                <CTableRow>
                                    <CTableDataCell className="text-end"><strong>VAT (16%)</strong></CTableDataCell>
                                    <CTableDataCell>KES {(bill.tax || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</CTableDataCell>
                                </CTableRow>
                                <CTableRow>
                                    <CTableDataCell className="text-end h5"><strong>Total Amount Due</strong></CTableDataCell>
                                    <CTableDataCell className="h5">KES {bill.total?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</CTableDataCell>
                                </CTableRow>
                            </CTableBody>
                        </CTable>
                    </CCol>
                </CRow>

                {bill.notes && (
                    <CRow className="mt-4">
                        <CCol>
                            <strong>Notes:</strong><br />
                            <p>{bill.notes}</p>
                        </CCol>
                    </CRow>
                )}
            </CCardBody>
        </CCard>
    )
}

export default BillView