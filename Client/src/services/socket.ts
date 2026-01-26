// src/services/socket.js
import { io } from 'socket.io-client'

let socket = null

export const initSocket = () => {
  if (socket) return socket

  socket = io('http:// localhost:5000', {
    auth: {
      token: localStorage.getItem('token') || '', // send JWT so backend can authenticate
    },
    withCredentials: true,
    autoConnect: true,
  })

  socket.on('connect', () => {
    console.log('Socket connected:', socket.id)
  })

  socket.on('connect_error', (err) => {
    console.error('Socket connection error:', err.message)
  })

  return socket
}

export const getSocket = () => {
  if (!socket) {
    console.warn('Socket not initialized yet. Call initSocket first.')
  }
  return socket
}

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
