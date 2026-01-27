// src/views/reports/ProfitLoss.js
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
    CFormSelect,
    CRow,
    CCol,
    CSpinner,
} from '@coreui/react'
import api from '../../../api/axios'

const ProfitLoss = () => {
    const [report, setReport] = useState(null)
    const [period, setPeriod] = useState('this_month')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchReport()
    }, [period])

    const fetchReport = async () => {
        setLoading(true)
        try {
            const res = await api.get(`/api/reports/profit-loss?period=${period}`)
            setReport(res.data)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    if (loading) return <CSpinner />

    return (
        <>
            <CCard className="mb-4">
                <CCardHeader>
                    <CRow className="align-items-center">
                        <CCol>
                            <h4>Profit & Loss Statement</h4>
                            <p className="text-muted mb-0">
                                {report?.period?.from} to {report?.period?.to}
                            </p>
                        </CCol>
                        <CCol md="auto">
                            <CFormSelect value={period} onChange={(e) => setPeriod(e.target.value)}>
                                <option value="this_month">This Month</option>
                                <option value="last_month">Last Month</option>
                                <option value="this_year">This Year</option>
                                <option value="today">Today</option>
                            </CFormSelect>
                        </CCol>
                    </CRow>
                </CCardHeader>
                <CCardBody>
                    <CTable>
                        <CTableBody>
                            <CTableRow>
                                <CTableDataCell><strong>Revenue</strong></CTableDataCell>
                                <CTableDataCell className="text-end">KES {report?.revenue?.toLocaleString()}</CTableDataCell>
                            </CTableRow>
                            <CTableRow>
                                <CTableDataCell><strong>Gross Profit</strong></CTableDataCell>
                                <CTableDataCell className="text-end">KES {report?.grossProfit?.toLocaleString()}</CTableDataCell>
                            </CTableRow>
                            <CTableRow>
                                <CTableDataCell><strong>Operating Expenses</strong></CTableDataCell>
                                <CTableDataCell className="text-end">KES {report?.operatingExpenses?.toLocaleString()}</CTableDataCell>
                            </CTableRow>
                            <CTableRow className="table-primary">
                                <CTableDataCell><strong>Net Profit</strong></CTableDataCell>
                                <CTableDataCell className="text-end h5">
                                    KES {report?.netProfit?.toLocaleString()}
                                </CTableDataCell>
                            </CTableRow>
                        </CTableBody>
                    </CTable>
                </CCardBody>
            </CCard>
        </>
    )
}

export default ProfitLoss