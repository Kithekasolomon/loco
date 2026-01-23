import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CButton,
  CButtonGroup,
  CBadge,
  CSpinner,
  CAlert,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CForm,
  CFormLabel,
  CFormInput,
  CFormSelect,
  CTooltip,
  CProgress,
  CProgressBar,
  CInputGroup,
  CInputGroupText,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilPlus,
  cilPencil,
  cilZoom,
  cilTrash,
  cilArrowLeft,
  cilMoney,
  cilCalculator,
  cilChartPie,
  cilCheckCircle,
  cilFile,
  cilClock,
  cilWarning,
} from '@coreui/icons'
import api from '../../../../api/axios'
import { useAuth } from '../../../../context/AuthContext'
import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'

const BoqView = () => {
  const { id } = useParams()
  const { user } = useAuth()
  const isSuperAdmin =
    user?.role?.name?.toUpperCase() === 'SUPER_ADMIN' ||
    user?.roleName?.toUpperCase() === 'SUPER_ADMIN'

  const [project, setProject] = useState(null)
  const [boqItems, setBoqItems] = useState([])
  const [summary, setSummary] = useState({
    totalContractSum: 0,
    valuedToDate: 0,
    percentageComplete: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  // Modals
  const [addModal, setAddModal] = useState(false)
  const [editModal, setEditModal] = useState(false)
  const [deleteModal, setDeleteModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)

  const [formData, setFormData] = useState({
    itemNumber: '',
    description: '',
    unit: '',
    quantity: '',
    rate: '',
    progressPercentage: 0,
  })

  const fetchProjectAndBoq = async () => {
    try {
      setLoading(true)
      const { data } = await api.get(`/api/projects/${id}`)

      setProject(data.project || null)

      const allItems = []
      if (data.boq?.categories && Array.isArray(data.boq.categories)) {
        data.boq.categories.forEach((category) => {
          if (category.items && Array.isArray(category.items)) {
            allItems.push(...category.items)
          }
        })
      }
      setBoqItems(allItems)
      const boqSummary = data.boq?.summary || {}
      setSummary({
        totalContractSum: boqSummary.totalContractSum || 0,
        valuedToDate: boqSummary.valuedToDate || 0,
        percentageComplete: parseFloat(boqSummary.percentageComplete) || 0,
      })
    } catch (err) {
      setError('Failed to load project or BOQ. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProjectAndBoq()
  }, [id])

  const handleAdd = async (e) => {
    e.preventDefault()

    const duplicate = boqItems.find(
      (item) =>
        item.itemNumber.trim().toLowerCase() === formData.itemNumber.trim().toLowerCase() &&
        (!selectedItem || item._id !== selectedItem._id),
    )

    if (duplicate) {
      setError(`Item Number "${formData.itemNumber}" already exists. Please use a unique number.`)
      return
    }
    try {
      setError(null)
      await api.post(`/api/boq/${id}`, formData)
      setSuccess('BOQ item added successfully!')
      setAddModal(false)
      resetForm()
      fetchProjectAndBoq()
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to add item')
    }
  }

  const handleEdit = async (e) => {
    e.preventDefault()
    const duplicate = boqItems.find(
      (item) =>
        item.itemNumber.trim().toLowerCase() === formData.itemNumber.trim().toLowerCase() &&
        (!selectedItem || item._id !== selectedItem._id),
    )

    if (duplicate) {
      setError(`Item Number "${formData.itemNumber}" already exists. Please use a unique number.`)
      return
    }
    try {
      setError(null)
      await api.put(`/api/boq/${selectedItem._id}`, formData)
      setSuccess('BOQ item updated successfully!')
      setEditModal(false)
      resetForm()
      fetchProjectAndBoq()
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to update item')
    }
  }

  const handleDelete = async () => {
    try {
      setError(null)
      await api.delete(`/api/boq/${selectedItem._id}`)
      setSuccess('BOQ item deleted successfully!')
      setDeleteModal(false)
      setSelectedItem(null)
      fetchProjectAndBoq()
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to delete item')
    }
  }

  const openAddModal = () => {
    resetForm()
    setAddModal(true)
  }

  const openEditModal = (item) => {
    setSelectedItem(item)
    setFormData({
      itemNumber: item.itemNumber,
      description: item.description,
      unit: item.unit,
      quantity: item.quantity,
      rate: item.rate,
      progressPercentage: item.progressPercentage || 0,
    })
    setEditModal(true)
  }

  const openDeleteModal = (item) => {
    setSelectedItem(item)
    setDeleteModal(true)
  }

  const resetForm = () => {
    setFormData({
      itemNumber: '',
      description: '',
      unit: '',
      quantity: '',
      rate: '',
      progressPercentage: 0,
    })
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 2,
    }).format(amount || 0)
  }

  const getProgressColor = (percentage) => {
    if (percentage >= 100) return 'success'
    if (percentage >= 75) return 'info'
    if (percentage >= 50) return 'warning'
    return 'danger'
  }

  const getStatusIcon = (percentage) => {
    if (percentage >= 100) return cilCheckCircle
    if (percentage >= 50) return cilClock
    return cilWarning
  }

  const exportBreakdownReport = async (boqItem) => {
    try {
      setError(null)

      // Fetch breakdown data
      const { data: breakdown } = await api.get(`/api/boq-breakdown/${boqItem._id}`)

      const workbook = new ExcelJS.Workbook()
      workbook.creator = 'BOQ System'
      workbook.created = new Date()

      // Summary Sheet
      const summarySheet = workbook.addWorksheet('Summary')
      summarySheet.mergeCells('A1:G1')
      summarySheet.getCell('A1').value = `${boqItem.itemNumber} - ${boqItem.description}`
      summarySheet.getCell('A1').font = { size: 16, bold: true }
      summarySheet.getCell('A1').alignment = { horizontal: 'center' }

      summarySheet.addRow([])
      summarySheet.addRow(['Quantity', boqItem.quantity])
      summarySheet.addRow(['Unit', boqItem.unit])
      summarySheet.addRow(['Rate (KES)', formatCurrency(boqItem.rate)])
      summarySheet.addRow(['BOQ Total', formatCurrency(boqItem.total)])
      summarySheet.addRow([])

      const grandTotal = breakdown.reduce((sum, sys) => {
        return sum + sys.items.reduce((s, i) => s + (i.total || 0), 0)
      }, 0)

      summarySheet.addRow(['Build-Up Grand Total', formatCurrency(grandTotal)])
      summarySheet.addRow(['Variance', formatCurrency(grandTotal - boqItem.total)])

      // One sheet per system
      breakdown.forEach((system) => {
        const safeName = system.name.substring(0, 31)
        const sheet = workbook.addWorksheet(safeName)

        sheet.addRow([`System: ${system.name}`]).font = { bold: true, size: 14 }
        sheet.addRow([])

        sheet.addRow(['Item No.', 'Description', 'Unit', 'Qty', 'Rate (KES)', 'Total (KES)'])
        sheet.getRow(sheet.rowCount).font = { bold: true }

        system.items.forEach((item) => {
          sheet.addRow([
            item.itemNumber || '',
            item.description,
            item.unit,
            item.quantity,
            item.rate,
            item.total || 0,
          ])
        })

        const sysTotal = system.items.reduce((s, i) => s + (i.total || 0), 0)
        sheet.addRow([])
        sheet.addRow(['', '', '', '', 'System Total', sysTotal])
        sheet.getRow(sheet.rowCount).font = { bold: true }
      })

      // Download
      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      saveAs(blob, `BOQ_${boqItem.itemNumber}_Rate_Build_Up.xlsx`)
    } catch (err) {
      console.error('Export failed:', err)
      setError('Failed to export rate build-up report')
    }
  }

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: '60vh' }}
      >
        <div className="text-center">
          <CSpinner color="primary" style={{ width: '3rem', height: '3rem' }} />
          <p className="mt-3 text-muted fw-semibold">Loading Bill of Quantities...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="animated fadeIn">
      {/* Alerts */}
      {error && (
        <CAlert color="danger" dismissible onClose={() => setError(null)} className="mb-4">
          <strong>Error!</strong> {error}
        </CAlert>
      )}
      {success && (
        <CAlert color="success" dismissible onClose={() => setSuccess(null)} className="mb-4">
          <strong>Success!</strong> {success}
        </CAlert>
      )}

      {/* Project Header Card */}
      <CCard
        className="mb-3 border-0 shadow-sm"
        style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
      >
        <CCardBody className="p-3">
          <div className="d-flex justify-content-between align-items-start mb-2">
            <div className="flex-grow-1">
              <Link to="/projects" className="text-decoration-none">
                <CButton
                  color="light"
                  size="sm"
                  className="mb-2 shadow-sm"
                  style={{ fontWeight: '500', fontSize: '0.75rem' }}
                >
                  <CIcon icon={cilArrowLeft} className="me-1" size="sm" />
                  Back to Projects
                </CButton>
              </Link>
              <h5 className="text-white mb-2 fw-bold">{project?.name}</h5>
              <div className="d-flex flex-wrap gap-2 align-items-center">
                <CBadge
                  color="light"
                  className="px-2 py-1"
                  style={{ fontSize: '0.75rem', fontWeight: '500' }}
                >
                  <CIcon icon={cilMoney} className="me-1" size="sm" />
                  {project?.location}
                </CBadge>
                <CBadge
                  color={summary.percentageComplete >= 100 ? 'success' : 'warning'}
                  className="px-2 py-1"
                  style={{ fontSize: '0.75rem', fontWeight: '500' }}
                >
                  <CIcon
                    icon={getStatusIcon(summary.percentageComplete)}
                    className="me-1"
                    size="sm"
                  />
                  {summary.percentageComplete >= 100
                    ? 'Completed'
                    : `${summary.percentageComplete.toFixed(1)}% Complete`}
                </CBadge>
              </div>
            </div>
            <CButton
              color="light"
              size="sm"
              onClick={openAddModal}
              className="shadow-sm fw-semibold"
              style={{ fontSize: '0.813rem' }}
            >
              <CIcon icon={cilPlus} className="me-1" size="sm" />
              Add BOQ Item
            </CButton>
          </div>

          <CRow className="mt-3 g-2 text-white">
            <CCol md={4}>
              <div className="d-flex align-items-center">
                <div className="bg-white bg-opacity-25 rounded-3 p-2 me-2">
                  <CIcon icon={cilCheckCircle} />
                </div>
                <div>
                  <small className="opacity-75 d-block" style={{ fontSize: '0.7rem' }}>
                    Project Lead
                  </small>
                  <strong style={{ fontSize: '0.813rem' }}>
                    {project?.projectLead?.firstName} {project?.projectLead?.lastName}
                  </strong>
                </div>
              </div>
            </CCol>
            <CCol md={4}>
              <div className="d-flex align-items-center">
                <div className="bg-white bg-opacity-25 rounded-3 p-2 me-2">
                  <CIcon icon={cilClock} />
                </div>
                <div>
                  <small className="opacity-75 d-block" style={{ fontSize: '0.7rem' }}>
                    Timeline
                  </small>
                  <strong style={{ fontSize: '0.813rem' }}>
                    {new Date(project?.timelineStart).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}{' '}
                    -{' '}
                    {new Date(project?.timelineEnd).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </strong>
                </div>
              </div>
            </CCol>
            <CCol md={4}>
              <div className="d-flex align-items-center">
                <div className="bg-white bg-opacity-25 rounded-3 p-2 me-2">
                  <CIcon icon={cilChartPie} />
                </div>
                <div className="flex-grow-1">
                  <small className="opacity-75 d-block mb-1" style={{ fontSize: '0.7rem' }}>
                    Overall Progress
                  </small>
                  <CProgress height={6} className="bg-white bg-opacity-25">
                    <CProgressBar
                      color="light"
                      value={summary.percentageComplete}
                      style={{ fontWeight: '600', fontSize: '0.65rem' }}
                    >
                      {summary.percentageComplete >= 20 &&
                        `${summary.percentageComplete.toFixed(0)}%`}
                    </CProgressBar>
                  </CProgress>
                </div>
              </div>
            </CCol>
          </CRow>
        </CCardBody>
      </CCard>

      {/* Summary Cards */}
      <CRow className="mb-3 g-3">
        <CCol lg={4}>
          <CCard
            className="border-0 shadow-sm h-100"
            style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
          >
            <CCardBody className="p-3 text-white">
              <div className="d-flex justify-content-between align-items-start mb-2">
                <div>
                  <div
                    className="text-white text-opacity-75 mb-1"
                    style={{ fontSize: '0.7rem', fontWeight: '500' }}
                  >
                    Contract Sum
                  </div>
                  <h5 className="mb-0 fw-bold">{formatCurrency(summary.totalContractSum)}</h5>
                </div>
                <div className="bg-white bg-opacity-25 rounded-3 p-2">
                  <CIcon icon={cilMoney} />
                </div>
              </div>
              <div className="text-white text-opacity-75" style={{ fontSize: '0.7rem' }}>
                Total project value
              </div>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol lg={4}>
          <CCard
            className="border-0 shadow-sm h-100"
            style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}
          >
            <CCardBody className="p-3 text-white">
              <div className="d-flex justify-content-between align-items-start mb-2">
                <div>
                  <div
                    className="text-white text-opacity-75 mb-1"
                    style={{ fontSize: '0.7rem', fontWeight: '500' }}
                  >
                    Valued to Date
                  </div>
                  <h5 className="mb-0 fw-bold">{formatCurrency(summary.valuedToDate)}</h5>
                </div>
                <div className="bg-white bg-opacity-25 rounded-3 p-2">
                  <CIcon icon={cilCalculator} />
                </div>
              </div>
              <div className="text-white text-opacity-75" style={{ fontSize: '0.7rem' }}>
                Work completed value
              </div>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol lg={4}>
          <CCard
            className="border-0 shadow-sm h-100"
            style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}
          >
            <CCardBody className="p-3 text-white">
              <div className="d-flex justify-content-between align-items-start mb-2">
                <div>
                  <div
                    className="text-white text-opacity-75 mb-1"
                    style={{ fontSize: '0.7rem', fontWeight: '500' }}
                  >
                    Remaining Balance
                  </div>
                  <h5 className="mb-0 fw-bold">
                    {formatCurrency(summary.totalContractSum - summary.valuedToDate)}
                  </h5>
                </div>
                <div className="bg-white bg-opacity-25 rounded-3 p-2">
                  <CIcon icon={cilChartPie} />
                </div>
              </div>
              <div className="d-flex align-items-center">
                <CProgress height={5} className="flex-grow-1 bg-white bg-opacity-25 me-2">
                  <CProgressBar color="light" value={summary.percentageComplete} />
                </CProgress>
                <span className="text-white" style={{ fontSize: '0.7rem', fontWeight: '600' }}>
                  {summary.percentageComplete.toFixed(1)}%
                </span>
              </div>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* BOQ Table */}
      <CCard className="border-0 shadow-sm">
        <CCardHeader className="bg-white border-bottom-0 p-3">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h6 className="mb-1 fw-bold">Bill of Quantities</h6>
              <p className="text-muted mb-0" style={{ fontSize: '0.7rem' }}>
                {boqItems.length} {boqItems.length === 1 ? 'item' : 'items'} in this project
              </p>
            </div>
          </div>
        </CCardHeader>
        <CCardBody className="p-0">
          {boqItems.length === 0 ? (
            <div className="text-center py-4">
              <div className="mb-3" style={{ fontSize: '3rem', opacity: '0.1' }}>
                <CIcon icon={cilCalculator} />
              </div>
              <h6 className="text-muted mb-2">No BOQ Items Yet</h6>
              <p className="text-muted mb-3" style={{ fontSize: '0.813rem' }}>
                Get started by adding your first bill of quantities item
              </p>
              <CButton color="primary" size="sm" onClick={openAddModal}>
                <CIcon icon={cilPlus} className="me-1" size="sm" />
                Add Your First BOQ Item
              </CButton>
            </div>
          ) : (
            <div className="table-responsive">
              <CTable hover className="mb-0" style={{ fontSize: '0.75rem' }}>
                <CTableHead style={{ backgroundColor: '#f8f9fa' }}>
                  <CTableRow>
                    <CTableHeaderCell className="fw-semibold py-2" style={{ fontSize: '0.7rem' }}>
                      #
                    </CTableHeaderCell>
                    <CTableHeaderCell className="fw-semibold py-2" style={{ fontSize: '0.7rem' }}>
                      Item No.
                    </CTableHeaderCell>
                    <CTableHeaderCell className="fw-semibold py-2" style={{ fontSize: '0.7rem' }}>
                      Description
                    </CTableHeaderCell>
                    <CTableHeaderCell className="fw-semibold py-2" style={{ fontSize: '0.7rem' }}>
                      Unit
                    </CTableHeaderCell>
                    <CTableHeaderCell
                      className="fw-semibold py-2 text-end"
                      style={{ fontSize: '0.7rem' }}
                    >
                      Quantity
                    </CTableHeaderCell>
                    <CTableHeaderCell
                      className="fw-semibold py-2 text-end"
                      style={{ fontSize: '0.7rem' }}
                    >
                      Rate
                    </CTableHeaderCell>
                    <CTableHeaderCell
                      className="fw-semibold py-2 text-end"
                      style={{ fontSize: '0.7rem' }}
                    >
                      Total
                    </CTableHeaderCell>
                    <CTableHeaderCell
                      className="fw-semibold py-2"
                      style={{ minWidth: '160px', fontSize: '0.7rem' }}
                    >
                      Progress
                    </CTableHeaderCell>
                    <CTableHeaderCell
                      className="fw-semibold py-2 text-end"
                      style={{ fontSize: '0.7rem' }}
                    >
                      Valued
                    </CTableHeaderCell>
                    <CTableHeaderCell
                      className="fw-semibold py-2 text-center"
                      style={{ fontSize: '0.7rem' }}
                    >
                      Actions
                    </CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {boqItems.map((item, index) => (
                    <CTableRow key={item._id} className="align-middle">
                      <CTableDataCell className="text-muted py-2">{index + 1}</CTableDataCell>
                      <CTableDataCell className="py-2">
                        <span className="fw-semibold text-primary">{item.itemNumber}</span>
                      </CTableDataCell>
                      <CTableDataCell style={{ maxWidth: '250px' }} className="py-2">
                        <div className="text-truncate" title={item.description}>
                          {item.description}
                        </div>
                      </CTableDataCell>
                      <CTableDataCell className="py-2">
                        <CBadge color="light" className="text-dark" style={{ fontSize: '0.65rem' }}>
                          {item.unit}
                        </CBadge>
                      </CTableDataCell>
                      <CTableDataCell className="text-end py-2">
                        {item.quantity?.toLocaleString()}
                      </CTableDataCell>
                      <CTableDataCell className="text-end text-muted py-2">
                        {formatCurrency(item.rate)}
                      </CTableDataCell>
                      <CTableDataCell className="text-end py-2">
                        <strong>{formatCurrency(item.total)}</strong>
                      </CTableDataCell>
                      <CTableDataCell className="py-2">
                        <div className="d-flex align-items-center gap-2">
                          <CProgress height={3} className="flex-grow-" style={{ minWidth: '30px' }}>
                            <CProgressBar
                              color={getProgressColor(item.progressPercentage)}
                              value={item.progressPercentage}
                            />
                          </CProgress>
                          <CBadge
                            color={getProgressColor(item.progressPercentage)}
                            className="px-2"
                            style={{ minWidth: '45px', fontSize: '0.65rem' }}
                          >
                            {item.progressPercentage}%
                          </CBadge>
                        </div>
                      </CTableDataCell>
                      <CTableDataCell className="text-end py-2">
                        <strong className="text-success">
                          {formatCurrency(item.valuedAmount)}
                        </strong>
                      </CTableDataCell>
                      <CTableDataCell className="text-center py-2">
                        <CButtonGroup size="sm">
                          <CTooltip content="Edit Item">
                            <CButton
                              color="info"
                              variant="ghost"
                              onClick={() => openEditModal(item)}
                              className="px-2"
                            >
                              <CIcon icon={cilPencil} size="sm" />
                            </CButton>
                          </CTooltip>

                          {/* NEW: View Details Button */}
                          <CTooltip content="View Details">
                            <Link to={`/projects/view/${id}/boq/${item._id}/details`}>
                              <CButton color="secondary" variant="ghost" className="px-2">
                                <CIcon icon={cilZoom} size="sm" />
                              </CButton>
                            </Link>
                          </CTooltip>

                          <CTooltip content="Export Rate Build-Up to Excel">
                            <CButton
                              color="success"
                              variant="ghost"
                              className="px-2"
                              onClick={() => exportBreakdownReport(item)}
                            >
                              <CIcon icon={cilFile} size="sm" />
                            </CButton>
                          </CTooltip>

                          <CTooltip content="Delete Item">
                            <CButton
                              color="danger"
                              variant="ghost"
                              onClick={() => openDeleteModal(item)}
                              className="px-2"
                            >
                              <CIcon icon={cilTrash} size="sm" />
                            </CButton>
                          </CTooltip>
                        </CButtonGroup>
                      </CTableDataCell>
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>
            </div>
          )}
        </CCardBody>
      </CCard>

      {/* Add / Edit Modal */}
      <CModal
        visible={addModal || editModal}
        onClose={() => {
          setAddModal(false)
          setEditModal(false)
          resetForm()
        }}
        size="lg"
        backdrop="static"
      >
        <CModalHeader
          className="border-bottom-0 pb-2"
          style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
        >
          <CModalTitle className="text-white fw-bold d-flex align-items-center">
            <div className="bg-white bg-opacity-25 rounded-3 p-2 me-2">
              <CIcon icon={addModal ? cilPlus : cilPencil} />
            </div>
            {addModal ? 'Add New BOQ Item' : 'Edit BOQ Item'}
          </CModalTitle>
        </CModalHeader>
        <CForm onSubmit={addModal ? handleAdd : handleEdit}>
          <CModalBody className="pt-4 pb-3">
            <CRow className="g-3">
              <CCol md={4}>
                <CFormLabel className="fw-semibold" style={{ fontSize: '0.813rem' }}>
                  Item Number <span className="text-danger">*</span>
                </CFormLabel>
                <CInputGroup>
                  <CInputGroupText
                    className="bg-light border-end-0"
                    style={{ fontSize: '0.75rem' }}
                  >
                    #
                  </CInputGroupText>
                  <CFormInput
                    required
                    value={formData.itemNumber}
                    onChange={(e) => setFormData({ ...formData, itemNumber: e.target.value })}
                    placeholder="e.g., 1.1"
                    className="border-start-0"
                    style={{ fontSize: '0.813rem' }}
                  />
                </CInputGroup>
              </CCol>
              <CCol md={8}>
                <CFormLabel className="fw-semibold" style={{ fontSize: '0.813rem' }}>
                  Description <span className="text-danger">*</span>
                </CFormLabel>
                <CInputGroup>
                  <CInputGroupText className="bg-light border-end-0">
                    <CIcon icon={cilCalculator} size="sm" />
                  </CInputGroupText>
                  <CFormInput
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Enter item description"
                    className="border-start-0"
                    style={{ fontSize: '0.813rem' }}
                  />
                </CInputGroup>
              </CCol>
              <CCol md={4}>
                <CFormLabel className="fw-semibold" style={{ fontSize: '0.813rem' }}>
                  Unit <span className="text-danger">*</span>
                </CFormLabel>
                <CFormSelect
                  required
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  style={{ fontSize: '0.813rem' }}
                >
                  <option value="">Select unit...</option>
                  <option value="m³">Cubic Meter (m³)</option>
                  <option value="m²">Square Meter (m²)</option>
                  <option value="m">Meter (m)</option>
                  <option value="kg">Kilogram (kg)</option>
                  <option value="tons">Tons</option>
                  <option value="pcs">Pieces (pcs)</option>
                  <option value="lumpsum">Lump Sum</option>
                </CFormSelect>
              </CCol>
              <CCol md={4}>
                <CFormLabel className="fw-semibold" style={{ fontSize: '0.813rem' }}>
                  Quantity <span className="text-danger">*</span>
                </CFormLabel>
                <CFormInput
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  placeholder="0.00"
                  style={{ fontSize: '0.813rem' }}
                />
              </CCol>
              <CCol md={4}>
                <CFormLabel className="fw-semibold" style={{ fontSize: '0.813rem' }}>
                  Rate (KES) <span className="text-danger">*</span>
                </CFormLabel>
                <CInputGroup>
                  <CInputGroupText
                    className="bg-light border-end-0"
                    style={{ fontSize: '0.75rem' }}
                  >
                    KES
                  </CInputGroupText>
                  <CFormInput
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={formData.rate}
                    onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                    placeholder="0.00"
                    className="border-start-0"
                    style={{ fontSize: '0.813rem' }}
                  />
                </CInputGroup>
              </CCol>

              {/* Calculated Total Display */}
              {formData.quantity && formData.rate && (
                <CCol md={12}>
                  <div className="bg-light rounded-3 p-3 d-flex justify-content-between align-items-center">
                    <div>
                      <small className="text-muted d-block" style={{ fontSize: '0.7rem' }}>
                        Calculated Total
                      </small>
                      <strong style={{ fontSize: '1.1rem', color: '#667eea' }}>
                        {formatCurrency(
                          parseFloat(formData.quantity || 0) * parseFloat(formData.rate || 0),
                        )}
                      </strong>
                    </div>
                    <div className="text-end">
                      <small className="text-muted d-block" style={{ fontSize: '0.7rem' }}>
                        Valued Amount
                      </small>
                      <strong className="text-success" style={{ fontSize: '1rem' }}>
                        {formatCurrency(
                          (parseFloat(formData.quantity || 0) *
                            parseFloat(formData.rate || 0) *
                            parseFloat(formData.progressPercentage || 0)) /
                            100,
                        )}
                      </strong>
                    </div>
                  </div>
                </CCol>
              )}

              <CCol md={12}>
                <CFormLabel
                  className="fw-semibold d-flex justify-content-between align-items-center"
                  style={{ fontSize: '0.813rem' }}
                >
                  <span>Progress Percentage</span>
                  <CBadge
                    color={getProgressColor(formData.progressPercentage)}
                    className="px-3 py-1"
                    style={{ fontSize: '0.813rem' }}
                  >
                    <CIcon
                      icon={getStatusIcon(formData.progressPercentage)}
                      size="sm"
                      className="me-1"
                    />
                    {formData.progressPercentage}%
                  </CBadge>
                </CFormLabel>
                <div className="bg-light rounded-3 p-3">
                  <div className="d-flex align-items-center gap-3 mb-2">
                    <CFormInput
                      type="range"
                      min="0"
                      max="100"
                      value={formData.progressPercentage}
                      onChange={(e) =>
                        setFormData({ ...formData, progressPercentage: e.target.value })
                      }
                      className="flex-grow-1"
                      style={{ cursor: 'pointer' }}
                    />
                    <CFormInput
                      type="number"
                      min="0"
                      max="100"
                      value={formData.progressPercentage}
                      onChange={(e) =>
                        setFormData({ ...formData, progressPercentage: e.target.value })
                      }
                      style={{ width: '80px', fontSize: '0.813rem' }}
                    />
                  </div>
                  <CProgress height={8}>
                    <CProgressBar
                      color={getProgressColor(formData.progressPercentage)}
                      value={formData.progressPercentage}
                    />
                  </CProgress>
                  <div
                    className="d-flex justify-content-between mt-2"
                    style={{ fontSize: '0.65rem', color: '#6c757d' }}
                  >
                    <span>Not Started</span>
                    <span>In Progress</span>
                    <span>Completed</span>
                  </div>
                </div>
              </CCol>
            </CRow>
          </CModalBody>
          <CModalFooter className="border-top-0 pt-2">
            <CButton
              color="light"
              onClick={() => {
                setAddModal(false)
                setEditModal(false)
                resetForm()
              }}
              style={{ fontSize: '0.813rem' }}
            >
              Cancel
            </CButton>
            <CButton
              color="primary"
              type="submit"
              className="px-4"
              style={{ fontSize: '0.813rem' }}
            >
              <CIcon icon={addModal ? cilPlus : cilCheckCircle} size="sm" className="me-2" />
              {addModal ? 'Add Item' : 'Update Item'}
            </CButton>
          </CModalFooter>
        </CForm>
      </CModal>

      {/* Delete Confirmation Modal */}
      <CModal visible={deleteModal} onClose={() => setDeleteModal(false)} alignment="center">
        <CModalHeader
          className="border-bottom-0"
          style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}
        >
          <CModalTitle className="text-white fw-bold d-flex align-items-center">
            <div className="bg-white bg-opacity-25 rounded-3 p-2 me-2">
              <CIcon icon={cilTrash} />
            </div>
            Confirm Deletion
          </CModalTitle>
        </CModalHeader>
        <CModalBody className="text-center py-4">
          <div
            className="rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3"
            style={{
              width: '80px',
              height: '80px',
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              opacity: '0.1',
            }}
          >
            <CIcon icon={cilTrash} size="3xl" style={{ color: '#f5576c' }} />
          </div>
          <h6 className="mb-3 fw-bold">Delete BOQ Item?</h6>
          <p className="text-muted mb-3" style={{ fontSize: '0.813rem' }}>
            Are you sure you want to delete this item? This action cannot be undone.
          </p>
          <div className="bg-light rounded-3 p-3 mb-3 text-start">
            <div className="d-flex align-items-start mb-2">
              <CBadge color="primary" className="me-2 mt-1" style={{ fontSize: '0.7rem' }}>
                {selectedItem?.itemNumber}
              </CBadge>
              <div className="flex-grow-1">
                <div className="fw-semibold mb-1" style={{ fontSize: '0.813rem' }}>
                  {selectedItem?.description}
                </div>
                <div className="d-flex gap-3" style={{ fontSize: '0.7rem', color: '#6c757d' }}>
                  <span>
                    <strong>Qty:</strong> {selectedItem?.quantity} {selectedItem?.unit}
                  </span>
                  <span>
                    <strong>Total:</strong> {formatCurrency(selectedItem?.total)}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-danger bg-opacity-10 rounded-3 p-2 d-flex align-items-center justify-content-center">
            <CIcon icon={cilWarning} className="text-danger me-2" size="sm" />
            <small className="text-danger fw-semibold" style={{ fontSize: '0.75rem' }}>
              This will permanently delete this BOQ item
            </small>
          </div>
        </CModalBody>
        <CModalFooter className="border-top-0">
          <CButton
            color="light"
            onClick={() => setDeleteModal(false)}
            style={{ fontSize: '0.813rem' }}
          >
            Cancel
          </CButton>
          <CButton
            color="danger"
            onClick={handleDelete}
            className="px-4"
            style={{ fontSize: '0.813rem' }}
          >
            <CIcon icon={cilTrash} size="sm" className="me-2" />
            Delete Item
          </CButton>
        </CModalFooter>
      </CModal>
    </div>
  )
}

export default BoqView
