import { useRef, useCallback } from 'react'

/**
 * Hook para gerenciar cache de conversas carregadas
 * Evita carregar a mesma conversa múltiplas vezes
 */
export const useConversationCache = () => {
  const cache = useRef(new Map())
  const loadingCache = useRef(new Set())

  /**
   * Verifica se uma conversa está em cache
   */
  const has = useCallback((userId) => {
    return cache.current.has(userId)
  }, [])

  /**
   * Obtém uma conversa do cache
   */
  const get = useCallback((userId) => {
    return cache.current.get(userId)
  }, [])

  /**
   * Armazena uma conversa no cache
   */
  const set = useCallback((userId, conversation) => {
    cache.current.set(userId, {
      data: conversation,
      timestamp: Date.now()
    })
  }, [])

  /**
   * Remove uma conversa do cache
   */
  const remove = useCallback((userId) => {
    cache.current.delete(userId)
  }, [])

  /**
   * Limpa todo o cache
   */
  const clear = useCallback(() => {
    cache.current.clear()
    loadingCache.current.clear()
  }, [])

  /**
   * Verifica se uma conversa está sendo carregada
   */
  const isLoading = useCallback((userId) => {
    return loadingCache.current.has(userId)
  }, [])

  /**
   * Marca uma conversa como carregando
   */
  const setLoading = useCallback((userId) => {
    loadingCache.current.add(userId)
  }, [])

  /**
   * Remove marca de carregamento
   */
  const clearLoading = useCallback((userId) => {
    loadingCache.current.delete(userId)
  }, [])

  /**
   * Atualiza mensagens de uma conversa no cache
   */
  const updateMessages = useCallback((userId, newMessages) => {
    const cached = cache.current.get(userId)
    if (cached) {
      cache.current.set(userId, {
        ...cached,
        data: {
          ...cached.data,
          messages: newMessages
        }
      })
    }
  }, [])

  /**
   * Verifica se o cache está muito antigo (> 5 minutos)
   */
  const isStale = useCallback((userId, maxAge = 5 * 60 * 1000) => {
    const cached = cache.current.get(userId)
    if (!cached) return true
    return Date.now() - cached.timestamp > maxAge
  }, [])

  return {
    has,
    get,
    set,
    remove,
    clear,
    isLoading,
    setLoading,
    clearLoading,
    updateMessages,
    isStale
  }
}
