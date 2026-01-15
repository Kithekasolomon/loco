import { useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import api from '../../../api/axios'
import { useAuth } from '../../../context/AuthContext'

export default function Otp() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const { login } = useAuth()
  const [otp, setOtp] = useState('')

  const submit = async () => {
    const res = await api.post('/api/auth/verify-otp', {
      userId: state.userId,
      otp,
    })

    login(res.data.token)
    navigate('/dashboard')
  }

  return (
    <div className="h-screen flex items-center justify-center">
      <div className="bg-white p-6 rounded w-96">
        <h2 className="text-xl font-bold mb-4">Enter OTP</h2>
        <input
          className="input"
          placeholder="6-digit OTP"
          onChange={(e) => setOtp(e.target.value)}
        />
        <button onClick={submit} className="btn-primary mt-4 w-full">
          Verify
        </button>
      </div>
    </div>
  )
}
