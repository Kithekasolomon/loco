// src/components/DailyReportsList.jsx
import React, { useEffect, useState } from 'react';
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
  CSpinner,
  CAlert,
  CBadge,
} from '@coreui/react';
import { getProjectDailyReports } from '../../../services/dailyReportService';
import { useParams } from 'react-router-dom';

const DailyReportsList = () => {
  const { projectId } = useParams(); // Automatically gets from URL: /projects/:projectId/reports

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!projectId) {
      setError('No project ID provided in the URL');
      setLoading(false);
      return;
    }

    const fetchReports = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch all statuses (you can add { status: 'APPROVED' } to filter later)
        const res = await getProjectDailyReports(projectId, {
          // limit: 50,   // optional pagination params
          // page: 1,
        });

        console.log('Reports fetched:', res.data?.length || 0, 'records');
        setReports(res.data || []);
      } catch (err) {
        console.error('Failed to load daily reports:', err);
        const errMsg =
          err.response?.data?.message ||
          err.message ||
          'Failed to load daily reports. Please try again.';
        setError(errMsg);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [projectId]);

  // Helper: colored status badge
  const getStatusBadge = (status) => {
    const colors = {
      DRAFT: 'warning',
      SUBMITTED: 'info',
      APPROVED: 'success',
      REJECTED: 'danger',
    };
    return <CBadge color={colors[status] || 'secondary'}>{status || 'Unknown'}</CBadge>;
  };

  return (
    <CCard className="mb-4 shadow-sm">
      <CCardHeader className="d-flex justify-content-between align-items-center">
        <strong>Daily Site Reports</strong>
        {projectId && (
          <small className="text-muted">
            Project ID: {projectId.slice(-8)} {/* shows last 8 chars for readability */}
          </small>
        )}
      </CCardHeader>

      <CCardBody>
        {loading ? (
          <div className="text-center py-5">
            <CSpinner color="primary" variant="grow" />
            <p className="mt-3 text-muted">Loading daily reports...</p>
          </div>
        ) : error ? (
          <CAlert color="danger" dismissible onClose={() => setError(null)}>
            {error}
          </CAlert>
        ) : reports.length === 0 ? (
          <CAlert color="info" className="text-center">
            No daily reports have been submitted for this project yet.
          </CAlert>
        ) : (
          <div className="table-responsive">
            <CTable hover responsive bordered striped className="align-middle">
              <CTableHead color="light">
                <CTableRow>
                  <CTableHeaderCell>Date</CTableHeaderCell>
                  <CTableHeaderCell>Submitted By</CTableHeaderCell>
                  <CTableHeaderCell>Status</CTableHeaderCell>
                  <CTableHeaderCell>Work Done</CTableHeaderCell>
                  <CTableHeaderCell>Expenses (KES)</CTableHeaderCell>
                  <CTableHeaderCell>Progress Added</CTableHeaderCell>
                  <CTableHeaderCell>Photos</CTableHeaderCell>
                  <CTableHeaderCell>BOQ Items</CTableHeaderCell>
                </CTableRow>
              </CTableHead>

              <CTableBody>
                {reports.map((report) => (
                  <CTableRow key={report._id}>
                    {/* Date */}
                    <CTableDataCell>
                      {new Date(report.reportDate).toLocaleDateString('en-KE', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </CTableDataCell>

                    {/* Submitted By */}
                    <CTableDataCell>
                      {report.submittedBy?.firstName && report.submittedBy?.lastName
                        ? `${report.submittedBy.firstName} ${report.submittedBy.lastName}`
                        : report.submittedBy?.username || 'Unknown User'}
                    </CTableDataCell>

                    {/* Status */}
                    <CTableDataCell>{getStatusBadge(report.status)}</CTableDataCell>

                    {/* Work Done - truncated */}
                    <CTableDataCell>
                      <div
                        style={{
                          maxWidth: '240px',
                          whiteSpace: 'pre-wrap',
                          fontSize: '0.9rem',
                          lineHeight: '1.4',
                        }}
                      >
                        {report.workDone?.substring(0, 100) || '—'}
                        {report.workDone?.length > 100 ? '...' : ''}
                      </div>
                    </CTableDataCell>

                    {/* Expenses */}
                    <CTableDataCell className="text-end">
                      {report.totalExpensesToday > 0
                        ? report.totalExpensesToday.toLocaleString('en-KE')
                        : '—'}
                    </CTableDataCell>

                    {/* Progress Added */}
                    <CTableDataCell className="text-center">
                      {report.boqProgressUpdates?.reduce(
                        (sum, u) => sum + (Number(u.progressIncrementToday) || 0),
                        0
                      ) || 0}
                      %
                    </CTableDataCell>

                    {/* Photos */}
                    <CTableDataCell className="text-center">
                      {report.sitePhotos?.length > 0 ? (
                        <CBadge color="info" shape="rounded-pill">
                          {report.sitePhotos.length}
                        </CBadge>
                      ) : (
                        '—'
                      )}
                    </CTableDataCell>

                    {/* BOQ Items Updated */}
                    <CTableDataCell className="text-center">
                      {report.boqProgressUpdates?.length > 0 ? (
                        <CBadge color="primary" shape="rounded-pill">
                          {report.boqProgressUpdates.length}
                        </CBadge>
                      ) : (
                        '—'
                      )}
                    </CTableDataCell>
                  </CTableRow>
                ))}
              </CTableBody>
            </CTable>
          </div>
        )}
      </CCardBody>
    </CCard>
  );
};

export default DailyReportsList;