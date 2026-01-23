// src/views/pages/projectManagement/BoqView/components/AddItemModal.jsx
import React, { useState, useEffect } from 'react';
import {
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CForm,
  CFormLabel,
  CFormInput,
  CFormSelect,
  CButton,
  CSpinner,
  CAlert,
} from '@coreui/react';
import CreatableSelect from 'react-select/creatable';
import api from '../../../../../api/axios';
import { createBoqCategory } from '../../../../../services/boqService'; 

const AddItemModal = ({ visible, onClose, projectId, onSuccess }) => {
  const [formData, setFormData] = useState({
    itemNumber: '',
    description: '',
    unit: '',
    quantity: '',
    rate: '',
    progressPercentage: 0,
    category: null, // will be { value, label }
  });

  const [categories, setCategories] = useState([]); // options for select
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Load existing categories when modal opens
  useEffect(() => {
    if (visible && projectId) {
      const loadCategories = async () => {
        setLoadingCategories(true);
        try {
          const { data } = await api.get(`/api/boq-categories/project/${projectId}`);
          const options = data.map(cat => ({
            value: cat.name,
            label: cat.name,
          }));
          setCategories(options);
        } catch (err) {
          console.error('Failed to load categories:', err);
          setError('Could not load categories');
        } finally {
          setLoadingCategories(false);
        }
      };
      loadCategories();
    }
  }, [visible, projectId]);

  const handleCreate = async (inputValue) => {
    if (!inputValue?.trim()) return;

    try {
      const newCategory = await createBoqCategory(projectId, inputValue.trim());
      const newOption = { value: newCategory.name, label: newCategory.name };
      
      setCategories(prev => [...prev, newOption]);
      setFormData(prev => ({ ...prev, category: newOption }));
    } catch (err) {
      setError(err || 'Failed to create new category');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.category?.value) {
      setError('Please select or create a category');
      return;
    }

    setSubmitting(true);

    try {
      await api.post(`/api/boq/${projectId}`, {
        itemNumber: formData.itemNumber.trim(),
        description: formData.description.trim(),
        unit: formData.unit,
        quantity: Number(formData.quantity) || 0,
        rate: Number(formData.rate) || 0,
        progressPercentage: Number(formData.progressPercentage) || 0,
        category: formData.category.value,
      });

      onSuccess?.(); // refresh parent
      onClose();
    } catch (err) {
      console.error('Add item failed:', err);
      setError(err.response?.data?.message || 'Failed to add item');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      itemNumber: '',
      description: '',
      unit: '',
      quantity: '',
      rate: '',
      progressPercentage: 0,
      category: null,
    });
    setError(null);
  };

  return (
    <CModal visible={visible} onClose={() => { resetForm(); onClose(); }} size="lg">
      <CModalHeader closeButton>
        <CModalTitle>Add New BOQ Item</CModalTitle>
      </CModalHeader>

      <CForm onSubmit={handleSubmit}>
        <CModalBody>
          {error && <CAlert color="danger" dismissible onClose={() => setError(null)}>{error}</CAlert>}

          <div className="row g-3">
            <div className="col-md-4">
              <CFormLabel>Item Number *</CFormLabel>
              <CFormInput
                required
                value={formData.itemNumber}
                onChange={e => setFormData({ ...formData, itemNumber: e.target.value })}
              />
            </div>

            <div className="col-md-8">
              <CFormLabel>Description *</CFormLabel>
              <CFormInput
                required
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="col-md-12">
              <CFormLabel>Category *</CFormLabel>
              {loadingCategories ? (
                <div><CSpinner size="sm" /> Loading categories...</div>
              ) : (
                <CreatableSelect
                  isClearable
                  isSearchable
                  options={categories}
                  value={formData.category}
                  onChange={option => setFormData({ ...formData, category: option })}
                  onCreateOption={handleCreate}
                  placeholder="Select existing or type to create new..."
                  formatCreateLabel={input => `Create new category: "${input}"`}
                  required
                />
              )}
            </div>

            <div className="col-md-4">
              <CFormLabel>Unit *</CFormLabel>
              <CFormSelect
                required
                value={formData.unit}
                onChange={e => setFormData({ ...formData, unit: e.target.value })}
              >
                <option value="">Select unit...</option>
                <option value="m³">m³</option>
                <option value="m²">m²</option>
                <option value="m">m</option>
                <option value="pcs">pcs</option>
                <option value="kg">kg</option>
                <option value="tons">tons</option>
                <option value="lumpsum">lumpsum</option>
              </CFormSelect>
            </div>

            <div className="col-md-4">
              <CFormLabel>Quantity *</CFormLabel>
              <CFormInput
                type="number"
                min="0"
                step="0.01"
                required
                value={formData.quantity}
                onChange={e => setFormData({ ...formData, quantity: e.target.value })}
              />
            </div>

            <div className="col-md-4">
              <CFormLabel>Rate (KES) *</CFormLabel>
              <CFormInput
                type="number"
                min="0"
                step="0.01"
                required
                value={formData.rate}
                onChange={e => setFormData({ ...formData, rate: e.target.value })}
              />
            </div>

            <div className="col-md-12">
              <CFormLabel>Progress (%)</CFormLabel>
              <CFormInput
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={formData.progressPercentage}
                onChange={e => setFormData({ ...formData, progressPercentage: e.target.value })}
              />
            </div>
          </div>
        </CModalBody>

        <CModalFooter>
          <CButton
            color="secondary"
            onClick={() => { resetForm(); onClose(); }}
            disabled={submitting}
          >
            Cancel
          </CButton>
          <CButton
            color="primary"
            type="submit"
            disabled={submitting || loadingCategories}
          >
            {submitting ? (
              <>
                <CSpinner size="sm" className="me-2" />
                Adding...
              </>
            ) : (
              'Add Item'
            )}
          </CButton>
        </CModalFooter>
      </CForm>
    </CModal>
  );
};

export default AddItemModal;