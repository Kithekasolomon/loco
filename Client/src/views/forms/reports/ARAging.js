// src/views/reports/ARAging.js
import React, { useEffect, useState } from 'react'
import {
    CCard,
    CCardBody,
    CCardHeader,
    CTable,
    CTableBody,
    CTableDataCell,
    CTableHead,
    CTableHeaderCell,
    CTableRow,
    CSpinner,
    CAlert,
    CBadge,
} from '@coreui/react'
import api from '../../../api/axios'

const ARAging = () => {
    const [aging, setAging] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        fetchARAging()
    }, [])

    const fetchARAging = async () => {
        try {
            const res = await api.get('/api/reports/ar-aging')
            setAging(res.data)
            setLoading(false)
        } catch (err) {
            setError('Failed to load A/R Aging report')
            setLoading(false)
        }
    }

    if (loading) return <div className="text-center py-5"><CSpinner /></div>
    if (error) return <CAlert color="danger">{error}</CAlert>

    const totals = {
        current: aging.filter(i => i.bucket === 'Current').reduce((sum, i) => sum + i.outstanding, 0),
        '1-30': aging.filter(i => i.bucket === '1-30').reduce((sum, i) => sum + i.outstanding, 0),
        '31-60': aging.filter(i => i.bucket === '31-60').reduce((sum, i) => sum + i.outstanding, 0),
        '61-90': aging.filter(i => i.bucket === '61-90').reduce((sum, i) => sum + i.outstanding, 0),
        over90: aging.filter(i => i.bucket === 'Over 90').reduce((sum, i) => sum + i.outstanding, 0),
    }
    totals.total = Object.values(totals).reduce((sum, v) => sum + v, 0)

    return (
        <>
            <CCard className="mb-4">
                <CCardHeader>
                <h4>Accounts Receivable Aging Report</h4>
                <p className="text-muted mb-0">As of today</p>
            </CCardHeader>
            <CCardBody>
                <CTable hover responsive bordered>
                    <CTableHead color="light">
                        <CTableRow>
                            <CTableHeaderCell>Customer</CTableHeaderCell>
                            <CTableHeaderCell>Invoice #</CTableHeaderCell>
                            <CTableHeaderCell>Invoice Date</CTableHeaderCell>
                            <CTableHeaderCell>Due Date</CTableHeaderCell>
                            <CTableHeaderCell>Days Overdue</CTableHeaderCell>
                            <CTableHeaderCell>Current</CTableHeaderCell>
                            <CTableHeaderCell>1-30 Days</CTableHeaderCell>
                            <CTableHeaderCell>31-60 Days</CTableHeaderCell>
                            <CTableHeaderCell>61-90 Days</CTableHeaderCell>
                            <CTableHeaderCell>Over 90 Days</CTableHeaderCell>
                            <CTableHeaderCell>Total Outstanding</CTableHeaderCell>
                        </CTableRow>
                    </CTableHead>
                    <CTableBody>
                        {aging.length === 0 ? (
                            <CTableRow>
                                <CTableDataCell colSpan="11" className="text-center text-muted">
                                    No outstanding receivables
                                </CTableDataCell>
                            </CTableRow>
                        ) : (
                            aging.map((row, idx) => (
                                <CTableRow key={idx}>
                                    <CTableDataCell>{row.customer}</CTableDataCell>
                                    <CTableDataCell>{row.invoiceNumber}</CTableDataCell>
                                    <CTableDataCell>{new Date(row.invoiceDate).toLocaleDateString()}</CTableDataCell>
                                    <CTableDataCell>{new Date(row.dueDate).toLocaleDateString()}</CTableDataCell>
                                    <CTableDataCell>
                                        {row.daysOverdue > 0 ? (
                                            <CBadge color="danger">{row.daysOverdue}</CBadge>
                                        ) : (
                                            <CBadge color="success">Current</CBadge>
                                        )}
                                    </CTableDataCell>
                                    <CTableDataCell>
                                        {row.bucket === 'Current' ? `KES ${row.outstanding.toLocaleString()}` : '-'}
                                    </CTableDataCell>
                                    <CTableDataCell>
                                        {row.bucket === '1-30' ? `KES ${row.outstanding.toLocaleString()}` : '-'}
                                    </CTableDataCell>
                                    <CTableDataCell>
                                        {row.bucket === '31-60' ? `KES ${row.outstanding.toLocaleString()}` : '-'}
                                    </CTableDataCell>
                                    <CTableDataCell>
                                        {row.bucket === '61-90' ? `KES ${row.outstanding.toLocaleString()}` : '-'}
                                    </CTableDataCell>
                                    <CTableDataCell>
                                        {row.bucket === 'Over 90' ? `KES ${row.outstanding.toLocaleString()}` : '-'}
                                    </CTableDataCell>
                                    <CTableDataCell className="fw-bold">
                                        KES {row.outstanding.toLocaleString()}
                                    </CTableDataCell>
                                </CTableRow>
                            ))
                        )}
                        <CTableRow className="table-primary">
                            <CTableDataCell colSpan="5"><strong>Total</strong></CTableDataCell>
                            <CTableDataCell><strong>KES {totals.current.toLocaleString()}</strong></CTableDataCell>
                            <CTableDataCell><strong>KES {totals['1-30'].toLocaleString()}</strong></CTableDataCell>
                            <CTableDataCell><strong>KES {totals['31-60'].toLocaleString()}</strong></CTableDataCell>
                            <CTableDataCell><strong>KES {totals['61-90'].toLocaleString()}</strong></CTableDataCell>
                            <CTableDataCell><strong>KES {totals.over90.toLocaleString()}</strong></CTableDataCell>
                            <CTableDataCell><strong>KES {totals.total.toLocaleString()}</strong></CTableDataCell>
                        </CTableRow>
                    </CTableBody>
                </CTable>
            </CCardBody>
        </CCard >
    </>
  )
}

export default ARAging