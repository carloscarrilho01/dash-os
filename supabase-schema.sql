-- ============================================
-- SCHEMA PARA SUPABASE - Dashboard Chat n8n
-- ============================================

-- 1. Tabela de Conversas (já existe, mas incluída aqui para referência)
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT UNIQUE NOT NULL,
  user_name TEXT NOT NULL,
  messages JSONB DEFAULT '[]'::jsonb,
  last_message TEXT,
  last_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  unread INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_timestamp ON conversations(last_timestamp DESC);

-- ============================================
-- 2. Tabela de Mensagens Rápidas (Quick Messages)
-- ============================================
CREATE TABLE IF NOT EXISTS quick_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text TEXT NOT NULL,
  emoji TEXT,
  category TEXT DEFAULT 'general',
  shortcut TEXT,
  "order" INTEGER DEFAULT 0,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para ordenação
CREATE INDEX IF NOT EXISTS idx_quick_messages_order ON quick_messages("order" ASC);
CREATE INDEX IF NOT EXISTS idx_quick_messages_enabled ON quick_messages(enabled);

-- ============================================
-- 3. Mensagens Rápidas Padrão (Seed Data)
-- ============================================
INSERT INTO quick_messages (text, emoji, category, "order", enabled) VALUES
  ('Obrigado! Estou aqui para ajudar.', '👍', 'greeting', 1, true),
  ('Já retorno com você em breve.', '⏰', 'support', 2, true),
  ('Entendi, vou verificar isso.', '✅', 'support', 3, true),
  ('Pode me fornecer mais detalhes?', '🤔', 'question', 4, true),
  ('Perfeito! Resolvido.', '✨', 'closing', 5, true),
  ('Aguarde um momento, por favor.', '⏳', 'support', 6, true),
  ('Vou transferir você para um especialista.', '👨‍💼', 'support', 7, true),
  ('Posso ajudar com mais alguma coisa?', '💬', 'closing', 8, true)
ON CONFLICT DO NOTHING;

-- ============================================
-- 4. Row Level Security (RLS) - Opcional
-- ============================================
-- Desabilite RLS se você confiar no backend para controle de acesso
-- Ou configure políticas adequadas para sua aplicação

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE quick_messages ENABLE ROW LEVEL SECURITY;

-- Política para permitir todas as operações (ajuste conforme necessário)
CREATE POLICY "Enable all access for conversations"
ON conversations FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY "Enable all access for quick_messages"
ON quick_messages FOR ALL
USING (true)
WITH CHECK (true);

-- ============================================
-- INSTRUÇÕES DE USO:
-- ============================================
-- 1. Acesse o Supabase Dashboard: https://app.supabase.com
-- 2. Selecione seu projeto
-- 3. Vá em "SQL Editor" no menu lateral
-- 4. Cole este script completo
-- 5. Clique em "Run" ou pressione Ctrl+Enter
-- 6. Verifique se as tabelas foram criadas em "Database" > "Tables"
-- ============================================
