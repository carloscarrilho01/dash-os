import { useState, useEffect } from 'react'
import { io } from 'socket.io-client'
import Sidebar from './components/Sidebar'
import ChatWindow from './components/ChatWindow'
import './App.css'

// Em produção, usa a mesma URL do site. Em desenvolvimento, usa localhost
const API_URL = import.meta.env.VITE_API_URL || (
  import.meta.env.MODE === 'production'
    ? window.location.origin
    : 'http://localhost:3001'
)
const socket = io(API_URL)

function App() {
  const [conversations, setConversations] = useState([])
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [loading, setLoading] = useState(true)

  // Carrega conversas iniciais
  useEffect(() => {
    fetchConversations()

    // Escuta mensagens via WebSocket
    socket.on('init', (data) => {
      setConversations(data.sort((a, b) =>
        new Date(b.lastTimestamp) - new Date(a.lastTimestamp)
      ))
      setLoading(false)
    })

    socket.on('message', ({ userId, conversation }) => {
      setConversations(prev => {
        const filtered = prev.filter(c => c.userId !== userId)
        return [conversation, ...filtered]
      })

      // Atualiza conversa selecionada se for a mesma
      if (selectedConversation?.userId === userId) {
        setSelectedConversation(conversation)
      }
    })

    return () => {
      socket.off('init')
      socket.off('message')
    }
  }, [selectedConversation?.userId])

  const fetchConversations = async () => {
    try {
      const response = await fetch(`${API_URL}/api/conversations`)
      const data = await response.json()
      setConversations(data)
      setLoading(false)
    } catch (error) {
      console.error('Erro ao carregar conversas:', error)
      setLoading(false)
    }
  }

  const handleSelectConversation = async (conversation) => {
    try {
      const response = await fetch(`${API_URL}/api/conversations/${conversation.userId}`)
      const data = await response.json()
      setSelectedConversation(data)

      // Atualiza o contador de não lidas
      setConversations(prev =>
        prev.map(c => c.userId === conversation.userId ? { ...c, unread: 0 } : c)
      )
    } catch (error) {
      console.error('Erro ao carregar conversa:', error)
    }
  }

  const handleSendMessage = async (messageData) => {
    if (!selectedConversation) return

    // Suporta tanto string quanto objeto { type, content, duration }
    const payload = typeof messageData === 'string'
      ? { message: messageData, type: 'text' }
      : {
          message: messageData.content,
          type: messageData.type || 'text',
          duration: messageData.duration
        }

    if (!payload.message || (payload.type === 'text' && !payload.message.trim())) return

    try {
      await fetch(`${API_URL}/api/conversations/${selectedConversation.userId}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error)
    }
  }

  return (
    <div className="app">
      <Sidebar
        conversations={conversations}
        selectedConversation={selectedConversation}
        onSelectConversation={handleSelectConversation}
        loading={loading}
      />
      <ChatWindow
        conversation={selectedConversation}
        onSendMessage={handleSendMessage}
      />
    </div>
  )
}

export default App
