import React, { useState } from 'react'
import {
  CButton,
  CCard,
  CCardBody,
  CCardGroup,
  CCol,
  CContainer,
  CForm,
  CFormInput,
  CRow,
} from '@coreui/react'
import { useNavigate } from 'react-router-dom'
import api from '../../../api/axios'

const Login = () => {
  const [form, setForm] = useState({ username: '', password: '' })
  const navigate = useNavigate()

  const submit = async (e) => {
    e.preventDefault()

    const res = await api.post('/api/auth/login', form)

    navigate('/otp', {
      state: { userId: res.data.userId },
    })
  }

  return (
    <div className="bg-light min-vh-100 d-flex flex-row align-items-center">
      <CContainer>
        <CRow className="justify-content-center">
          <CCol md={8}>
            <CCardGroup>
              <CCard className="p-4">
                <CCardBody>
                  <CForm onSubmit={submit}>
                    <h1>Login</h1>
                    <p className="text-medium-emphasis">Sign In</p>

                    <CFormInput
                      placeholder="Username"
                      className="mb-3"
                      onChange={(e) => setForm({ ...form, username: e.target.value })}
                    />

                    <CFormInput
                      type="password"
                      placeholder="Password"
                      className="mb-4"
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                    />

                    <CButton type="submit" color="primary">
                      Login
                    </CButton>
                  </CForm>
                </CCardBody>
              </CCard>
            </CCardGroup>
          </CCol>
        </CRow>
      </CContainer>
    </div>
  )
}

export default Login
