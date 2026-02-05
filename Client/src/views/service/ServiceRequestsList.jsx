import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    CTable,
    CTableHead,
    CTableRow,
    CTableHeaderCell,
    CTableBody,
    CTableDataCell,
    CBadge,
    CButton,
    CSpinner,
} from '@coreui/react';
import { getMyRequests } from '../../services/serviceService';

const statusColors = {
    PENDING: 'warning',
    CONFIRMED: 'info',
    IN_PROGRESS: 'primary',
    COMPLETED: 'success',
    CANCELLED: 'danger',
    REJECTED: 'dark',
};

const ServiceRequestsList = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getMyRequests()
            .then(setRequests)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <CSpinner />;

    return (
        <>
            <div className="d-flex justify-content-between mb-3">
                <h4>My Service Requests</h4>
                <CButton color="primary" as={Link} to="/requests/create">
                    + New Request
                </CButton>
            </div>

            <CTable hover responsive>
                <CTableHead>
                    <CTableRow>
                        <CTableHeaderCell>Type</CTableHeaderCell>
                        <CTableHeaderCell>Location</CTableHeaderCell>
                        <CTableHeaderCell>Date / Time</CTableHeaderCell>
                        <CTableHeaderCell>Status</CTableHeaderCell>
                        <CTableHeaderCell>Actions</CTableHeaderCell>
                    </CTableRow>
                </CTableHead>
                <CTableBody>
                    {requests.map((req) => (
                        <CTableRow key={req._id}>
                            <CTableDataCell>{req.serviceType}</CTableDataCell>
                            <CTableDataCell>{req.location}</CTableDataCell>
                            <CTableDataCell>
                                {new Date(req.date).toLocaleDateString()} {req.time || ''}
                            </CTableDataCell>
                            <CTableDataCell>
                                <CBadge color={statusColors[req.status]}>{req.status}</CBadge>
                            </CTableDataCell>
                            <CTableDataCell>
                                <CButton size="sm" color="info" as={Link} to={`/requests/${req._id}`}>
                                    View
                                </CButton>
                            </CTableDataCell>
                        </CTableRow>
                    ))}
                </CTableBody>
            </CTable>
        </>
    );
};

export default ServiceRequestsList;