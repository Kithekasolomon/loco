// src/views/contacts/ContactView.js
import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
    CCard,
    CCardBody,
    CCardHeader,
    CButton,
    CRow,
    CCol,
    CBadge,
    CSpinner,
    CAlert,
} from '@coreui/react'
import api from '../../../api/axios'

const ContactView = () => {
    const { id } = useParams()
    const [contact, setContact] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        const fetchContact = async () => {
            try {
                const res = await api.get(`/api/contacts/${id}`)
                setContact(res.data)
            } catch (err) {
                setError('Failed to load contact')
            } finally {
                setLoading(false)
            }
        }
        fetchContact()
    }, [id])

    if (loading) return <div className="text-center py-5"><CSpinner /></div>
    if (error) return <CAlert color="danger">{error}</CAlert>
    if (!contact) return <CAlert color="info">Contact not found</CAlert>

    const getTypeBadge = (type) => {
        switch (type) {
            case 'CUSTOMER': return <CBadge color="success">Customer</CBadge>
            case 'VENDOR': return <CBadge color="warning">Vendor</CBadge>
            case 'BOTH': return <CBadge color="info">Customer & Vendor</CBadge>
            default: return <CBadge color="secondary">Unknown</CBadge>
        }
    }

    return (
        <>
            <CCard className="mb-4">
                <CCardHeader className="d-flex justify-content-between align-items-center">
                    <h4>{contact.displayName}</h4>
                    <div>
                        {getTypeBadge(contact.type)}
                        <Link to={`/contacts/${id}/edit`} className="ms-3">
                            <CButton color="primary" size="sm">Edit</CButton>
                        </Link>
                    </div>
                </CCardHeader>
                <CCardBody>
                    <CRow>
                        <CCol md={6}>
                            <strong>Company:</strong> {contact.companyName || 'N/A'}<br />
                            <strong>Name:</strong> {contact.firstName} {contact.lastName}<br />
                            <strong>Email:</strong> {contact.email || 'N/A'}<br />
                            <strong>Phone:</strong> {contact.phone || contact.mobile || 'N/A'}<br />
                            <strong>KRA PIN:</strong> {contact.kraPin || 'N/A'}<br />
                            <strong>VAT Number:</strong> {contact.vatNumber || 'N/A'}
                        </CCol>
                        <CCol md={6}>
                            <strong>Billing Address:</strong><br />
                            {contact.billingAddress?.street && <>{contact.billingAddress.street}<br /></>}
                            {contact.billingAddress?.city && <>{contact.billingAddress.city}, </>}
                            {contact.billingAddress?.state}<br />
                            {contact.billingAddress?.zipCode} {contact.billingAddress?.country || 'Kenya'}
                        </CCol>
                    </CRow>

                    {contact.notes && (
                        <CRow className="mt-4">
                            <CCol>
                                <strong>Notes:</strong><br />
                                <p>{contact.notes}</p>
                            </CCol>
                        </CRow>
                    )}
                </CCardBody>
            </CCard>
        </>
    )
}

export default ContactView