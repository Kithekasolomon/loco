// src/views/admin/AdminRequestsList.jsx
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
    CFormSelect,
    CAlert,
} from '@coreui/react';
import api from '../../api/axios';
import { getOrganizationUsers } from '../../services/serviceService';

const statusColors = {
    PENDING: 'warning',
    CONFIRMED: 'info',
    IN_PROGRESS: 'primary',
    COMPLETED: 'success',
    CANCELLED: 'danger',
    REJECTED: 'dark',
};

const AdminRequestsList = () => {
    const [requests, setRequests] = useState([]);
    const [technicians, setTechnicians] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Load all service requests (admin view)
                const reqRes = await api.get('/api/admin/requests');
                setRequests(reqRes.data || []);

                // Load all organization users
                const allUsers = await getOrganizationUsers();
                console.log('All organization users:', allUsers);
                console.log('All roles found:', allUsers.map(u => u.role?.name || 'NO_ROLE'));

                // Filter technicians - case insensitive and tolerant matching
                const techOnly = allUsers.filter(user => {
                    const roleName = user.role?.name?.trim();
                    if (!roleName) return false;
                    const upper = roleName.toUpperCase();
                    return (
                        upper === 'TECHNICIAN' ||
                        upper === 'TECH' ||
                        upper.includes('TECHNICIAN') ||
                        upper === 'FIELD TECHNICIAN' ||
                        upper === 'SERVICE TECHNICIAN'
                    );
                });

                console.log('Filtered technicians (raw):', techOnly);

                // Map to dropdown-friendly format
                const techOptions = techOnly.map(user => ({
                    value: user._id,
                    label:
                        [user.firstName, user.lastName]
                            .filter(Boolean)
                            .join(' ') ||
                        user.username ||
                        user.email ||
                        'Unnamed Technician',
                }));

                console.log('Technicians ready for dropdown:', techOptions);

                setTechnicians(techOptions);
            } catch (err) {
                console.error('Failed to load data:', err);
                setError(
                    'Failed to load requests or technicians. Check console for details.'
                );
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const assignTechnician = async (requestId, techId) => {
        if (!techId) return;

        try {
            const res = await api.patch(`/api/admin/requests/${requestId}/assign`, {
                assignedTo: techId,
            });

            // Optimistic UI update
            setRequests(prev =>
                prev.map(r =>
                    r._id === requestId ? { ...r, assignedTo: res.data.request.assignedTo } : r
                )
            );

            alert('Technician assigned successfully');
        } catch (err) {
            alert('Assignment failed: ' + (err.response?.data?.message || err.message));
        }
    };

    if (loading) {
        return (
            <div className="text-center py-5">
                <CSpinner color="primary" />
                <p className="mt-2">Loading service requests...</p>
            </div>
        );
    }

    if (error) {
        return <CAlert color="danger" dismissible>{error}</CAlert>;
    }

    return (
        <div>
            <h3 className="mb-4">All Service Requests (Admin View)</h3>

            <CTable hover responsive bordered className="shadow-sm">
                <CTableHead color="dark">
                    <CTableRow>
                        <CTableHeaderCell>Type</CTableHeaderCell>
                        <CTableHeaderCell>Client</CTableHeaderCell>
                        <CTableHeaderCell>Location</CTableHeaderCell>
                        <CTableHeaderCell>Status</CTableHeaderCell>
                        <CTableHeaderCell>Assigned Technician</CTableHeaderCell>
                        <CTableHeaderCell>Actions</CTableHeaderCell>
                    </CTableRow>
                </CTableHead>
                <CTableBody>
                    
                    {requests.map(req => (
                        <CTableRow key={req._id}>
                            <CTableDataCell>{req.serviceType || '—'}</CTableDataCell>
                            <CTableDataCell>
                                {req.user?.firstName || req.user?.email || '—'}
                            </CTableDataCell>
                            <CTableDataCell>{req.location || '—'}</CTableDataCell>
                            <CTableDataCell>
                                <CBadge color={statusColors[req.status] || 'secondary'}>
                                    {req.status || 'Unknown'}
                                </CBadge>
                            </CTableDataCell>
                            <CTableDataCell>
                                {req.assignedTo ? (
                                    `${req.assignedTo.firstName || ''} ${req.assignedTo.lastName || ''}`.trim() ||
                                    req.assignedTo.username ||
                                    'Assigned'
                                ) : (
                                    <CFormSelect
                                        size="sm"
                                        onChange={e => assignTechnician(req._id, e.target.value)}
                                        defaultValue=""
                                    >
                                        <option value="" disabled>
                                            Assign Technician...
                                        </option>
                                        {technicians.length === 0 ? (
                                            <option disabled>No technicians available</option>
                                        ) : (
                                            technicians.map(tech => (
                                                <option key={tech.value} value={tech.value}>
                                                    {tech.label}
                                                </option>
                                            ))
                                        )}
                                    </CFormSelect>
                                )}
                            </CTableDataCell>
                            <CTableDataCell>
                                <CButton
                                    size="sm"
                                    color="info"
                                    as={Link}
                                    to={`/requests/${req._id}`}
                                >
                                    View Details
                                </CButton>
                            </CTableDataCell>
                        </CTableRow>
                    ))}
                </CTableBody>
            </CTable>

            {requests.length === 0 && (
                <div className="text-center py-5 text-muted">
                    No service requests found in the system.
                </div>
            )}
        </div>
    );
};

export default AdminRequestsList;