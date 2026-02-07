// src/views/technician/TechnicianDashboard.jsx
import React, { useState, useEffect } from 'react';
import {
  CCard, CCardBody, CCardHeader, CTable, CTableHead, CTableRow, CTableHeaderCell,
  CTableBody, CTableDataCell, CBadge, CButton, CModal, CModalHeader, CModalTitle,
  CModalBody, CModalFooter, CForm, CFormLabel, CFormSelect, CFormTextarea,
  CFormInput, CAlert, CSpinner, CCollapse, CInputGroup, CInputGroupText,
  CFormCheck,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilCloudUpload, cilCalendar, cilFilter } from '@coreui/icons';
import api from '../../api/axios';
import { format } from 'date-fns';

const statusColors = {
  PENDING: 'warning',
  IN_PROGRESS: 'info',
  READY_FOR_COMPLETION: 'primary',
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

  // Modal
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [updateForm, setUpdateForm] = useState({
    status: '',
    comment: '',
    progressPercentage: 0,
    isFinalUpdate: false,
  });
  const [photoType, setPhotoType] = useState('before');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState([]); // {url, name, type: 'before'|'after'}
  const [modalLoading, setModalLoading] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState('');
  const [updateError, setUpdateError] = useState('');

  // Collapsible
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
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let temp = [...requests];
    if (statusFilter) temp = temp.filter(r => r.status === statusFilter);
    if (dateFrom) {
      const from = new Date(dateFrom);
      temp = temp.filter(r => new Date(r.createdAt) >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      temp = temp.filter(r => new Date(r.createdAt) <= to);
    }
    setFilteredRequests(temp);
  };

  const toggleRow = (id) => setOpenRows(p => ({ ...p, [id]: !p[id] }));

  const openModal = (req) => {
    setSelectedRequest(req);
    setUpdateForm({
      status: req.status,
      comment: '',
      progressPercentage: req.progressPercentage || 0,
      isFinalUpdate: false,
    });
    setUploadedFiles([]);
    setUpdateError('');
    setUpdateSuccess('');
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setUpdateForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setUploadError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/api/upload/service-request-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const newFile = {
        url: res.data.url,
        public_id: res.data.public_id,
        name: file.name,
        type: photoType,
      };

      setUploadedFiles(prev => [...prev, newFile]);
    } catch (err) {
      setUploadError(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!updateForm.status) {
      setUpdateError('Status is required');
      return;
    }

    setModalLoading(true);
    setUpdateError('');
    setUpdateSuccess('');

    try {
      const payload = {
        status: updateForm.status,
        comment: updateForm.comment.trim(),
        progressPercentage: Number(updateForm.progressPercentage),
        isFinalUpdate: updateForm.isFinalUpdate,
        attachments: uploadedFiles.map(f => ({
          url: f.url,
          public_id: f.public_id,
          type: f.type,
        })),
      };

      await api.put(`/api/service-requests/${selectedRequest._id}`, payload);

      setUpdateSuccess('Update submitted successfully');
      fetchRequests();
      setTimeout(() => setSelectedRequest(null), 1800);
    } catch (err) {
      setUpdateError(err.response?.data?.msg || 'Failed to update');
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <>
      <CCard className="mb-4">
        <CCardHeader>
          <strong>Technician Dashboard – Assigned Requests</strong>
        </CCardHeader>
        <CCardBody>
          {/* Filters */}
          <div className="row g-3 mb-4">
            <div className="col-md-3">
              <CFormLabel>Status</CFormLabel>
              <CFormSelect value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="">All</option>
                <option value="PENDING">Pending</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="READY_FOR_COMPLETION">Ready for Completion</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </CFormSelect>
            </div>
            <div className="col-md-5">
              <CFormLabel>Date Range</CFormLabel>
              <div className="d-flex gap-2">
                <CFormInput type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
                <CFormInput type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
              </div>
            </div>
            <div className="col-md-2 d-flex align-items-end">
              <CButton color="secondary" variant="outline" onClick={() => {
                setStatusFilter(''); setDateFrom(''); setDateTo('');
              }}>
                Clear
              </CButton>
            </div>
          </div>

          {/* Table */}
          {filteredRequests.length === 0 ? (
            <p className="text-center text-muted py-5">No matching requests</p>
          ) : (
            <CTable hover responsive bordered>
              <CTableHead color="light">
                <CTableRow>
                  <CTableHeaderCell>#</CTableHeaderCell>
                  <CTableHeaderCell>Client</CTableHeaderCell>
                  <CTableHeaderCell>Product</CTableHeaderCell>
                  <CTableHeaderCell>Status</CTableHeaderCell>
                  <CTableHeaderCell>Created</CTableHeaderCell>
                  <CTableHeaderCell>Actions</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {filteredRequests.map((req, i) => (
                  <React.Fragment key={req._id}>
                    <CTableRow>
                      <CTableDataCell>{i + 1}</CTableDataCell>
                      <CTableDataCell>
                        {req.client?.firstName} {req.client?.lastName}<br />
                        <small className="text-muted">{req.client?.email}</small>
                      </CTableDataCell>
                      <CTableDataCell>
                        <strong>{req.productType}</strong> – {req.productBrand || '—'}<br />
                        <small>{req.specifics || ''}</small>
                      </CTableDataCell>
                      <CTableDataCell>
                        <CBadge color={statusColors[req.status]}>{req.status}</CBadge>
                      </CTableDataCell>
                      <CTableDataCell>
                        {format(new Date(req.createdAt), 'dd MMM yyyy • HH:mm')}
                      </CTableDataCell>
                      <CTableDataCell>
                        <CButton color="primary" size="sm" onClick={() => openModal(req)}>
                          Update
                        </CButton>{' '}
                        <CButton
                          color="info"
                          variant="outline"
                          size="sm"
                          onClick={() => toggleRow(req._id)}
                        >
                          {openRows[req._id] ? 'Hide History' : 'Show History'}
                        </CButton>
                      </CTableDataCell>
                    </CTableRow>

                    {/* Collapsible History */}
                    <CTableRow>
                      <CTableDataCell colSpan="6" className="p-0">
                        <CCollapse visible={openRows[req._id]}>
                          <div className="p-3 bg-light">
                            <h6>Update History</h6>
                            {req.history?.length > 0 ? (
                              req.history.map((h, idx) => (
                                <div key={idx} className="mb-3 pb-2 border-bottom">
                                  <div className="d-flex justify-content-between">
                                    <strong>{h.status}</strong>
                                    <small className="text-muted">
                                      {format(new Date(h.date), 'dd MMM yyyy • HH:mm')}
                                    </small>
                                  </div>
                                  <div className="mt-1 small">
                                    <span className="text-primary fw-bold">
                                      By: {h.by?.firstName || 'System'} {h.by?.lastName || ''}
                                    </span>
                                  </div>
                                  <div className="mt-1 text-muted small">
                                    {h.comment || <em>No comment</em>}
                                  </div>
                                </div>
                              ))
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

      {/* Update Modal */}
      <CModal visible={!!selectedRequest} onClose={() => setSelectedRequest(null)} size="lg" alignment="center">
        <CModalHeader>
          <CModalTitle>Update Request #{selectedRequest?._id?.slice(-8)}</CModalTitle>
        </CModalHeader>
        <CModalBody>
          {updateError && <CAlert color="danger">{updateError}</CAlert>}
          {updateSuccess && <CAlert color="success">{updateSuccess}</CAlert>}

          <CForm onSubmit={handleSubmit}>
            <div className="mb-3">
              <CFormLabel>Current Status</CFormLabel>
              <div><CBadge color={statusColors[selectedRequest?.status]}>{selectedRequest?.status}</CBadge></div>
            </div>

            <div className="mb-3">
              <CFormLabel>New Status</CFormLabel>
              <CFormSelect name="status" value={updateForm.status} onChange={handleChange} required>
                <option value="">Select...</option>
                <option value="PENDING">PENDING</option>
                <option value="IN_PROGRESS">IN PROGRESS</option>
                <option value="READY_FOR_COMPLETION">READY FOR COMPLETION</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="CANCELLED">CANCELLED</option>
              </CFormSelect>
            </div>

            <div className="mb-3">
              <CFormLabel>Progress (%)</CFormLabel>
              <CFormInput
                type="number"
                name="progressPercentage"
                value={updateForm.progressPercentage}
                onChange={handleChange}
                min="0"
                max="100"
              />
            </div>

            <div className="mb-4">
              <CFormLabel>Comment / Work Done</CFormLabel>
              <CFormTextarea
                name="comment"
                value={updateForm.comment}
                onChange={handleChange}
                rows={4}
                placeholder="Describe what was done, issues found, parts used..."
              />
            </div>

            <div className="mb-4 form-check">
              <CFormCheck
                id="finalUpdate"
                name="isFinalUpdate"
                checked={updateForm.isFinalUpdate}
                onChange={handleChange}
                label="This is the final update – mark job as ready for client review"
              />
            </div>

            {/* Photo Upload */}
            <div className="mb-4">
              <CFormLabel>Upload Photos</CFormLabel>
              <div className="d-flex gap-4 mb-3">
                <CFormCheck
                  type="radio"
                  id="before"
                  name="photoType"
                  label="Before"
                  checked={photoType === 'before'}
                  onChange={() => setPhotoType('before')}
                />
                <CFormCheck
                  type="radio"
                  id="after"
                  name="photoType"
                  label="After"
                  checked={photoType === 'after'}
                  onChange={() => setPhotoType('after')}
                />
              </div>

              <CInputGroup>
                <CInputGroupText><CIcon icon={cilCloudUpload} /></CInputGroupText>
                <CFormInput
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
              </CInputGroup>

              {uploading && <CSpinner size="sm" className="mt-2" />}
              {uploadError && <CAlert color="danger" className="mt-2 small">{uploadError}</CAlert>}

              {uploadedFiles.length > 0 && (
                <div className="mt-3">
                  <small>Uploaded this session:</small>
                  <div className="d-flex flex-wrap gap-3 mt-2">
                    {uploadedFiles.map((f, idx) => (
                      <div key={idx} style={{ maxWidth: '160px' }} className="text-center">
                        <img
                          src={f.url}
                          alt={f.name}
                          className="img-thumbnail"
                          style={{ width: '100%', cursor: 'pointer' }}
                          onClick={() => window.open(f.url, '_blank')}
                        />
                        <div className="badge bg-primary mt-1">
                          {f.type === 'before' ? 'Before' : 'After'}
                        </div>
                        <small className="d-block text-muted mt-1">
                          {f.name.length > 18 ? f.name.substring(0, 15) + '...' : f.name}
                        </small>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <CModalFooter>
              <CButton color="secondary" onClick={() => setSelectedRequest(null)}>
                Close
              </CButton>
              <CButton color="primary" type="submit" disabled={modalLoading}>
                {modalLoading ? <CSpinner size="sm" /> : 'Submit Update'}
              </CButton>
            </CModalFooter>
          </CForm>
        </CModalBody>
      </CModal>
    </>
  );
};

export default TechnicianDashboard;