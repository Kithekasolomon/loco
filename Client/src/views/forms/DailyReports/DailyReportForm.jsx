// src/components/DailyReportForm.jsx
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
  CSpinner,
  CAlert,
} from '@coreui/react';
import Select from 'react-select';
import makeAnimated from 'react-select/animated';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

import ProjectSelector from '../../../components/ProjectSelector'; // assuming this is your component
import {
  createDailyReportDraft,
  updateDailyReportDraft,
  submitDailyReport,
  uploadReportFiles,
} from '../../../services/dailyReportService';
import { getBoqItemsByProject } from '../../../services/boqService';
import { getOrganizationUsers } from '../../../services/userService';

// ────────────────────────────────────────────────
// Validation Schema
// ────────────────────────────────────────────────
const schema = yup.object({
  project: yup.string().required('Project is required'),
  reportDate: yup.date().required('Report date is required'),
  workDone: yup.string().required('Work done today is required'),
  pendingWork: yup.string(),
  challengesFaced: yup.string(),
  weatherConditions: yup.string(),
  personnel: yup.array().of(
    yup.object({
      user: yup.string().required('Team member is required'),
      entryTime: yup.date().nullable(),
      exitTime: yup.date().nullable(),
      workPerformed: yup.string(),
    })
  ),
  boqProgressUpdates: yup.array().of(
    yup.object({
      boqItem: yup.string().required(),
      progressIncrementToday: yup.number().min(0).max(100).required(),
      quantityDoneToday: yup.number().min(0),
      comment: yup.string(),
    })
  ),
  dailyExpenses: yup.array().of(
    yup.object({
      description: yup.string().required('Description required'),
      amount: yup.number().min(0).required('Amount required'),
      category: yup.string(),
    })
  ),
}).required();

// ────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────
const DailyReportForm = ({ reportId = null, initialProjectId = null }) => {
  const isEdit = !!reportId;
  const navigate = useNavigate();

  const [boqItems, setBoqItems] = useState([]);           // All BOQ for selected project
  const [selectedBoqs, setSelectedBoqs] = useState([]);   // Multi-selected BOQs
  const [usersOptions, setUsersOptions] = useState([]);
  const [uploadedPhotos, setUploadedPhotos] = useState([]); // preview
  const [loadingBoq, setLoadingBoq] = useState(false);

  const animatedComponents = makeAnimated();

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
      project: initialProjectId || '',
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

  // Load organization users (for personnel)
  useEffect(() => {
    const loadUsers = async () => {
      const opts = await getOrganizationUsers();
      setUsersOptions(opts);
    };
    loadUsers();
  }, []);

  // Load BOQ items when project is selected
  useEffect(() => {
    if (!selectedProject) {
      setBoqItems([]);
      setSelectedBoqs([]);
      setValue('boqProgressUpdates', []);
      return;
    }

    const loadBoqs = async () => {
      setLoadingBoq(true);
      try {
        const items = await getBoqItemsByProject(selectedProject);
        const options = items.map(item => ({
          value: item._id,
          label: `${item.itemNumber || 'N/A'} - ${item.description?.substring(0, 55) || ''}${item.description?.length > 55 ? '...' : ''}`,
          fullData: item,
        }));
        setBoqItems(options);
      } catch (err) {
        toast.error('Could not load BOQ items');
      } finally {
        setLoadingBoq(false);
      }
    };

    loadBoqs();
  }, [selectedProject, setValue]);

  // Sync selected BOQs → form array
  useEffect(() => {
    const currentIds = new Set(boqFields.map(f => f.boqItem));
    const newSelections = selectedBoqs.filter(s => !currentIds.has(s.value));

    newSelections.forEach(sel => {
      addBoqUpdate({
        boqItem: sel.value,
        progressIncrementToday: 0,
        quantityDoneToday: 0,
        comment: '',
      });
    });

    // Optional: remove entries for BOQs that were deselected
    // Uncomment if you want auto-cleanup
    /*
    const toRemove = boqFields
      .map((f, idx) => ({ idx, boqItem: f.boqItem }))
      .filter(f => !selectedBoqs.some(s => s.value === f.boqItem));
    toRemove.reverse().forEach(({ idx }) => removeBoqUpdate(idx));
    */
  }, [selectedBoqs, boqFields, addBoqUpdate, removeBoqUpdate]);

  const onSubmit = async (data) => {
    try {
      let draft;
      if (isEdit) {
        draft = await updateDailyReportDraft(reportId, data);
        toast.success('Draft updated successfully');
      } else {
        draft = await createDailyReportDraft(data.project, data);
        toast.success('Draft created');
        // Redirect to edit mode with real ID
        navigate(`/daily-reports/edit/${draft._id}`);
      }
      return draft;
    } catch (err) {
      toast.error(err || 'Failed to save draft');
      throw err;
    }
  };

  const handleSaveAndSubmit = async () => {
    try {
      const data = await handleSubmit(onSubmit)();
      if (data && !isEdit) {
        await submitDailyReport(data._id);
        toast.success('Report submitted for approval!');
        navigate('/daily-reports/my'); // or your list route
      }
    } catch (err) {
      // already toasted in onSubmit
    }
  };

  const handleFileUpload = async (e, type = 'sitePhotos', expenseIndex = null) => {
    const files = e.target.files;
    if (!files?.length || !reportId) return;

    const toastId = toast.loading('Uploading files...');

    try {
      let expenseId = null;
      if (type === 'receipts' && expenseIndex !== null) {
        const expense = expenseFields[expenseIndex];
        if (expense?._id) expenseId = expense._id;
      }

      const res = await uploadReportFiles(reportId, files, type, expenseId);

      if (type === 'sitePhotos') {
        setUploadedPhotos(prev => [
          ...prev,
          ...res.uploadedUrls.map(url => ({ url, caption: '' })),
        ]);
      }

      toast.success(res.message || `${files.length} file(s) uploaded`, { id: toastId });
    } catch (err) {
      toast.error(err || 'Upload failed', { id: toastId });
    }
  };

  return (
    <CCard>
      <CCardHeader>
        <strong>{isEdit ? 'Edit Daily Report Draft' : 'Create New Daily Site Report'}</strong>
      </CCardHeader>

      <CCardBody>
        <CForm onSubmit={handleSubmit(onSubmit)}>
          <CRow className="mb-4">
            <CCol md={6}>
              <CFormLabel>Project *</CFormLabel>
              <Controller
                name="project"
                control={control}
                render={({ field }) => (
                  <ProjectSelector
                    {...field}
                    onChange={(val) => {
                      field.onChange(val);
                      // Reset BOQ related when project changes
                      setSelectedBoqs([]);
                      setValue('boqProgressUpdates', []);
                    }}
                  />
                )}
              />
              {errors.project && <CAlert color="danger" className="mt-2">{errors.project.message}</CAlert>}
            </CCol>

            <CCol md={6}>
              <CFormLabel>Report Date *</CFormLabel>
              <CFormInput
                type="datetime-local"
                {...register('reportDate')}
                invalid={!!errors.reportDate}
              />
              {errors.reportDate && <CAlert color="danger" className="mt-2">{errors.reportDate.message}</CAlert>}
            </CCol>
          </CRow>

          {/* Narrative Fields */}
          <CFormTextarea
            label="Work Done Today *"
            rows={4}
            {...register('workDone')}
            invalid={!!errors.workDone}
          />
          {errors.workDone && <CAlert color="danger" className="mt-2">{errors.workDone.message}</CAlert>}

          <CRow className="mt-3">
            <CCol md={6}>
              <CFormTextarea label="Pending Work" rows={3} {...register('pendingWork')} />
            </CCol>
            <CCol md={6}>
              <CFormTextarea label="Challenges Faced" rows={3} {...register('challengesFaced')} />
            </CCol>
          </CRow>

          <CFormInput
            label="Weather Conditions"
            className="mt-3"
            {...register('weatherConditions')}
          />

          {/* Personnel Section */}
          <div className="mt-5">
            <CButton
              color="primary"
              size="sm"
              onClick={() => addPersonnel({ user: '', entryTime: '', exitTime: '', workPerformed: '' })}
            >
              + Add Personnel
            </CButton>

            {personnelFields.map((field, index) => (
              <CRow key={field.id} className="mt-3 align-items-end border-top pt-3">
                <CCol md={4}>
                  <Controller
                    name={`personnel.${index}.user`}
                    control={control}
                    render={({ field: controllerField }) => (
                      <Select
                        options={usersOptions}
                        value={usersOptions.find(opt => opt.value === controllerField.value) || null}
                        onChange={opt => controllerField.onChange(opt?.value)}
                        placeholder="Select team member..."
                        isClearable
                      />
                    )}
                  />
                </CCol>
                <CCol md={3}>
                  <CFormInput
                    type="datetime-local"
                    label="Entry Time"
                    {...register(`personnel.${index}.entryTime`)}
                  />
                </CCol>
                <CCol md={3}>
                  <CFormInput
                    type="datetime-local"
                    label="Exit Time"
                    {...register(`personnel.${index}.exitTime`)}
                  />
                </CCol>
                <CCol md={2}>
                  <CFormInput
                    label="Work Performed"
                    {...register(`personnel.${index}.workPerformed`)}
                  />
                </CCol>
                <CCol md={1} className="d-flex align-items-center">
                  <CCloseButton onClick={() => removePersonnel(index)} />
                </CCol>
              </CRow>
            ))}
          </div>

          {/* BOQ Section */}
          <div className="mt-5">
            {loadingBoq ? (
              <CSpinner color="primary" />
            ) : selectedProject && boqItems.length > 0 ? (
              <>
                <CFormLabel>Select BOQ Items to Update</CFormLabel>
                <Select
                  closeMenuOnSelect={false}
                  components={animatedComponents}
                  isMulti
                  options={boqItems}
                  value={selectedBoqs}
                  onChange={setSelectedBoqs}
                  placeholder="Search / select one or more BOQ items..."
                />

                {boqFields.length > 0 && (
                  <div className="mt-4">
                    <h5>Progress Updates for Selected Items</h5>
                    {boqFields.map((field, index) => {
                      const boq = boqItems.find(b => b.value === field.boqItem)?.fullData;
                      return (
                        <div key={field.id} className="border rounded p-3 mb-3 bg-light">
                          <div className="d-flex justify-content-between align-items-start">
                            <div>
                              <strong>
                                {boq ? `${boq.itemNumber || 'N/A'} - ${boq.description || 'No description'}` : 'Unknown BOQ'}
                              </strong>
                              {boq && (
                                <div className="small text-muted">
                                  Unit: {boq.unit} | Total Qty: {boq.quantity} | Current: {boq.progressPercentage || 0}%
                                </div>
                              )}
                            </div>
                            <CCloseButton onClick={() => removeBoqUpdate(index)} />
                          </div>

                          <CRow className="mt-3">
                            <CCol md={3}>
                              <CFormInput
                                type="number"
                                label="% Progress Today"
                                {...register(`boqProgressUpdates.${index}.progressIncrementToday`, {
                                  valueAsNumber: true,
                                })}
                              />
                            </CCol>
                            <CCol md={3}>
                              <CFormInput
                                type="number"
                                label="Quantity Done Today"
                                {...register(`boqProgressUpdates.${index}.quantityDoneToday`, {
                                  valueAsNumber: true,
                                })}
                              />
                            </CCol>
                            <CCol md={6}>
                              <CFormInput
                                label="Comment / Remarks"
                                {...register(`boqProgressUpdates.${index}.comment`)}
                              />
                            </CCol>
                          </CRow>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            ) : selectedProject ? (
              <CAlert color="info">No BOQ items found for this project.</CAlert>
            ) : null}
          </div>

          {/* Expenses */}
          <div className="mt-5">
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
                    label="Description"
                    {...register(`dailyExpenses.${index}.description`)}
                  />
                </CCol>
                <CCol md={2}>
                  <CInputGroup>
                    <CInputGroupText>KES</CInputGroupText>
                    <CFormInput
                      type="number"
                      label="Amount"
                      {...register(`dailyExpenses.${index}.amount`, { valueAsNumber: true })}
                    />
                  </CInputGroup>
                </CCol>
                <CCol md={3}>
                  <CFormSelect label="Category" {...register(`dailyExpenses.${index}.category`)}>
                    <option value="">Select category</option>
                    <option>Fuel</option>
                    <option>Materials</option>
                    <option>Labour</option>
                    <option>Equipment</option>
                    <option>Transport</option>
                    <option>Other</option>
                  </CFormSelect>
                </CCol>
                <CCol md={2}>
                  {reportId ? (
                    <CFormInput
                      type="file"
                      label="Receipt"
                      onChange={e => handleFileUpload(e, 'receipts', index)}
                    />
                  ) : (
                    <small className="text-muted">Save draft first to upload receipts</small>
                  )}
                </CCol>
                <CCol md={1}>
                  <CCloseButton onClick={() => removeExpense(index)} />
                </CCol>
              </CRow>
            ))}
          </div>

          {/* Site Photos */}
          <div className="mt-5">
            <CFormLabel>Site Photos / Proof of Work</CFormLabel>
            {reportId ? (
              <CFormInput
                type="file"
                multiple
                onChange={e => handleFileUpload(e, 'sitePhotos')}
              />
            ) : (
              <CAlert color="warning" className="mt-2">
                Save the draft first to enable photo uploads.
              </CAlert>
            )}

            {uploadedPhotos.length > 0 && (
              <div className="mt-3">
                <strong>Uploaded Photos:</strong>
                <div className="d-flex flex-wrap gap-2 mt-2">
                  {uploadedPhotos.map((photo, idx) => (
                    <img
                      key={idx}
                      src={photo.url}
                      alt="Site photo"
                      style={{ maxWidth: '140px', borderRadius: '6px', objectFit: 'cover' }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="mt-5 d-flex gap-3 flex-wrap">
            <CButton
              color="primary"
              type="submit"
              disabled={isSubmitting || !selectedProject}
            >
              {isSubmitting ? <CSpinner size="sm" /> : isEdit ? 'Update Draft' : 'Save Draft'}
            </CButton>

            {!isEdit && (
              <CButton
                color="success"
                disabled={isSubmitting || !selectedProject}
                onClick={handleSaveAndSubmit}
              >
                {isSubmitting ? <CSpinner size="sm" /> : 'Save & Submit for Approval'}
              </CButton>
            )}

            <CButton
              color="secondary"
              onClick={() => navigate(-1)}
              disabled={isSubmitting}
            >
              Cancel
            </CButton>
          </div>
        </CForm>
      </CCardBody>
    </CCard>
  );
};

export default DailyReportForm;