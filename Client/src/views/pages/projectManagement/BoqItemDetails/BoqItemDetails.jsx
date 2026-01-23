import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CNav,
  CNavItem,
  CNavLink,
  CTabContent,
  CTabPane,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CButton,
  CBadge,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CForm,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CRow,
  CCol,
  CSpinner,
  CAlert,
} from '@coreui/react'
import { CIcon } from '@coreui/icons-react'

import {
  cilPlus,
  cilArrowLeft,
  cilZoom,
  cilSettings,
  cilPeople,
  cilBuilding,
  cilCalculator,
  cilWarning,
  cilMoney,
  cilPencil,
  cilTrash,
} from '@coreui/icons'

import api from '../../../../api/axios'

const BoqItemDetails = () => {
  const { id: projectId, boqItemId } = useParams()

  const [boqItem, setBoqItem] = useState(null)
  const [categories, setCategories] = useState([])
  const [itemsByCategory, setItemsByCategory] = useState({})
  const [activeTab, setActiveTab] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Modals & Editing
  const [addEntryModal, setAddEntryModal] = useState(false)
  const [addTabModal, setAddTabModal] = useState(false)
  const [deleteModal, setDeleteModal] = useState(false)
  const [newTabName, setNewTabName] = useState('')
  const [editingItem, setEditingItem] = useState(null)
  const [itemToDelete, setItemToDelete] = useState(null)

  // Form data
  const [formData, setFormData] = useState({
    itemNumber: '',
    description: '',
    unit: '',
    quantity: '',
    rate: '',
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        const { data: parent } = await api.get(`/api/boq/${boqItemId}`)
        setBoqItem(parent)

        const { data: breakdown } = await api.get(`/api/boq-breakdown/${boqItemId}`)

        setCategories(breakdown.map((s) => ({ name: s.name })))

        const grouped = breakdown.reduce((acc, sys) => {
          acc[sys.name] = sys.items
          return acc
        }, {})

        setItemsByCategory(grouped)

        if (breakdown.length > 0) {
          setActiveTab(breakdown[0].name)
        }
      } catch (err) {
        setError('Failed to load BOQ breakdown')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [boqItemId])

  const refreshBreakdown = async () => {
    try {
      const { data: breakdown } = await api.get(`/api/boq-breakdown/${boqItemId}`)
      setCategories(breakdown.map((s) => ({ name: s.name })))
      setItemsByCategory(
        breakdown.reduce((acc, sys) => {
          acc[sys.name] = sys.items
          return acc
        }, {}),
      )
    } catch (err) {
      setError('Failed to refresh data')
    }
  }

  const handleAddTab = () => {
    const trimmed = newTabName.trim()
    if (!trimmed) return

    setCategories((prev) => [...prev, { name: trimmed }])
    setItemsByCategory((prev) => ({ ...prev, [trimmed]: [] }))
    setActiveTab(trimmed)
    setAddTabModal(false)
    setNewTabName('')
  }

  const handleSaveItem = async (e) => {
    e.preventDefault()

    const payload = {
      system: activeTab,
      itemNumber: formData.itemNumber || '',
      description: formData.description,
      unit: formData.unit,
      quantity: parseFloat(formData.quantity) || 0,
      rate: parseFloat(formData.rate) || 0,
    }

    try {
      if (editingItem) {
        // Update
        await api.put(`/api/boq-breakdown/${boqItemId}/items/${editingItem._id}`, payload)
      } else {
        // Create
        await api.post(`/api/boq-breakdown/${boqItemId}/items`, payload)
      }

      await refreshBreakdown()

      setAddEntryModal(false)
      setEditingItem(null)
      setFormData({ itemNumber: '', description: '', unit: '', quantity: '', rate: '' })
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save item')
    }
  }

  const handleEditItem = (item) => {
    setEditingItem(item)
    setFormData({
      itemNumber: item.itemNumber || '',
      description: item.description,
      unit: item.unit,
      quantity: item.quantity,
      rate: item.rate,
    })
    setAddEntryModal(true)
  }

  const handleDeleteItem = (item) => {
    setItemToDelete(item)
    setDeleteModal(true)
  }

  const confirmDelete = async () => {
    if (!itemToDelete) return

    try {
      await api.delete(`/api/boq-breakdown/${boqItemId}/items/${itemToDelete._id}`)
      await refreshBreakdown()
      setDeleteModal(false)
      setItemToDelete(null)
    } catch (err) {
      setError('Failed to delete item')
    }
  }

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(amount || 0)

  const getIconForCategory = (name) => {
    const map = {
      CCTV: cilZoom,
      'Structured Cabling': cilSettings,
      Intercom: cilPeople,
      'Access Control': cilBuilding,
      MATV: cilCalculator,
      'Fire Alarm': cilWarning,
      Intrusion: cilBuilding,
      BMS: cilSettings,
      Fencing: cilBuilding,
      'Air Conditioners': cilSettings,
      'Electrical Work': cilMoney,
    }
    return map[name] || cilCalculator
  }

  if (loading) {
    return (
      <div className="text-center py-5">
        <CSpinner color="primary" />
        <p>Loading BOQ breakdown...</p>
      </div>
    )
  }

  if (error) {
    return <CAlert color="danger">{error}</CAlert>
  }

  if (!boqItem) {
    return <CAlert color="warning">BOQ Item not found</CAlert>
  }

  return (
    <div className="animated fadeIn">
      {/* Header */}
      <CCard className="mb-3 border-0 shadow-sm">
        <CCardBody className="p-4">
          <div className="d-flex justify-content-between align-items-start">
            <div>
              <Link to={`/projects/view/${projectId}/boq`} className="text-decoration-none">
                <CButton color="light" size="sm" className="mb-3">
                  <CIcon icon={cilArrowLeft} className="me-2" /> Back to BOQ
                </CButton>
              </Link>
              <h4 className="mb-1 fw-bold">
                {boqItem.itemNumber} - {boqItem.description}
              </h4>
              <p className="text-muted mb-0">
                {boqItem.quantity} {boqItem.unit} @ {formatCurrency(boqItem.rate)} ={' '}
                <strong>{formatCurrency(boqItem.total)}</strong>
              </p>
            </div>

            <div className="d-flex gap-2">
              <CButton color="success" onClick={() => setAddTabModal(true)}>
                <CIcon icon={cilPlus} className="me-2" />
                Add System Tab
              </CButton>
              <CButton color="primary" onClick={() => setAddEntryModal(true)}>
                <CIcon icon={cilPlus} className="me-2" />
                Add Item ({activeTab || 'Select Tab'})
              </CButton>
            </div>
          </div>
        </CCardBody>
      </CCard>

      {/* Tabs */}
      {categories.length === 0 ? (
        <CAlert color="info">No system tabs yet. Click "Add System Tab" to create one.</CAlert>
      ) : (
        <CCard className="border-0 shadow-sm">
          <CCardHeader className="border-bottom">
            <CNav variant="tabs">
              {categories.map((cat) => (
                <CNavItem key={cat.name}>
                  <CNavLink
                    active={activeTab === cat.name}
                    onClick={() => setActiveTab(cat.name)}
                    style={{ cursor: 'pointer' }}
                  >
                    <CIcon icon={getIconForCategory(cat.name)} className="me-2" />
                    {cat.name}
                    <CBadge color="primary" className="ms-2">
                      {itemsByCategory[cat.name]?.length || 0}
                    </CBadge>
                  </CNavLink>
                </CNavItem>
              ))}
            </CNav>
          </CCardHeader>

          <CCardBody>
            {activeTab && (!itemsByCategory[activeTab] || itemsByCategory[activeTab].length === 0) ? (
              <div className="text-center py-5 text-muted">
                <CIcon icon={getIconForCategory(activeTab)} size="4xl" className="mb-3 opacity-25" />
                <h6>No items in {activeTab} yet</h6>
                <p>Click "Add Item" to start building the rate</p>
              </div>
            ) : (
              <div className="table-responsive">
                <CTable hover>
                  <CTableHead>
                    <CTableRow>
                      <CTableHeaderCell>Item No.</CTableHeaderCell>
                      <CTableHeaderCell>Description</CTableHeaderCell>
                      <CTableHeaderCell>Unit</CTableHeaderCell>
                      <CTableHeaderCell className="text-end">Qty</CTableHeaderCell>
                      <CTableHeaderCell className="text-end">Rate</CTableHeaderCell>
                      <CTableHeaderCell className="text-end">Total</CTableHeaderCell>
                      <CTableHeaderCell className="text-center">Actions</CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {itemsByCategory[activeTab]?.map((item) => (
                      <CTableRow key={item._id}>
                        <CTableDataCell>{item.itemNumber || '-'}</CTableDataCell>
                        <CTableDataCell>{item.description}</CTableDataCell>
                        <CTableDataCell>{item.unit}</CTableDataCell>
                        <CTableDataCell className="text-end">
                          {item.quantity.toLocaleString()}
                        </CTableDataCell>
                        <CTableDataCell className="text-end">
                          {formatCurrency(item.rate)}
                        </CTableDataCell>
                        <CTableDataCell className="text-end fw-bold text-primary">
                          {formatCurrency(item.total)}
                        </CTableDataCell>
                        <CTableDataCell className="text-center">
                          <CButton
                            color="info"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditItem(item)}
                            className="me-1"
                          >
                            <CIcon icon={cilPencil} size="sm" />
                          </CButton>
                          <CButton
                            color="danger"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteItem(item)}
                          >
                            <CIcon icon={cilTrash} size="sm" />
                          </CButton>
                        </CTableDataCell>
                      </CTableRow>
                    ))}
                    <CTableRow className="fw-bold bg-light">
                      <CTableDataCell colSpan={6} className="text-end">
                        Total — {activeTab}
                      </CTableDataCell>
                      <CTableDataCell className="text-end text-success">
                        {formatCurrency(
                          itemsByCategory[activeTab]?.reduce((sum, i) => sum + (i.total || 0), 0) || 0
                        )}
                      </CTableDataCell>
                    </CTableRow>
                  </CTableBody>
                </CTable>
              </div>
            )}
          </CCardBody>
        </CCard>
      )}

      {/* Add/Edit Item Modal */}
      <CModal visible={addEntryModal} onClose={() => {
        setAddEntryModal(false)
        setEditingItem(null)
        setFormData({ itemNumber: '', description: '', unit: '', quantity: '', rate: '' })
      }} size="lg">
        <CModalHeader>
          <CModalTitle>
            {editingItem ? 'Edit' : 'Add'} Item — {activeTab}
          </CModalTitle>
        </CModalHeader>
        <CForm onSubmit={handleSaveItem}>
          <CModalBody>
            <CRow className="g-3">
              <CCol md={3}>
                <CFormLabel>Item No.</CFormLabel>
                <CFormInput
                  value={formData.itemNumber}
                  onChange={(e) => setFormData({ ...formData, itemNumber: e.target.value })}
                  placeholder="e.g. 1.01"
                />
              </CCol>
              <CCol md={9}>
                <CFormLabel>Description *</CFormLabel>
                <CFormInput
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </CCol>
              <CCol md={3}>
                <CFormLabel>Unit *</CFormLabel>
                <CFormSelect
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  required
                >
                  <option value="">Select...</option>
                  <option>No.</option>
                  <option>m</option>
                  <option>m²</option>
                  <option>m³</option>
                  <option>kg</option>
                  <option>set</option>
                  <option>lumpsum</option>
                </CFormSelect>
              </CCol>
              <CCol md={4}>
                <CFormLabel>Quantity *</CFormLabel>
                <CFormInput
                  type="number"
                  step="0.01"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  required
                />
              </CCol>
              <CCol md={5}>
                <CFormLabel>Rate (KES) *</CFormLabel>
                <CFormInput
                  type="number"
                  step="0.01"
                  value={formData.rate}
                  onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                  required
                />
              </CCol>
            </CRow>

            {formData.quantity && formData.rate && (
              <div className="mt-4 p-3 bg-light rounded">
                <strong>Line Total: </strong>
                {formatCurrency((parseFloat(formData.quantity) || 0) * (parseFloat(formData.rate) || 0))}
              </div>
            )}
          </CModalBody>
          <CModalFooter>
            <CButton color="light" onClick={() => {
              setAddEntryModal(false)
              setEditingItem(null)
            }}>
              Cancel
            </CButton>
            <CButton color="primary" type="submit">
              {editingItem ? 'Update' : 'Save'} Item
            </CButton>
          </CModalFooter>
        </CForm>
      </CModal>

      {/* Delete Confirmation Modal */}
      <CModal visible={deleteModal} onClose={() => setDeleteModal(false)} alignment="center">
        <CModalHeader>
          <CModalTitle>Confirm Delete</CModalTitle>
        </CModalHeader>
        <CModalBody className="text-center">
          <CIcon icon={cilWarning} size="4xl" className="text-danger mb-3" />
          <h5>Delete this item?</h5>
          <p className="text-muted">
            <strong>{itemToDelete?.description}</strong>
            <br />
            Qty: {itemToDelete?.quantity} × Rate: {formatCurrency(itemToDelete?.rate)} ={' '}
            {formatCurrency(itemToDelete?.total)}
          </p>
          <small className="text-danger">This action cannot be undone.</small>
        </CModalBody>
        <CModalFooter>
          <CButton color="light" onClick={() => setDeleteModal(false)}>
            Cancel
          </CButton>
          <CButton color="danger" onClick={confirmDelete}>
            Yes, Delete
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Add Tab Modal */}
      <CModal visible={addTabModal} onClose={() => setAddTabModal(false)}>
        <CModalHeader>
          <CModalTitle>Add New System Tab</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <CFormLabel>System Name</CFormLabel>
          <CFormInput
            value={newTabName}
            onChange={(e) => setNewTabName(e.target.value)}
            placeholder="e.g. Public Address System"
            autoFocus
          />
        </CModalBody>
        <CModalFooter>
          <CButton color="light" onClick={() => setAddTabModal(false)}>
            Cancel
          </CButton>
          <CButton color="success" onClick={handleAddTab} disabled={!newTabName.trim()}>
            Add Tab
          </CButton>
        </CModalFooter>
      </CModal>
    </div>
  )
}

export default BoqItemDetails