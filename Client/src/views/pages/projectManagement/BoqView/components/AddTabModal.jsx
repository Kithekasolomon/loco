// src/views/pages/projectManagement/BoqView/components/AddTabModal.jsx
import React from 'react'
import {
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CFormInput,
  CFormLabel,
  CButton,
} from '@coreui/react'

const AddTabModal = ({ visible, onClose, newTabName, setNewTabName, onAdd }) => {
  return (
    <CModal visible={visible} onClose={onClose}>
      <CModalHeader>
        <CModalTitle>Add New Category Tab</CModalTitle>
      </CModalHeader>
      <CModalBody>
        <CFormLabel>New Tab Name</CFormLabel>
        <CFormInput
          value={newTabName}
          onChange={(e) => setNewTabName(e.target.value)}
          placeholder="e.g. PABX System, UPS, Solar"
          autoFocus
        />
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" onClick={onClose}>
          Cancel
        </CButton>
        <CButton color="primary" onClick={onAdd} disabled={!newTabName.trim()}>
          Add Tab
        </CButton>
      </CModalFooter>
    </CModal>
  )
}

export default AddTabModal
