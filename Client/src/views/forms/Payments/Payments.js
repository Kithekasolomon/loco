// src/views/payments/Payments.js
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
    CFormSelect,
    CSpinner,
} from '@coreui/react'
import { Link } from 'react-router-dom'
import api from '../../../api/axios'

const Payments = () => {
    const [payments, setPayments] = useState([])
    const [filterType, setFilterType] = useState('ALL')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchPayments()
    }, [])

    const fetchPayments = async () => {
        try {
            const res = await api.get('/api/payments')
            setPayments(res.data)
            setLoading(false)
        } catch (err) {
            console.error(err)
            setLoading(false)
        }
    }

    const filteredPayments = filterType === 'ALL'
        ? payments
        : payments.filter(p => p.type === filterType)

    const getTypeBadge = (type) => {
        return type === 'RECEIVED'
            ? <CBadge color="success">Received</CBadge>
            : <CBadge color="info">Made</CBadge>
    }

    return (
        <>
            <CCard className="mb-4">
                <CCardHeader>
                    <div className="d-flex justify-content-between align-items-center">
                        <h5>Payments</h5>
                        <div className="d-flex gap-3 align-items-center">
                            <CFormSelect
                                size="sm"
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                            >
                                <option value="ALL">All Payments</option>
                                <option value="RECEIVED">Received Only</option>
                                <option value="MADE">Made Only</option>
                            </CFormSelect>
                            <Link to="/payments/create">
                                <CButton color="primary">New Payment</CButton>
                            </Link>
                        </div>
                    </div>
                </CCardHeader>
                <CCardBody>
                    {loading ? (
                        <div className="text-center py-5"><CSpinner /></div>
                    ) : (
                        <CTable hover responsive>
                            <CTableHead>
                                <CTableRow>
                                    <CTableHeaderCell>#</CTableHeaderCell>
                                    <CTableHeaderCell>Date</CTableHeaderCell>
                                    <CTableHeaderCell>Contact</CTableHeaderCell>
                                    <CTableHeaderCell>Type</CTableHeaderCell>
                                    <CTableHeaderCell>Method</CTableHeaderCell>
                                    <CTableHeaderCell>Amount</CTableHeaderCell>
                                    <CTableHeaderCell>Actions</CTableHeaderCell>
                                </CTableRow>
                            </CTableHead>
                            <CTableBody>
                                {filteredPayments.length === 0 ? (
                                    <CTableRow>
                                        <CTableDataCell colSpan="7" className="text-center text-muted">
                                            No payments found
                                        </CTableDataCell>
                                    </CTableRow>
                                ) : (
                                    filteredPayments.map((payment) => (
                                        <CTableRow key={payment._id}>
                                            <CTableDataCell>
                                                <Link to={`/payments/${payment._id}`}>
                                                    {payment.paymentNumber}
                                                </Link>
                                            </CTableDataCell>
                                            <CTableDataCell>{new Date(payment.paymentDate).toLocaleDateString()}</CTableDataCell>
                                            <CTableDataCell>{payment.contact?.displayName || 'N/A'}</CTableDataCell>
                                            <CTableDataCell>{getTypeBadge(payment.type)}</CTableDataCell>
                                            <CTableDataCell>{payment.paymentMethod}</CTableDataCell>
                                            <CTableDataCell>KES {payment.amount.toLocaleString()}</CTableDataCell>
                                            <CTableDataCell>
                                                <Link to={`/payments/${payment._id}`}>
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

export default Payments