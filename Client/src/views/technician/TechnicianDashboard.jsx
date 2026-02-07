// src/views/technician/TechnicianDashboard.jsx
import React, { useState, useEffect } from 'react';
import {
  CCard,
  CCardBody,
  CCardHeader,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CBadge,
  CButton,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CForm,
  CFormLabel,
  CFormSelect,
  CFormTextarea,
  CFormInput,
  CAlert,
  CSpinner,
  CCollapse,
  CInputGroup,
  CInputGroupText,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilCloudUpload, cilCalendar, cilFilter } from '@coreui/icons';
import api from '../../api/axios';
import { format } from 'date-fns';

const statusColors = {
  PENDING: 'warning',
  IN_PROGRESS: 'info',
  COMPLETED: 'success',
  CANCELLED: 'danger',
};

const TechnicianDashboard = () => {
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Modal & update
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [updateForm, setUpdateForm] = useState({ status: '', comment: '' });
  const [updateError, setUpdateError] = useState('');
  const [updateSuccess, setUpdateSuccess] = useState('');
  const [modalLoading, setModalLoading] = useState(false);

  // File upload
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState([]); // { url, name, type: 'before'|'after' }

  // Collapsible rows
  const [openRows, setOpenRows] = useState({});

  useEffect(() => {
    fetchRequests();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [requests, statusFilter, dateFrom, dateTo]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/service-requests/technician');
      setRequests(res.data);
      setFilteredRequests(res.data);
    } catch (err) {
      console.error('Failed to load technician requests', err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...requests];

    // Status filter
    if (statusFilter) {
      filtered = filtered.filter(r => r.status === statusFilter);
    }

    // Date range filter
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      filtered = filtered.filter(r => new Date(r.createdAt) >= fromDate);
    }
    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999); // end of day
      filtered = filtered.filter(r => new Date(r.createdAt) <= toDate);
    }

    setFilteredRequests(filtered);
  };

  const toggleRow = (id) => {
    setOpenRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const openUpdateModal = (req) => {
    setSelectedRequest(req);
    setUpdateForm({ status: req.status, comment: '' });
    setUploadedFiles([]); // reset uploads per request
    setUpdateError('');
    setUpdateSuccess('');
  };

  const handleUpdateChange = (e) => {
    const { name, value } = e.target;
    setUpdateForm(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setUploadError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/api/upload/service-request-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const newFile = {
        url: res.data.url,
        public_id: res.data.public_id,
        name: file.name,
        type: 'photo', // you can later ask user to mark before/after
      };

      setUploadedFiles(prev => [...prev, newFile]);
    } catch (err) {
      setUploadError(err.response?.data?.message || 'Upload failed');
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!updateForm.status) {
      setUpdateError('Please select a status');
      return;
    }

    setModalLoading(true);
    setUpdateError('');
    setUpdateSuccess('');

    try {
      const payload = {
        status: updateForm.status,
        comment: updateForm.comment.trim(),
        // Optional: send uploaded files if you want to store them on the request
        // attachments: uploadedFiles.map(f => f.url)
      };

      await api.put(`/api/service-requests/${selectedRequest._id}`, payload);

      setUpdateSuccess('Request updated successfully');
      fetchRequests();
      setTimeout(() => setSelectedRequest(null), 1800);
    } catch (err) {
      setUpdateError(err.response?.data?.msg || 'Update failed');
    } finally {
      setModalLoading(false);
    }
  };

  const getStatusBadge = (status) => (
    <CBadge color={statusColors[status] || 'secondary'}>{status}</CBadge>
  );

  if (loading) return <div className="text-center mt-5"><CSpinner color="primary" /></div>;

  return (
    <>
      <CCard className="mb-4">
        <CCardHeader>
          <strong>Technician Dashboard</strong>
          <div className="card-header-actions">
            <small>{filteredRequests.length} request{filteredRequests.length !== 1 ? 's' : ''}</small>
          </div>
        </CCardHeader>

        <CCardBody>
          {/* Filters */}
          <div className="row mb-4 g-3">
            <div className="col-md-3">
              <CFormLabel>Status</CFormLabel>
              <CFormSelect
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </CFormSelect>
            </div>

            <div className="col-md-4">
              <CFormLabel>Date Range</CFormLabel>
              <div className="d-flex gap-2">
                <CFormInput
                  type="date"
                  value={dateFrom}
                  onChange={e => setDateFrom(e.target.value)}
                />
                <CFormInput
                  type="date"
                  value={dateTo}
                  onChange={e => setDateTo(e.target.value)}
                />
              </div>
            </div>

            <div className="col-md-2 d-flex align-items-end">
              <CButton
                color="secondary"
                variant="outline"
                onClick={() => {
                  setStatusFilter('');
                  setDateFrom('');
                  setDateTo('');
                }}
              >
                Clear Filters
              </CButton>
            </div>
          </div>

          {/* Table */}
          {filteredRequests.length === 0 ? (
            <div className="text-center text-muted py-5">
              No assigned requests match the current filters.
            </div>
          ) : (
            <CTable hover responsive bordered>
              <CTableHead color="light">
                <CTableRow>
                  <CTableHeaderCell>#</CTableHeaderCell>
                  <CTableHeaderCell>Client</CTableHeaderCell>
                  <CTableHeaderCell>Service / Product</CTableHeaderCell>
                  <CTableHeaderCell>Status</CTableHeaderCell>
                  <CTableHeaderCell>Created</CTableHeaderCell>
                  <CTableHeaderCell>Actions</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {filteredRequests.map((req, index) => (
                  <React.Fragment key={req._id}>
                    <CTableRow>
                      <CTableDataCell>{index + 1}</CTableDataCell>
                      <CTableDataCell>
                        {req.client?.firstName} {req.client?.lastName}
                        <br />
                        <small className="text-muted">{req.client?.email}</small>
                      </CTableDataCell>
                      <CTableDataCell>
                        <strong>{req.productType}</strong> – {req.productBrand || '—'}
                        <br />
                        <small>{req.specifics || req.comment?.slice(0, 60) || ''}</small>
                      </CTableDataCell>
                      <CTableDataCell>{getStatusBadge(req.status)}</CTableDataCell>
                      <CTableDataCell>
                        {format(new Date(req.createdAt), 'dd MMM yyyy HH:mm')}
                      </CTableDataCell>
                      <CTableDataCell>
                        <CButton
                          color="primary"
                          size="sm"
                          onClick={() => openUpdateModal(req)}
                        >
                          Update
                        </CButton>
                        {' '}
                        <CButton
                          color="info"
                          variant="outline"
                          size="sm"
                          onClick={() => toggleRow(req._id)}
                        >
                          {openRows[req._id] ? 'Hide' : 'History'}
                        </CButton>
                      </CTableDataCell>
                    </CTableRow>

                    {/* Collapsible History Row */}
                    <CTableRow>
                      <CTableDataCell colSpan="6" className="p-0">
                        <CCollapse visible={openRows[req._id]}>
                          <div className="p-3 bg-light border-top">
                            <h6 className="mb-3">Update History</h6>
                            {req.history?.length > 0 ? (
                              <ul className="list-group list-group-flush">
                                {req.history.map((entry, i) => (
                                  <li key={i} className="list-group-item">
                                    <div className="d-flex justify-content-between">
                                      <strong>{entry.status}</strong>
                                      <small>
                                        {format(new Date(entry.date), 'dd MMM yyyy HH:mm')}
                                      </small>
                                    </div>
                                    <div className="text-muted mt-1">
                                      {entry.comment || 'No comment provided'}
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-muted">No updates yet.</p>
                            )}
                          </div>
                        </CCollapse>
                      </CTableDataCell>
                    </CTableRow>
                  </React.Fragment>
                ))}
              </CTableBody>
            </CTable>
          )}
        </CCardBody>
      </CCard>

      {/* Update Modal with file upload */}
      <CModal
        visible={!!selectedRequest}
        onClose={() => setSelectedRequest(null)}
        alignment="center"
        size="lg"
      >
        <CModalHeader>
          <CModalTitle>
            Update Request #{selectedRequest?._id?.slice(-8)}
          </CModalTitle>
        </CModalHeader>
        <CModalBody>
          {updateError && <CAlert color="danger">{updateError}</CAlert>}
          {updateSuccess && <CAlert color="success">{updateSuccess}</CAlert>}

          <CForm onSubmit={handleUpdateSubmit}>
            <div className="mb-3">
              <CFormLabel>Current Status</CFormLabel>
              <div>{getStatusBadge(selectedRequest?.status)}</div>
            </div>

            <div className="mb-3">
              <CFormLabel>New Status *</CFormLabel>
              <CFormSelect
                name="status"
                value={updateForm.status}
                onChange={handleUpdateChange}
                required
              >
                <option value="">Select...</option>
                <option value="PENDING">PENDING</option>
                <option value="IN_PROGRESS">IN PROGRESS</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="CANCELLED">CANCELLED</option>
              </CFormSelect>
            </div>

            <div className="mb-4">
              <CFormLabel>Comment / Work Done</CFormLabel>
              <CFormTextarea
                name="comment"
                value={updateForm.comment}
                onChange={handleUpdateChange}
                rows={4}
                placeholder="Describe actions taken, parts replaced, test results, recommendations..."
              />
            </div>

            {/* File Upload Section */}
            <div className="mb-4">
              <CFormLabel>Attach Before/After Photos</CFormLabel>
              <CInputGroup>
                <CInputGroupText>
                  <CIcon icon={cilCloudUpload} />
                </CInputGroupText>
                <CFormInput
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={uploading}
                />
              </CInputGroup>
              {uploading && <CSpinner size="sm" className="mt-2" />}
              {uploadError && <CAlert color="danger" className="mt-2">{uploadError}</CAlert>}

              {uploadedFiles.length > 0 && (
                <div className="mt-3">
                  <small>Uploaded files:</small>
                  <ul className="list-unstyled">
                    {uploadedFiles.map((f, i) => (
                      <li key={i}>
                        <a href={f.url} target="_blank" rel="noopener noreferrer">
                          {f.name}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <CModalFooter>
              <CButton color="secondary" onClick={() => setSelectedRequest(null)}>
                Close
              </CButton>
              <CButton color="primary" type="submit" disabled={modalLoading}>
                {modalLoading ? <CSpinner size="sm" /> : 'Save Update'}
              </CButton>
            </CModalFooter>
          </CForm>
        </CModalBody>
      </CModal>
    </>
  );
};

export default TechnicianDashboard;