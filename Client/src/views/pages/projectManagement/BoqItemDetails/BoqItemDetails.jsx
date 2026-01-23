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
} from '@coreui/icons'

import api from '../../../../api/axios' // your axios instance

const BoqItemDetails = () => {
  const { id: projectId, boqItemId } = useParams()

  const [boqItem, setBoqItem] = useState(null)
  const [categories, setCategories] = useState([]) // from BoqCategory
  const [itemsByCategory, setItemsByCategory] = useState({})
  const [activeTab, setActiveTab] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Modals
  const [addEntryModal, setAddEntryModal] = useState(false)
  const [addTabModal, setAddTabModal] = useState(false)
  const [newTabName, setNewTabName] = useState('')

  // Form
  const [formData, setFormData] = useState({
    itemNumber: '',
    description: '',
    unit: '',
    quantity: '',
    rate: '',
  })

  // Fetch everything on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        const { data: itemRes } = await api.get(`/api/boq/${boqItemId}`)
        setBoqItem(itemRes) 

        const { data: cats } = await api.get(`/api/boq-categories/project/${projectId}/categories`)
        setCategories(cats)

        
        const { data: projectRes } = await api.get(`/api/projects/${projectId}`)
        const allItems = projectRes.boq.categories.reduce((acc, cat) => {
          return { ...acc, [cat.name]: cat.items }
        }, {})

        setItemsByCategory(allItems)

        if (cats.length > 0) {
          setActiveTab(cats[0].name)
        }
      } catch (err) {
        setError('Failed to load BOQ details')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [projectId, boqItemId])

  const handleAddTab = async () => {
    if (!newTabName.trim()) return

    try {
      await api.post(`/api/boq-categories/project/${projectId}/categories`, {
        name: newTabName.trim(),
      })

      // Refresh categories
      const { data } = await api.get(`/api/boq-categories/project/${projectId}/categories`)
      setCategories(data)
      setActiveTab(newTabName.trim())
      setAddTabModal(false)
      setNewTabName('')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add system tab')
    }
  }

  const handleAddEntry = async (e) => {
    e.preventDefault()

    const payload = {
      itemNumber: formData.itemNumber || 'N/A',
      description: formData.description,
      unit: formData.unit,
      quantity: parseFloat(formData.quantity) || 0,
      rate: parseFloat(formData.rate) || 0,
      category: activeTab,
    }

    try {
      await api.post(`/api/boq/${projectId}`, payload)

      // Refresh project to get updated items
      const { data } = await api.get(`/api/projects/${projectId}`)
      const newItemsByCat = data.boq.categories.reduce((acc, cat) => {
        return { ...acc, [cat.name]: cat.items }
      }, {})
      setItemsByCategory(newItemsByCat)

      setAddEntryModal(false)
      setFormData({ itemNumber: '', description: '', unit: '', quantity: '', rate: '' })
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to add item')
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
                <CNavItem key={cat._id}>
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
            {activeTab && itemsByCategory[activeTab]?.length === 0 ? (
              <div className="text-center py-5 text-muted">
                <CIcon
                  icon={getIconForCategory(activeTab)}
                  size="4xl"
                  className="mb-3 opacity-25"
                />
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
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {itemsByCategory[activeTab]?.map((item) => (
                      <CTableRow key={item._id}>
                        <CTableDataCell>{item.itemNumber}</CTableDataCell>
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
                      </CTableRow>
                    ))}
                    <CTableRow className="fw-bold bg-light">
                      <CTableDataCell colSpan={5} className="text-end">
                        Total — {activeTab}
                      </CTableDataCell>
                      <CTableDataCell className="text-end text-success">
                        {formatCurrency(
                          itemsByCategory[activeTab]?.reduce((sum, i) => sum + i.total, 0) || 0,
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

      {/* Add Entry Modal */}
      <CModal visible={addEntryModal} onClose={() => setAddEntryModal(false)} size="lg">
        <CModalHeader>
          <CModalTitle>Add Item — {activeTab}</CModalTitle>
        </CModalHeader>
        <CForm onSubmit={handleAddEntry}>
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
              <div className="mt-3 p-3 bg-light rounded">
                <strong>Line Total: </strong>
                {formatCurrency(formData.quantity * formData.rate)}
              </div>
            )}
          </CModalBody>
          <CModalFooter>
            <CButton color="light" onClick={() => setAddEntryModal(false)}>
              Cancel
            </CButton>
            <CButton color="primary" type="submit">
              Save Item
            </CButton>
          </CModalFooter>
        </CForm>
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
