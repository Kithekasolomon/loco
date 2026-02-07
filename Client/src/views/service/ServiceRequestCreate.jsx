// src/views/service/ServiceRequestCreate.jsx
import React, { useState, useEffect } from 'react';
import {
    CCard,
    CCardBody,
    CCardHeader,
    CForm,
    CFormLabel,
    CFormSelect,
    CFormInput,
    CFormTextarea,
    CButton,
    CAlert,
    CSpinner,
} from '@coreui/react';
import api from '../../api/axios'; 

const ServiceRequestCreate = () => {
    const [formData, setFormData] = useState({
        serviceType: '',
        productType: '',
        productBrand: '',
        specifics: '',
        problemType: '',
        expectedTimeline: '',
        comment: '',
        assignedTo: '',
        price: '',
    });

    const [technicians, setTechnicians] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Sample data — in real app you can fetch from backend or keep static
    const serviceTypes = [
        { value: 'REPAIR_MAINTENANCE', label: 'Repair and Maintenance' },
        { value: 'PURCHASE', label: 'Purchase' },
    ];

    const productTypes = [
        'Laptop', 'Desktop', 'Printer', 'Router', 'Server', 'Monitor', 'Projector',
        'POS Machine', 'CCTV Camera', 'Other'
    ];

    // You can make this dynamic later (fetch brands per productType)
    const brandsByProduct = {
        Laptop: ['HP', 'Dell', 'Lenovo', 'Apple', 'Asus', 'Acer'],
        Desktop: ['HP', 'Dell', 'Lenovo', 'Custom Build'],
        Printer: ['HP', 'Canon', 'Epson', 'Brother'],
        // ... add more
    };
    useEffect(() => {
        const fetchTechnicians = async () => {
            try {
                const res = await api.get('/api/users/organization?role=TECHNICIAN');
                console.log("Loaded technicians:", res.data); // ← debug here
                setTechnicians(res.data || []);
            } catch (err) {
                console.error("Failed to load technicians", err.response?.data || err);
                setError("Could not load available technicians");
            }
        };
        fetchTechnicians();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));

        // Optional: reset dependent fields
        if (name === 'productType') {
            setFormData((prev) => ({ ...prev, productBrand: '' }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        // Basic validation
        if (!formData.serviceType) {
            setError('Please select service type');
            setLoading(false);
            return;
        }
        if (formData.serviceType === 'REPAIR_MAINTENANCE' && !formData.problemType) {
            setError('Problem type is required for repair/maintenance');
            setLoading(false);
            return;
        }
        if (!formData.assignedTo) {
            setError('Please assign a technician');
            setLoading(false);
            return;
        }

        try {
            const payload = {
                ...formData,
                price: formData.price ? Number(formData.price) : undefined,
            };

            const res = await api.post('/api/service-requests', payload);

            setSuccess('Service request created successfully! ID: ' + res.data._id);
            // Optional: reset form or redirect
            setFormData({
                serviceType: '',
                productType: '',
                productBrand: '',
                specifics: '',
                problemType: '',
                expectedTimeline: '',
                comment: '',
                assignedTo: '',
                price: '',
            });
        } catch (err) {
            setError(err.response?.data?.msg || 'Failed to create request');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const isRepair = formData.serviceType === 'REPAIR_MAINTENANCE';
    const availableBrands = brandsByProduct[formData.productType] || [];

    return (
        <CCard>
            <CCardHeader>
                <strong>Create Service Request</strong>
            </CCardHeader>
            <CCardBody>
                {error && <CAlert color="danger">{error}</CAlert>}
                {success && <CAlert color="success">{success}</CAlert>}

                <CForm onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <CFormLabel>Service Type *</CFormLabel>
                        <CFormSelect
                            name="serviceType"
                            value={formData.serviceType}
                            onChange={handleChange}
                            required
                        >
                            <option value="">Select...</option>
                            {serviceTypes.map((t) => (
                                <option key={t.value} value={t.value}>
                                    {t.label}
                                </option>
                            ))}
                        </CFormSelect>
                    </div>

                    <div className="mb-3">
                        <CFormLabel>Product Type *</CFormLabel>
                        <CFormSelect
                            name="productType"
                            value={formData.productType}
                            onChange={handleChange}
                            required
                        >
                            <option value="">Select...</option>
                            {productTypes.map((p) => (
                                <option key={p} value={p}>
                                    {p}
                                </option>
                            ))}
                        </CFormSelect>
                    </div>

                    <div className="mb-3">
                        <CFormLabel>Product Brand / Model</CFormLabel>
                        <CFormSelect
                            name="productBrand"
                            value={formData.productBrand}
                            onChange={handleChange}
                            disabled={!formData.productType}
                        >
                            <option value="">Select brand...</option>
                            {availableBrands.map((b) => (
                                <option key={b} value={b}>
                                    {b}
                                </option>
                            ))}
                        </CFormSelect>
                    </div>

                    <div className="mb-3">
                        <CFormLabel>Specifics (model, serial number, etc.)</CFormLabel>
                        <CFormInput
                            name="specifics"
                            value={formData.specifics}
                            onChange={handleChange}
                        />
                    </div>

                    {isRepair && (
                        <div className="mb-3">
                            <CFormLabel>Problem Type *</CFormLabel>
                            <CFormInput
                                name="problemType"
                                value={formData.problemType}
                                onChange={handleChange}
                                placeholder="e.g. No power, Slow performance, Screen cracked"
                                required={isRepair}
                            />
                        </div>
                    )}

                    <div className="mb-3">
                        <CFormLabel>Expected Timeline</CFormLabel>
                        <CFormInput
                            name="expectedTimeline"
                            value={formData.expectedTimeline}
                            onChange={handleChange}
                            placeholder="e.g. Within 3 days, Next week"
                        />
                    </div>

                    <div className="mb-3">
                        <CFormLabel>Additional Comments</CFormLabel>
                        <CFormTextarea
                            name="comment"
                            value={formData.comment}
                            onChange={handleChange}
                            rows={3}
                        />
                    </div>

                    <div className="mb-3">
                        <CFormLabel>Assign Technician *</CFormLabel>
                        <CFormSelect
                            name="assignedTo"
                            value={formData.assignedTo}
                            onChange={handleChange}
                            required
                        >
                            <option value="">Select technician...</option>
                            {technicians.map((tech) => (
                                <option key={tech._id} value={tech._id}>
                                    {tech.firstName} {tech.lastName} ({tech.username})
                                </option>
                            ))}
                        </CFormSelect>
                    </div>

                    <div className="mb-3">
                        <CFormLabel>Estimated Price (optional)</CFormLabel>
                        <CFormInput
                            type="number"
                            name="price"
                            value={formData.price}
                            onChange={handleChange}
                            placeholder="e.g. 4500"
                        />
                    </div>

                    <CButton type="submit" color="primary" disabled={loading}>
                        {loading ? (
                            <>
                                <CSpinner size="sm" /> Submitting...
                            </>
                        ) : (
                            'Submit Request'
                        )}
                    </CButton>
                </CForm>
            </CCardBody>
        </CCard>
    );
};

export default ServiceRequestCreate;