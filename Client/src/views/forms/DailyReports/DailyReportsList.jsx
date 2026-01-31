import React, { useEffect, useState } from 'react';
import { CCard, CCardBody, CCardHeader, CTable, CTableHead, CTableRow, CTableHeaderCell, CTableBody, CTableDataCell } from '@coreui/react';
import { getProjectDailyReports } from '../../../services/dailyReportService';

const DailyReportsList = () => {
  const [reports, setReports] = useState([]);
  const projectId = "your-project-id-here"; 

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await getProjectDailyReports(projectId, { status: 'APPROVED' });
        setReports(res.data || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchReports();
  }, [projectId]);

  return (
    <CCard>
      <CCardHeader>Daily Site Reports</CCardHeader>
      <CCardBody>
        <CTable hover responsive>
          <CTableHead>
            <CTableRow>
              <CTableHeaderCell>Date</CTableHeaderCell>
              <CTableHeaderCell>Submitted By</CTableHeaderCell>
              <CTableHeaderCell>Status</CTableHeaderCell>
              <CTableHeaderCell>Expenses</CTableHeaderCell>
              <CTableHeaderCell>Progress Added</CTableHeaderCell>
            </CTableRow>
          </CTableHead>
          <CTableBody>
            {reports.map(r => (
              <CTableRow key={r._id}>
                <CTableDataCell>{new Date(r.reportDate).toLocaleDateString()}</CTableDataCell>
                <CTableDataCell>{r.submittedBy?.username || 'N/A'}</CTableDataCell>
                <CTableDataCell>{r.status}</CTableDataCell>
                <CTableDataCell>{r.totalExpensesToday || 0}</CTableDataCell>
                <CTableDataCell>{r.boqProgressUpdates?.reduce((s, u) => s + (u.progressIncrementToday || 0), 0) || 0}%</CTableDataCell>
              </CTableRow>
            ))}
          </CTableBody>
        </CTable>
      </CCardBody>
    </CCard>
  );
};

export default DailyReportsList;