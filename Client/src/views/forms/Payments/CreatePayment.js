// src/views/payments/CreatePayment.js
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
    CAlert,
    CFormTextarea,
    CSpinner,
} from '@coreui/react'
import { useNavigate } from 'react-router-dom'
import api from '../../../api/axios'

const CreatePayment = () => {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const [type, setType] = useState('RECEIVED') 
    const [contacts, setContacts] = useState([])
    const [documents, setDocuments] = useState([]) 
    const [bankAccounts, setBankAccounts] = useState([])

    const [formData, setFormData] = useState({
        contact: '',
        paymentDate: new Date().toISOString().split('T')[0],
        amount: '',
        paymentMethod: 'BANK_TRANSFER',
        reference: '',
        notes: '',
        account: '',
        appliedTo: [], 
    })

    useEffect(() => {
        fetchData()
    }, [type])

    const fetchData = async () => {
        try {
            const contactType = type === 'RECEIVED' ? 'CUSTOMER' : 'VENDOR'
            const docEndpoint = type === 'RECEIVED' ? '/api/invoices?status=!PAID' : '/api/bills?status=!PAID'

            const [contactRes, docRes, accRes] = await Promise.all([
                api.get(`/api/contacts?type=${contactType}`),
                api.get(docEndpoint),
                api.get('/api/accounts?subType=Bank'), 
            ])

            setContacts(contactRes.data)
            setDocuments(docRes.data)
            setBankAccounts(accRes.data)
        } catch (err) {
            setError('Failed to load data')
    }
    }

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleApplyChange = (docId, value) => {
        setFormData(prev => ({
            ...prev,
            appliedTo: prev.appliedTo.map(a => a.id === docId ? { ...a, amountApplied: parseFloat(value) || 0 } : a)
        }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        const payload = {
            ...formData,
            type,
            amount: parseFloat(formData.amount),
            appliedTo: formData.appliedTo.filter(a => a.amountApplied > 0),
        }

        try {
            await api.post('/api/payments', payload)
            navigate('/payments')
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to record payment')
        } finally {
            setLoading(false)
        }
    }

    const outstanding = documents
        .filter(d => formData.contact === d.customer?._id || formData.contact === d.vendor?._id)
        .reduce((sum, d) => sum + (d.total - (d.paid || 0)), 0)

    return (
        <>
            <CCard className="mb-4">
                <CCardHeader>
                    <h4>Record Payment</h4>
                </CCardHeader>
                <CCardBody>
                    {error && <CAlert color="danger">{error}</CAlert>}

                    <CForm onSubmit={handleSubmit}>
                        <CRow className="mb-3">
                            <CCol md={4}>
                                <CFormLabel>Payment Type</CFormLabel>
                                <CFormSelect value={type} onChange={(e) => setType(e.target.value)}>
                                    <option value="RECEIVED">Receive Payment</option>
                                    <option value="MADE">Make Payment</option>
                                </CFormSelect>
                            </CCol>
                            <CCol md={8}>
                                <CFormLabel>
                                    {type === 'RECEIVED' ? 'From Customer' : 'To Vendor'}
                                </CFormLabel>

                            <CFormSelect name="contact" value={formData.contact} onChange={handleChange} required>
                                <option value="">Select {type === 'RECEIVED' ? 'Customer' : 'Vendor'}</option>
                                {contacts.map(c => (
                                    <option key={c._id} value={c._id}>{c.displayName}</option>
                                ))}
                            </CFormSelect>
                        </CCol>
                    </CRow>

                    <CRow className="mb-3">
                        <CCol md={4}>
                            <CFormLabel>Amount</CFormLabel>
                            <CFormInput type="number" step="0.01" name="amount" value={formData.amount} onChange={handleChange} required />
                        </CCol>
                        <CCol md={4}>
                            <CFormLabel>Date</CFormLabel>
                            <CFormInput type="date" name="paymentDate" value={formData.paymentDate} onChange={handleChange} required />
                        </CCol>
                        <CCol md={4}>
                            <CFormLabel>Bank/Cash Account</CFormLabel>
                            <CFormSelect name="account" value={formData.account} onChange={handleChange} required>
                                <option value="">Select Account</option>
                                {bankAccounts.map(acc => (
                                    <option key={acc._id} value={acc._id}>{acc.name}</option>
                                ))}
                            </CFormSelect>
                        </CCol>
                    </CRow>

                    <CRow className="mb-3">
                        <CCol md={6}>
                            <CFormLabel>Payment Method</CFormLabel>
                            <CFormSelect name="paymentMethod" value={formData.paymentMethod} onChange={handleChange}>
                                <option value="BANK_TRANSFER">Bank Transfer</option>
                                <option value="M_PESA">M-Pesa</option>
                                <option value="CASH">Cash</option>
                                <option value="CHEQUE">Cheque</option>
                            </CFormSelect>
                        </CCol>
                        <CCol md={6}>
                            <CFormLabel>Reference (e.g., M-Pesa Code)</CFormLabel>
                            <CFormInput name="reference" value={formData.reference} onChange={handleChange} />
                        </CCol>
                    </CRow>

                    {/* Apply to Invoices/Bills */}
                    {formData.contact && documents.length > 0 && (
                        <>
                            <h5>Apply to Outstanding {type === 'RECEIVED' ? 'Invoices' : 'Bills'}</h5>
                            <CTable bordered>
                                <CTableHead>
                                    <CTableRow>
                                        <CTableHeaderCell>#</CTableHeaderCell>
                                        <CTableHeaderCell>Date</CTableHeaderCell>
                                        <CTableHeaderCell>Total</CTableHeaderCell>
                                        <CTableHeaderCell>Balance</CTableHeaderCell>
                                        <CTableHeaderCell>Amount to Apply</CTableHeaderCell>
                                    </CTableRow>
                                </CTableHead>
                                <CTableBody>
                                    {documents
                                        .filter(d => (type === 'RECEIVED' ? d.customer?._id : d.vendor?._id) === formData.contact)
                                        .map(doc => (
                                            <CTableRow key={doc._id}>
                                                <CTableDataCell>{type === 'RECEIVED' ? doc.invoiceNumber : doc.billNumber}</CTableDataCell>
                                                <CTableDataCell>{new Date(type === 'RECEIVED' ? doc.invoiceDate : doc.billDate).toLocaleDateString()}</CTableDataCell>
                                                <CTableDataCell>KES {doc.total.toLocaleString()}</CTableDataCell>
                                                <CTableDataCell>KES {(doc.total - (doc.paid || 0)).toLocaleString()}</CTableDataCell>
                                                <CTableDataCell>
                                                    <CFormInput
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        max={doc.total - (doc.paid || 0)}
                                                        onChange={(e) => handleApplyChange(doc._id, e.target.value)}
                                                    />
                                                </CTableDataCell>
                                            </CTableRow>
                                        ))}
                                </CTableBody>
                            </CTable>
                        </>
                    )}

                    <CRow className="mb-3">
                        <CCol>
                            <CFormLabel>Notes</CFormLabel>
                            <CFormTextarea name="notes" value={formData.notes} onChange={handleChange} rows={3} />
                        </CCol>
                    </CRow>

                    <div className="d-flex gap-2">
                        <CButton type="submit" color="primary" disabled={loading}>
                            {loading ? <CSpinner size="sm" /> : 'Record Payment'}
                        </CButton>
                        <CButton color="secondary" onClick={() => navigate('/payments')}>Cancel</CButton>
                    </div>
                </CForm>
            </CCardBody>
        </CCard >
    </>
  )
}

export default CreatePayment