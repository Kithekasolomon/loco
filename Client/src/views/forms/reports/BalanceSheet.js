// src/views/reports/BalanceSheet.js
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
    CFormInput,
    CButton,
} from '@coreui/react'
import api from '../../../api/axios'

const BalanceSheet = () => {
    const [report, setReport] = useState(null)
    const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split('T')[0])
    const [loading, setLoading] = useState(false)

    const fetchReport = async () => {
        setLoading(true)
        try {
            const res = await api.get(`/api/reports/balance-sheet?asOfDate=${asOfDate}`)
            setReport(res.data)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchReport()
    }, [asOfDate])

    return (
        <>
            <CCard className="mb-4">
                <CCardHeader>
                    <div className="d-flex justify-content-between align-items-center">
                        <h4>Balance Sheet</h4>
                        <div className="d-flex gap-2">
                            <CFormInput type="date" value={asOfDate} onChange={(e) => setAsOfDate(e.target.value)} />
                            <CButton color="primary" onClick={fetchReport}>Refresh</CButton>
                        </div>
                    </div>
                    <p className="text-muted mb-0">As of {new Date(asOfDate).toLocaleDateString()}</p>
                </CCardHeader>
                <CCardBody>
                    <CTable>
                        <CTableHead>
                            <CTableRow>
                                <CTableHeaderCell><strong>Assets</strong></CTableHeaderCell>
                                <CTableHeaderCell className="text-end"><strong>Amount</strong></CTableHeaderCell>
                            </CTableRow>
                        </CTableHead>
                        <CTableBody>
                            {report?.assets?.accounts?.map(acc => (
                                <CTableRow key={acc.code}>
                                    <CTableDataCell>{acc.name}</CTableDataCell>
                                    <CTableDataCell className="text-end">KES {acc.balance.toLocaleString()}</CTableDataCell>
                                </CTableRow>
                            ))}
                            <CTableRow className="table-success">
                                <CTableDataCell><strong>Total Assets</strong></CTableDataCell>
                                <CTableDataCell className="text-end"><strong>KES {report?.assets?.total?.toLocaleString()}</strong></CTableDataCell>
                            </CTableRow>
                        </CTableBody>
                    </CTable>

                    <CTable className="mt-4">
                        <CTableHead>
                            <CTableRow>
                                <CTableHeaderCell><strong>Liabilities & Equity</strong></CTableHeaderCell>
                                <CTableHeaderCell className="text-end"><strong>Amount</strong></CTableHeaderCell>
                            </CTableRow>
                        </CTableHead>
                        <CTableBody>
                            {/* Liabilities */}
                            {report?.liabilities?.accounts?.map(acc => (
                                <CTableRow key={acc.code}>
                                    <CTableDataCell>{acc.name}</CTableDataCell>
                                    <CTableDataCell className="text-end">KES {acc.balance.toLocaleString()}</CTableDataCell>
                                </CTableRow>
                            ))}
                            {/* Equity */}
                            {report?.equity?.accounts?.map(acc => (
                                <CTableRow key={acc.code}>
                                    <CTableDataCell>{acc.name}</CTableDataCell>
                                    <CTableDataCell className="text-end">KES {acc.balance.toLocaleString()}</CTableDataCell>
                                </CTableRow>
                            ))}
                            <CTableRow className="table-success">
                                <CTableDataCell><strong>Total Liabilities & Equity</strong></CTableDataCell>
                                <CTableDataCell className="text-end"><strong>KES {report?.totalLiabilitiesAndEquity?.toLocaleString()}</strong></CTableDataCell>
                            </CTableRow>
                        </CTableBody>
                    </CTable>
                </CCardBody>
            </CCard>
        </>
    )
}

export default BalanceSheet