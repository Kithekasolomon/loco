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
} from '@coreui/react';
import { useAuth } from '../../context/AuthContext';
import {
    getRequestById,
    cancelRequest,
    completeRequest,
    submitProgressUpdate,
    getRequestUpdates,
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
    const { user } = useAuth(); // current logged-in user

    const [request, setRequest] = useState(null);
    const [updates, setUpdates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Cancel modal
    const [cancelModal, setCancelModal] = useState(false);
    const [cancelReason, setCancelReason] = useState('');

    // Complete + review modal
    const [completeModal, setCompleteModal] = useState(false);
    const [rating, setRating] = useState(5);
    const [reviewComment, setReviewComment] = useState('');

    // Technician progress update modal
    const [progressModal, setProgressModal] = useState(false);
    const [progressMessage, setProgressMessage] = useState('');
    const [progressFiles, setProgressFiles] = useState([]);
    const [markAsReady, setMarkAsReady] = useState(false);
    const [submittingProgress, setSubmittingProgress] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            try {
                const reqData = await getRequestById(id);
                setRequest(reqData);

                const updateData = await getRequestUpdates(id);
                setUpdates(updateData);
            } catch (err) {
                setError(err.message || 'Failed to load request or updates');
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [id]);

    const isClient = request?.user?._id === user?.id;
    const isTechnician = request?.assignedTo?._id === user?.id;

    const canCancel = ['PENDING', 'CONFIRMED'].includes(request?.status);
    const canComplete = request?.status === 'READY_FOR_COMPLETION' && isClient;
    const canUpdateProgress = ['IN_PROGRESS'].includes(request?.status) && isTechnician;

    const handleFileSelect = (e) => {
        if (e.target.files) {
            setProgressFiles(Array.from(e.target.files));
        }
    };

    const handleProgressSubmit = async () => {
        if (!progressMessage.trim()) {
            setError('Please enter a description of the work done');
            return;
        }

        setSubmittingProgress(true);
        setError('');

        try {
            const payload = {
                message: progressMessage.trim(),
                markAsReady,
                files: progressFiles,
            };

            const result = await submitProgressUpdate(id, payload);

            // Refresh updates list
            const freshUpdates = await getRequestUpdates(id);
            setUpdates(freshUpdates);

            // Update request if status changed
            if (result.request) {
                setRequest(result.request);
            }

            // Reset form
            setProgressModal(false);
            setProgressMessage('');
            setProgressFiles([]);
            setMarkAsReady(false);
        } catch (err) {
            setError(err.message || 'Failed to submit progress update');
        } finally {
            setSubmittingProgress(false);
        }
    };

    const handleCancel = async () => {
        try {
            await cancelRequest(id, cancelReason);
            setRequest({ ...request, status: 'CANCELLED' });
            setCancelModal(false);
        } catch (err) {
            setError(err.message);
        }
    };

    const handleComplete = async () => {
        try {
            await completeRequest(id, rating, reviewComment);
            setRequest({
                ...request,
                status: 'COMPLETED',
                rating,
                reviewComment,
            });
            setCompleteModal(false);
        } catch (err) {
            setError(err.message);
        }
    };

    if (loading) return <div className="text-center py-5"><CSpinner color="primary" /></div>;
    if (error) return <CAlert color="danger">{error}</CAlert>;
    if (!request) return <CAlert color="info">Request not found</CAlert>;

    return (
        <>
            <CCardHeader>
                <h4>Service Request #{request._id?.slice(-8) || 'N/A'}</h4>
            </CCardHeader>

            <CCardBody>
                <CRow className="mb-4">
                    <CCol md={8}>
                        <h5 className="mb-3">{request.serviceType}</h5>

                        <div className="mb-2">
                            <strong>Description:</strong> {request.description || '—'}
                        </div>

                        <div className="mb-2">
                            <strong>Location:</strong> {request.location || '—'}
                        </div>

                        <div className="mb-2">
                            <strong>Scheduled:</strong>{' '}
                            {request.date ? new Date(request.date).toLocaleDateString() : '—'}{' '}
                            {request.time || ''}
                        </div>

                        {request.price && (
                            <div className="mb-2">
                                <strong>Estimated Price:</strong> KES {request.price.toLocaleString()}
                            </div>
                        )}

                        <div className="mb-3">
                            <strong>Current Status:</strong>{' '}
                            <CBadge color={statusColors[request.status] || 'secondary'} size="lg">
                                {request.status}
                            </CBadge>
                        </div>

                        <div>
                            <strong>Assigned Technician:</strong>{' '}
                            {request.assignedTo
                                ? `${request.assignedTo.firstName || ''} ${request.assignedTo.lastName || ''}`
                                : 'Not assigned yet'}
                        </div>
                    </CCol>

                    <CCol md={4}>
                        {request.image && (
                            <CImage
                                fluid
                                src={request.image}
                                alt="Request photo"
                                className="rounded shadow-sm"
                            />
                        )}
                    </CCol>
                </CRow>

                {/* Action buttons */}
                <div className="d-flex flex-wrap gap-2 mb-4">
                    {canCancel && (
                        <CButton color="danger" onClick={() => setCancelModal(true)}>
                            Cancel Request
                        </CButton>
                    )}

                    {canComplete && (
                        <CButton color="success" onClick={() => setCompleteModal(true)}>
                            Confirm Job Done + Leave Review
                        </CButton>
                    )}

                    {canUpdateProgress && (
                        <CButton color="primary" onClick={() => setProgressModal(true)}>
                            Add Progress Update
                        </CButton>
                    )}
                </div>

                {/* Progress History */}
                {updates.length > 0 && (
                    <div className="mt-4 mb-5">
                        <h5>Work Progress History</h5>
                        <CListGroup flush className="border rounded">
                            {updates.map((update) => (
                                <CListGroupItem key={update._id} className="p-3">
                                    <div className="d-flex justify-content-between align-items-start mb-2">
                                        <div>
                                            <strong>
                                                {update.user?.firstName} {update.user?.lastName}
                                            </strong>
                                            <small className="text-muted ms-2">
                                                {new Date(update.createdAt).toLocaleString()}
                                            </small>
                                        </div>
                                        {update.statusAtUpdate && (
                                            <CBadge color="info">{update.statusAtUpdate}</CBadge>
                                        )}
                                    </div>

                                    <p className="mb-2">{update.message}</p>

                                    {update.images?.length > 0 && (
                                        <div className="d-flex flex-wrap gap-2 mt-2">
                                            {update.images.map((img, idx) => (
                                                <CImage
                                                    key={idx}
                                                    src={img}
                                                    alt={`Progress photo ${idx + 1}`}
                                                    width={180}
                                                    className="rounded border"
                                                    style={{ objectFit: 'cover' }}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </CListGroupItem>
                            ))}
                        </CListGroup>
                    </div>
                )}

                {/* Client review (visible after completion) */}
                {request.status === 'COMPLETED' && request.rating && (
                    <div className="mt-4 p-3 bg-light rounded border">
                        <h5>Client Review</h5>
                        <div className="mb-2">
                            <strong>Rating:</strong> {request.rating} / 5 ★
                        </div>
                        <div>
                            <strong>Comment:</strong>{' '}
                            {request.reviewComment || <em>No comment provided</em>}
                        </div>
                    </div>
                )}
            </CCardBody>

            {/* Progress Update Modal */}
            <CModal visible={progressModal} onClose={() => setProgressModal(false)} size="lg">
                <CModalHeader closeButton>
                    <CModalTitle>Update Progress</CModalTitle>
                </CModalHeader>
                <CModalBody>
                    {error && <CAlert color="danger" dismissible>{error}</CAlert>}

                    <CForm>
                        <CFormLabel>Work Done / Notes</CFormLabel>
                        <CFormTextarea
                            rows={5}
                            placeholder="Describe what has been completed so far..."
                            value={progressMessage}
                            onChange={(e) => setProgressMessage(e.target.value)}
                            required
                        />

                        <CFormLabel className="mt-4">Photos / Evidence (optional, multiple allowed)</CFormLabel>
                        <CFormInput
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleFileSelect}
                        />
                        {progressFiles.length > 0 && (
                            <small className="text-muted mt-1 d-block">
                                {progressFiles.length} file(s) selected
                            </small>
                        )}

                        <CFormCheck
                            className="mt-4"
                            id="markReadyCheckbox"
                            label="This update completes the job – mark as ready for client review"
                            checked={markAsReady}
                            onChange={(e) => setMarkAsReady(e.target.checked)}
                        />
                    </CForm>
                </CModalBody>
                <CModalFooter>
                    <CButton color="secondary" onClick={() => setProgressModal(false)}>
                        Cancel
                    </CButton>
                    <CButton
                        color="primary"
                        disabled={submittingProgress || !progressMessage.trim()}
                        onClick={handleProgressSubmit}
                    >
                        {submittingProgress ? (
                            <>
                                <CSpinner size="sm" className="me-2" />
                                Submitting...
                            </>
                        ) : (
                            'Submit Update'
                        )}
                    </CButton>
                </CModalFooter>
            </CModal>

            {/* Cancel Modal */}
            <CModal visible={cancelModal} onClose={() => setCancelModal(false)}>
                <CModalHeader closeButton>
                    <CModalTitle>Cancel Service Request</CModalTitle>
                </CModalHeader>
                <CModalBody>
                    <CFormLabel>Reason for cancellation (optional)</CFormLabel>
                    <CFormTextarea
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                    />
                </CModalBody>
                <CModalFooter>
                    <CButton color="secondary" onClick={() => setCancelModal(false)}>
                        Close
                    </CButton>
                    <CButton color="danger" onClick={handleCancel}>
                        Confirm Cancellation
                    </CButton>
                </CModalFooter>
            </CModal>

            {/* Complete + Review Modal */}
            <CModal visible={completeModal} onClose={() => setCompleteModal(false)}>
                <CModalHeader closeButton>
                    <CModalTitle>Confirm Job Completed</CModalTitle>
                </CModalHeader>
                <CModalBody>
                    <CForm>
                        <CFormLabel>Rate the service (1–5)</CFormLabel>
                        <CFormInput
                            type="number"
                            min="1"
                            max="5"
                            value={rating}
                            onChange={(e) => setRating(Number(e.target.value))}
                        />

                        <CFormLabel className="mt-3">Your review / comments</CFormLabel>
                        <CFormTextarea
                            rows={4}
                            value={reviewComment}
                            onChange={(e) => setReviewComment(e.target.value)}
                            placeholder="How was the service? Any feedback?"
                        />
                    </CForm>
                </CModalBody>
                <CModalFooter>
                    <CButton color="secondary" onClick={() => setCompleteModal(false)}>
                        Close
                    </CButton>
                    <CButton color="success" onClick={handleComplete}>
                        Submit Review & Confirm
                    </CButton>
                </CModalFooter>
            </CModal>
        </>
    );
};

export default ServiceRequestDetail;