import { useState, useEffect } from 'react';
import './QuickMessagesManager.css';

const CATEGORIES = [
  { value: 'general', label: 'Geral' },
  { value: 'greeting', label: 'Saudação' },
  { value: 'support', label: 'Suporte' },
  { value: 'question', label: 'Pergunta' },
  { value: 'closing', label: 'Encerramento' }
];

const EMOJI_OPTIONS = ['👍', '⏰', '✅', '🤔', '✨', '⏳', '👨‍💼', '💬', '📝', '🎯', '💡', '🚀', '📞', '✔️', '❌'];

function QuickMessagesManager({ onClose }) {
  const [quickMessages, setQuickMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    text: '',
    emoji: '',
    category: 'general',
    shortcut: '',
    enabled: true
  });

  useEffect(() => {
    loadQuickMessages();
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.text.trim()) {
      alert('O texto da mensagem é obrigatório!');
      return;
    }

    try {
      const url = editingId
        ? `http://localhost:3001/api/quick-messages/${editingId}`
        : 'http://localhost:3001/api/quick-messages';

      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          order: quickMessages.length
        })
      });

      if (response.ok) {
        await loadQuickMessages();
        resetForm();
      } else {
        alert('Erro ao salvar mensagem rápida');
      }
    } catch (error) {
      console.error('Erro ao salvar quick message:', error);
      alert('Erro ao salvar mensagem rápida');
    }
  };

  const handleEdit = (qm) => {
    setEditingId(qm.id);
    setFormData({
      text: qm.text,
      emoji: qm.emoji || '',
      category: qm.category || 'general',
      shortcut: qm.shortcut || '',
      enabled: qm.enabled
    });
  };

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja excluir esta mensagem rápida?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:3001/api/quick-messages/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await loadQuickMessages();
      } else {
        alert('Erro ao excluir mensagem rápida');
      }
    } catch (error) {
      console.error('Erro ao excluir quick message:', error);
      alert('Erro ao excluir mensagem rápida');
    }
  };

  const handleToggleEnabled = async (qm) => {
    try {
      const response = await fetch(`http://localhost:3001/api/quick-messages/${qm.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...qm,
          enabled: !qm.enabled
        })
      });

      if (response.ok) {
        await loadQuickMessages();
      }
    } catch (error) {
      console.error('Erro ao atualizar quick message:', error);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      text: '',
      emoji: '',
      category: 'general',
      shortcut: '',
      enabled: true
    });
  };

  return (
    <div className="quick-messages-manager-overlay">
      <div className="quick-messages-manager">
        <div className="manager-header">
          <h2>Gerenciar Mensagens Rápidas</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="manager-content">
          <div className="manager-form-section">
            <h3>{editingId ? 'Editar' : 'Nova'} Mensagem Rápida</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Texto da Mensagem *</label>
                <textarea
                  value={formData.text}
                  onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                  placeholder="Ex: Obrigado! Estou aqui para ajudar."
                  rows="3"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Emoji</label>
                  <div className="emoji-selector">
                    <button
                      type="button"
                      className="emoji-clear-btn"
                      onClick={() => setFormData({ ...formData, emoji: '' })}
                    >
                      Nenhum
                    </button>
                    {EMOJI_OPTIONS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        className={`emoji-option ${formData.emoji === emoji ? 'selected' : ''}`}
                        onClick={() => setFormData({ ...formData, emoji })}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Categoria</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Atalho (opcional)</label>
                  <input
                    type="text"
                    value={formData.shortcut}
                    onChange={(e) => setFormData({ ...formData, shortcut: e.target.value })}
                    placeholder="Ex: obg"
                    maxLength="10"
                  />
                </div>
              </div>

              <div className="form-actions">
                {editingId && (
                  <button type="button" className="cancel-btn" onClick={resetForm}>
                    Cancelar
                  </button>
                )}
                <button type="submit" className="save-btn">
                  {editingId ? 'Atualizar' : 'Adicionar'}
                </button>
              </div>
            </form>
          </div>

          <div className="manager-list-section">
            <h3>Mensagens Cadastradas ({quickMessages.length})</h3>
            {loading ? (
              <p className="loading-text">Carregando...</p>
            ) : quickMessages.length === 0 ? (
              <p className="empty-text">Nenhuma mensagem rápida cadastrada.</p>
            ) : (
              <div className="quick-messages-grid">
                {quickMessages.map((qm) => (
                  <div key={qm.id} className={`quick-message-item ${!qm.enabled ? 'disabled' : ''}`}>
                    <div className="qm-header">
                      {qm.emoji && <span className="qm-emoji">{qm.emoji}</span>}
                      <span className="qm-category">{CATEGORIES.find(c => c.value === qm.category)?.label || qm.category}</span>
                      <label className="qm-toggle">
                        <input
                          type="checkbox"
                          checked={qm.enabled}
                          onChange={() => handleToggleEnabled(qm)}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                    <p className="qm-text">{qm.text}</p>
                    {qm.shortcut && <span className="qm-shortcut">/{qm.shortcut}</span>}
                    <div className="qm-actions">
                      <button className="edit-btn" onClick={() => handleEdit(qm)}>
                        Editar
                      </button>
                      <button className="delete-btn" onClick={() => handleDelete(qm.id)}>
                        Excluir
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default QuickMessagesManager;
