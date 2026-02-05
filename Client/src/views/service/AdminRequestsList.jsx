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
} from '@coreui/react';
import api from '../../api/axios'; 

const AdminRequestsList = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [technicians, setTechnicians] = useState([]); 

    useEffect(() => {
        const fetchData = async () => {
            try {
                const reqRes = await api.get('/api/admin/requests');
                setRequests(reqRes.data);

                
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);
    const statusColors = {
        PENDING: 'warning',
        CONFIRMED: 'info',
        IN_PROGRESS: 'primary',
        COMPLETED: 'success',
        CANCELLED: 'danger',
        REJECTED: 'dark',
    };

    const assignTechnician = async (requestId, techId) => {
        if (!techId) return;

        try {
            const res = await api.patch(`/api/admin/requests/${requestId}/assign`, {
                assignedTo: techId,
            });
            // Refresh list
            setRequests(prev =>
                prev.map(r => (r._id === requestId ? res.data.request : r))
            );
            alert('Assigned successfully');
        } catch (err) {
            alert('Assignment failed: ' + (err.response?.data?.message || err.message));
        }
    };

    if (loading) return <CSpinner />;

    return (
        <div>
            <h3>All Service Requests (Admin View)</h3>
            <CTable hover responsive>
                <CTableHead>
                    <CTableRow>
                        <CTableHeaderCell>Type</CTableHeaderCell>
                        <CTableHeaderCell>Client</CTableHeaderCell>
                        <CTableHeaderCell>Location</CTableHeaderCell>
                        <CTableHeaderCell>Status</CTableHeaderCell>
                        <CTableHeaderCell>Assigned To</CTableHeaderCell>
                        <CTableHeaderCell>Actions</CTableHeaderCell>
                    </CTableRow>
                </CTableHead>
                <CTableBody>
                    {requests.map(req => (
                        <CTableRow key={req._id}>
                            <CTableDataCell>{req.serviceType}</CTableDataCell>
                            <CTableDataCell>{req.user?.firstName || req.user?.email}</CTableDataCell>
                            <CTableDataCell>{req.location}</CTableDataCell>
                            <CTableDataCell>
                                <CBadge color={statusColors[req.status]}>{req.status}</CBadge>
                            </CTableDataCell>
                            <CTableDataCell>
                                {req.assignedTo ? (
                                    `${req.assignedTo.firstName} ${req.assignedTo.lastName}`
                                ) : (
                                    <CFormSelect
                                        size="sm"
                                        onChange={e => assignTechnician(req._id, e.target.value)}
                                    >
                                        <option value="">Assign Technician...</option>
                                        {/* Populate with real technicians later */}
                                        <option value="67exampleTechId1">John Doe (Tech)</option>
                                        <option value="67exampleTechId2">Jane Smith</option>
                                    </CFormSelect>
                                )}
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
        </div>
    );
};

export default AdminRequestsList;