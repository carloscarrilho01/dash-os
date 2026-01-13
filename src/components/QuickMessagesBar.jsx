import { useState, useEffect } from 'react';
import './QuickMessagesBar.css';

function QuickMessagesBar({ onSelectMessage, onManage }) {
  const [quickMessages, setQuickMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    loadQuickMessages();

    // Listener para atualizar quando houver mudanças
    const socket = window.socket;
    if (socket) {
      socket.on('quick-messages-updated', loadQuickMessages);
      return () => socket.off('quick-messages-updated', loadQuickMessages);
    }
  }, []);

  const loadQuickMessages = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/quick-messages');
      if (response.ok) {
        const data = await response.json();
        setQuickMessages(data);
      }
    } catch (error) {
      console.error('Erro ao carregar quick messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClick = (text) => {
    onSelectMessage({ type: 'text', content: text });
  };

  if (loading) {
    return <div className="quick-messages-bar loading">Carregando...</div>;
  }

  if (quickMessages.length === 0) {
    return (
      <div className="quick-messages-bar empty">
        <button
          className="quick-message-manage-btn"
          onClick={onManage}
          title="Gerenciar mensagens rápidas"
        >
          + Adicionar mensagens rápidas
        </button>
      </div>
    );
  }

  const displayedMessages = showAll ? quickMessages : quickMessages.slice(0, 5);

  return (
    <div className="quick-messages-bar">
      <div className="quick-messages-list">
        {displayedMessages.map((qm) => (
          <button
            key={qm.id}
            className="quick-message-btn"
            onClick={() => handleClick(qm.text)}
            title={qm.text}
          >
            {qm.emoji && <span className="quick-message-emoji">{qm.emoji}</span>}
            <span className="quick-message-text">{qm.text}</span>
          </button>
        ))}

        {quickMessages.length > 5 && (
          <button
            className="quick-message-toggle-btn"
            onClick={() => setShowAll(!showAll)}
            title={showAll ? 'Mostrar menos' : 'Mostrar mais'}
          >
            {showAll ? '−' : '+'}
          </button>
        )}

        <button
          className="quick-message-manage-btn"
          onClick={onManage}
          title="Gerenciar mensagens rápidas"
        >
          ⚙️
        </button>
      </div>
    </div>
  );
}

export default QuickMessagesBar;
