import { useState, useEffect, useCallback, useRef } from 'react'

const cache = new Map()
const pendingRequests = new Map()

/**
 * Hook customizado para requisições com cache, deduplicação e retry
 * @param {string} url - URL da requisição
 * @param {Object} options - Opções do fetch
 * @param {Object} config - Configurações do hook
 * @returns {Object} { data, loading, error, refetch }
 */
export const useFetch = (url, options = {}, config = {}) => {
  const {
    cacheTime = 60000, // 1 minuto de cache por padrão
    enabled = true,
    retryAttempts = 3,
    retryDelay = 1000,
    onSuccess,
    onError
  } = config

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const mountedRef = useRef(true)
  const abortControllerRef = useRef(null)

  const fetchData = useCallback(async (forceRefresh = false) => {
    if (!url || !enabled) return

    // Verificar cache
    const cacheKey = `${url}-${JSON.stringify(options)}`
    const cachedData = cache.get(cacheKey)

    if (!forceRefresh && cachedData && Date.now() - cachedData.timestamp < cacheTime) {
      setData(cachedData.data)
      setLoading(false)
      return
    }

    // Deduplicação - verificar se já existe requisição em andamento
    if (pendingRequests.has(cacheKey)) {
      try {
        const result = await pendingRequests.get(cacheKey)
        if (mountedRef.current) {
          setData(result)
          setLoading(false)
        }
        return
      } catch (err) {
        if (mountedRef.current) {
          setError(err)
          setLoading(false)
        }
        return
      }
    }

    setLoading(true)
    setError(null)

    // Criar nova AbortController
    abortControllerRef.current = new AbortController()

    // Função de retry com backoff exponencial
    const attemptFetch = async (attempt = 1) => {
      try {
        const response = await fetch(url, {
          ...options,
          signal: abortControllerRef.current.signal
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const result = await response.json()

        // Salvar no cache
        cache.set(cacheKey, {
          data: result,
          timestamp: Date.now()
        })

        if (mountedRef.current) {
          setData(result)
          setLoading(false)
          onSuccess?.(result)
        }

        // Remover da fila de requisições pendentes
        pendingRequests.delete(cacheKey)

        return result
      } catch (err) {
        // Se foi abortado, não fazer retry
        if (err.name === 'AbortError') {
          throw err
        }

        // Retry logic
        if (attempt < retryAttempts) {
          const delay = retryDelay * Math.pow(2, attempt - 1) // Backoff exponencial
          await new Promise(resolve => setTimeout(resolve, delay))
          return attemptFetch(attempt + 1)
        }

        // Após todas as tentativas falharem
        if (mountedRef.current) {
          setError(err)
          setLoading(false)
          onError?.(err)
        }

        pendingRequests.delete(cacheKey)
        throw err
      }
    }

    // Adicionar à fila de requisições pendentes
    const fetchPromise = attemptFetch()
    pendingRequests.set(cacheKey, fetchPromise)

    return fetchPromise
  }, [url, JSON.stringify(options), cacheTime, enabled, retryAttempts, retryDelay])

  useEffect(() => {
    mountedRef.current = true

    if (enabled) {
      fetchData()
    }

    return () => {
      mountedRef.current = false
      // Cancelar requisição em andamento ao desmontar
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [fetchData, enabled])

  const refetch = useCallback(() => {
    return fetchData(true)
  }, [fetchData])

  return {
    data,
    loading,
    error,
    refetch
  }
}

/**
 * Limpa todo o cache
 */
export const clearCache = () => {
  cache.clear()
}

/**
 * Limpa cache de uma URL específica
 */
export const clearCacheForUrl = (url, options = {}) => {
  const cacheKey = `${url}-${JSON.stringify(options)}`
  cache.delete(cacheKey)
}
