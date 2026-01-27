import React from 'react'
import {
    CCard,
    CCardBody,
    CCardHeader,
    CRow,
    CCol,
    CButton,
} from '@coreui/react'
import { Link } from 'react-router-dom'

const Reports = () => {
    return (
        <>
            <CCard className="mb-4">
                <CCardHeader>
                    <h4>Financial Reports</h4>
                </CCardHeader>
                <CCardBody>
                    <CRow className="g-4">
                        <CCol md={6} lg={4}>
                            <CCard className="h-100 text-center p-4 shadow-sm border-primary">
                                <CCardBody>
                                    <h5>Profit & Loss</h5>
                                    <p className="text-muted">Income Statement - Revenue, Expenses, Net Profit</p>
                                    <Link to="/reports/profit-loss">
                                        <CButton color="primary">View Report</CButton>
                                    </Link>
                                </CCardBody>
                            </CCard>
                        </CCol>

                        <CCol md={6} lg={4}>
                            <CCard className="h-100 text-center p-4 shadow-sm border-success">
                                <CCardBody>
                                    <h5>Balance Sheet</h5>
                                    <p className="text-muted">Assets, Liabilities & Equity as of date</p>
                                    <Link to="/reports/balance-sheet">
                                        <CButton color="success">View Report</CButton>
                                    </Link>
                                </CCardBody>
                            </CCard>
                        </CCol>

                        <CCol md={6} lg={4}>
                            <CCard className="h-100 text-center p-4 shadow-sm border-warning">
                                <CCardBody>
                                    <h5>Accounts Receivable Aging</h5>
                                    <p className="text-muted">Outstanding invoices by aging buckets</p>
                                    <Link to="/reports/ar-aging">
                                        <CButton color="warning">View Report</CButton>
                                    </Link>
                                </CCardBody>
                            </CCard>
                        </CCol>

                        <CCol md={6} lg={4}>
                            <CCard className="h-100 text-center p-4 shadow-sm border-danger">
                                <CCardBody>
                                    <h5>Accounts Payable Aging</h5>
                                    <p className="text-muted">Outstanding bills by aging buckets</p>
                                    <Link to="/reports/ap-aging">
                                        <CButton color="danger">View Report</CButton>
                                    </Link>
                                </CCardBody>
                            </CCard>
                        </CCol>
                    </CRow>
                </CCardBody>
            </CCard>
        </>
    )
}

export default Reports