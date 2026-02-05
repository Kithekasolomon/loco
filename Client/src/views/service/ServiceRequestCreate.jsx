import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    CForm,
    CFormInput,
    CFormTextarea,
    CFormLabel,
    CButton,
    CCard,
    CCardBody,
    CCardHeader,
    CRow,      
    CCol, 
    CAlert,
    CSpinner,
} from '@coreui/react';
import { createRequest, uploadImage } from '../../services/serviceService';

const ServiceRequestCreate = () => {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        serviceType: '',
        description: '',
        location: '',
        date: '',
        time: '',
        price: '',
    });
    const [imageFile, setImageFile] = useState(null);
    const [imageUrl, setImageUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        if (e.target.files[0]) {
            setImageFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            let uploadedImageUrl = '';
            if (imageFile) {
                uploadedImageUrl = await uploadImage(imageFile);
                setImageUrl(uploadedImageUrl);
            }

            const payload = { ...form, image: uploadedImageUrl };
            await createRequest(payload);
            setSuccess('Request created successfully!');
            setTimeout(() => navigate('/requests'), 1500);
        } catch (err) {
            setError(err.message || 'Failed to submit');
        } finally {
            setLoading(false);
        }
    };

    return (
        <CCard>
            <CCardHeader>Create New Service Request</CCardHeader>
            <CCardBody>
                {error && <CAlert color="danger">{error}</CAlert>}
                {success && <CAlert color="success">{success}</CAlert>}

                <CForm onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <CFormLabel>Service Type</CFormLabel>
                        <CFormInput name="serviceType" value={form.serviceType} onChange={handleChange} required />
                    </div>

                    <div className="mb-3">
                        <CFormLabel>Description</CFormLabel>
                        <CFormTextarea name="description" rows={4} value={form.description} onChange={handleChange} required />
                    </div>

                    <div className="mb-3">
                        <CFormLabel>Location</CFormLabel>
                        <CFormInput name="location" value={form.location} onChange={handleChange} required />
                    </div>

                    <CRow>
                        <CCol md={6}>
                            <div className="mb-3">
                                <CFormLabel>Date</CFormLabel>
                                <CFormInput type="date" name="date" value={form.date} onChange={handleChange} required />
                            </div>
                        </CCol>
                        <CCol md={6}>
                            <div className="mb-3">
                                <CFormLabel>Time</CFormLabel>
                                <CFormInput type="time" name="time" value={form.time} onChange={handleChange} />
                            </div>
                        </CCol>
                    </CRow>

                    <div className="mb-3">
                        <CFormLabel>Expected Price (KES, optional)</CFormLabel>
                        <CFormInput type="number" name="price" value={form.price} onChange={handleChange} />
                    </div>

                    <div className="mb-3">
                        <CFormLabel>Upload Photo (issue/product)</CFormLabel>
                        <CFormInput type="file" accept="image/*" onChange={handleFileChange} />
                        {imageUrl && <img src={imageUrl} alt="preview" style={{ maxWidth: '200px', marginTop: '10px' }} />}
                    </div>

                    <CButton type="submit" color="primary" disabled={loading}>
                        {loading ? <CSpinner size="sm" /> : 'Submit Request'}
                    </CButton>
                </CForm>
            </CCardBody>
        </CCard>
    );
};

export default ServiceRequestCreate;