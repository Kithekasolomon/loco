import React, { useState } from 'react'
import {
  CAvatar,
  CBadge,
  CDropdown,
  CDropdownDivider,
  CDropdownHeader,
  CDropdownItem,
  CDropdownMenu,
  CDropdownToggle,
  CSpinner,
} from '@coreui/react'
import {
  cilBell,
  cilCreditCard,
  cilCommentSquare,
  cilEnvelopeOpen,
  cilFile,
  cilLockLocked,
  cilSettings,
  cilTask,
  cilUser,
} from '@coreui/icons'
import CIcon from '@coreui/icons-react'
import { useNavigate } from 'react-router-dom'

import avatar8 from './../../assets/images/avatars/8.jpg'

const AppHeaderDropdown = () => {
  const navigate = useNavigate()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)

    try {
      // Optional: Call your backend logout endpoint if you have one
      // await api.post('/logout')

      // Small delay so the loader is visible (feels more natural)
      await new Promise((resolve) => setTimeout(resolve, 1000))
    } catch (error) {
      console.error('Error during logout:', error)
    } finally {
      // Clear the authentication token
      localStorage.removeItem('token')

      // Optional: clear other stored user data
      // localStorage.removeItem('user')
      // localStorage.clear()

      // Redirect to login page (replace history to prevent back navigation)
      navigate('/login', { replace: true })
    }
  }

  return (
    <>
      <CDropdown variant="nav-item">
        <CDropdownToggle placement="bottom-end" className="py-0 pe-0" caret={false}>
          <CAvatar src={avatar8} size="md" />
        </CDropdownToggle>
        <CDropdownMenu className="pt-0" placement="bottom-end">
          <CDropdownHeader className="bg-body-secondary fw-semibold mb-2">Account</CDropdownHeader>

          <CDropdownItem href="#">
            <CIcon icon={cilBell} className="me-2" />
            Updates
            <CBadge color="info" className="ms-2">
              42
            </CBadge>
          </CDropdownItem>

          <CDropdownItem href="#">
            <CIcon icon={cilEnvelopeOpen} className="me-2" />
            Messages
            <CBadge color="success" className="ms-2">
              42
            </CBadge>
          </CDropdownItem>

          <CDropdownItem href="#">
            <CIcon icon={cilTask} className="me-2" />
            Tasks
            <CBadge color="danger" className="ms-2">
              42
            </CBadge>
          </CDropdownItem>

          <CDropdownItem href="#">
            <CIcon icon={cilCommentSquare} className="me-2" />
            Comments
            <CBadge color="warning" className="ms-2">
              42
            </CBadge>
          </CDropdownItem>

          <CDropdownHeader className="bg-body-secondary fw-semibold my-2">Settings</CDropdownHeader>

          <CDropdownItem href="#">
            <CIcon icon={cilUser} className="me-2" />
            Profile
          </CDropdownItem>

          <CDropdownItem href="#">
            <CIcon icon={cilSettings} className="me-2" />
            Settings
          </CDropdownItem>

          <CDropdownItem href="#">
            <CIcon icon={cilCreditCard} className="me-2" />
            Payments
            <CBadge color="secondary" className="ms-2">
              42
            </CBadge>
          </CDropdownItem>

          <CDropdownItem href="#">
            <CIcon icon={cilFile} className="me-2" />
            Projects
            <CBadge color="primary" className="ms-2">
              42
            </CBadge>
          </CDropdownItem>

          <CDropdownDivider />

          <CDropdownItem
            onClick={handleLogout}
            disabled={isLoggingOut}
            style={{ cursor: isLoggingOut ? 'not-allowed' : 'pointer' }}
          >
            <CIcon icon={cilLockLocked} className="me-2" />
            {isLoggingOut ? (
              <>
                <CSpinner size="sm" className="me-2" />
                Logging you out...
              </>
            ) : (
              'Log Out'
            )}
          </CDropdownItem>
        </CDropdownMenu>
      </CDropdown>

      {/* Full-screen loading overlay - appears only during logout */}
      {isLoggingOut && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            color: 'white',
            fontSize: '1.8rem',
            fontWeight: '500',
          }}
        >
          <CSpinner color="light" size="lg" className="mb-4" />
          <div>Logging you out securely...</div>
          <div style={{ fontSize: '1rem', marginTop: '1rem', opacity: 0.8 }}>
            Please wait a moment
          </div>
        </div>
      )}
    </>
  )
}

export default AppHeaderDropdown
