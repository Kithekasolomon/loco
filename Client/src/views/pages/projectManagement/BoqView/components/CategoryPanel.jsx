// src/views/pages/projectManagement/BoqView/components/CategoryPanel.jsx
import React from 'react'
import { CCard, CCardHeader, CCardBody, CButton, CIcon } from '@coreui/react'
import { cilPlus } from '@coreui/icons'
import BoqTable from './BoqTable'

const CategoryPanel = ({ category, onAddItem, formatCurrency }) => {
  return (
    <CCard className="mt-3 shadow-sm">
      <CCardHeader className="d-flex justify-content-between align-items-center">
        <strong>
          {category.name} ({category.items.length} items)
        </strong>
        <CButton color="primary" size="sm" onClick={onAddItem}>
          <CIcon icon={cilPlus} className="me-2" />
          Add Item
        </CButton>
      </CCardHeader>
      <CCardBody>
        <BoqTable items={category.items} formatCurrency={formatCurrency} />
      </CCardBody>
    </CCard>
  )
}

export default CategoryPanel
