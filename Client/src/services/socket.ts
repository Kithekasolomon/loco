// src/services/socket.js
import { io } from 'socket.io-client';

let socket = null;

export const initSocket = () => {
  if (socket) return socket;

  const token = localStorage.getItem('token');
  if (!token) return null;

  socket = io('http://localhost:5000', {
    auth: { token },
  });

  socket.on('connect', () => {
    console.log('Socket connected for notifications');
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected');
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) socket.disconnect();
  socket = null;
};