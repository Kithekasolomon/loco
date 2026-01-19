// src/views/notifications/NotificationList.jsx
import React, { useState, useEffect, useCallback } from 'react'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CListGroup,
  CListGroupItem,
  CBadge,
  CButton,
  CAvatar,
  CSpinner,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilBell,
  cilCheckCircle,
  cilXCircle,
  cilUserPlus,
  cilUserX,
  cilPencil,
} from '@coreui/icons'
import { initSocket, getSocket } from '../../../../services/socket'
import { useAuth } from '../../../../context/AuthContext'

const NotificationList = () => {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  // Map action types to icons and colors
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'approval:new':
        return { icon: cilBell, color: 'info' }
      case 'approval:status':
        return { icon: cilCheckCircle, color: 'success' }
      case 'CREATE_USER':
        return { icon: cilUserPlus, color: 'primary' }
      case 'EDIT_USER':
        return { icon: cilPencil, color: 'warning' }
      case 'DEACTIVATE_USER':
        return { icon: cilUserX, color: 'danger' }
      default:
        return { icon: cilBell, color: 'secondary' }
    }
  }

  const getNotificationMessage = (data) => {
    if (data.event === 'approval:new') {
      return `New approval request: ${data.actionType.replace('_', ' ')}`
    }
    if (data.event === 'approval:status') {
      const status = data.status === 'APPROVED' ? 'approved' : 'denied'
      return `Your request (${data.actionType.replace('_', ' ')}) was ${status}`
    }
    return data.message || 'New notification'
  }

  const markAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((notif) => (notif.id === id ? { ...notif, read: true } : notif)),
    )
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })))
  }

  const addNotification = useCallback((data) => {
    const newNotif = {
      id: Date.now() + Math.random(), // temporary ID
      event: data.event || 'unknown',
      message: getNotificationMessage(data),
      type: data.actionType || data.event,
      timestamp: new Date().toISOString(),
      read: false,
      data,
    }

    setNotifications((prev) => [newNotif, ...prev])
  }, [])

  useEffect(() => {
    // Initialize socket on mount
    const socket = initSocket()

    if (socket) {
      // Listen for new approval requests (SUPER_ADMIN)
      socket.on('approval:new', (data) => {
        addNotification({ event: 'approval:new', ...data })
      })

      // Listen for status updates (for the requester)
      socket.on('approval:status', (data) => {
        addNotification({ event: 'approval:status', ...data })
      })

      setLoading(false)
    }

    // Cleanup on unmount
    return () => {
      if (socket) {
        socket.off('approval:new')
        socket.off('approval:status')
      }
    }
  }, [addNotification])

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>
              Notifications{' '}
              {unreadCount > 0 && (
                <CBadge color="danger" className="ms-2">
                  {unreadCount} New
                </CBadge>
              )}
            </strong>
            {unreadCount > 0 && (
              <CButton size="sm" color="link" onClick={markAllAsRead}>
                Mark all as read
              </CButton>
            )}
          </CCardHeader>
          <CCardBody>
            {loading ? (
              <div className="text-center py-5">
                <CSpinner color="primary" />
              </div>
            ) : notifications.length === 0 ? (
              <p className="text-center text-muted py-5">No notifications yet.</p>
            ) : (
              <CListGroup flush>
                {notifications.map((notif) => {
                  const { icon, color } = getNotificationIcon(notif.type)

                  return (
                    <CListGroupItem
                      key={notif.id}
                      className={`d-flex align-items-center border-start-4 border-start-${color} ${
                        !notif.read ? 'bg-light' : ''
                      }`}
                      style={{ cursor: 'pointer' }}
                      onClick={() => markAsRead(notif.id)}
                    >
                      <CAvatar color={color} className="me-3">
                        <CIcon icon={icon} />
                      </CAvatar>
                      <div className="flex-grow-1">
                        <div className="fw-semibold">{notif.message}</div>
                        <small className="text-muted">
                          {new Date(notif.timestamp).toLocaleString()}
                        </small>
                      </div>
                      {!notif.read && (
                        <CBadge color="primary" shape="pill">
                          New
                        </CBadge>
                      )}
                    </CListGroupItem>
                  )
                })}
              </CListGroup>
            )}
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  )
}

export default NotificationList
