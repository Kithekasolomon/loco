// src/views/contacts/Contacts.js
import React, { useEffect, useState } from 'react'
import {
    CButton,
    CCard,
    CCardBody,
    CCardHeader,
    CTable,
    CTableBody,
    CTableDataCell,
    CTableHead,
    CTableHeaderCell,
    CTableRow,
    CBadge,
    CFormSelect,
    CSpinner,
} from '@coreui/react'
import { Link } from 'react-router-dom'
import api from '../../../api/axios'

const Contacts = () => {
    const [contacts, setContacts] = useState([])
    const [filterType, setFilterType] = useState('ALL')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchContacts()
    }, [])

    const fetchContacts = async () => {
        try {
            const res = await api.get('/api/contacts')
            setContacts(res.data)
            setLoading(false)
        } catch (err) {
            console.error(err)
            setLoading(false)
        }
    }

    const filteredContacts = filterType === 'ALL'
        ? contacts
        : contacts.filter(c => c.type === filterType || (c.type === 'BOTH' && filterType !== 'ALL'))

    const getTypeBadge = (type) => {
        switch (type) {
            case 'CUSTOMER': return <CBadge color="success">Customer</CBadge>
            case 'VENDOR': return <CBadge color="warning">Vendor</CBadge>
            case 'BOTH': return <CBadge color="info">Both</CBadge>
            default: return <CBadge color="secondary">Unknown</CBadge>
        }
    }

    return (
        <>
            <CCard className="mb-4">
                <CCardHeader>
                    <div className="d-flex justify-content-between align-items-center">
                        <h5>Contacts</h5>
                        <div className="d-flex gap-3 align-items-center">
                            <CFormSelect
                                size="sm"
                                style={{ width: 'auto' }}
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                            >
                                <option value="ALL">All Contacts</option>
                                <option value="CUSTOMER">Customers Only</option>
                                <option value="VENDOR">Vendors Only</option>
                            </CFormSelect>
                            <Link to="/contacts/create">
                                <CButton color="primary">New Contact</CButton>
                            </Link>
                        </div>
                    </div>
                </CCardHeader>
                <CCardBody>
                    {loading ? (
                        <div className="text-center py-5"><CSpinner /></div>
                    ) : (
                        <CTable hover responsive>
                            <CTableHead>
                                <CTableRow>
                                    <CTableHeaderCell>Name</CTableHeaderCell>
                                    <CTableHeaderCell>Company</CTableHeaderCell>
                                    <CTableHeaderCell>Email</CTableHeaderCell>
                                    <CTableHeaderCell>Phone</CTableHeaderCell>
                                    <CTableHeaderCell>Type</CTableHeaderCell>
                                    <CTableHeaderCell>KRA PIN</CTableHeaderCell>
                                    <CTableHeaderCell>Actions</CTableHeaderCell>
                                </CTableRow>
                            </CTableHead>
                            <CTableBody>
                                {filteredContacts.length === 0 ? (
                                    <CTableRow>
                                        <CTableDataCell colSpan="7" className="text-center text-muted">
                                            No contacts found
                                        </CTableDataCell>
                                    </CTableRow>
                                ) : (
                                    filteredContacts.map((contact) => (
                                        <CTableRow key={contact._id}>
                                            <CTableDataCell>
                                                <Link to={`/contacts/${contact._id}`}>
                                                    <strong>{contact.displayName}</strong>
                                                </Link>
                                            </CTableDataCell>
                                            <CTableDataCell>{contact.companyName || '-'}</CTableDataCell>
                                            <CTableDataCell>{contact.email || '-'}</CTableDataCell>
                                            <CTableDataCell>{contact.phone || contact.mobile || '-'}</CTableDataCell>
                                            <CTableDataCell>{getTypeBadge(contact.type)}</CTableDataCell>
                                            <CTableDataCell>{contact.kraPin || '-'}</CTableDataCell>
                                            <CTableDataCell>
                                                <Link to={`/contacts/${contact._id}`}>
                                                    <CButton size="sm" color="info">View</CButton>
                                                </Link>
                                            </CTableDataCell>
                                        </CTableRow>
                                    ))
                                )}
                            </CTableBody>
                        </CTable>
                    )}
                </CCardBody>
            </CCard>
        </>
    )
}

export default Contacts