
import React from 'react'
import { CCard, CCardBody, CRow, CCol, CButton, CIcon } from '@coreui/react'
import { cilArrowLeft, cilMoney, cilCalculator, cilChartPie } from '@coreui/icons'
import { Link } from 'react-router-dom'

const HeaderSummary = ({ project, grandSummary, onExport, onAddTab }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(amount || 0)
  }

  return (
    <CCard className="mb-4 shadow-sm">
      <CCardBody>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <Link to="/projects/list">
              <CButton color="light" size="sm">
                <CIcon icon={cilArrowLeft} className="me-2" />
                Back to Projects
              </CButton>
            </Link>
            <h3 className="d-inline-block ms-3 mb-0">{project?.name || 'Loading...'}</h3>
            <span className="badge bg-info ms-3 fs-6">{project?.location}</span>
          </div>
          <div>
            <CButton color="success" className="me-2" onClick={onExport}>
              <CIcon icon={cilCloudDownload} className="me-2" />
              Export Excel
            </CButton>
            <CButton color="primary" onClick={onAddTab}>
              <CIcon icon={cilPlus} className="me-2" />
              Add Tab
            </CButton>
          </div>
        </div>

        <CRow className="g-4 text-center">
          <CCol md={4}>
            <CCard color="primary" textColor="white" className="h-100">
              <CCardBody>
                <CIcon icon={cilMoney} size="xl" />
                <h5 className="mt-3">Contract Sum</h5>
                <h4>{formatCurrency(grandSummary.totalContractSum)}</h4>
              </CCardBody>
            </CCard>
          </CCol>
          <CCol md={4}>
            <CCard color="success" textColor="white" className="h-100">
              <CCardBody>
                <CIcon icon={cilCalculator} size="xl" />
                <h5 className="mt-3">Valued to Date</h5>
                <h4>{formatCurrency(grandSummary.valuedToDate)}</h4>
              </CCardBody>
            </CCard>
          </CCol>
          <CCol md={4}>
            <CCard color="info" textColor="white" className="h-100">
              <CCardBody>
                <CIcon icon={cilChartPie} size="xl" />
                <h5 className="mt-3">Overall Progress</h5>
                <h4>{grandSummary.percentageComplete?.toFixed(1)}%</h4>
              </CCardBody>
            </CCard>
          </CCol>
        </CRow>
      </CCardBody>
    </CCard>
  )
}

export default HeaderSummary