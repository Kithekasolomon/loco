import React, { useState, useEffect, useRef } from 'react'
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
  CProgress,
  CProgressBar,
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
  cilFile,
  cilCloudDownload,
  cilChevronTop,
  cilChevronBottom,
} from '@coreui/icons'

import api from '../../../../api/axios'
import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

const BoqItemDetails = () => {
  const { id: projectId, boqItemId } = useParams()
  const printRef = useRef()

  const [boqItem, setBoqItem] = useState(null)
  const [categories, setCategories] = useState([])
  const [itemsByCategory, setItemsByCategory] = useState({})
  const [activeTab, setActiveTab] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [summaryExpanded, setSummaryExpanded] = useState(true)

  // Modals & CRUD
  const [addEntryModal, setAddEntryModal] = useState(false)
  const [addTabModal, setAddTabModal] = useState(false)
  const [deleteModal, setDeleteModal] = useState(false)
  const [newTabName, setNewTabName] = useState('')
  const [editingItem, setEditingItem] = useState(null)
  const [itemToDelete, setItemToDelete] = useState(null)

  const [formData, setFormData] = useState({
    itemNumber: '',
    description: '',
    unit: '',
    quantity: '',
    rate: '',
  })

  useEffect(() => {
    fetchData()
  }, [boqItemId])

  const fetchData = async () => {
    try {
      setLoading(true)

      // Fetch parent BOQ item
      const { data: parent } = await api.get(`/api/boq/${boqItemId}`)
      setBoqItem(parent)

      // Fetch breakdown
      const { data: breakdown } = await api.get(`/api/boq-breakdown/${boqItemId}`)

      setCategories(breakdown.map((s) => ({ name: s.name })))

      const grouped = breakdown.reduce((acc, sys) => {
        acc[sys.name] = sys.items.map((item) => ({
          ...item,
          total: item.quantity * item.rate,
        }))
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

  const refreshBreakdown = async () => {
    await fetchData()
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

    const allCurrentItems = Object.values(itemsByCategory).flat()
    const duplicate = allCurrentItems.find(
      (item) =>
        item.itemNumber?.trim().toLowerCase() === formData.itemNumber.trim().toLowerCase() &&
        (!editingItem || item._id !== editingItem._id),
    )

    if (duplicate) {
      setError(`Item Number "${formData.itemNumber}" already exists in this breakdown.`)
      return
    }

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
        await api.put(`/api/boq-breakdown/${boqItemId}/items/${editingItem._id}`, payload)
      } else {
        await api.post(`/api/boq-breakdown/${boqItemId}/items`, payload)
      }

      await refreshBreakdown()
      closeModal()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save item')
    }
  }

  const closeModal = () => {
    setAddEntryModal(false)
    setEditingItem(null)
    setFormData({ itemNumber: '', description: '', unit: '', quantity: '', rate: '' })
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
    try {
      await api.delete(`/api/boq-breakdown/${boqItemId}/items/${itemToDelete._id}`)
      await refreshBreakdown()
      setDeleteModal(false)
      setItemToDelete(null)
    } catch (err) {
      setError('Failed to delete item')
    }
  }

  // Calculations
  const grandTotal = Object.values(itemsByCategory)
    .flat()
    .reduce((sum, item) => sum + (item.total || 0), 0)

  const parentTotal = boqItem?.total || 0
  const variance = grandTotal - parentTotal
  const variancePercent = parentTotal > 0 ? ((variance / parentTotal) * 100).toFixed(2) : 0
  const buildUpPercent = parentTotal > 0 ? ((grandTotal / parentTotal) * 100).toFixed(2) : 0

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

  // Export to Excel
  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'BOQ System'
    workbook.created = new Date()

    const worksheet = workbook.addWorksheet('Rate Build-Up')

    worksheet.mergeCells('A1:G1')
    worksheet.getCell('A1').value = `${boqItem.itemNumber} - ${boqItem.description}`
    worksheet.getCell('A1').font = { size: 16, bold: true }
    worksheet.getCell('A1').alignment = { horizontal: 'center' }

    let row = 3

    Object.keys(itemsByCategory).forEach((system) => {
      const items = itemsByCategory[system]
      if (items.length === 0) return

      worksheet.mergeCells(`A${row}:G${row}`)
      worksheet.getCell(`A${row}`).value = system
      worksheet.getCell(`A${row}`).font = { bold: true, size: 14 }
      worksheet.getCell(`A${row}`).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' },
      }
      row++

      worksheet.addRow(['Item No.', 'Description', 'Unit', 'Qty', 'Rate (KES)', 'Total (KES)'])
      worksheet.getRow(row).font = { bold: true }
      row++

      items.forEach((item) => {
        worksheet.addRow([
          item.itemNumber || '',
          item.description,
          item.unit,
          item.quantity,
          item.rate,
          item.total,
        ])
        row++
      })

      const sysTotal = items.reduce((s, i) => s + i.total, 0)
      worksheet.addRow(['', '', '', '', 'System Total', sysTotal])
      worksheet.getRow(row).font = { bold: true }
      row += 2
    })

    // Summary
    worksheet.mergeCells(`A${row}:E${row}`)
    worksheet.getCell(`A${row}`).value = 'GRAND TOTAL (Build-Up)'
    worksheet.getCell(`A${row}`).font = { bold: true }
    worksheet.getCell(`F${row}`).value = grandTotal
    worksheet.getCell(`F${row}`).font = { bold: true, color: { argb: 'FF006400' } }

    row++
    worksheet.mergeCells(`A${row}:E${row}`)
    worksheet.getCell(`A${row}`).value = 'PARENT BOQ RATE'
    worksheet.getCell(`A${row}`).font = { bold: true }
    worksheet.getCell(`F${row}`).value = parentTotal

    row++
    worksheet.mergeCells(`A${row}:E${row}`)
    worksheet.getCell(`A${row}`).value = 'VARIANCE'
    worksheet.getCell(`A${row}`).font = { bold: true }
    worksheet.getCell(`F${row}`).value = variance
    worksheet.getCell(`F${row}`).font = {
      bold: true,
      color: { argb: variance >= 0 ? 'FF006400' : 'FFFF0000' },
    }

    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    saveAs(blob, `BOQ_${boqItem.itemNumber}_BuildUp.xlsx`)
  }

  // Export to PDF
  const exportToPDF = async () => {
    const element = printRef.current
    const canvas = await html2canvas(element, { scale: 2 })
    const imgData = canvas.toDataURL('image/png')

    const pdf = new jsPDF('p', 'mm', 'a4')
    const imgWidth = 210
    const pageHeight = 295
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    let heightLeft = imgHeight
    let position = 10

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
    heightLeft -= pageHeight

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight
      pdf.addPage()
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
    }

    pdf.save(`BOQ_${boqItem.itemNumber}_BuildUp.pdf`)
  }

  if (loading) {
    return (
      <div
        className="d-flex flex-column align-items-center justify-content-center"
        style={{ minHeight: '60vh' }}
      >
        <CSpinner color="primary" style={{ width: '3rem', height: '3rem' }} />
        <p className="mt-3 text-muted fw-medium">Loading BOQ breakdown...</p>
      </div>
    )
  }

  if (error) {
    return (
      <CAlert color="danger" className="d-flex align-items-center">
        <CIcon icon={cilWarning} className="me-2" size="xl" />
        <div>{error}</div>
      </CAlert>
    )
  }

  if (!boqItem) {
    return (
      <CAlert color="warning" className="d-flex align-items-center">
        <CIcon icon={cilWarning} className="me-2" size="xl" />
        <div>BOQ Item not found</div>
      </CAlert>
    )
  }

  return (
    <div className="animated fadeIn">
      <div ref={printRef}>
        {/* Compact Header */}
        <CCard
          className="mb-3 border-0 overflow-hidden"
          style={{
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            borderRadius: '12px',
          }}
        >
          <div
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              padding: '1.5rem',
              color: 'white',
            }}
          >
            <Link
              to={`/projects/view/${projectId}/boq`}
              className="text-decoration-none d-inline-block mb-3"
            >
              <CButton
                style={{
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  color: 'white',
                  backdropFilter: 'blur(10px)',
                  fontSize: '0.8rem',
                  padding: '0.4rem 0.8rem',
                }}
                size="sm"
              >
                <CIcon icon={cilArrowLeft} className="me-2" /> Back to BOQ
              </CButton>
            </Link>

            <div className="d-flex justify-content-between align-items-start flex-wrap gap-3">
              <div>
                <div className="d-flex align-items-center gap-2 mb-2">
                  <CBadge
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.25)',
                      color: 'white',
                      fontSize: '0.7rem',
                      padding: '0.35rem 0.7rem',
                    }}
                  >
                    {boqItem.itemNumber}
                  </CBadge>
                  <CBadge color="success" style={{ fontSize: '0.7rem', padding: '0.35rem 0.7rem' }}>
                    Active
                  </CBadge>
                </div>
                <h4 className="mb-2 fw-bold" style={{ fontSize: '1.3rem' }}>
                  {boqItem.description}
                </h4>
                <div
                  className="d-flex align-items-center gap-2 flex-wrap"
                  style={{ fontSize: '0.8rem', opacity: 0.95 }}
                >
                  <span>
                    <strong>{boqItem.quantity}</strong> {boqItem.unit}
                  </span>
                  <span>×</span>
                  <span>
                    <strong>{formatCurrency(boqItem.rate)}</strong>
                  </span>
                  <span>=</span>
                  <span
                    className="px-2 py-1 rounded"
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.25)',
                      backdropFilter: 'blur(10px)',
                      fontSize: '0.95rem',
                      fontWeight: 'bold',
                    }}
                  >
                    {formatCurrency(parentTotal)}
                  </span>
                </div>
              </div>

              <div className="d-flex gap-2 flex-wrap">
                <CButton
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    color: 'white',
                    fontSize: '0.75rem',
                    padding: '0.4rem 0.8rem',
                  }}
                  onClick={() => setAddTabModal(true)}
                  size="sm"
                >
                  <CIcon icon={cilPlus} className="me-1" /> System
                </CButton>
                <CButton
                  style={{
                    backgroundColor: 'white',
                    border: 'none',
                    color: '#667eea',
                    fontSize: '0.75rem',
                    padding: '0.4rem 0.8rem',
                    fontWeight: '600',
                  }}
                  onClick={() => setAddEntryModal(true)}
                  size="sm"
                >
                  <CIcon icon={cilPlus} className="me-1" /> Add Item
                </CButton>
                <CButton
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    color: 'white',
                    fontSize: '0.75rem',
                    padding: '0.4rem 0.8rem',
                  }}
                  onClick={exportToExcel}
                  size="sm"
                >
                  <CIcon icon={cilFile} className="me-1" /> Excel
                </CButton>
                <CButton
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    color: 'white',
                    fontSize: '0.75rem',
                    padding: '0.4rem 0.8rem',
                  }}
                  onClick={exportToPDF}
                  size="sm"
                >
                  <CIcon icon={cilCloudDownload} className="me-1" /> PDF
                </CButton>
              </div>
            </div>
          </div>
        </CCard>

        {/* Collapsible Summary Card */}
        {summaryExpanded && (
          <CCard
            className="mb-3 border-0"
            style={{
              boxShadow: '0 4px 20px rgba(102, 126, 234, 0.15)',
              borderRadius: '12px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                padding: '1.25rem',
                color: 'white',
              }}
            >
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5
                  className="mb-0 fw-bold d-flex align-items-center gap-2"
                  style={{ fontSize: '1rem' }}
                >
                  <CIcon icon={cilCalculator} /> Rate Build-Up Summary
                </h5>
                <CButton
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    color: 'white',
                    fontSize: '0.7rem',
                    padding: '0.25rem 0.5rem',
                  }}
                  onClick={() => setSummaryExpanded(false)}
                  size="sm"
                >
                  <CIcon icon={cilChevronTop} />
                </CButton>
              </div>

              <CRow className="g-3">
                <CCol md={3}>
                  <div
                    className="p-3 rounded"
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.15)',
                      backdropFilter: 'blur(10px)',
                    }}
                  >
                    <div
                      className="text-uppercase mb-1"
                      style={{ fontSize: '0.65rem', opacity: 0.9 }}
                    >
                      Grand Total (Build-Up)
                    </div>
                    <div style={{ fontSize: '1.3rem', fontWeight: '700' }}>
                      {formatCurrency(grandTotal)}
                    </div>
                  </div>
                </CCol>

                <CCol md={3}>
                  <div
                    className="p-3 rounded"
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.15)',
                      backdropFilter: 'blur(10px)',
                    }}
                  >
                    <div
                      className="text-uppercase mb-1"
                      style={{ fontSize: '0.65rem', opacity: 0.9 }}
                    >
                      Parent BOQ Rate
                    </div>
                    <div style={{ fontSize: '1.3rem', fontWeight: '700' }}>
                      {formatCurrency(parentTotal)}
                    </div>
                  </div>
                </CCol>

                <CCol md={3}>
                  <div
                    className="p-3 rounded"
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.15)',
                      backdropFilter: 'blur(10px)',
                    }}
                  >
                    <div
                      className="text-uppercase mb-1"
                      style={{ fontSize: '0.65rem', opacity: 0.9 }}
                    >
                      Variance
                    </div>
                    <div style={{ fontSize: '1.3rem', fontWeight: '700' }}>
                      {formatCurrency(variance)}
                      <span style={{ fontSize: '0.75rem', marginLeft: '0.3rem' }}>
                        ({variancePercent}%)
                      </span>
                    </div>
                  </div>
                </CCol>

                <CCol md={3}>
                  <div
                    className="p-3 rounded"
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.15)',
                      backdropFilter: 'blur(10px)',
                    }}
                  >
                    <div
                      className="text-uppercase mb-2"
                      style={{ fontSize: '0.65rem', opacity: 0.9 }}
                    >
                      Build-Up Progress
                    </div>
                    <CProgress height={20} style={{ borderRadius: '8px' }}>
                      <CProgressBar
                        style={{
                          backgroundColor: variance >= 0 ? '#28a745' : '#dc3545',
                          fontSize: '0.7rem',
                          fontWeight: '700',
                        }}
                        value={Math.min(100, buildUpPercent)}
                      >
                        {buildUpPercent}%
                      </CProgressBar>
                    </CProgress>
                  </div>
                </CCol>
              </CRow>
            </div>
          </CCard>
        )}

        {/* Collapsed Summary Bar */}
        {!summaryExpanded && (
          <CCard className="mb-3 border-0" style={{ borderRadius: '8px', overflow: 'hidden' }}>
            <CButton
              onClick={() => setSummaryExpanded(true)}
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                color: 'white',
                fontSize: '0.8rem',
                padding: '0.75rem',
                textAlign: 'left',
              }}
              className="w-100 d-flex justify-content-between align-items-center"
            >
              <div className="d-flex align-items-center gap-3">
                <CIcon icon={cilCalculator} />
                <span className="fw-bold">Summary</span>
                <span>Total: {formatCurrency(grandTotal)}</span>
                <span>•</span>
                <span>Variance: {formatCurrency(variance)}</span>
              </div>
              <CIcon icon={cilChevronBottom} />
            </CButton>
          </CCard>
        )}

        {/* Tabs */}
        {categories.length === 0 ? (
          <CCard
            className="border-0"
            style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', borderRadius: '10px' }}
          >
            <CCardBody className="text-center py-5">
              <div className="mb-3" style={{ fontSize: '3rem', opacity: 0.3 }}>
                📊
              </div>
              <h5 className="text-muted mb-2">No Systems Yet</h5>
              <p className="text-muted mb-3" style={{ fontSize: '0.85rem' }}>
                Get started by creating your first system tab
              </p>
              <CButton color="primary" onClick={() => setAddTabModal(true)} size="sm">
                <CIcon icon={cilPlus} className="me-2" /> Add System Tab
              </CButton>
            </CCardBody>
          </CCard>
        ) : (
          <CCard
            className="border-0 mb-3"
            style={{
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
              borderRadius: '10px',
              overflow: 'hidden',
            }}
          >
            <CCardHeader className="bg-white border-0 pb-0">
              <CNav variant="tabs" className="border-0">
                {categories.map((cat) => (
                  <CNavItem key={cat.name}>
                    <CNavLink
                      active={activeTab === cat.name}
                      onClick={() => setActiveTab(cat.name)}
                      style={{
                        cursor: 'pointer',
                        border: 'none',
                        borderBottom:
                          activeTab === cat.name ? '2px solid #667eea' : '2px solid transparent',
                        color: activeTab === cat.name ? '#667eea' : '#6c757d',
                        fontWeight: activeTab === cat.name ? '600' : '500',
                        padding: '0.6rem 1.2rem',
                        transition: 'all 0.3s ease',
                        fontSize: '0.8rem',
                      }}
                    >
                      <CIcon icon={getIconForCategory(cat.name)} className="me-2" size="sm" />
                      {cat.name}
                      <CBadge
                        style={{
                          backgroundColor: activeTab === cat.name ? '#667eea' : '#e9ecef',
                          color: activeTab === cat.name ? 'white' : '#6c757d',
                          marginLeft: '0.4rem',
                          padding: '0.2rem 0.4rem',
                          borderRadius: '4px',
                          fontSize: '0.65rem',
                        }}
                      >
                        {itemsByCategory[cat.name]?.length || 0}
                      </CBadge>
                    </CNavLink>
                  </CNavItem>
                ))}
              </CNav>
            </CCardHeader>

            <CCardBody className="p-0">
              {activeTab &&
              (!itemsByCategory[activeTab] || itemsByCategory[activeTab].length === 0) ? (
                <div className="text-center py-4 px-3">
                  <CIcon
                    icon={getIconForCategory(activeTab)}
                    style={{ fontSize: '3rem', opacity: 0.15, marginBottom: '0.75rem' }}
                  />
                  <h6 className="text-muted mb-2" style={{ fontSize: '0.9rem' }}>
                    No Items in {activeTab}
                  </h6>
                  <p className="text-muted mb-3" style={{ fontSize: '0.75rem' }}>
                    Start building your rate breakdown
                  </p>
                  <CButton color="primary" onClick={() => setAddEntryModal(true)} size="sm">
                    <CIcon icon={cilPlus} className="me-2" /> Add First Item
                  </CButton>
                </div>
              ) : (
                <div className="table-responsive">
                  <CTable hover className="mb-0" style={{ fontSize: '0.75rem' }}>
                    <CTableHead style={{ backgroundColor: '#f8f9fa' }}>
                      <CTableRow>
                        <CTableHeaderCell
                          style={{
                            fontWeight: '600',
                            color: '#495057',
                            fontSize: '0.7rem',
                            textTransform: 'uppercase',
                            padding: '0.6rem',
                          }}
                        >
                          Item No.
                        </CTableHeaderCell>
                        <CTableHeaderCell
                          style={{
                            fontWeight: '600',
                            color: '#495057',
                            fontSize: '0.7rem',
                            textTransform: 'uppercase',
                            padding: '0.6rem',
                          }}
                        >
                          Description
                        </CTableHeaderCell>
                        <CTableHeaderCell
                          style={{
                            fontWeight: '600',
                            color: '#495057',
                            fontSize: '0.7rem',
                            textTransform: 'uppercase',
                            padding: '0.6rem',
                          }}
                        >
                          Unit
                        </CTableHeaderCell>
                        <CTableHeaderCell
                          className="text-end"
                          style={{
                            fontWeight: '600',
                            color: '#495057',
                            fontSize: '0.7rem',
                            textTransform: 'uppercase',
                            padding: '0.6rem',
                          }}
                        >
                          Qty
                        </CTableHeaderCell>
                        <CTableHeaderCell
                          className="text-end"
                          style={{
                            fontWeight: '600',
                            color: '#495057',
                            fontSize: '0.7rem',
                            textTransform: 'uppercase',
                            padding: '0.6rem',
                          }}
                        >
                          Rate
                        </CTableHeaderCell>
                        <CTableHeaderCell
                          className="text-end"
                          style={{
                            fontWeight: '600',
                            color: '#495057',
                            fontSize: '0.7rem',
                            textTransform: 'uppercase',
                            padding: '0.6rem',
                          }}
                        >
                          Total
                        </CTableHeaderCell>
                        <CTableHeaderCell
                          className="text-center"
                          style={{
                            fontWeight: '600',
                            color: '#495057',
                            fontSize: '0.7rem',
                            textTransform: 'uppercase',
                            padding: '0.6rem',
                          }}
                        >
                          Actions
                        </CTableHeaderCell>
                      </CTableRow>
                    </CTableHead>
                    <CTableBody>
                      {itemsByCategory[activeTab]?.map((item, idx) => (
                        <CTableRow
                          key={item._id}
                          style={{
                            transition: 'background-color 0.2s ease',
                            backgroundColor: idx % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.02)',
                          }}
                        >
                          <CTableDataCell
                            style={{ fontWeight: '500', color: '#6c757d', padding: '0.6rem' }}
                          >
                            {item.itemNumber || '-'}
                          </CTableDataCell>
                          <CTableDataCell style={{ fontWeight: '500', padding: '0.6rem' }}>
                            {item.description}
                          </CTableDataCell>
                          <CTableDataCell style={{ padding: '0.6rem' }}>
                            <CBadge
                              style={{
                                backgroundColor: '#e9ecef',
                                color: '#495057',
                                fontWeight: '500',
                                padding: '0.25rem 0.5rem',
                                borderRadius: '4px',
                                fontSize: '0.7rem',
                              }}
                            >
                              {item.unit}
                            </CBadge>
                          </CTableDataCell>
                          <CTableDataCell
                            className="text-end"
                            style={{ fontWeight: '500', padding: '0.6rem' }}
                          >
                            {item.quantity.toLocaleString()}
                          </CTableDataCell>
                          <CTableDataCell
                            className="text-end"
                            style={{ fontWeight: '500', color: '#6c757d', padding: '0.6rem' }}
                          >
                            {formatCurrency(item.rate)}
                          </CTableDataCell>
                          <CTableDataCell
                            className="text-end"
                            style={{
                              fontWeight: '700',
                              color: '#667eea',
                              fontSize: '0.8rem',
                              padding: '0.6rem',
                            }}
                          >
                            {formatCurrency(item.total)}
                          </CTableDataCell>
                          <CTableDataCell className="text-center" style={{ padding: '0.6rem' }}>
                            <CButton
                              color="info"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditItem(item)}
                              className="me-1"
                              style={{ borderRadius: '4px', padding: '0.25rem 0.4rem' }}
                            >
                              <CIcon icon={cilPencil} size="sm" />
                            </CButton>
                            <CButton
                              color="danger"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteItem(item)}
                              style={{ borderRadius: '4px', padding: '0.25rem 0.4rem' }}
                            >
                              <CIcon icon={cilTrash} size="sm" />
                            </CButton>
                          </CTableDataCell>
                        </CTableRow>
                      ))}
                      <CTableRow
                        style={{ backgroundColor: '#f8f9fa', borderTop: '2px solid #dee2e6' }}
                      >
                        <CTableDataCell
                          colSpan={5}
                          className="text-end"
                          style={{ fontWeight: '700', fontSize: '0.8rem', padding: '0.75rem' }}
                        >
                          {activeTab} Total
                        </CTableDataCell>
                        <CTableDataCell
                          className="text-end"
                          style={{
                            fontWeight: '700',
                            fontSize: '0.9rem',
                            color: '#28a745',
                            padding: '0.75rem',
                          }}
                        >
                          {formatCurrency(
                            itemsByCategory[activeTab]?.reduce((s, i) => s + i.total, 0) || 0,
                          )}
                        </CTableDataCell>
                        <CTableDataCell></CTableDataCell>
                      </CTableRow>
                    </CTableBody>
                  </CTable>
                </div>
              )}
            </CCardBody>
          </CCard>
        )}
      </div>

      {/* Enhanced Add/Edit Modal */}
      <CModal visible={addEntryModal} onClose={closeModal} size="lg" backdrop="static">
        <CModalHeader
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            borderBottom: 'none',
          }}
        >
          <CModalTitle style={{ fontSize: '1rem', fontWeight: '600' }}>
            {editingItem ? 'Edit' : 'Add'} Item — {activeTab}
          </CModalTitle>
        </CModalHeader>
        <CForm onSubmit={handleSaveItem}>
          <CModalBody style={{ padding: '1.25rem' }}>
            <CRow className="g-3">
              <CCol md={3}>
                <CFormLabel style={{ fontWeight: '600', fontSize: '0.75rem', color: '#495057' }}>
                  Item No.
                </CFormLabel>
                <CFormInput
                  value={formData.itemNumber}
                  onChange={(e) => setFormData({ ...formData, itemNumber: e.target.value })}
                  placeholder="e.g. 1.01"
                  style={{ borderRadius: '6px', padding: '0.5rem', fontSize: '0.8rem' }}
                />
              </CCol>
              <CCol md={9}>
                <CFormLabel style={{ fontWeight: '600', fontSize: '0.75rem', color: '#495057' }}>
                  Description <span style={{ color: '#dc3545' }}>*</span>
                </CFormLabel>
                <CFormInput
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  style={{ borderRadius: '6px', padding: '0.5rem', fontSize: '0.8rem' }}
                />
              </CCol>
              <CCol md={3}>
                <CFormLabel style={{ fontWeight: '600', fontSize: '0.75rem', color: '#495057' }}>
                  Unit <span style={{ color: '#dc3545' }}>*</span>
                </CFormLabel>
                <CFormSelect
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  required
                  style={{ borderRadius: '6px', padding: '0.5rem', fontSize: '0.8rem' }}
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
                <CFormLabel style={{ fontWeight: '600', fontSize: '0.75rem', color: '#495057' }}>
                  Quantity <span style={{ color: '#dc3545' }}>*</span>
                </CFormLabel>
                <CFormInput
                  type="number"
                  step="0.01"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  required
                  style={{ borderRadius: '6px', padding: '0.5rem', fontSize: '0.8rem' }}
                />
              </CCol>
              <CCol md={5}>
                <CFormLabel style={{ fontWeight: '600', fontSize: '0.75rem', color: '#495057' }}>
                  Rate (KES) <span style={{ color: '#dc3545' }}>*</span>
                </CFormLabel>
                <CFormInput
                  type="number"
                  step="0.01"
                  value={formData.rate}
                  onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                  required
                  style={{ borderRadius: '6px', padding: '0.5rem', fontSize: '0.8rem' }}
                />
              </CCol>
            </CRow>

            {formData.quantity && formData.rate && (
              <div
                className="mt-3 p-3 rounded"
                style={{
                  background: 'linear-gradient(135deg, #667eea15 0%, #764ba215 100%)',
                  border: '2px solid #667eea40',
                  borderRadius: '10px',
                }}
              >
                <div className="d-flex justify-content-between align-items-center">
                  <span style={{ fontWeight: '600', color: '#495057', fontSize: '0.8rem' }}>
                    Line Total:
                  </span>
                  <span style={{ fontSize: '1.2rem', fontWeight: '700', color: '#667eea' }}>
                    {formatCurrency(
                      (parseFloat(formData.quantity) || 0) * (parseFloat(formData.rate) || 0),
                    )}
                  </span>
                </div>
              </div>
            )}
          </CModalBody>
          <CModalFooter style={{ borderTop: '1px solid #dee2e6', padding: '0.75rem 1.25rem' }}>
            <CButton
              color="light"
              onClick={closeModal}
              size="sm"
              style={{
                borderRadius: '6px',
                padding: '0.4rem 1rem',
                fontWeight: '500',
                fontSize: '0.8rem',
              }}
            >
              Cancel
            </CButton>
            <CButton
              color="primary"
              type="submit"
              size="sm"
              style={{
                borderRadius: '6px',
                padding: '0.4rem 1rem',
                fontWeight: '600',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                fontSize: '0.8rem',
              }}
            >
              {editingItem ? 'Update Item' : 'Save Item'}
            </CButton>
          </CModalFooter>
        </CForm>
      </CModal>

      {/* Enhanced Delete Modal */}
      <CModal visible={deleteModal} onClose={() => setDeleteModal(false)} alignment="center">
        <CModalHeader
          style={{
            background: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)',
            color: 'white',
            borderBottom: 'none',
          }}
        >
          <CModalTitle style={{ fontSize: '1rem', fontWeight: '600' }}>Confirm Delete</CModalTitle>
        </CModalHeader>
        <CModalBody className="text-center" style={{ padding: '1.5rem' }}>
          <div
            style={{
              width: '60px',
              height: '60px',
              margin: '0 auto 1rem',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #dc354520 0%, #dc354510 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CIcon icon={cilWarning} size="3xl" className="text-danger" />
          </div>
          <h6 style={{ fontWeight: '600', marginBottom: '0.75rem', fontSize: '0.9rem' }}>
            Delete this item?
          </h6>
          <p
            style={{
              fontWeight: '500',
              color: '#495057',
              marginBottom: '0.5rem',
              fontSize: '0.8rem',
            }}
          >
            {itemToDelete?.description}
          </p>
          <div
            style={{
              padding: '0.6rem',
              backgroundColor: '#f8f9fa',
              borderRadius: '6px',
              marginTop: '0.75rem',
            }}
          >
            <p className="mb-0" style={{ fontSize: '0.75rem', color: '#6c757d' }}>
              Qty: <strong>{itemToDelete?.quantity}</strong> × Rate:{' '}
              <strong>{formatCurrency(itemToDelete?.rate)}</strong> ={' '}
              <strong style={{ color: '#667eea' }}>{formatCurrency(itemToDelete?.total)}</strong>
            </p>
          </div>
        </CModalBody>
        <CModalFooter style={{ borderTop: '1px solid #dee2e6', padding: '0.75rem 1rem' }}>
          <CButton
            color="light"
            onClick={() => setDeleteModal(false)}
            size="sm"
            style={{
              borderRadius: '6px',
              padding: '0.4rem 1rem',
              fontWeight: '500',
              fontSize: '0.8rem',
            }}
          >
            Cancel
          </CButton>
          <CButton
            color="danger"
            onClick={confirmDelete}
            size="sm"
            style={{
              borderRadius: '6px',
              padding: '0.4rem 1rem',
              fontWeight: '600',
              fontSize: '0.8rem',
            }}
          >
            Delete Item
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Enhanced Add Tab Modal */}
      <CModal visible={addTabModal} onClose={() => setAddTabModal(false)} alignment="center">
        <CModalHeader
          style={{
            background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
            color: 'white',
            borderBottom: 'none',
          }}
        >
          <CModalTitle style={{ fontSize: '1rem', fontWeight: '600' }}>
            Add New System Tab
          </CModalTitle>
        </CModalHeader>
        <CModalBody style={{ padding: '1.25rem' }}>
          <CFormLabel style={{ fontWeight: '600', fontSize: '0.75rem', color: '#495057' }}>
            System Name <span style={{ color: '#dc3545' }}>*</span>
          </CFormLabel>
          <CFormInput
            value={newTabName}
            onChange={(e) => setNewTabName(e.target.value)}
            placeholder="e.g. Public Address System"
            autoFocus
            style={{ borderRadius: '6px', padding: '0.5rem', fontSize: '0.8rem' }}
          />
          <div
            className="mt-3 p-2 rounded"
            style={{ backgroundColor: '#e7f3ff', fontSize: '0.75rem', color: '#0056b3' }}
          >
            💡 Tip: Use descriptive names like "CCTV", "Fire Alarm", or "Access Control"
          </div>
        </CModalBody>
        <CModalFooter style={{ borderTop: '1px solid #dee2e6', padding: '0.75rem 1rem' }}>
          <CButton
            color="light"
            onClick={() => setAddTabModal(false)}
            size="sm"
            style={{
              borderRadius: '6px',
              padding: '0.4rem 1rem',
              fontWeight: '500',
              fontSize: '0.8rem',
            }}
          >
            Cancel
          </CButton>
          <CButton
            onClick={handleAddTab}
            disabled={!newTabName.trim()}
            size="sm"
            style={{
              borderRadius: '6px',
              padding: '0.4rem 1rem',
              fontWeight: '600',
              background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
              border: 'none',
              color: 'white',
              fontSize: '0.8rem',
            }}
          >
            <CIcon icon={cilPlus} className="me-2" /> Add Tab
          </CButton>
        </CModalFooter>
      </CModal>
    </div>
  )
}

export default BoqItemDetails
