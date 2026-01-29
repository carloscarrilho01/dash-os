import { memo, useCallback, useState, useMemo } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { formatConversationTime } from '../utils/dateFormatters'
import './Sidebar.css'

function Sidebar({ conversations, selectedConversation, onSelectConversation, loading, onNewConversation, onNavigateToCRM, onNavigateToAnalytics, onNavigateToStock, onNavigateToOS, labels = [], onManageLabels }) {
  const { signOut } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const [filterLabelId, setFilterLabelId] = useState(null)
  const [showLabelFilter, setShowLabelFilter] = useState(false)
  const [activeTab, setActiveTab] = useState('all') // 'all' ou 'on-hold'

  // Cria um mapa de labels para acesso rápido
  const labelsMap = labels.reduce((acc, label) => {
    acc[label.id] = label
    return acc
  }, {})

  // Contagem de conversas em espera (usando trava do lead)
  const onHoldCount = useMemo(() =>
    conversations.filter(c => c.trava).length,
    [conversations]
  )

  // Filtra conversas por aba e etiqueta
  const filteredConversations = useMemo(() => {
    let filtered = conversations

    // Filtro por aba (todos ou em espera - usa trava do lead)
    if (activeTab === 'on-hold') {
      filtered = filtered.filter(c => c.trava)
    }

    // Filtro por etiqueta
    if (filterLabelId) {
      filtered = filtered.filter(c => c.labelId === filterLabelId)
    }

    return filtered
  }, [conversations, activeTab, filterLabelId])

  const formatTime = useCallback((timestamp) => {
    try {
      return formatConversationTime(timestamp)
    } catch {
      return ''
    }
  }, [])

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>IA Conversa</h2>
        <div className="sidebar-header-actions">
          <button
            className="icon-button analytics-btn"
            onClick={onNavigateToAnalytics}
            title="Analytics"
          >
            <svg viewBox="0 0 24 24" width="24" height="24">
              <path fill="currentColor" d="M16,11.78L20.24,4.45L21.97,5.45L16.74,14.5L10.23,10.75L5.46,19H22V21H2V3H4V17.54L9.5,8L16,11.78Z" />
            </svg>
          </button>
          <button
            className="icon-button crm-btn"
            onClick={onNavigateToCRM}
            title="CRM Kanban"
          >
            <svg viewBox="0 0 24 24" width="24" height="24">
              <path fill="currentColor" d="M3,3H11V11H3V3M13,3H21V11H13V3M3,13H11V21H3V13M13,13H21V21H13V13Z" />
            </svg>
          </button>
          <button
            className="icon-button stock-btn"
            onClick={onNavigateToStock}
            title="Estoque de Produtos"
          >
            <svg viewBox="0 0 24 24" width="24" height="24">
              <path fill="currentColor" d="M19,18H6V8H19M19,6H6V4H19M3,14H4V20H20V14H21V20A1,1 0 0,1 20,21H4A1,1 0 0,1 3,20V14M16,8V10H14V12H12V10H10V8H12V6H14V8H16Z" />
            </svg>
          </button>
          <button
            className="icon-button os-btn"
            onClick={onNavigateToOS}
            title="Ordens de Servico"
          >
            <svg viewBox="0 0 24 24" width="24" height="24">
              <path fill="currentColor" d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20M9,13V18H7V13H9M15,15V18H13V15H15M11,11V18H13V11H11Z" />
            </svg>
          </button>
          <button
            className="icon-button labels-btn"
            onClick={onManageLabels}
            title="Gerenciar Etiquetas"
          >
            <svg viewBox="0 0 24 24" width="24" height="24">
              <path fill="currentColor" d="M5.5,7A1.5,1.5 0 0,1 4,5.5A1.5,1.5 0 0,1 5.5,4A1.5,1.5 0 0,1 7,5.5A1.5,1.5 0 0,1 5.5,7M21.41,11.58L12.41,2.58C12.05,2.22 11.55,2 11,2H4C2.89,2 2,2.89 2,4V11C2,11.55 2.22,12.05 2.59,12.41L11.58,21.41C11.95,21.77 12.45,22 13,22C13.55,22 14.05,21.77 14.41,21.41L21.41,14.41C21.78,14.05 22,13.55 22,13C22,12.44 21.77,11.94 21.41,11.58Z" />
            </svg>
          </button>
          <button
            className="icon-button theme-toggle-btn"
            onClick={toggleTheme}
            title={isDark ? 'Modo Claro' : 'Modo Escuro'}
          >
            {isDark ? (
              <svg viewBox="0 0 24 24" width="24" height="24">
                <path fill="currentColor" d="M12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,2L14.39,5.42C13.65,5.15 12.84,5 12,5C11.16,5 10.35,5.15 9.61,5.42L12,2M3.34,7L7.5,6.65C6.9,7.16 6.36,7.78 5.94,8.5C5.5,9.24 5.25,10 5.11,10.79L3.34,7M3.36,17L5.12,13.23C5.26,14 5.53,14.78 5.95,15.5C6.37,16.24 6.91,16.86 7.5,17.37L3.36,17M20.65,7L18.88,10.79C18.74,10 18.47,9.23 18.05,8.5C17.63,7.78 17.1,7.15 16.5,6.64L20.65,7M20.64,17L16.5,17.36C17.09,16.85 17.62,16.22 18.04,15.5C18.46,14.77 18.73,14 18.87,13.21L20.64,17M12,22L9.59,18.56C10.33,18.83 11.14,19 12,19C12.82,19 13.63,18.83 14.37,18.56L12,22Z" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="24" height="24">
                <path fill="currentColor" d="M17.75,4.09L15.22,6.03L16.13,9.09L13.5,7.28L10.87,9.09L11.78,6.03L9.25,4.09L12.44,4L13.5,1L14.56,4L17.75,4.09M21.25,11L19.61,12.25L20.2,14.23L18.5,13.06L16.8,14.23L17.39,12.25L15.75,11L17.81,10.95L18.5,9L19.19,10.95L21.25,11M18.97,15.95C19.8,15.87 20.69,17.05 20.16,17.8C19.84,18.25 19.5,18.67 19.08,19.07C15.17,23 8.84,23 4.94,19.07C1.03,15.17 1.03,8.83 4.94,4.93C5.34,4.53 5.76,4.17 6.21,3.85C6.96,3.32 8.14,4.21 8.06,5.04C7.79,7.9 8.75,10.87 10.95,13.06C13.14,15.26 16.1,16.22 18.97,15.95M17.33,17.97C14.5,17.81 11.7,16.64 9.53,14.5C7.36,12.31 6.2,9.5 6.04,6.68C3.23,9.82 3.34,14.64 6.35,17.66C9.37,20.67 14.19,20.78 17.33,17.97Z" />
              </svg>
            )}
          </button>
          <button
            className="icon-button new-conversation-btn"
            onClick={onNewConversation}
            title="Nova Conversa"
          >
            <svg viewBox="0 0 24 24" width="24" height="24">
              <path fill="currentColor" d="M20,2H4A2,2 0 0,0 2,4V22L6,18H20A2,2 0 0,0 22,16V4A2,2 0 0,0 20,2M11,13H9V11H7V9H9V7H11V9H13V11H11V13Z" />
            </svg>
          </button>
          <button
            className="icon-button logout-btn"
            onClick={signOut}
            title="Sair"
          >
            <svg viewBox="0 0 24 24" width="24" height="24">
              <path fill="currentColor" d="M16,17V14H9V10H16V7L21,12L16,17M14,2A2,2 0 0,1 16,4V6H14V4H5V20H14V18H16V20A2,2 0 0,1 14,22H5A2,2 0 0,1 3,20V4A2,2 0 0,1 5,2H14Z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Abas de filtro principal */}
      <div className="sidebar-tabs">
        <button
          className={`sidebar-tab ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          Todos
        </button>
        <button
          className={`sidebar-tab ${activeTab === 'on-hold' ? 'active' : ''}`}
          onClick={() => setActiveTab('on-hold')}
        >
          Em espera
          {onHoldCount > 0 && (
            <span className="tab-count">{onHoldCount}</span>
          )}
        </button>
      </div>

      <div className="sidebar-search">
        <div className="search-box">
          <svg viewBox="0 0 24 24" width="20" height="20" className="search-icon">
            <path fill="currentColor" d="M15.5,14H14.71L14.43,13.73C15.41,12.59 16,11.11 16,9.5C16,5.91 13.09,3 9.5,3C5.91,3 3,5.91 3,9.5C3,13.09 5.91,16 9.5,16C11.11,16 12.59,15.41 13.73,14.43L14,14.71V15.5L19,20.5L20.5,19L15.5,14M9.5,14C7.01,14 5,11.99 5,9.5C5,7.01 7.01,5 9.5,5C11.99,5 14,7.01 14,9.5C14,11.99 11.99,14 9.5,14Z" />
          </svg>
          <input type="text" placeholder="Pesquisar conversas" />
          {labels.length > 0 && (
            <button
              className={`filter-label-btn ${showLabelFilter ? 'active' : ''}`}
              onClick={() => setShowLabelFilter(!showLabelFilter)}
              title="Filtrar por etiqueta"
            >
              <svg viewBox="0 0 24 24" width="18" height="18">
                <path fill="currentColor" d="M14,12V19.88C14.04,20.18 13.94,20.5 13.71,20.71C13.32,21.1 12.69,21.1 12.3,20.71L10.29,18.7C10.06,18.47 9.96,18.16 10,17.87V12H9.97L4.21,4.62C3.87,4.19 3.95,3.56 4.38,3.22C4.57,3.08 4.78,3 5,3H19C19.22,3 19.43,3.08 19.62,3.22C20.05,3.56 20.13,4.19 19.79,4.62L14.03,12H14Z" />
              </svg>
            </button>
          )}
        </div>

        {/* Filtro por etiquetas */}
        {showLabelFilter && labels.length > 0 && (
          <div className="label-filter-bar">
            <button
              className={`label-filter-chip ${filterLabelId === null ? 'active' : ''}`}
              onClick={() => setFilterLabelId(null)}
            >
              Todas
            </button>
            {labels.map(label => (
              <button
                key={label.id}
                className={`label-filter-chip ${filterLabelId === label.id ? 'active' : ''}`}
                onClick={() => setFilterLabelId(label.id)}
                style={{
                  '--label-color': label.color,
                  backgroundColor: filterLabelId === label.id ? label.color : undefined
                }}
              >
                <span className="chip-dot" style={{ backgroundColor: label.color }} />
                {label.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="conversations-list">
        {loading ? (
          <div className="loading">Carregando conversas...</div>
        ) : filteredConversations.length === 0 ? (
          <div className="empty-state">
            {activeTab === 'on-hold' ? (
              <>
                <p>Nenhuma conversa em espera</p>
                <small>Conversas marcadas como "em espera" aparecerao aqui</small>
              </>
            ) : filterLabelId ? (
              <>
                <p>Nenhuma conversa com esta etiqueta</p>
                <small>Remova o filtro para ver todas as conversas</small>
              </>
            ) : (
              <>
                <p>Nenhuma conversa ainda</p>
                <small>As conversas do n8n aparecerao aqui</small>
              </>
            )}
          </div>
        ) : (
          filteredConversations.map((conversation) => {
            const conversationLabel = conversation.labelId ? labelsMap[conversation.labelId] : null
            return (
              <div
                key={conversation.userId}
                className={`conversation-item ${
                  selectedConversation?.userId === conversation.userId ? 'active' : ''
                } ${conversation.trava ? 'on-hold' : ''}`}
                onClick={() => onSelectConversation(conversation)}
              >
                <div className="conversation-avatar">
                  <svg viewBox="0 0 24 24" width="40" height="40">
                    <path fill="currentColor" d="M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z" />
                  </svg>
                </div>

                <div className="conversation-info">
                  <div className="conversation-header">
                    <h3 className="conversation-name">{conversation.userName}</h3>
                    <span className="conversation-time">
                      {formatTime(conversation.lastTimestamp)}
                    </span>
                  </div>
                  {conversationLabel && (
                    <div className="conversation-label">
                      <span
                        className="label-badge-small"
                        style={{ backgroundColor: conversationLabel.color }}
                      >
                        {conversationLabel.name}
                      </span>
                    </div>
                  )}
                  <div className="conversation-preview">
                    <p className="last-message">{conversation.lastMessage}</p>
                    {conversation.unread > 0 && (
                      <span className="unread-badge">{conversation.unread}</span>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default memo(Sidebar)
