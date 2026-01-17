import { useEffect, useRef, useCallback } from 'react'
import { io } from 'socket.io-client'
import { API_URL } from '../config/api'

let socketInstance = null

/**
 * Hook centralizado para gerenciar conexão Socket.IO
 * Singleton pattern para evitar múltiplas conexões
 */
export const useSocket = () => {
  const socketRef = useRef(null)

  useEffect(() => {
    if (!socketInstance) {
      socketInstance = io(API_URL, {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
        transports: ['websocket', 'polling']
      })

      socketInstance.on('connect', () => {
        console.log('🔌 Socket conectado')
      })

      socketInstance.on('disconnect', (reason) => {
        console.log('🔌 Socket desconectado:', reason)
        if (reason === 'io server disconnect') {
          // Servidor desconectou, tentar reconectar manualmente
          socketInstance.connect()
        }
      })

      socketInstance.on('connect_error', (error) => {
        console.error('❌ Erro de conexão Socket:', error)
      })
    }

    socketRef.current = socketInstance
  }, [])

  const on = useCallback((event, handler) => {
    if (socketRef.current) {
      socketRef.current.on(event, handler)
    }
  }, [])

  const off = useCallback((event, handler) => {
    if (socketRef.current) {
      socketRef.current.off(event, handler)
    }
  }, [])

  const emit = useCallback((event, data) => {
    if (socketRef.current) {
      socketRef.current.emit(event, data)
    }
  }, [])

  return {
    socket: socketRef.current,
    on,
    off,
    emit,
    isConnected: socketRef.current?.connected ?? false
  }
}
