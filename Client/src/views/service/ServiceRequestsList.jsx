// src/views/service/ServiceRequestsList.jsx
import React, { useState, useEffect } from 'react';
import { CCard, CCardBody, CCardHeader, CTable, CTableHead, CTableRow, CTableHeaderCell, CTableBody, CTableDataCell } from '@coreui/react';
import api from '../../api/axios';
import { Link } from 'react-router-dom';

const ServiceRequestsList = () => {
    const [requests, setRequests] = useState([]);

    useEffect(() => {
        api.get('/api/service-requests/my')
            .then(res => setRequests(res.data))
            .catch(err => console.error(err));
    }, []);

    return (
        <CCard>
            <CCardHeader>My Service Requests</CCardHeader>
            <CCardBody>
                <CTable hover responsive>
                    <CTableHead>
                        <CTableRow>
                            <CTableHeaderCell>ID</CTableHeaderCell>
                            <CTableHeaderCell>Type</CTableHeaderCell>
                            <CTableHeaderCell>Product</CTableHeaderCell>
                            <CTableHeaderCell>Status</CTableHeaderCell>
                            <CTableHeaderCell>Technician</CTableHeaderCell>
                            <CTableHeaderCell>Created</CTableHeaderCell>
                            <CTableHeaderCell>Action</CTableHeaderCell>
                        </CTableRow>
                    </CTableHead>
                    <CTableBody>
                        {requests.map(req => (
                            <CTableRow key={req._id}>
                                <CTableDataCell>{req._id.slice(-6)}</CTableDataCell>
                                <CTableDataCell>{req.serviceType.replace('_', ' ')}</CTableDataCell>
                                <CTableDataCell>{req.productType} - {req.productBrand}</CTableDataCell>
                                <CTableDataCell>{req.status}</CTableDataCell>
                                <CTableDataCell>
                                    {req.assignedTo?.firstName} {req.assignedTo?.lastName}
                                </CTableDataCell>
                                <CTableDataCell>{new Date(req.createdAt).toLocaleDateString()}</CTableDataCell>
                                <CTableDataCell>
                                    <Link to={`/requests/${req._id}`}>View</Link>
                                </CTableDataCell>
                            </CTableRow>
                        ))}
                    </CTableBody>
                </CTable>
            </CCardBody>
        </CCard>
    );
};

export default ServiceRequestsList;