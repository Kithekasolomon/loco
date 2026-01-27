// src/views/bills/CreateBill.js
import React, { useState, useEffect } from 'react'
import {
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CForm,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CRow,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
  CSpinner,
  CAlert,
  CFormTextarea,
} from '@coreui/react'
import { useNavigate } from 'react-router-dom'
import api from '../../../api/axios'

const CreateBill = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [vendors, setVendors] = useState([])
  const [accounts, setAccounts] = useState([])

  const [formData, setFormData] = useState({
    vendor: '',
    billDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    notes: '',
    items: [
      {
        description: '',
        quantity: 1,
        rate: 0,
        account: '',
        amount: 0,
      },
    ],
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [vendRes, accRes] = await Promise.all([
          api.get('/api/contacts?type=VENDOR'),
          api.get('/api/accounts'),
        ])
        setVendors(vendRes.data)
        setAccounts(accRes.data.filter(a => a.type === 'EXPENSE'))
      } catch (err) {
        setError('Failed to load vendors or accounts')
      }
    }
    fetchData()
  }, [])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items]
    newItems[index][field] = value
    if (field === 'quantity' || field === 'rate') {
      newItems[index].amount = (newItems[index].quantity || 0) * (newItems[index].rate || 0)
    }
    setFormData(prev => ({ ...prev, items: newItems }))
  }

  const addItemRow = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { description: '', quantity: 1, rate: 0, account: '', amount: 0 }],
    }))
  }

  const removeItemRow = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }))
  }

  const calculateTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => sum + (item.amount || 0), 0)
    const tax = subtotal * 0.16 // 16% VAT Kenya
    const total = subtotal + tax
    return { subtotal, tax, total }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    const { subtotal, tax, total } = calculateTotals()

    const payload = {
      ...formData,
      items: formData.items.map(item => ({
        description: item.description,
        quantity: Number(item.quantity),
        rate: Number(item.rate),
        account: item.account,
      })),
      subtotal,
      tax,
      total,
    }

    try {
      await api.post('/api/bills', payload)
      setSuccess('Bill created successfully!')
      setTimeout(() => navigate('/bills'), 2000)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create bill')
    } finally {
      setLoading(false)
    }
  }

  const { subtotal, tax, total } = calculateTotals()

  return (
    <>
      <CCard className="mb-4">
        <CCardHeader>
          <h4>Create New Bill</h4>
        </CCardHeader>
        <CCardBody>
          {error && <CAlert color="danger">{error}</CAlert>}
          {success && <CAlert color="success">{success}</CAlert>}

          <CForm onSubmit={handleSubmit}>
            <CRow className="mb-3">
              <CCol md={6}>
                <CFormLabel>Vendor</CFormLabel>
                <CFormSelect name="vendor" value={formData.vendor} onChange={handleInputChange} required>
                  <option value="">Select Vendor</option>
                  {vendors.map(v => (
                    <option key={v._id} value={v._id}>
                      {v.displayName} ({v.companyName || 'Supplier'})
                    </option>
                  ))}
                </CFormSelect>
              </CCol>
              <CCol md={3}>
                <CFormLabel>Bill Date</CFormLabel>
                <CFormInput type="date" name="billDate" value={formData.billDate} onChange={handleInputChange} required />
              </CCol>
              <CCol md={3}>
                <CFormLabel>Due Date</CFormLabel>
                <CFormInput type="date" name="dueDate" value={formData.dueDate} onChange={handleInputChange} />
              </CCol>
            </CRow>

            <h5 className="mt-4 mb-3">Bill Items</h5>
            <CTable bordered responsive>
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell>Description</CTableHeaderCell>
                  <CTableHeaderCell>Qty</CTableHeaderCell>
                  <CTableHeaderCell>Rate</CTableHeaderCell>
                  <CTableHeaderCell>Expense Account</CTableHeaderCell>
                  <CTableHeaderCell>Amount</CTableHeaderCell>
                  <CTableHeaderCell></CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {formData.items.map((item, i) => (
                  <CTableRow key={i}>
                    <CTableDataCell><CFormInput value={item.description} onChange={e => handleItemChange(i, 'description', e.target.value)} required /></CTableDataCell>
                    <CTableDataCell><CFormInput type="number" min="1" value={item.quantity} onChange={e => handleItemChange(i, 'quantity', parseFloat(e.target.value) || 0)} required /></CTableDataCell>
                    <CTableDataCell><CFormInput type="number" step="0.01" value={item.rate} onChange={e => handleItemChange(i, 'rate', parseFloat(e.target.value) || 0)} required /></CTableDataCell>
                    <CTableDataCell>
                      <CFormSelect value={item.account} onChange={e => handleItemChange(i, 'account', e.target.value)} required>
                        <option value="">Select Account</option>
                        {accounts.map(acc => <option key={acc._id} value={acc._id}>{acc.name}</option>)}
                      </CFormSelect>
                    </CTableDataCell>
                    <CTableDataCell>KES {(item.amount || 0).toLocaleString()}</CTableDataCell>
                    <CTableDataCell>
                      <CButton
                        color="danger"
                        size="sm"
                        onClick={() => removeItemRow(i)}
                        disabled={formData.items.length === 1}
                      >
                        ×
                      </CButton>

                    </CTableDataCell>
                  </CTableRow>
                ))}
              </CTableBody>
            </CTable>

            <CButton color="primary" size="sm" onClick={addItemRow} className="mb-3">+ Add Item</CButton>

            <CRow className="mt-4">
              <CCol md={6} className="offset-md-6">
                <CTable borderless>
                  <CTableBody>
                    <CTableRow><CTableDataCell className="text-end"><strong>Subtotal:</strong></CTableDataCell><CTableDataCell>KES {subtotal.toFixed(2)}</CTableDataCell></CTableRow>
                    <CTableRow><CTableDataCell className="text-end"><strong>VAT (16%):</strong></CTableDataCell><CTableDataCell>KES {tax.toFixed(2)}</CTableDataCell></CTableRow>
                    <CTableRow><CTableDataCell className="text-end h5"><strong>Total:</strong></CTableDataCell><CTableDataCell className="h5">KES {total.toFixed(2)}</CTableDataCell></CTableRow>
                  </CTableBody>
                </CTable>
              </CCol>
            </CRow>

            <CRow className="mb-3">
              <CCol><CFormLabel>Notes</CFormLabel><CFormTextarea name="notes" value={formData.notes} onChange={handleInputChange} rows={3} /></CCol>
            </CRow>

            <div className="d-flex gap-2">
              <CButton type="submit" color="primary" disabled={loading}>
                {loading ? <CSpinner size="sm" /> : 'Create Bill'}
              </CButton>
              <CButton color="secondary" onClick={() => navigate('/bills')}>Cancel</CButton>
            </div>
          </CForm>
        </CCardBody>
      </CCard>
    </>
  )
}

export default CreateBill