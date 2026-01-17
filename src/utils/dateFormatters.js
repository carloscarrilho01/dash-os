import { format, isToday, isYesterday } from 'date-fns'
import { ptBR } from 'date-fns/locale'

/**
 * Formata timestamp para exibição em mensagens
 * @param {string|number|Date} timestamp
 * @returns {string}
 */
export const formatMessageTime = (timestamp) => {
  const date = new Date(timestamp)

  if (isToday(date)) {
    return format(date, 'HH:mm')
  } else if (isYesterday(date)) {
    return `Ontem às ${format(date, 'HH:mm')}`
  } else {
    return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
  }
}

/**
 * Formata timestamp para exibição em listas
 * @param {string|number|Date} timestamp
 * @returns {string}
 */
export const formatConversationTime = (timestamp) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'agora'
  if (diffMins < 60) return `há ${diffMins} min`
  if (diffHours < 24) return `há ${diffHours}h`
  if (diffDays < 7) return `há ${diffDays}d`

  return format(date, 'dd/MM/yyyy', { locale: ptBR })
}

/**
 * Formata tamanho de arquivo
 * @param {number} bytes
 * @returns {string}
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}
