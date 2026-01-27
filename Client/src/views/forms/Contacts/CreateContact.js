// src/views/contacts/CreateContact.js
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
    CFormTextarea,
    CRow,
    CAlert,
    CSpinner,
} from '@coreui/react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../../../api/axios'

const CreateContact = () => {
    const { id } = useParams() // for edit mode
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [isEdit, setIsEdit] = useState(false)

    const [formData, setFormData] = useState({
        type: 'CUSTOMER',
        displayName: '',
        companyName: '',
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        mobile: '',
        kraPin: '',
        vatNumber: '',
        billingAddress: { street: '', city: '', state: '', zipCode: '', country: 'Kenya' },
        notes: '',
    })

    useEffect(() => {
        if (id) {
            setIsEdit(true)
            fetchContact()
        }
    }, [id])

    const fetchContact = async () => {
        try {
            const res = await api.get(`/api/contacts/${id}`)
            setFormData(res.data)
        } catch (err) {
            setError('Failed to load contact')
        }
    }

    const handleChange = (e) => {
        const { name, value } = e.target
        if (name.includes('billingAddress.')) {
            const field = name.split('.')[1]
            setFormData(prev => ({
                ...prev,
                billingAddress: { ...prev.billingAddress, [field]: value }
            }))
        } else {
            setFormData(prev => ({ ...prev, [name]: value }))
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            if (isEdit) {
                await api.put(`/api/contacts/${id}`, formData)
            } else {
                await api.post('/api/contacts', formData)
            }
            navigate('/contacts')
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save contact')
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <CCard className="mb-4">
                <CCardHeader>
                    <h4>{isEdit ? 'Edit Contact' : 'Create New Contact'}</h4>
                </CCardHeader>
                <CCardBody>
                    {error && <CAlert color="danger">{error}</CAlert>}

                    <CForm onSubmit={handleSubmit}>
                        <CRow className="mb-3">
                            <CCol md={4}>
                                <CFormLabel>Contact Type</CFormLabel>
                                <CFormSelect name="type" value={formData.type} onChange={handleChange} required>
                                    <option value="CUSTOMER">Customer</option>
                                    <option value="VENDOR">Vendor</option>
                                    <option value="BOTH">Both</option>
                                </CFormSelect>
                            </CCol>
                            <CCol md={8}>
                                <CFormLabel>Display Name (As shown in lists)</CFormLabel>
                                <CFormInput name="displayName" value={formData.displayName} onChange={handleChange} required />
                            </CCol>
                        </CRow>

                        <CRow className="mb-3">
                            <CCol md={6}>
                                <CFormLabel>Company Name</CFormLabel>
                                <CFormInput name="companyName" value={formData.companyName || ''} onChange={handleChange} />
                            </CCol>
                            <CCol md={3}>
                                <CFormLabel>First Name</CFormLabel>
                                <CFormInput name="firstName" value={formData.firstName || ''} onChange={handleChange} />
                            </CCol>
                            <CCol md={3}>
                                <CFormLabel>Last Name</CFormLabel>
                                <CFormInput name="lastName" value={formData.lastName || ''} onChange={handleChange} />
                            </CCol>
                        </CRow>

                        <CRow className="mb-3">
                            <CCol md={6}>
                                <CFormLabel>Email</CFormLabel>
                                <CFormInput type="email" name="email" value={formData.email || ''} onChange={handleChange} />
                            </CCol>
                            <CCol md={3}>
                                <CFormLabel>Phone</CFormLabel>
                                <CFormInput name="phone" value={formData.phone || ''} onChange={handleChange} />
                            </CCol>
                            <CCol md={3}>
                                <CFormLabel>Mobile</CFormLabel>
                                <CFormInput name="mobile" value={formData.mobile || ''} onChange={handleChange} />
                            </CCol>
                        </CRow>

                        <CRow className="mb-3">
                            <CCol md={6}>
                                <CFormLabel>KRA PIN</CFormLabel>
                                <CFormInput name="kraPin" value={formData.kraPin || ''} onChange={handleChange} />
                            </CCol>
                            <CCol md={6}>
                                <CFormLabel>VAT Number</CFormLabel>
                                <CFormInput name="vatNumber" value={formData.vatNumber || ''} onChange={handleChange} />
                            </CCol>
                        </CRow>

                        <h5 className="mt-4">Billing Address</h5>
                        <CRow className="mb-3">
                            <CCol md={12}>
                                <CFormLabel>Street</CFormLabel>
                                <CFormInput name="billingAddress.street" value={formData.billingAddress?.street || ''} onChange={handleChange} />
                            </CCol>
                        </CRow>
                        <CRow className="mb-3">
                            <CCol md={4}>
                                <CFormLabel>City</CFormLabel>
                                <CFormInput name="billingAddress.city" value={formData.billingAddress?.city || ''} onChange={handleChange} />
                            </CCol>
                            <CCol md={4}>
                                <CFormLabel>County/State</CFormLabel>
                                <CFormInput name="billingAddress.state" value={formData.billingAddress?.state || ''} onChange={handleChange} />
                            </CCol>
                            <CCol md={4}>
                                <CFormLabel>ZIP Code</CFormLabel>
                                <CFormInput name="billingAddress.zipCode" value={formData.billingAddress?.zipCode || ''} onChange={handleChange} />
                            </CCol>
                        </CRow>

                        <CRow className="mb-3">
                            <CCol>
                                <CFormLabel>Notes</CFormLabel>
                                <CFormTextarea name="notes" value={formData.notes || ''} onChange={handleChange} rows={3} />
                            </CCol>
                        </CRow>

                        <div className="d-flex gap-2">
                            <CButton type="submit" color="primary" disabled={loading}>
                                {loading ? <CSpinner size="sm" /> : (isEdit ? 'Update Contact' : 'Create Contact')}
                            </CButton>
                            <CButton color="secondary" onClick={() => navigate('/contacts')}>
                                Cancel
                            </CButton>
                        </div>
                    </CForm>
                </CCardBody>
            </CCard>
        </>
    )
}

export default CreateContact