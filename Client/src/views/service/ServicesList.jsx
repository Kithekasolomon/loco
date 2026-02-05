import React, { useEffect, useState } from 'react';
import { CCard, CCardBody, CCardHeader, CRow, CCol, CSpinner, CImage } from '@coreui/react';
import { getServices } from '../../services/serviceService';

const ServicesList = () => {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchServices = async () => {
            try {
                const data = await getServices();
                setServices(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchServices();
    }, []);

    if (loading) return <CSpinner color="primary" />;
    if (error) return <div className="text-danger">{error}</div>;

    return (
        <>
            <CCardHeader>
                <h4>Available Services</h4>
            </CCardHeader>
            <CRow>
                {services.map((svc) => (
                    <CCol md={4} key={svc._id} className="mb-4">
                        <CCard>
                            {svc.image && <CImage fluid src={svc.image} alt={svc.name} />}
                            <CCardBody>
                                <h5>{svc.name}</h5>
                                <p>{svc.description}</p>
                                <p><strong>Category:</strong> {svc.category}</p>
                                {svc.basePrice && <p><strong>Starting from:</strong> KES {svc.basePrice.toLocaleString()}</p>}
                            </CCardBody>
                        </CCard>
                    </CCol>
                ))}
            </CRow>
        </>
    );
};

export default ServicesList;