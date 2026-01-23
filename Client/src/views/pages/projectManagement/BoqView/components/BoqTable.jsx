// src/views/pages/projectManagement/BoqView/components/BoqTable.jsx
import React from 'react'
import {
  CTable,
  CTableHead,
  CTableBody,
  CTableRow,
  CTableHeaderCell,
  CTableDataCell,
} from '@coreui/react'

const BoqTable = ({ items, formatCurrency }) => {
  if (items.length === 0) {
    return <p className="text-center text-muted py-4">No items in this category yet.</p>
  }

  const categoryTotal = items.reduce((sum, item) => sum + (item.total || 0), 0)
  const categoryValued = items.reduce((sum, item) => sum + (item.valuedAmount || 0), 0)

  return (
    <div className="table-responsive">
      <CTable hover bordered>
        <CTableHead color="light">
          <CTableRow>
            <CTableHeaderCell>#</CTableHeaderCell>
            <CTableHeaderCell>Item No.</CTableHeaderCell>
            <CTableHeaderCell>Description</CTableHeaderCell>
            <CTableHeaderCell>Unit</CTableHeaderCell>
            <CTableHeaderCell className="text-end">Qty</CTableHeaderCell>
            <CTableHeaderCell className="text-end">Rate</CTableHeaderCell>
            <CTableHeaderCell className="text-end">Total</CTableHeaderCell>
            <CTableHeaderCell className="text-center">Progress</CTableHeaderCell>
            <CTableHeaderCell className="text-end">Valued</CTableHeaderCell>
          </CTableRow>
        </CTableHead>
        <CTableBody>
          {items.map((item, idx) => (
            <CTableRow key={item._id}>
              <CTableDataCell>{idx + 1}</CTableDataCell>
              <CTableDataCell>{item.itemNumber}</CTableDataCell>
              <CTableDataCell>{item.description}</CTableDataCell>
              <CTableDataCell>{item.unit}</CTableDataCell>
              <CTableDataCell className="text-end">
                {item.quantity?.toLocaleString()}
              </CTableDataCell>
              <CTableDataCell className="text-end">{formatCurrency(item.rate)}</CTableDataCell>
              <CTableDataCell className="text-end fw-bold">
                {formatCurrency(item.total)}
              </CTableDataCell>
              <CTableDataCell className="text-center">{item.progressPercentage}%</CTableDataCell>
              <CTableDataCell className="text-end text-success fw-bold">
                {formatCurrency(item.valuedAmount)}
              </CTableDataCell>
            </CTableRow>
          ))}
          <CTableRow className="fw-bold bg-light">
            <CTableDataCell colSpan={6} className="text-end">
              Category Total →
            </CTableDataCell>
            <CTableDataCell className="text-end">{formatCurrency(categoryTotal)}</CTableDataCell>
            <CTableDataCell></CTableDataCell>
            <CTableDataCell className="text-end text-success">
              {formatCurrency(categoryValued)}
            </CTableDataCell>
          </CTableRow>
        </CTableBody>
      </CTable>
    </div>
  )
}

export default BoqTable
