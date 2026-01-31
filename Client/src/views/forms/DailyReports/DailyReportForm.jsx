import React, { useEffect, useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  CCard,
  CCardBody,
  CCardHeader,
  CForm,
  CFormInput,
  CFormTextarea,
  CFormLabel,
  CButton,
  CRow,
  CCol,
  CCloseButton,
  CFormSelect,
  CInputGroup,
  CInputGroupText,
} from '@coreui/react';
import { toast } from 'react-hot-toast';
import { useParams, useNavigate } from 'react-router-dom';
import ProjectSelector from '../../../components/ProjectSelector';
import {
  createDailyReportDraft,
  updateDailyReportDraft,
  submitDailyReport,
  uploadReportFiles,
} from '../../../services/dailyReportService';

// Validation schema
const schema = yup.object({
  project: yup.string().required('Project is required'),
  reportDate: yup.date().required('Date is required'),
  workDone: yup.string().required('Work done is required'),
  pendingWork: yup.string(),
  challengesFaced: yup.string(),
  weatherConditions: yup.string(),
  personnel: yup.array().of(
    yup.object({
      user: yup.string().required('User is required'),
      entryTime: yup.date().nullable(),
      exitTime: yup.date().nullable(),
      workPerformed: yup.string(),
    })
  ),
  boqProgressUpdates: yup.array().of(
    yup.object({
      boqItem: yup.string().required('BOQ Item is required'),
      progressIncrementToday: yup.number().min(0).max(100),
      quantityDoneToday: yup.number().min(0),
      comment: yup.string(),
    })
  ),
  dailyExpenses: yup.array().of(
    yup.object({
      description: yup.string().required(),
      amount: yup.number().min(0).required(),
      category: yup.string(),
    })
  ),
});

const DailyReportForm = () => {
  const { projectId: paramProjectId, reportId } = useParams();
  const isEdit = !!reportId;
  const navigate = useNavigate();

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      project: paramProjectId || '',
      reportDate: new Date().toISOString().slice(0, 16),
      workDone: '',
      pendingWork: '',
      challengesFaced: '',
      weatherConditions: '',
      personnel: [],
      boqProgressUpdates: [],
      dailyExpenses: [],
    },
  });

  const {
    fields: personnelFields,
    append: addPersonnel,
    remove: removePersonnel,
  } = useFieldArray({ control, name: 'personnel' });

  const {
    fields: boqFields,
    append: addBoqUpdate,
    remove: removeBoqUpdate,
  } = useFieldArray({ control, name: 'boqProgressUpdates' });

  const {
    fields: expenseFields,
    append: addExpense,
    remove: removeExpense,
  } = useFieldArray({ control, name: 'dailyExpenses' });

  const selectedProject = watch('project');

  // Fetch existing report if editing
  useEffect(() => {
    if (isEdit) {
      // TODO: fetch report by reportId and patch values
      // example:
      // const fetchReport = async () => {
      //   const res = await getDailyReportById(reportId);
      //   Object.keys(res).forEach(key => setValue(key, res[key]));
      // };
      // fetchReport();
    }
  }, [reportId, isEdit, setValue]);

  const onSubmit = async (data) => {
    try {
      if (isEdit) {
        await updateDailyReportDraft(reportId, data);
        toast.success('Draft updated');
      } else {
        const draft = await createDailyReportDraft(data.project, data);
        toast.success('Draft created');
        navigate(`/site-reports/edit/${draft._id}`);
      }
    } catch (err) {
      toast.error(err || 'Operation failed');
    }
  };

  const handleFileChange = async (e, type = 'sitePhotos', expenseIndex = null) => {
    const files = e.target.files;
    if (!files.length || !selectedProject) return;

    const toastId = toast.loading('Uploading...');

    try {
      const payload = { type };
      if (type === 'receipts' && expenseIndex !== null) {
        const expense = expenseFields[expenseIndex];
        if (!expense?._id) throw new Error('Expense not saved yet');
        payload.expenseId = expense._id;
      }

      const res = await uploadReportFiles(reportId || 'temp', files, type, payload.expenseId);
      toast.success(res.message || 'Files uploaded', { id: toastId });

      // Optionally refresh form or show previews
    } catch (err) {
      toast.error(err || 'Upload failed', { id: toastId });
    }
  };

  return (
    <CCard>
      <CCardHeader>
        <strong>{isEdit ? 'Edit Daily Report Draft' : 'New Daily Site Report'}</strong>
      </CCardHeader>
      <CCardBody>
        <CForm onSubmit={handleSubmit(onSubmit)}>
          <CRow>
            <CCol md={6}>
              <CFormLabel>Project *</CFormLabel>
              <Controller
                name="project"
                control={control}
                render={({ field }) => (
                  <ProjectSelector {...field} onChange={field.onChange} />
                )}
              />
              {errors.project && <div className="text-danger">{errors.project.message}</div>}
            </CCol>

            <CCol md={6}>
              <CFormLabel>Report Date *</CFormLabel>
              <CFormInput
                type="datetime-local"
                {...register('reportDate')}
                invalid={!!errors.reportDate}
              />
              {errors.reportDate && <div className="text-danger">{errors.reportDate.message}</div>}
            </CCol>
          </CRow>

          <hr />

          {/* Work Done */}
          <CFormTextarea
            label="Work Done Today *"
            rows={4}
            {...register('workDone')}
            invalid={!!errors.workDone}
          />
          {errors.workDone && <div className="text-danger">{errors.workDone.message}</div>}

          <CRow className="mt-3">
            <CCol md={6}>
              <CFormTextarea label="Pending Work" rows={3} {...register('pendingWork')} />
            </CCol>
            <CCol md={6}>
              <CFormTextarea label="Challenges Faced" rows={3} {...register('challengesFaced')} />
            </CCol>
          </CRow>

          <CFormInput label="Weather Conditions" {...register('weatherConditions')} className="mt-3" />

          {/* Personnel */}
          <div className="mt-4">
            <CButton
              color="primary"
              size="sm"
              onClick={() => addPersonnel({ user: '', entryTime: '', exitTime: '', workPerformed: '' })}
            >
              + Add Personnel
            </CButton>

            {personnelFields.map((field, index) => (
              <CRow key={field.id} className="mt-3 border-top pt-3">
                <CCol md={3}>
                  <CFormInput placeholder="User ID or Name" {...register(`personnel.${index}.user`)} />
                </CCol>
                <CCol md={3}>
                  <CFormInput type="datetime-local" {...register(`personnel.${index}.entryTime`)} />
                </CCol>
                <CCol md={3}>
                  <CFormInput type="datetime-local" {...register(`personnel.${index}.exitTime`)} />
                </CCol>
                <CCol md={2}>
                  <CFormInput placeholder="Work Performed" {...register(`personnel.${index}.workPerformed`)} />
                </CCol>
                <CCol md={1} className="d-flex align-items-center">
                  <CCloseButton onClick={() => removePersonnel(index)} />
                </CCol>
              </CRow>
            ))}
          </div>

          {/* BOQ Progress Updates */}
          <div className="mt-4">
            <CButton
              color="primary"
              size="sm"
              onClick={() => addBoqUpdate({ boqItem: '', progressIncrementToday: 0, quantityDoneToday: 0, comment: '' })}
            >
              + Add BOQ Update
            </CButton>

            {boqFields.map((field, index) => (
              <CRow key={field.id} className="mt-3 border-top pt-3">
                <CCol md={4}>
                  <CFormInput placeholder="BOQ Item ID" {...register(`boqProgressUpdates.${index}.boqItem`)} />
                </CCol>
                <CCol md={2}>
                  <CFormInput
                    type="number"
                    placeholder="% Added"
                    {...register(`boqProgressUpdates.${index}.progressIncrementToday`)}
                  />
                </CCol>
                <CCol md={2}>
                  <CFormInput
                    type="number"
                    placeholder="Qty Done"
                    {...register(`boqProgressUpdates.${index}.quantityDoneToday`)}
                  />
                </CCol>
                <CCol md={3}>
                  <CFormInput placeholder="Comment" {...register(`boqProgressUpdates.${index}.comment`)} />
                </CCol>
                <CCol md={1} className="d-flex align-items-center">
                  <CCloseButton onClick={() => removeBoqUpdate(index)} />
                </CCol>
              </CRow>
            ))}
          </div>

          {/* Expenses */}
          <div className="mt-4">
            <CButton
              color="primary"
              size="sm"
              onClick={() => addExpense({ description: '', amount: 0, category: '' })}
            >
              + Add Expense
            </CButton>

            {expenseFields.map((field, index) => (
              <CRow key={field.id} className="mt-3 border-top pt-3 align-items-end">
                <CCol md={4}>
                  <CFormInput
                    placeholder="Description"
                    {...register(`dailyExpenses.${index}.description`)}
                  />
                </CCol>
                <CCol md={2}>
                  <CInputGroup>
                    <CInputGroupText>KES</CInputGroupText>
                    <CFormInput
                      type="number"
                      {...register(`dailyExpenses.${index}.amount`)}
                    />
                  </CInputGroup>
                </CCol>
                <CCol md={3}>
                  <CFormSelect {...register(`dailyExpenses.${index}.category`)}>
                    <option value="">Category</option>
                    <option>Fuel</option>
                    <option>Materials</option>
                    <option>Allowances</option>
                    <option>Equipment</option>
                    <option>Other</option>
                  </CFormSelect>
                </CCol>
                <CCol md={2}>
                  <CFormInput
                    type="file"
                    onChange={e => handleFileChange(e, 'receipts', index)}
                  />
                  <small>Upload receipt</small>
                </CCol>
                <CCol md={1} className="d-flex align-items-center">
                  <CCloseButton onClick={() => removeExpense(index)} />
                </CCol>
              </CRow>
            ))}
          </div>

          {/* General Photos */}
          <div className="mt-4">
            <CFormLabel>Site Photos</CFormLabel>
            <CFormInput
              type="file"
              multiple
              onChange={e => handleFileChange(e, 'sitePhotos')}
            />
          </div>

          <div className="mt-4 d-flex gap-3">
            <CButton color="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : isEdit ? 'Update Draft' : 'Save Draft'}
            </CButton>

            {!isEdit && (
              <CButton
                color="success"
                disabled={isSubmitting}
                onClick={async () => {
                  const data = await handleSubmit(onSubmit)();
                  if (data) {
                    const draftId = data._id; // assuming create returns _id
                    await submitDailyReport(draftId);
                    toast.success('Report submitted for approval');
                    navigate('/site-reports/my');
                  }
                }}
              >
                Submit for Approval
              </CButton>
            )}
          </div>
        </CForm>
      </CCardBody>
    </CCard>
  );
};

export default DailyReportForm;