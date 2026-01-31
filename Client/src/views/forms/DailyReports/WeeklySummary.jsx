import React, { useState } from 'react';
import { CCard, CCardBody, CCardHeader, CFormInput, CButton, CRow, CCol } from '@coreui/react';
import { toast } from 'react-hot-toast';
import { getWeeklyAggregate } from '../../services/dailyReportService';
// Assume you have a chart component or use @coreui/chartjs

const WeeklySummary = () => {
  const [projectId, setProjectId] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [week, setWeek] = useState(Math.ceil((new Date() - new Date(new Date().getFullYear(), 0, 1)) / 86400000 / 7));
  const [summary, setSummary] = useState(null);

  const fetchSummary = async () => {
    if (!projectId) return toast.error('Select project first');

    try {
      const res = await getWeeklyAggregate(projectId, { year, week });
      setSummary(res);
      toast.success('Weekly summary loaded');
    } catch (err) {
      toast.error(err || 'Failed to load summary');
    }
  };

  return (
    <CCard>
      <CCardHeader>Weekly Progress Summary</CCardHeader>
      <CCardBody>
        <CRow className="mb-4">
          <CCol md={4}>
            <CFormInput
              label="Year"
              type="number"
              value={year}
              onChange={e => setYear(e.target.value)}
            />
          </CCol>
          <CCol md={4}>
            <CFormInput
              label="Week Number"
              type="number"
              min={1}
              max={53}
              value={week}
              onChange={e => setWeek(e.target.value)}
            />
          </CCol>
          <CCol md={4} className="d-flex align-items-end">
            <CButton color="primary" onClick={fetchSummary}>
              Load Summary
            </CButton>
          </CCol>
        </CRow>

        {summary && (
          <>
            <h5>
              Week {summary.week.week} / {summary.week.year} ({summary.dateRange.start} – {summary.dateRange.end})
            </h5>

            <CRow>
              <CCol md={4}>
                <div className="border p-3">
                  <strong>Total Expenses:</strong> KES {summary.summary.totalExpensesThisWeek.toLocaleString()}
                </div>
              </CCol>
              <CCol md={4}>
                <div className="border p-3">
                  <strong>Hours On Site:</strong> {summary.summary.totalHoursOnSite} hrs
                </div>
              </CCol>
              <CCol md={4}>
                <div className="border p-3">
                  <strong>Progress Added:</strong> {summary.summary.progressIncrementThisWeek}%
                </div>
              </CCol>
            </CRow>

            {/* Add chart here if you have chart library */}
            {/* Example placeholder */}
            <div className="mt-4 border p-3 text-center">
              [Progress chart / Bar chart would go here]
              <br />
              {summary.detailedProgress.length} BOQ items updated this week
            </div>
          </>
        )}
      </CCardBody>
    </CCard>
  );
};

export default WeeklySummary;