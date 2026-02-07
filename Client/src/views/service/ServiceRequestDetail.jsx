// src/views/service/ServiceRequestDetail.jsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
    CCard,
    CCardBody,
    CCardHeader,
    CRow,
    CCol,
    CImage,
    CBadge,
    CButton,
    CModal,
    CModalHeader,
    CModalTitle,
    CModalBody,
    CModalFooter,
    CForm,
    CFormLabel,
    CFormInput,
    CFormTextarea,
    CFormCheck,
    CAlert,
    CSpinner,
    CListGroup,
    CListGroupItem,
    CFormSelect,
} from '@coreui/react';
import { useAuth } from '../../context/AuthContext';
import {
    getRequestById,
    cancelRequest,
    requestAssignTechnician,
    requestConfirmCompletion,
    submitProgressUpdate,
    getRequestUpdates,
    getOrganizationUsers,  
} from '../../services/serviceService';

const statusColors = {
    PENDING: 'warning',
    CONFIRMED: 'info',
    IN_PROGRESS: 'primary',
    READY_FOR_COMPLETION: 'info',
    COMPLETED: 'success',
    CANCELLED: 'danger',
    REJECTED: 'dark',
};

const ServiceRequestDetail = () => {
    const { id } = useParams();
    const { user } = useAuth(); 

    const [request, setRequest] = useState(null);
    const [updates, setUpdates] = useState([]);
    const [technicians, setTechnicians] = useState([]); 

    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const [cancelModal, setCancelModal] = useState(false);
    const [cancelReason, setCancelReason] = useState('');

    const [assignModal, setAssignModal] = useState(false);
    const [selectedTech, setSelectedTech] = useState('');

    const [completeModal, setCompleteModal] = useState(false);
    const [completionNote, setCompletionNote] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('');
    const [transactionRef, setTransactionRef] = useState('');
    const [proofFile, setProofFile] = useState(null);

    const [progressModal, setProgressModal] = useState(false);
    const [progressMessage, setProgressMessage] = useState('');
    const [progressFiles, setProgressFiles] = useState([]);
    const [markAsReady, setMarkAsReady] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setErrorMsg('');

                const reqData = await getRequestById(id);
                setRequest(reqData);

                const updateData = await getRequestUpdates(id);
                setUpdates(updateData || []);

                if (reqData?.user?._id === user?.id && !reqData?.assignedTo) {
                    const techList = await getOrganizationUsers();
                    setTechnicians(techList);
                }
            } catch (err) {
                setErrorMsg(err.message || 'Could not load request details');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id, user?.id]);

    const isClient = request?.user?._id === user?.id;
    const isTechnician = request?.assignedTo?._id === user?.id;
    const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(user?.roleName);

    const canCancel = isClient && ['PENDING', 'CONFIRMED'].includes(request?.status);
    const canRequestAssign = isClient && !request?.assignedTo;
    const canRequestComplete = isClient && request?.status === 'READY_FOR_COMPLETION';
    const canAddProgress = isTechnician && request?.status === 'IN_PROGRESS';

    // ─── Handlers ─────────────────────────────────────────────────────────────

    const handleCancel = async () => {
        try {
            await cancelRequest(id, cancelReason.trim());
            setRequest(prev => ({ ...prev, status: 'CANCELLED' }));
            setSuccessMsg('Request cancelled successfully');
            setCancelModal(false);
        } catch (err) {
            setErrorMsg(err.message || 'Failed to cancel request');
        }
    };

    const handleRequestAssign = async () => {
        if (!selectedTech) {
            setErrorMsg('Please select a technician');
            return;
        }
        try {
            await requestAssignTechnician(id, selectedTech);
            setSuccessMsg('Technician assignment request sent. Waiting for approval.');
            setAssignModal(false);
            setSelectedTech('');
            // Optional: refresh request data
            const fresh = await getRequestById(id);
            setRequest(fresh);
        } catch (err) {
            setErrorMsg(err.message || 'Failed to request assignment');
        }
    };

    const handleConfirmCompletion = async () => {
        try {
            const payload = {
                note: completionNote.trim(),
                paymentMethod: paymentMethod.trim(),
                transactionRef: transactionRef.trim(),
                proofFile,
            };
            await requestConfirmCompletion(id, payload);
            setSuccessMsg('Completion & payment confirmation sent for admin review.');
            setCompleteModal(false);
            // Reset fields
            setCompletionNote('');
            setPaymentMethod('');
            setTransactionRef('');
            setProofFile(null);
        } catch (err) {
            setErrorMsg(err.message || 'Failed to submit confirmation');
        }
    };

    const handleProgressSubmit = async () => {
        if (!progressMessage.trim()) {
            setErrorMsg('Please describe the progress');
            return;
        }

        try {
            const payload = {
                message: progressMessage.trim(),
                markAsReady,
                files: progressFiles,
            };

            const result = await submitProgressUpdate(id, payload);

            // Refresh updates & request
            const freshUpdates = await getRequestUpdates(id);
            setUpdates(freshUpdates);

            if (result.request) {
                setRequest(result.request);
            }

            setSuccessMsg('Progress update submitted successfully');
            setProgressModal(false);
            setProgressMessage('');
            setProgressFiles([]);
            setMarkAsReady(false);
        } catch (err) {
            setErrorMsg(err.message || 'Failed to submit update');
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files) {
            setProgressFiles(Array.from(e.target.files));
        }
    };

    if (loading) return <div className="text-center py-5"><CSpinner color="primary" /></div>;
    if (errorMsg) return <CAlert color="danger" dismissible>{errorMsg}</CAlert>;
    if (!request) return <CAlert color="info">Request not found</CAlert>;

    return (
        <>
            <CCard>
                <CCardHeader>
                    <h4>Service Request #{id.slice(-8)}</h4>
                </CCardHeader>

                <CCardBody>
                    {successMsg && <CAlert color="success" dismissible onClose={() => setSuccessMsg('')}>{successMsg}</CAlert>}

                    <CRow className="mb-4">
                        <CCol md={8}>
                            <h5 className="mb-3">{request.serviceType}</h5>

                            <div className="mb-2"><strong>Description:</strong> {request.description || '—'}</div>
                            <div className="mb-2"><strong>Location:</strong> {request.location || '—'}</div>
                            <div className="mb-2">
                                <strong>Scheduled:</strong>{' '}
                                {request.date ? new Date(request.date).toLocaleDateString() : '—'} {request.time || ''}
                            </div>
                            {request.price && (
                                <div className="mb-2"><strong>Price:</strong> KES {request.price.toLocaleString()}</div>
                            )}
                            <div className="mb-3">
                                <strong>Status:</strong>{' '}
                                <CBadge color={statusColors[request.status] || 'secondary'} size="lg">
                                    {request.status}
                                </CBadge>
                            </div>
                            <div>
                                <strong>Technician:</strong>{' '}
                                {request.assignedTo
                                    ? `${request.assignedTo.firstName || ''} ${request.assignedTo.lastName || ''}`
                                    : 'Not assigned yet'}
                            </div>
                        </CCol>

                        <CCol md={4}>
                            {request.image && (
                                <CImage fluid src={request.image} alt="Request photo" className="rounded shadow" />
                            )}
                        </CCol>
                    </CRow>

                    {/* Action Buttons */}
                    <div className="d-flex flex-wrap gap-3 mb-5">
                        {canCancel && (
                            <CButton color="danger" onClick={() => setCancelModal(true)}>
                                Cancel Request
                            </CButton>
                        )}

                        {canRequestAssign && (
                            <CButton color="primary" onClick={() => setAssignModal(true)}>
                                Request Technician
                            </CButton>
                        )}

                        {canRequestComplete && (
                            <CButton color="success" onClick={() => setCompleteModal(true)}>
                                Confirm Job Done & Payment
                            </CButton>
                        )}

                        {canAddProgress && (
                            <CButton color="primary" onClick={() => setProgressModal(true)}>
                                Add Progress Update
                            </CButton>
                        )}

                        {isAdmin && request.status === 'READY_FOR_COMPLETION' && (
                            <CButton color="dark" as="a" href={`/admin/requests/${id}`}>
                                Review as Admin
                            </CButton>
                        )}
                    </div>

                    {/* Progress Updates */}
                    {updates.length > 0 && (
                        <div className="mt-4">
                            <h5>Progress & Updates</h5>
                            {updates.map((upd) => (
                                <div key={upd._id} className="border rounded p-3 mb-3 bg-light">
                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                        <strong>
                                            {upd.user?.firstName} {upd.user?.lastName}
                                        </strong>
                                        <small className="text-muted">
                                            {new Date(upd.createdAt).toLocaleString()}
                                        </small>
                                    </div>
                                    <p className="mb-3">{upd.message}</p>

                                    {upd.images?.length > 0 && (
                                        <CRow className="g-2">
                                            {upd.images.map((imgUrl, idx) => (
                                                <CCol xs={6} sm={4} md={3} key={idx}>
                                                    <CImage
                                                        fluid
                                                        src={imgUrl}
                                                        alt={`Progress ${idx + 1}`}
                                                        className="rounded border shadow-sm"
                                                    />
                                                </CCol>
                                            ))}
                                        </CRow>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </CCardBody>
            </CCard>

            {/* ─── Modals ─────────────────────────────────────────────────────────────── */}

            {/* Assign Technician Modal */}
            <CModal visible={assignModal} onClose={() => setAssignModal(false)}>
                <CModalHeader closeButton>
                    <CModalTitle>Request a Technician</CModalTitle>
                </CModalHeader>
                <CModalBody>
                    <CFormSelect
                        value={selectedTech}
                        onChange={(e) => setSelectedTech(e.target.value)}
                    >
                        <option value="">Select technician...</option>
                        {technicians.length === 0 ? (
                            <option disabled>No technicians available</option>
                        ) : (
                            technicians.map(t => (
                                <option key={t.value} value={t.value}>
                                    {t.label}
                                </option>
                            ))
                        )}
                    </CFormSelect>
                </CModalBody>
                <CModalFooter>
                    <CButton color="secondary" onClick={() => setAssignModal(false)}>
                        Close
                    </CButton>
                    <CButton
                        color="primary"
                        disabled={!selectedTech}
                        onClick={handleRequestAssign}
                    >
                        Send Request
                    </CButton>
                </CModalFooter>
            </CModal>

            {/* Completion Confirmation Modal */}
            <CModal visible={completeModal} onClose={() => setCompleteModal(false)} size="lg">
                <CModalHeader closeButton>
                    <CModalTitle>Confirm Job Completed & Payment</CModalTitle>
                </CModalHeader>
                <CModalBody>
                    <CForm>
                        <CFormLabel>Final Notes (optional)</CFormLabel>
                        <CFormTextarea
                            rows={3}
                            value={completionNote}
                            onChange={e => setCompletionNote(e.target.value)}
                            placeholder="Any last comments..."
                        />

                        <CFormLabel className="mt-3">Payment Method</CFormLabel>
                        <CFormInput
                            placeholder="M-Pesa / Cash / Card / Bank..."
                            value={paymentMethod}
                            onChange={e => setPaymentMethod(e.target.value)}
                        />

                        <CFormLabel className="mt-3">Transaction Ref / Code (if any)</CFormLabel>
                        <CFormInput
                            value={transactionRef}
                            onChange={e => setTransactionRef(e.target.value)}
                        />

                        <CFormLabel className="mt-3">Payment Proof (screenshot / receipt)</CFormLabel>
                        <CFormInput
                            type="file"
                            accept="image/*"
                            onChange={e => setProofFile(e.target.files?.[0] || null)}
                        />
                    </CForm>
                </CModalBody>
                <CModalFooter>
                    <CButton color="secondary" onClick={() => setCompleteModal(false)}>
                        Cancel
                    </CButton>
                    <CButton color="success" onClick={handleConfirmCompletion}>
                        Submit for Review
                    </CButton>
                </CModalFooter>
            </CModal>

            {/* Progress Update Modal */}
            <CModal visible={progressModal} onClose={() => setProgressModal(false)} size="lg">
                <CModalHeader closeButton>
                    <CModalTitle>Add Progress Update</CModalTitle>
                </CModalHeader>
                <CModalBody>
                    <CForm>
                        <CFormLabel>Work Done / Notes *</CFormLabel>
                        <CFormTextarea
                            rows={5}
                            value={progressMessage}
                            onChange={e => setProgressMessage(e.target.value)}
                            placeholder="Describe what has been completed..."
                            required
                        />

                        <CFormLabel className="mt-4">Photos (optional – multiple allowed)</CFormLabel>
                        <CFormInput
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleFileChange}
                        />
                        {progressFiles.length > 0 && (
                            <small className="text-muted d-block mt-1">
                                {progressFiles.length} file(s) selected
                            </small>
                        )}

                        <CFormCheck
                            className="mt-4"
                            id="markReady"
                            label="This is the final update – mark job as ready for client review"
                            checked={markAsReady}
                            onChange={e => setMarkAsReady(e.target.checked)}
                        />
                    </CForm>
                </CModalBody>
                <CModalFooter>
                    <CButton color="secondary" onClick={() => setProgressModal(false)}>
                        Close
                    </CButton>
                    <CButton
                        color="primary"
                        disabled={!progressMessage.trim()}
                        onClick={handleProgressSubmit}
                    >
                        Submit Update
                    </CButton>
                </CModalFooter>
            </CModal>

            {/* Cancel Modal */}
            <CModal visible={cancelModal} onClose={() => setCancelModal(false)}>
                <CModalHeader closeButton>
                    <CModalTitle>Cancel Request</CModalTitle>
                </CModalHeader>
                <CModalBody>
                    <CFormLabel>Reason (optional)</CFormLabel>
                    <CFormTextarea
                        value={cancelReason}
                        onChange={e => setCancelReason(e.target.value)}
                        placeholder="Why are you cancelling?"
                    />
                </CModalBody>
                <CModalFooter>
                    <CButton color="secondary" onClick={() => setCancelModal(false)}>
                        Close
                    </CButton>
                    <CButton color="danger" onClick={handleCancel}>
                        Confirm Cancel
                    </CButton>
                </CModalFooter>
            </CModal>
        </>
    );
};

export default ServiceRequestDetail;