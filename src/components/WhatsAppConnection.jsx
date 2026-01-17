import { useState, useEffect, useCallback, memo } from 'react'
import { API_URL } from '../config/api'
import './WhatsAppConnection.css'

function WhatsAppConnection({ socket }) {
  const [instances, setInstances] = useState([])
  const [selectedInstance, setSelectedInstance] = useState(null)
  const [qrCode, setQrCode] = useState(null)
  const [connectionStatus, setConnectionStatus] = useState('disconnected')
  const [loading, setLoading] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newInstanceName, setNewInstanceName] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [searchNumber, setSearchNumber] = useState('')
  const [searching, setSearching] = useState(false)

  const fetchInstances = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/whatsapp/instances`)
      const data = await response.json()
      console.log('📋 Instâncias encontradas:', data)

      // Evolution API retorna array diretamente ou dentro de um objeto
      const instancesList = Array.isArray(data) ? data : (data.instances || [])
      setInstances(instancesList)
    } catch (error) {
      console.error('Erro ao buscar instâncias:', error)
      setError('Erro ao buscar instâncias. Verifique se o Evolution API está rodando.')
    }
  }, [])

  const createInstance = useCallback(async () => {
    if (!newInstanceName.trim()) {
      setError('Nome da instância é obrigatório')
      return
    }

    setCreating(true)
    setError('')

    try {
      const response = await fetch(`${API_URL}/api/whatsapp/instance/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          instanceName: newInstanceName.trim(),
          qrcode: true // Solicita geração automática de QR Code
        })
      })

      if (response.ok) {
        const data = await response.json()
        setInstances(prev => [...prev, data.instance])
        setSelectedInstance(data.instance.name)
        setShowCreateModal(false)
        setNewInstanceName('')

        // Se já retornou QR code
        if (data.qrcode) {
          setQrCode(data.qrcode.code)
        } else {
          // Busca o QR code
          connectInstance(data.instance.name)
        }
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Erro ao criar instância')
      }
    } catch (error) {
      console.error('Erro ao criar instância:', error)
      setError('Erro ao criar instância. Verifique a conexão.')
    } finally {
      setCreating(false)
    }
  }, [newInstanceName])

  const connectInstance = useCallback(async (instanceName) => {
    const instance = instanceName || selectedInstance
    if (!instance) return

    setLoading(true)
    setError('')

    try {
      console.log(`🔌 Conectando instância: ${instance}`)
      const response = await fetch(`${API_URL}/api/whatsapp/instance/${instance}/connect`)

      if (!response.ok) {
        const errorData = await response.json()
        console.error('❌ Erro na resposta:', errorData)
        setError(errorData.error || 'Erro ao conectar')
        setLoading(false)
        return
      }

      const data = await response.json()
      console.log('📱 Resposta do connect:', data)

      // Evolution API pode retornar QR code em diferentes formatos
      if (data.qrcode) {
        const qrCodeData = data.qrcode.code || data.qrcode.base64 || data.qrcode
        console.log('✅ QR Code recebido:', qrCodeData ? 'Sim' : 'Não')
        setQrCode(qrCodeData)
        setConnectionStatus('qr')
      } else if (data.status === 'open') {
        console.log('✅ Instância já conectada')
        setConnectionStatus('open')
        setQrCode(null)
      } else {
        console.log('⚠️ Resposta sem QR code ou status:', data)
        setError('Resposta inesperada da API. Verifique o console.')
      }
    } catch (error) {
      console.error('❌ Erro ao conectar instância:', error)
      setError('Erro ao obter QR Code. Verifique a instância.')
    } finally {
      setLoading(false)
    }
  }, [selectedInstance])

  const disconnectInstance = useCallback(async () => {
    if (!selectedInstance) return

    setLoading(true)

    try {
      const response = await fetch(`${API_URL}/api/whatsapp/instance/${selectedInstance}/logout`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setConnectionStatus('disconnected')
        setQrCode(null)
      }
    } catch (error) {
      console.error('Erro ao desconectar instância:', error)
      setError('Erro ao desconectar instância.')
    } finally {
      setLoading(false)
    }
  }, [selectedInstance])

  const deleteInstance = useCallback(async (instanceName) => {
    if (!confirm(`Tem certeza que deseja excluir a instância "${instanceName}"?`)) {
      return
    }

    try {
      const response = await fetch(`${API_URL}/api/whatsapp/instance/${instanceName}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setInstances(prev => prev.filter(inst => inst.name !== instanceName))
        if (selectedInstance === instanceName) {
          setSelectedInstance(null)
          setQrCode(null)
          setConnectionStatus('disconnected')
        }
      }
    } catch (error) {
      console.error('Erro ao excluir instância:', error)
      setError('Erro ao excluir instância.')
    }
  }, [selectedInstance])

  const searchByNumber = useCallback(async () => {
    if (!searchNumber.trim()) {
      setError('Digite um número para buscar')
      return
    }

    setSearching(true)
    setError('')

    try {
      console.log(`🔍 Buscando por número: ${searchNumber}`)
      const response = await fetch(`${API_URL}/api/whatsapp/find-by-number/${searchNumber}`)

      if (!response.ok) {
        const errorData = await response.json()
        setError(errorData.error || 'Nenhuma instância encontrada')
        setSearching(false)
        return
      }

      const data = await response.json()
      console.log('✅ Instâncias encontradas:', data.instances)

      if (data.instances && data.instances.length > 0) {
        // Seleciona a primeira instância encontrada
        const foundInstance = data.instances[0]
        setSelectedInstance(foundInstance.name)

        // Se não está conectada, busca o QR code
        if (foundInstance.status !== 'open') {
          connectInstance(foundInstance.name)
        }

        setError(`✅ Encontrada instância: ${foundInstance.name} (${foundInstance.phoneNumber})`)
      }
    } catch (error) {
      console.error('❌ Erro ao buscar por número:', error)
      setError('Erro ao buscar instância. Verifique o console.')
    } finally {
      setSearching(false)
    }
  }, [searchNumber, connectInstance])

  const getStatusBadge = useCallback((status) => {
    const statusMap = {
      'open': { label: 'Conectado', color: '#2ecc71' },
      'qr': { label: 'Aguardando QR', color: '#f39c12' },
      'connecting': { label: 'Conectando...', color: '#3498db' },
      'disconnected': { label: 'Desconectado', color: '#95a5a6' },
      'close': { label: 'Desconectado', color: '#e74c3c' }
    }

    const statusInfo = statusMap[status] || statusMap['disconnected']

    return (
      <span
        className="status-badge"
        style={{ background: statusInfo.color }}
      >
        {statusInfo.label}
      </span>
    )
  }, [])

  const handleWhatsAppStatus = useCallback((data) => {
    if (data.instance === selectedInstance) {
      setConnectionStatus(data.status)
      if (data.status === 'open') {
        setQrCode(null)
      }
    }
  }, [selectedInstance])

  const handleWhatsAppQr = useCallback((data) => {
    if (data.instance === selectedInstance) {
      setQrCode(data.qr)
    }
  }, [selectedInstance])

  useEffect(() => {
    fetchInstances()

    if (socket) {
      socket.on('whatsapp-status', handleWhatsAppStatus)
      socket.on('whatsapp-qr', handleWhatsAppQr)

      return () => {
        socket.off('whatsapp-status', handleWhatsAppStatus)
        socket.off('whatsapp-qr', handleWhatsAppQr)
      }
    }
  }, [socket, fetchInstances, handleWhatsAppStatus, handleWhatsAppQr])

  return (
    <div className="whatsapp-connection">
      <div className="whatsapp-header">
        <h2>Conexões WhatsApp</h2>
        <button
          className="btn-create-instance"
          onClick={() => setShowCreateModal(true)}
        >
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path fill="currentColor" d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z" />
          </svg>
          Nova Instância
        </button>
      </div>

      <div className="search-section">
        <div className="search-box">
          <svg viewBox="0 0 24 24" width="20" height="20" className="search-icon">
            <path fill="currentColor" d="M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar por número de WhatsApp (ex: 5511999999999)"
            value={searchNumber}
            onChange={(e) => setSearchNumber(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && searchByNumber()}
          />
          <button
            className="btn-search"
            onClick={searchByNumber}
            disabled={searching || !searchNumber.trim()}
          >
            {searching ? (
              <>
                <div className="spinner-small"></div>
                Buscando...
              </>
            ) : (
              'Buscar'
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className={`message-banner ${error.startsWith('✅') ? 'success' : 'error'}`}>
          <svg viewBox="0 0 24 24" width="20" height="20">
            {error.startsWith('✅') ? (
              <path fill="currentColor" d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M11,16.5L18,9.5L16.59,8.09L11,13.67L7.91,10.59L6.5,12L11,16.5Z" />
            ) : (
              <path fill="currentColor" d="M13,13H11V7H13M13,17H11V15H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" />
            )}
          </svg>
          {error}
          <button onClick={() => setError('')}>×</button>
        </div>
      )}

      <div className="whatsapp-content">
        <div className="instances-list">
          <h3>Instâncias</h3>
          {instances.length === 0 ? (
            <div className="empty-state">
              <svg viewBox="0 0 24 24" width="48" height="48">
                <path fill="currentColor" d="M17.5,12A1.5,1.5 0 0,1 16,10.5A1.5,1.5 0 0,1 17.5,9A1.5,1.5 0 0,1 19,10.5A1.5,1.5 0 0,1 17.5,12M10,12A1.5,1.5 0 0,1 8.5,10.5A1.5,1.5 0 0,1 10,9A1.5,1.5 0 0,1 11.5,10.5A1.5,1.5 0 0,1 10,12M20,2H4A2,2 0 0,0 2,4V22L6,18H20A2,2 0 0,0 22,16V4A2,2 0 0,0 20,2Z" />
              </svg>
              <p>Nenhuma instância criada</p>
              <p className="empty-hint">Crie uma nova instância para começar</p>
            </div>
          ) : (
            <div className="instances-grid">
              {instances.map(instance => (
                <div
                  key={instance.name}
                  className={`instance-card ${selectedInstance === instance.name ? 'selected' : ''}`}
                  onClick={() => {
                    setSelectedInstance(instance.name)
                    // Automaticamente tenta conectar e pegar o QR code
                    if (instance.status !== 'open') {
                      connectInstance(instance.name)
                    }
                  }}
                >
                  <div className="instance-info">
                    <div className="instance-name">{instance.name}</div>
                    {getStatusBadge(instance.status)}
                  </div>
                  <button
                    className="btn-delete-instance"
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteInstance(instance.name)
                    }}
                    title="Excluir instância"
                  >
                    <svg viewBox="0 0 24 24" width="18" height="18">
                      <path fill="currentColor" d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="qr-section">
          {selectedInstance ? (
            <>
              <h3>Conectar: {selectedInstance}</h3>
              {getStatusBadge(connectionStatus)}

              {connectionStatus === 'open' ? (
                <div className="connected-state">
                  <svg viewBox="0 0 24 24" width="64" height="64" className="success-icon">
                    <path fill="currentColor" d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4M11,16.5L6.5,12L7.91,10.59L11,13.67L16.59,8.09L18,9.5L11,16.5Z" />
                  </svg>
                  <h4>WhatsApp Conectado!</h4>
                  <p>Sua instância está ativa e pronta para uso</p>
                  <button
                    className="btn-disconnect"
                    onClick={disconnectInstance}
                    disabled={loading}
                  >
                    Desconectar
                  </button>
                </div>
              ) : qrCode ? (
                <div className="qr-display">
                  <p className="qr-instruction">Escaneie o QR Code com seu WhatsApp</p>
                  <div className="qr-code-container">
                    <img src={qrCode} alt="QR Code" className="qr-code-image" />
                  </div>
                  <div className="qr-steps">
                    <div className="step">
                      <span className="step-number">1</span>
                      <span>Abra o WhatsApp no seu celular</span>
                    </div>
                    <div className="step">
                      <span className="step-number">2</span>
                      <span>Toque em Menu ou Configurações</span>
                    </div>
                    <div className="step">
                      <span className="step-number">3</span>
                      <span>Toque em Aparelhos conectados</span>
                    </div>
                    <div className="step">
                      <span className="step-number">4</span>
                      <span>Toque em Conectar um aparelho</span>
                    </div>
                    <div className="step">
                      <span className="step-number">5</span>
                      <span>Aponte seu celular para esta tela</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="connect-prompt">
                  <svg viewBox="0 0 24 24" width="64" height="64">
                    <path fill="currentColor" d="M17.5,12A1.5,1.5 0 0,1 16,10.5A1.5,1.5 0 0,1 17.5,9A1.5,1.5 0 0,1 19,10.5A1.5,1.5 0 0,1 17.5,12M10,12A1.5,1.5 0 0,1 8.5,10.5A1.5,1.5 0 0,1 10,9A1.5,1.5 0 0,1 11.5,10.5A1.5,1.5 0 0,1 10,12M20,2H4A2,2 0 0,0 2,4V22L6,18H20A2,2 0 0,0 22,16V4A2,2 0 0,0 20,2Z" />
                  </svg>
                  <p>Clique no botão abaixo para gerar o QR Code</p>
                  <button
                    className="btn-connect"
                    onClick={() => connectInstance()}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <div className="spinner-small"></div>
                        Gerando QR Code...
                      </>
                    ) : (
                      <>
                        <svg viewBox="0 0 24 24" width="20" height="20">
                          <path fill="currentColor" d="M3,11H11V3H3M5,5H9V9H5M13,3V11H21V3M19,9H15V5H19M3,21H11V13H3M5,15H9V19H5M13,13H15V15H13M15,15H17V17H15M17,13H19V15H17M15,17H17V19H15M17,17H19V19H17M19,15H21V17H19M19,19H21V21H19M13,17H15V21H13M13,21H15V23H13Z" />
                        </svg>
                        Gerar QR Code
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="no-instance-selected">
              <svg viewBox="0 0 24 24" width="64" height="64">
                <path fill="currentColor" d="M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8M12,10A2,2 0 0,0 10,12A2,2 0 0,0 12,14A2,2 0 0,0 14,12A2,2 0 0,0 12,10M10,22C9.75,22 9.54,21.82 9.5,21.58L9.13,18.93C8.5,18.68 7.96,18.34 7.44,17.94L4.95,18.95C4.73,19.03 4.46,18.95 4.34,18.73L2.34,15.27C2.21,15.05 2.27,14.78 2.46,14.63L4.57,12.97L4.5,12L4.57,11L2.46,9.37C2.27,9.22 2.21,8.95 2.34,8.73L4.34,5.27C4.46,5.05 4.73,4.96 4.95,5.05L7.44,6.05C7.96,5.66 8.5,5.32 9.13,5.07L9.5,2.42C9.54,2.18 9.75,2 10,2H14C14.25,2 14.46,2.18 14.5,2.42L14.87,5.07C15.5,5.32 16.04,5.66 16.56,6.05L19.05,5.05C19.27,4.96 19.54,5.05 19.66,5.27L21.66,8.73C21.79,8.95 21.73,9.22 21.54,9.37L19.43,11L19.5,12L19.43,13L21.54,14.63C21.73,14.78 21.79,15.05 21.66,15.27L19.66,18.73C19.54,18.95 19.27,19.04 19.05,18.95L16.56,17.95C16.04,18.34 15.5,18.68 14.87,18.93L14.5,21.58C14.46,21.82 14.25,22 14,22H10M11.25,4L10.88,6.61C9.68,6.86 8.62,7.5 7.85,8.39L5.44,7.35L4.69,8.65L6.8,10.2C6.4,11.37 6.4,12.64 6.8,13.8L4.68,15.36L5.43,16.66L7.86,15.62C8.63,16.5 9.68,17.14 10.87,17.38L11.24,20H12.76L13.13,17.39C14.32,17.14 15.37,16.5 16.14,15.62L18.57,16.66L19.32,15.36L17.2,13.81C17.6,12.64 17.6,11.37 17.2,10.2L19.31,8.65L18.56,7.35L16.15,8.39C15.38,7.5 14.32,6.86 13.12,6.62L12.75,4H11.25Z" />
              </svg>
              <p>Selecione uma instância ao lado</p>
            </div>
          )}
        </div>
      </div>

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content create-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Criar Nova Instância</h3>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Nome da Instância</label>
                <input
                  type="text"
                  placeholder="Ex: whatsapp-principal"
                  value={newInstanceName}
                  onChange={(e) => setNewInstanceName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && createInstance()}
                  autoFocus
                />
                <small>Use apenas letras, números e hífen</small>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn-cancel"
                onClick={() => setShowCreateModal(false)}
                disabled={creating}
              >
                Cancelar
              </button>
              <button
                className="btn-create"
                onClick={createInstance}
                disabled={creating || !newInstanceName.trim()}
              >
                {creating ? 'Criando...' : 'Criar Instância'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default memo(WhatsAppConnection)
