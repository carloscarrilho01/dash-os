-- ============================================
-- ÍNDICES PARA OTIMIZAÇÃO DE PERFORMANCE
-- Execute este SQL no Supabase SQL Editor
-- ============================================

-- Índice para buscar conversas ordenadas por última atualização
-- Usado em: ConversationDB.findAll()
CREATE INDEX IF NOT EXISTS idx_conversations_last_timestamp
ON conversations (last_timestamp DESC);

-- Índice para buscar conversa por user_id (já deve existir como PK, mas garantindo)
-- Usado em: ConversationDB.findByUserId()
CREATE INDEX IF NOT EXISTS idx_conversations_user_id
ON conversations (user_id);

-- Índice para buscar leads por telefone (busca com ou sem formatação)
-- Usado em: LeadDB.findByPhone()
CREATE INDEX IF NOT EXISTS idx_leads_telefone
ON leads (telefone);

-- Índice para buscar leads por UUID
-- Usado em: LeadDB.findByUuid()
CREATE INDEX IF NOT EXISTS idx_leads_id
ON leads (id);

-- Índice para buscar leads por status (usado no Kanban)
-- Usado em: KanbanBoard para filtrar leads por coluna
CREATE INDEX IF NOT EXISTS idx_leads_status
ON leads (status);

-- Índice composto para buscar leads por status e data de atualização
-- Útil para ordenar leads dentro de cada coluna
CREATE INDEX IF NOT EXISTS idx_leads_status_updated_at
ON leads (status, updated_at DESC);

-- Índice para buscar quick messages por ID
-- Usado em: QuickMessagesDB.findById()
CREATE INDEX IF NOT EXISTS idx_quick_messages_id
ON quick_messages (id);

-- Índice para ordenar quick messages por ordem
-- Usado em: QuickMessagesDB.findAll()
CREATE INDEX IF NOT EXISTS idx_quick_messages_order
ON quick_messages ("order");

-- ============================================
-- OTIMIZAÇÕES ADICIONAIS
-- ============================================

-- Analyze tables para atualizar estatísticas
ANALYZE conversations;
ANALYZE leads;
ANALYZE quick_messages;

-- Mensagem de conclusão
SELECT 'Índices criados com sucesso! ✅' as status;
