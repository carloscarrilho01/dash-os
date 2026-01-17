import { useState, useEffect, useCallback, useMemo, memo } from 'react'
import { API_URL } from '../config/api'
import './Analytics.css'

function Analytics({ socket }) {
  const [metrics, setMetrics] = useState({
    // Conversas
    totalConversations: 0,
    activeConversations: 0,
    unansweredChats: 0,

    // Mensagens
    messagesReceived: 0,
    messagesSent: 0,

    // Tempos
    avgResponseTime: 0,
    maxWaitingTime: 0,
    medianResponseTime: 0,

    // Leads
    leadsWon: 0,
    leadsActive: 0,
    leadsLost: 0,
    leadsTasks: 0,
    leadsWithoutTasks: 0,

    // Detalhes por fonte
    messagesBySource: [],

    // Período
    thisWeek: {
      conversations: 0,
      messages: 0,
      leads: 0
    },
    lastWeek: {
      conversations: 0,
      messages: 0,
      leads: 0
    }
  })

  const [period, setPeriod] = useState('today')
  const [loading, setLoading] = useState(true)

  const fetchMetrics = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/metrics?period=${period}`)
      const data = await response.json()
      setMetrics(data)
      setLoading(false)
    } catch (error) {
      console.error('Erro ao carregar métricas:', error)
      setLoading(false)
    }
  }, [period])

  const handleMetricsUpdated = useCallback((data) => {
    setMetrics(data)
  }, [])

  useEffect(() => {
    fetchMetrics()

    // Atualiza métricas a cada 30 segundos
    const interval = setInterval(fetchMetrics, 30000)

    // Escuta eventos de atualização via WebSocket
    if (socket) {
      socket.on('metrics-updated', handleMetricsUpdated)

      return () => {
        socket.off('metrics-updated', handleMetricsUpdated)
        clearInterval(interval)
      }
    }

    return () => clearInterval(interval)
  }, [fetchMetrics, socket, handleMetricsUpdated])

  const formatTime = useCallback((seconds) => {
    if (seconds < 60) return `${Math.round(seconds)}s`
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`
    return `${Math.round(seconds / 3600)}h`
  }, [])

  const calculatePercentage = useCallback((current, total) => {
    if (total === 0) return 0
    return Math.round((current / total) * 100)
  }, [])

  const getChangeIndicator = useCallback((current, previous) => {
    if (previous === 0) return { value: '+100', positive: true }
    const change = Math.round(((current - previous) / previous) * 100)
    return {
      value: change > 0 ? `+${change}` : `${change}`,
      positive: change >= 0
    }
  }, [])

  const conversationsChange = useMemo(() =>
    getChangeIndicator(
      metrics.thisWeek.conversations,
      metrics.lastWeek.conversations
    ),
    [metrics.thisWeek.conversations, metrics.lastWeek.conversations, getChangeIndicator]
  )

  const messagesChange = useMemo(() =>
    getChangeIndicator(
      metrics.thisWeek.messages,
      metrics.lastWeek.messages
    ),
    [metrics.thisWeek.messages, metrics.lastWeek.messages, getChangeIndicator]
  )

  const leadsChange = useMemo(() =>
    getChangeIndicator(
      metrics.thisWeek.leads,
      metrics.lastWeek.leads
    ),
    [metrics.thisWeek.leads, metrics.lastWeek.leads, getChangeIndicator]
  )

  if (loading) {
    return (
      <div className="analytics-loading">
        <div className="loading-spinner"></div>
        <p>Carregando métricas...</p>
      </div>
    )
  }

  return (
    <div className="analytics-container">
      <div className="analytics-header">
        <h1>Analytics</h1>
        <div className="analytics-filters">
          <button
            className={`filter-button ${period === 'today' ? 'active' : ''}`}
            onClick={() => setPeriod('today')}
          >
            Hoje
          </button>
          <button
            className={`filter-button ${period === 'week' ? 'active' : ''}`}
            onClick={() => setPeriod('week')}
          >
            Semana
          </button>
          <button
            className={`filter-button ${period === 'month' ? 'active' : ''}`}
            onClick={() => setPeriod('month')}
          >
            Mês
          </button>
          <button
            className={`filter-button ${period === 'all' ? 'active' : ''}`}
            onClick={() => setPeriod('all')}
          >
            Todos
          </button>
        </div>
      </div>

      <div className="analytics-grid">
        {/* Mensagens Recebidas */}
        <div className="metric-card primary">
          <div className="metric-header">
            <span className="metric-label">MENSAGENS RECEBIDAS</span>
          </div>
          <div className="metric-value-large">{metrics.messagesReceived}</div>
          <div className="metric-subtitle">esta semana</div>
          <div className="metric-breakdown">
            <div className="breakdown-item">
              <svg viewBox="0 0 24 24" width="14" height="14">
                <path fill="currentColor" d="M17.5,12A1.5,1.5 0 0,1 16,10.5A1.5,1.5 0 0,1 17.5,9A1.5,1.5 0 0,1 19,10.5A1.5,1.5 0 0,1 17.5,12M10,12A1.5,1.5 0 0,1 8.5,10.5A1.5,1.5 0 0,1 10,9A1.5,1.5 0 0,1 11.5,10.5A1.5,1.5 0 0,1 10,12M20,2H4C2.89,2 2,2.89 2,4V22L6,18H20A2,2 0 0,0 22,16V4C22,2.89 21.1,2 20,2Z" />
              </svg>
              <span>WhatsApp Lite</span>
              <span className="breakdown-value">{metrics.messagesBySource.find(s => s.source === 'whatsapp-lite')?.count || 0}</span>
            </div>
            <div className="breakdown-item">
              <svg viewBox="0 0 24 24" width="14" height="14">
                <path fill="currentColor" d="M12,3C6.5,3 2,6.58 2,11C2.05,13.15 3.06,15.17 4.75,16.5C4.75,17.1 4.33,18.67 2,21C4.37,20.89 6.64,20 8.47,18.5C9.61,18.83 10.81,19 12,19C17.5,19 22,15.42 22,11C22,6.58 17.5,3 12,3M12,17C7.58,17 4,14.31 4,11C4,7.69 7.58,5 12,5C16.42,5 20,7.69 20,11C20,14.31 16.42,17 12,17Z" />
              </svg>
              <span>WhatsApp Cloud API</span>
              <span className="breakdown-value">{metrics.messagesBySource.find(s => s.source === 'whatsapp-cloud')?.count || 0}</span>
            </div>
            <div className="breakdown-item">
              <svg viewBox="0 0 24 24" width="14" height="14">
                <path fill="currentColor" d="M16.5,1.5A2.5,2.5 0 0,0 14,4A2.5,2.5 0 0,0 16.5,6.5A2.5,2.5 0 0,0 19,4A2.5,2.5 0 0,0 16.5,1.5M9,3C6.27,3 4,4.66 4,6.73C4,8.79 6.27,10.45 9,10.45C11.73,10.45 14,8.79 14,6.73C14,4.66 11.73,3 9,3M5,11C2.5,11 1,12.5 1,14.5C1,16.5 2.5,18 5,18C7.5,18 9,16.5 9,14.5C9,12.5 7.5,11 5,11M13,11C10.5,11 9,12.5 9,14.5C9,16.5 10.5,18 13,18C15.5,18 17,16.5 17,14.5C17,12.5 15.5,11 13,11M21,13C18.24,13 16,14.9 16,17.23C16,19.56 18.24,21.45 21,21.45C23.76,21.45 26,19.56 26,17.23C26,14.9 23.76,13 21,13Z" />
              </svg>
              <span>Outros</span>
              <span className="breakdown-value">{metrics.messagesBySource.find(s => s.source === 'outros')?.count || 0}</span>
            </div>
          </div>
          <div className="metric-change">
            <span className={`change-indicator ${messagesChange.positive ? 'positive' : 'negative'}`}>
              {messagesChange.value}
            </span>
            <span>esta semana</span>
          </div>
        </div>

        {/* Conversas Ativas */}
        <div className="metric-card secondary">
          <div className="metric-header">
            <span className="metric-label">CONVERSAS ATIVAS</span>
          </div>
          <div className="metric-value">{metrics.activeConversations}</div>
          <div className="metric-change">
            <span className={`change-indicator ${conversationsChange.positive ? 'positive' : 'negative'}`}>
              {conversationsChange.value}
            </span>
            <span>esta semana</span>
          </div>
        </div>

        {/* Chats Sem Resposta */}
        <div className="metric-card tertiary">
          <div className="metric-header">
            <span className="metric-label">CHATS SEM RESPOSTAS</span>
          </div>
          <div className="metric-value">{metrics.unansweredChats}</div>
        </div>

        {/* Fontes de Lead */}
        <div className="metric-card info">
          <div className="metric-header">
            <span className="metric-label">FONTES DE LEAD</span>
          </div>
          <div className="circular-progress">
            <svg viewBox="0 0 200 200" className="progress-ring">
              <circle
                cx="100"
                cy="100"
                r="80"
                fill="none"
                stroke="#1e3a5f"
                strokeWidth="20"
              />
              <circle
                cx="100"
                cy="100"
                r="80"
                fill="none"
                stroke="#f39c12"
                strokeWidth="20"
                strokeDasharray={`${calculatePercentage(metrics.leadsActive, metrics.totalConversations) * 5.03} 502.65`}
                strokeDashoffset="0"
                transform="rotate(-90 100 100)"
              />
            </svg>
            <div className="progress-label">
              <div className="progress-phone">5519941518973</div>
            </div>
          </div>
        </div>

        {/* Tempo de Resposta */}
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">TEMPO DE RESPOSTA</span>
          </div>
          <div className="metric-value time">{formatTime(metrics.avgResponseTime)}</div>
          <div className="metric-subtitle">esta semana</div>
        </div>

        {/* Mais Tempo Esperando */}
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">MAIS TEMPO ESPERANDO</span>
          </div>
          <div className="metric-value time">{formatTime(metrics.maxWaitingTime)}</div>
        </div>

        {/* Leads Ganhos */}
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">LEADS GANHOS</span>
          </div>
          <div className="metric-value">{metrics.leadsWon}</div>
          <div className="metric-subtitle">R$0</div>
          <div className="metric-progress">
            <div className="progress-bar">
              <div
                className="progress-fill green"
                style={{ width: `${calculatePercentage(metrics.leadsWon, metrics.totalConversations)}%` }}
              />
            </div>
          </div>
          <div className="metric-change">
            <span className={`change-indicator ${leadsChange.positive ? 'positive' : 'negative'}`}>
              {leadsChange.value}
            </span>
            <span>esta semana</span>
          </div>
        </div>

        {/* Leads Ativos */}
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">LEADS ATIVOS</span>
          </div>
          <div className="metric-value">{metrics.leadsActive}</div>
          <div className="metric-subtitle">R$0</div>
          <div className="metric-progress">
            <div className="progress-bar">
              <div
                className="progress-fill blue"
                style={{ width: `${calculatePercentage(metrics.leadsActive, metrics.totalConversations)}%` }}
              />
            </div>
          </div>
          <div className="metric-change">
            <span className="change-indicator positive">+307</span>
            <span>esta semana</span>
          </div>
        </div>

        {/* Tarefas */}
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">TAREFAS</span>
          </div>
          <div className="metric-value">{metrics.leadsTasks}</div>
        </div>

        {/* Tempo Médio de Resposta */}
        <div className="metric-card large">
          <div className="metric-header">
            <span className="metric-label">TEMPO MÉDIO DE RESPOSTA</span>
          </div>
          <div className="metric-value-huge time">{formatTime(metrics.medianResponseTime)}</div>
          <div className="metric-subtitle">esta semana</div>
        </div>

        {/* Leads Perdidos */}
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">LEADS PERDIDOS</span>
          </div>
          <div className="metric-value">{metrics.leadsLost}</div>
          <div className="metric-subtitle">R$0</div>
          <div className="metric-progress">
            <div className="progress-bar">
              <div
                className="progress-fill red"
                style={{ width: `${calculatePercentage(metrics.leadsLost, metrics.totalConversations)}%` }}
              />
            </div>
          </div>
          <div className="metric-change">
            <span className="change-indicator positive">0</span>
            <span>esta semana</span>
          </div>
        </div>

        {/* Leads Sem Tarefas */}
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">LEADS SEM TAREFAS</span>
          </div>
          <div className="metric-value">{metrics.leadsWithoutTasks}</div>
          <div className="metric-subtitle">R$0</div>
          <div className="metric-progress">
            <div className="progress-bar">
              <div
                className="progress-fill orange"
                style={{ width: `${calculatePercentage(metrics.leadsWithoutTasks, metrics.totalConversations)}%` }}
              />
            </div>
          </div>
          <div className="metric-change">
            <span className="change-indicator positive">0</span>
            <span>esta semana</span>
          </div>
        </div>

        {/* Mensagens Enviadas */}
        <div className="metric-card full-width">
          <div className="metric-header">
            <span className="metric-label">MENSAGENS ENVIADAS</span>
          </div>
          <div className="metric-value-large">{metrics.messagesSent}</div>
          <div className="metric-subtitle">esta semana</div>
          <div className="metric-breakdown">
            <div className="breakdown-item">
              <svg viewBox="0 0 24 24" width="14" height="14">
                <path fill="currentColor" d="M17.5,12A1.5,1.5 0 0,1 16,10.5A1.5,1.5 0 0,1 17.5,9A1.5,1.5 0 0,1 19,10.5A1.5,1.5 0 0,1 17.5,12M10,12A1.5,1.5 0 0,1 8.5,10.5A1.5,1.5 0 0,1 10,9A1.5,1.5 0 0,1 11.5,10.5A1.5,1.5 0 0,1 10,12M20,2H4C2.89,2 2,2.89 2,4V22L6,18H20A2,2 0 0,0 22,16V4C22,2.89 21.1,2 20,2Z" />
              </svg>
              <span>WhatsApp Lite</span>
              <span className="breakdown-value">{metrics.messagesBySource.find(s => s.source === 'whatsapp-lite')?.sent || 0}</span>
            </div>
            <div className="breakdown-item">
              <svg viewBox="0 0 24 24" width="14" height="14">
                <path fill="currentColor" d="M12,3C6.5,3 2,6.58 2,11C2.05,13.15 3.06,15.17 4.75,16.5C4.75,17.1 4.33,18.67 2,21C4.37,20.89 6.64,20 8.47,18.5C9.61,18.83 10.81,19 12,19C17.5,19 22,15.42 22,11C22,6.58 17.5,3 12,3M12,17C7.58,17 4,14.31 4,11C4,7.69 7.58,5 12,5C16.42,5 20,7.69 20,11C20,14.31 16.42,17 12,17Z" />
              </svg>
              <span>WhatsApp Cloud API</span>
              <span className="breakdown-value">{metrics.messagesBySource.find(s => s.source === 'whatsapp-cloud')?.sent || 0}</span>
            </div>
            <div className="breakdown-item">
              <svg viewBox="0 0 24 24" width="14" height="14">
                <path fill="currentColor" d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z" />
              </svg>
              <span>Bate-papo online</span>
              <span className="breakdown-value">{metrics.messagesBySource.find(s => s.source === 'web-chat')?.sent || 0}</span>
            </div>
            <div className="breakdown-item">
              <svg viewBox="0 0 24 24" width="14" height="14">
                <path fill="currentColor" d="M16.5,1.5A2.5,2.5 0 0,0 14,4A2.5,2.5 0 0,0 16.5,6.5A2.5,2.5 0 0,0 19,4A2.5,2.5 0 0,0 16.5,1.5M9,3C6.27,3 4,4.66 4,6.73C4,8.79 6.27,10.45 9,10.45C11.73,10.45 14,8.79 14,6.73C14,4.66 11.73,3 9,3M5,11C2.5,11 1,12.5 1,14.5C1,16.5 2.5,18 5,18C7.5,18 9,16.5 9,14.5C9,12.5 7.5,11 5,11M13,11C10.5,11 9,12.5 9,14.5C9,16.5 10.5,18 13,18C15.5,18 17,16.5 17,14.5C17,12.5 15.5,11 13,11M21,13C18.24,13 16,14.9 16,17.23C16,19.56 18.24,21.45 21,21.45C23.76,21.45 26,19.56 26,17.23C26,14.9 23.76,13 21,13Z" />
              </svg>
              <span>Outros</span>
              <span className="breakdown-value">{metrics.messagesBySource.find(s => s.source === 'outros')?.sent || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default memo(Analytics)
