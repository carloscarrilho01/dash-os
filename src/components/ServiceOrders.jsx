import { useState, useEffect, useCallback, memo } from 'react'
import { API_URL } from '../config/api'
import OSPdfGenerator from './OSPdfGenerator'
import './ServiceOrders.css'

const STATUS_LABELS = {
  aberta: 'Aberta',
  em_andamento: 'Em Andamento',
  aguardando_peca: 'Aguardando Peca',
  aguardando_aprovacao: 'Aguardando Aprovacao',
  aprovada: 'Aprovada',
  concluida: 'Concluida',
  entregue: 'Entregue',
  cancelada: 'Cancelada'
}

const STATUS_COLORS = {
  aberta: '#3498db',
  em_andamento: '#f39c12',
  aguardando_peca: '#9b59b6',
  aguardando_aprovacao: '#e67e22',
  aprovada: '#2ecc71',
  concluida: '#27ae60',
  entregue: '#1abc9c',
  cancelada: '#e74c3c'
}

const PRIORIDADE_LABELS = {
  baixa: 'Baixa',
  normal: 'Normal',
  alta: 'Alta',
  urgente: 'Urgente'
}

const PRIORIDADE_COLORS = {
  baixa: '#95a5a6',
  normal: '#3498db',
  alta: '#e67e22',
  urgente: '#e74c3c'
}

function ServiceOrders({ socket }) {
  const [orders, setOrders] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showPdf, setShowPdf] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [filterStatus, setFilterStatus] = useState('')
  const [filterPrioridade, setFilterPrioridade] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState('list') // 'list' ou 'detail'

  const fetchOrders = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (filterStatus) params.append('status', filterStatus)
      if (filterPrioridade) params.append('prioridade', filterPrioridade)
      if (searchTerm) params.append('search', searchTerm)

      const response = await fetch(`${API_URL}/api/service-orders?${params}`)
      const data = await response.json()
      setOrders(data)
      setLoading(false)
    } catch (error) {
      console.error('Erro ao buscar OS:', error)
      setLoading(false)
    }
  }, [filterStatus, filterPrioridade, searchTerm])

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/service-orders/stats`)
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Erro ao buscar stats:', error)
    }
  }, [])

  useEffect(() => {
    fetchOrders()
    fetchStats()
  }, [fetchOrders, fetchStats])

  // WebSocket listeners
  useEffect(() => {
    if (!socket) return

    const handleCreated = (order) => {
      setOrders(prev => [order, ...prev])
      fetchStats()
    }

    const handleUpdated = (order) => {
      setOrders(prev => prev.map(o => o.id === order.id ? order : o))
      if (selectedOrder?.id === order.id) {
        setSelectedOrder(order)
      }
      fetchStats()
    }

    const handleStatusUpdated = (data) => {
      setOrders(prev => prev.map(o => o.id === data.id ? { ...o, ...data } : o))
      if (selectedOrder?.id === data.id) {
        setSelectedOrder(prev => ({ ...prev, ...data }))
      }
      fetchStats()
    }

    const handleDeleted = ({ id }) => {
      setOrders(prev => prev.filter(o => o.id !== id))
      if (selectedOrder?.id === id) {
        setSelectedOrder(null)
        setViewMode('list')
      }
      fetchStats()
    }

    socket.on('os-created', handleCreated)
    socket.on('os-updated', handleUpdated)
    socket.on('os-status-updated', handleStatusUpdated)
    socket.on('os-deleted', handleDeleted)

    return () => {
      socket.off('os-created', handleCreated)
      socket.off('os-updated', handleUpdated)
      socket.off('os-status-updated', handleStatusUpdated)
      socket.off('os-deleted', handleDeleted)
    }
  }, [socket, selectedOrder, fetchStats])

  const handleCreate = useCallback(() => {
    setSelectedOrder(null)
    setShowModal(true)
  }, [])

  const handleEdit = useCallback((order) => {
    setSelectedOrder(order)
    setShowModal(true)
  }, [])

  const handleView = useCallback((order) => {
    setSelectedOrder(order)
    setViewMode('detail')
  }, [])

  const handlePrint = useCallback((order) => {
    setSelectedOrder(order)
    setShowPdf(true)
  }, [])

  const handleDelete = useCallback(async (id) => {
    if (!confirm('Tem certeza que deseja excluir esta OS?')) return

    try {
      await fetch(`${API_URL}/api/service-orders/${id}`, { method: 'DELETE' })
    } catch (error) {
      console.error('Erro ao deletar OS:', error)
    }
  }, [])

  const handleStatusChange = useCallback(async (id, newStatus) => {
    try {
      await fetch(`${API_URL}/api/service-orders/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
    }
  }, [])

  const handleSave = useCallback(async (osData) => {
    try {
      const method = osData.id ? 'PUT' : 'POST'
      const url = osData.id
        ? `${API_URL}/api/service-orders/${osData.id}`
        : `${API_URL}/api/service-orders`

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(osData)
      })

      if (response.ok) {
        setShowModal(false)
        fetchOrders()
        fetchStats()
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Erro ao salvar OS')
      }
    } catch (error) {
      console.error('Erro ao salvar OS:', error)
      alert('Erro de conexao ao salvar OS')
    }
  }, [fetchOrders, fetchStats])

  const formatDate = useCallback((date) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }, [])

  const formatCurrency = useCallback((value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0)
  }, [])

  if (viewMode === 'detail' && selectedOrder) {
    return (
      <div className="os-detail-view">
        <div className="os-detail-header">
          <button className="os-back-btn" onClick={() => setViewMode('list')}>
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path fill="currentColor" d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z" />
            </svg>
            Voltar
          </button>
          <div className="os-detail-actions">
            <button className="os-btn os-btn-edit" onClick={() => handleEdit(selectedOrder)}>
              Editar
            </button>
            <button className="os-btn os-btn-print" onClick={() => handlePrint(selectedOrder)}>
              Imprimir PDF
            </button>
          </div>
        </div>

        <div className="os-detail-content">
          <div className="os-detail-title">
            <h2>{selectedOrder.numeroOs}</h2>
            <span
              className="os-status-badge"
              style={{ backgroundColor: STATUS_COLORS[selectedOrder.status] }}
            >
              {STATUS_LABELS[selectedOrder.status]}
            </span>
            <span
              className="os-prioridade-badge"
              style={{ backgroundColor: PRIORIDADE_COLORS[selectedOrder.prioridade] }}
            >
              {PRIORIDADE_LABELS[selectedOrder.prioridade]}
            </span>
          </div>

          <div className="os-detail-grid">
            <div className="os-detail-section">
              <h3>Dados do Cliente</h3>
              <div className="os-detail-field">
                <label>Nome:</label>
                <span>{selectedOrder.clienteNome}</span>
              </div>
              <div className="os-detail-field">
                <label>Telefone:</label>
                <span>{selectedOrder.clienteTelefone || '-'}</span>
              </div>
              <div className="os-detail-field">
                <label>Email:</label>
                <span>{selectedOrder.clienteEmail || '-'}</span>
              </div>
              <div className="os-detail-field">
                <label>Endereco:</label>
                <span>{selectedOrder.clienteEndereco || '-'}</span>
              </div>
              <div className="os-detail-field">
                <label>CPF/CNPJ:</label>
                <span>{selectedOrder.clienteCpfCnpj || '-'}</span>
              </div>
            </div>

            <div className="os-detail-section">
              <h3>Equipamento</h3>
              <div className="os-detail-field">
                <label>Equipamento:</label>
                <span>{selectedOrder.equipamento || '-'}</span>
              </div>
              <div className="os-detail-field">
                <label>Marca:</label>
                <span>{selectedOrder.marca || '-'}</span>
              </div>
              <div className="os-detail-field">
                <label>Modelo:</label>
                <span>{selectedOrder.modelo || '-'}</span>
              </div>
              <div className="os-detail-field">
                <label>N Serie:</label>
                <span>{selectedOrder.numeroSerie || '-'}</span>
              </div>
            </div>

            <div className="os-detail-section">
              <h3>Servico</h3>
              <div className="os-detail-field">
                <label>Descricao:</label>
                <span>{selectedOrder.descricao}</span>
              </div>
              <div className="os-detail-field">
                <label>Diagnostico:</label>
                <span>{selectedOrder.diagnostico || '-'}</span>
              </div>
              <div className="os-detail-field">
                <label>Solucao:</label>
                <span>{selectedOrder.solucao || '-'}</span>
              </div>
              <div className="os-detail-field">
                <label>Observacoes:</label>
                <span>{selectedOrder.observacoes || '-'}</span>
              </div>
              <div className="os-detail-field">
                <label>Tecnico:</label>
                <span>{selectedOrder.tecnicoNome || '-'}</span>
              </div>
            </div>

            <div className="os-detail-section">
              <h3>Valores</h3>
              <div className="os-detail-field">
                <label>Servico:</label>
                <span>{formatCurrency(selectedOrder.valorServico)}</span>
              </div>
              <div className="os-detail-field">
                <label>Pecas:</label>
                <span>{formatCurrency(selectedOrder.valorPecas)}</span>
              </div>
              <div className="os-detail-field">
                <label>Desconto:</label>
                <span>{formatCurrency(selectedOrder.desconto)}</span>
              </div>
              <div className="os-detail-field os-detail-total">
                <label>Total:</label>
                <span>{formatCurrency(selectedOrder.valorTotal)}</span>
              </div>
              <div className="os-detail-field">
                <label>Pagamento:</label>
                <span>{selectedOrder.formaPagamento || '-'}</span>
              </div>
            </div>

            <div className="os-detail-section">
              <h3>Datas</h3>
              <div className="os-detail-field">
                <label>Entrada:</label>
                <span>{formatDate(selectedOrder.dataEntrada)}</span>
              </div>
              <div className="os-detail-field">
                <label>Previsao:</label>
                <span>{formatDate(selectedOrder.dataPrevisao)}</span>
              </div>
              <div className="os-detail-field">
                <label>Conclusao:</label>
                <span>{formatDate(selectedOrder.dataConclusao)}</span>
              </div>
              <div className="os-detail-field">
                <label>Entrega:</label>
                <span>{formatDate(selectedOrder.dataEntrega)}</span>
              </div>
              <div className="os-detail-field">
                <label>Garantia:</label>
                <span>{selectedOrder.garantiaDias} dias</span>
              </div>
            </div>

            {selectedOrder.itens && selectedOrder.itens.length > 0 && (
              <div className="os-detail-section os-detail-section-full">
                <h3>Itens/Servicos</h3>
                <table className="os-itens-table">
                  <thead>
                    <tr>
                      <th>Descricao</th>
                      <th>Qtd</th>
                      <th>Valor Unit.</th>
                      <th>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.itens.map((item, idx) => (
                      <tr key={idx}>
                        <td>{item.descricao}</td>
                        <td>{item.quantidade}</td>
                        <td>{formatCurrency(item.valorUnitario)}</td>
                        <td>{formatCurrency(item.quantidade * item.valorUnitario)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="os-detail-status-actions">
            <h3>Alterar Status</h3>
            <div className="os-status-buttons">
              {Object.entries(STATUS_LABELS).map(([key, label]) => (
                <button
                  key={key}
                  className={`os-status-btn ${selectedOrder.status === key ? 'active' : ''}`}
                  style={{
                    backgroundColor: selectedOrder.status === key ? STATUS_COLORS[key] : 'transparent',
                    borderColor: STATUS_COLORS[key],
                    color: selectedOrder.status === key ? '#fff' : STATUS_COLORS[key]
                  }}
                  onClick={() => handleStatusChange(selectedOrder.id, key)}
                  disabled={selectedOrder.status === key}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {showPdf && (
          <OSPdfGenerator
            order={selectedOrder}
            onClose={() => setShowPdf(false)}
          />
        )}
      </div>
    )
  }

  return (
    <div className="os-container">
      {/* Header com stats */}
      <div className="os-header">
        <h2>Ordens de Servico</h2>
        <button className="os-btn os-btn-new" onClick={handleCreate}>
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path fill="currentColor" d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z" />
          </svg>
          Nova OS
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="os-stats">
          <div className="os-stat-card">
            <span className="os-stat-value">{stats.total}</span>
            <span className="os-stat-label">Total</span>
          </div>
          <div className="os-stat-card" style={{ borderColor: STATUS_COLORS.aberta }}>
            <span className="os-stat-value">{stats.abertas}</span>
            <span className="os-stat-label">Abertas</span>
          </div>
          <div className="os-stat-card" style={{ borderColor: STATUS_COLORS.em_andamento }}>
            <span className="os-stat-value">{stats.emAndamento}</span>
            <span className="os-stat-label">Em Andamento</span>
          </div>
          <div className="os-stat-card" style={{ borderColor: STATUS_COLORS.concluida }}>
            <span className="os-stat-value">{stats.concluidas}</span>
            <span className="os-stat-label">Concluidas</span>
          </div>
          <div className="os-stat-card os-stat-card-money">
            <span className="os-stat-value">{formatCurrency(stats.valorConcluidas)}</span>
            <span className="os-stat-label">Faturado</span>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="os-filters">
        <div className="os-search">
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path fill="currentColor" d="M15.5,14H14.71L14.43,13.73C15.41,12.59 16,11.11 16,9.5C16,5.91 13.09,3 9.5,3C5.91,3 3,5.91 3,9.5C3,13.09 5.91,16 9.5,16C11.11,16 12.59,15.41 13.73,14.43L14,14.71V15.5L19,20.5L20.5,19L15.5,14M9.5,14C7.01,14 5,11.99 5,9.5C5,7.01 7.01,5 9.5,5C11.99,5 14,7.01 14,9.5C14,11.99 11.99,14 9.5,14Z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar OS por numero, cliente, equipamento..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="os-filter-select"
        >
          <option value="">Todos os Status</option>
          {Object.entries(STATUS_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        <select
          value={filterPrioridade}
          onChange={(e) => setFilterPrioridade(e.target.value)}
          className="os-filter-select"
        >
          <option value="">Todas as Prioridades</option>
          {Object.entries(PRIORIDADE_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      {/* Lista de OS */}
      <div className="os-list">
        {loading ? (
          <div className="os-loading">Carregando ordens de servico...</div>
        ) : orders.length === 0 ? (
          <div className="os-empty">
            <svg viewBox="0 0 24 24" width="48" height="48">
              <path fill="currentColor" d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20M9,13V18H7V13H9M15,15V18H13V15H15M11,11V18H13V11H11Z" />
            </svg>
            <p>Nenhuma ordem de servico encontrada</p>
            <button className="os-btn os-btn-new" onClick={handleCreate}>
              Criar primeira OS
            </button>
          </div>
        ) : (
          <div className="os-table-wrapper">
            <table className="os-table">
              <thead>
                <tr>
                  <th>N OS</th>
                  <th>Cliente</th>
                  <th>Equipamento</th>
                  <th>Status</th>
                  <th>Prioridade</th>
                  <th>Entrada</th>
                  <th>Valor</th>
                  <th>Acoes</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} onClick={() => handleView(order)}>
                    <td className="os-numero">{order.numeroOs}</td>
                    <td>{order.clienteNome}</td>
                    <td>{order.equipamento || '-'}</td>
                    <td>
                      <span
                        className="os-status-badge-sm"
                        style={{ backgroundColor: STATUS_COLORS[order.status] }}
                      >
                        {STATUS_LABELS[order.status]}
                      </span>
                    </td>
                    <td>
                      <span
                        className="os-prioridade-badge-sm"
                        style={{ color: PRIORIDADE_COLORS[order.prioridade] }}
                      >
                        {PRIORIDADE_LABELS[order.prioridade]}
                      </span>
                    </td>
                    <td>{formatDate(order.dataEntrada)}</td>
                    <td className="os-valor">{formatCurrency(order.valorTotal)}</td>
                    <td className="os-actions" onClick={(e) => e.stopPropagation()}>
                      <button
                        className="os-action-btn"
                        title="Editar"
                        onClick={() => handleEdit(order)}
                      >
                        <svg viewBox="0 0 24 24" width="16" height="16">
                          <path fill="currentColor" d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z" />
                        </svg>
                      </button>
                      <button
                        className="os-action-btn"
                        title="Imprimir"
                        onClick={() => handlePrint(order)}
                      >
                        <svg viewBox="0 0 24 24" width="16" height="16">
                          <path fill="currentColor" d="M18,3H6V7H18M19,12A1,1 0 0,1 18,11A1,1 0 0,1 19,10A1,1 0 0,1 20,11A1,1 0 0,1 19,12M16,19H8V14H16M19,8H5A3,3 0 0,0 2,11V17H6V21H18V17H22V11A3,3 0 0,0 19,8Z" />
                        </svg>
                      </button>
                      <button
                        className="os-action-btn os-action-btn-delete"
                        title="Excluir"
                        onClick={() => handleDelete(order.id)}
                      >
                        <svg viewBox="0 0 24 24" width="16" height="16">
                          <path fill="currentColor" d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showPdf && selectedOrder && (
        <OSPdfGenerator
          order={selectedOrder}
          onClose={() => setShowPdf(false)}
        />
      )}
    </div>
  )
}

export default memo(ServiceOrders)
