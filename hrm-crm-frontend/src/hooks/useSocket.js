import { useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import { useAuthStore } from '@/store/auth.store'

export const useSocket = () => {
  const socketRef = useRef(null)
  const { accessToken } = useAuthStore()

  useEffect(() => {
    if (!accessToken) return

    socketRef.current = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
      auth: { token: accessToken },
    })

    socketRef.current.on('connect', () => console.log('Socket connected'))
    socketRef.current.on('disconnect', () => console.log('Socket disconnected'))

    return () => {
      socketRef.current?.disconnect()
    }
  }, [accessToken])

  return socketRef.current
}
