-- ============================================
-- SCHEMA PARA CAMPO "EM ESPERA" (ON_HOLD)
-- Execute este SQL no Supabase Dashboard
-- ============================================

-- 1. Adicionar coluna on_hold na tabela conversations
ALTER TABLE conversations
ADD COLUMN IF NOT EXISTS on_hold BOOLEAN DEFAULT false;

-- 2. Indice para busca por status de espera
CREATE INDEX IF NOT EXISTS idx_conversations_on_hold ON conversations(on_hold);

-- ============================================
-- INSTRUCOES:
-- 1. Acesse o Supabase Dashboard
-- 2. Va em "SQL Editor"
-- 3. Cole e execute este script
-- 4. Verifique se a coluna 'on_hold' foi adicionada em 'conversations'
-- ============================================
