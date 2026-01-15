// src/routes/RoleGuard.jsx
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function RoleGuard({ roles = [], children }) {
  const { user } = useAuth()

  if (!user || !roles.includes(user.role)) {
    return <Navigate to="/404" replace /> 
  }

  return children
}
