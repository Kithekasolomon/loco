import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  CCard,
  CCardBody,
  CCardHeader,
  CButton,
  CFormTextarea,
  CSpinner,
} from '@coreui/react';
import { toast } from 'react-hot-toast';
import { reviewDailyReport } from '../../services/dailyReportService';
// import getDailyReportById from service

const DailyReportReview = () => {
  const { reportId } = useParams();
  const [report, setReport] = useState(null);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch report
    // const fetchReport = async () => {
    //   try {
    //     const res = await getDailyReportById(reportId);
    //     setReport(res);
    //   } catch (err) {
    //     toast.error('Failed to load report');
    //   } finally {
    //     setLoading(false);
    //   }
    // };
    // fetchReport();
  }, [reportId]);

  const handleReview = async (status) => {
    try {
      await reviewDailyReport(reportId, { status, adminComment: comment });
      toast.success(`Report ${status.toLowerCase()}`);
      // navigate back or refresh
    } catch (err) {
      toast.error(err || 'Failed to review');
    }
  };

  if (loading) return <CSpinner color="primary" />;

  if (!report) return <div>Report not found</div>;

  return (
    <CCard>
      <CCardHeader>
        Review Daily Report - {new Date(report.reportDate).toLocaleDateString()}
      </CCardHeader>
      <CCardBody>
        <h5>Work Done</h5>
        <p>{report.workDone}</p>

        <h5>Expenses</h5>
        {report.dailyExpenses?.map((e, i) => (
          <div key={i}>
            {e.description} - KES {e.amount}
            {e.receiptUrls?.length > 0 && (
              <div>
                Receipts:{' '}
                {e.receiptUrls.map((url, j) => (
                  <a key={j} href={url} target="_blank" rel="noopener noreferrer">
                    View
                  </a>
                ))}
              </div>
            )}
          </div>
        ))}

        <h5>BOQ Progress</h5>
        <ul>
          {report.boqProgressUpdates?.map((u, i) => (
            <li key={i}>
              BOQ Item {u.boqItem}: +{u.progressIncrementToday}% 
              {u.quantityDoneToday ? ` (${u.quantityDoneToday} units)` : ''}
            </li>
          ))}
        </ul>

        <hr />

        <CFormTextarea
          label="Admin Comment"
          rows={3}
          value={comment}
          onChange={e => setComment(e.target.value)}
        />

        <div className="mt-4">
          <CButton color="success" onClick={() => handleReview('APPROVED')}>
            Approve
          </CButton>
          <CButton color="danger" className="ms-2" onClick={() => handleReview('REJECTED')}>
            Reject
          </CButton>
        </div>
      </CCardBody>
    </CCard>
  );
};

export default DailyReportReview;