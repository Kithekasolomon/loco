import { useState } from 'react'
import api from '../../api/axios'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const [form, setForm] = useState({ username: '', password: '' })
  const navigate = useNavigate()

  const submit = async (e) => {
    e.preventDefault()
    const res = await api.post('/login', form)
    navigate('/otp', { state: { userId: res.data.userId } })
  }

  return (
    <div className="h-screen flex items-center justify-center bg-gray-100">
      <form className="bg-white p-6 rounded w-96" onSubmit={submit}>
        <h2 className="text-xl font-bold mb-4">Login</h2>
        <input
          className="input"
          placeholder="Username"
          onChange={(e) => setForm({ ...form, username: e.target.value })}
        />
        <input
          type="password"
          className="input mt-3"
          placeholder="Password"
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <button className="btn-primary mt-4 w-full">Login</button>
      </form>
    </div>
  )
}
