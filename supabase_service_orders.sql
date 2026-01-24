-- ========================================
-- Tabela: service_orders (Ordens de Serviço)
-- ========================================
CREATE TABLE IF NOT EXISTS service_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_os TEXT UNIQUE NOT NULL,

  -- Dados do Cliente (pode vincular ao lead)
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  cliente_nome TEXT NOT NULL,
  cliente_telefone TEXT,
  cliente_email TEXT,
  cliente_endereco TEXT,
  cliente_cpf_cnpj TEXT,

  -- Dados do Serviço
  descricao TEXT NOT NULL,
  observacoes TEXT,
  diagnostico TEXT,
  solucao TEXT,

  -- Equipamento / Item
  equipamento TEXT,
  marca TEXT,
  modelo TEXT,
  numero_serie TEXT,

  -- Técnico responsável
  tecnico_nome TEXT,
  tecnico_id TEXT,

  -- Valores
  valor_servico DECIMAL(10, 2) DEFAULT 0,
  valor_pecas DECIMAL(10, 2) DEFAULT 0,
  desconto DECIMAL(10, 2) DEFAULT 0,
  valor_total DECIMAL(10, 2) DEFAULT 0,

  -- Forma de pagamento
  forma_pagamento TEXT DEFAULT 'dinheiro',

  -- Status da OS
  status TEXT DEFAULT 'aberta' CHECK (status IN (
    'aberta',
    'em_andamento',
    'aguardando_peca',
    'aguardando_aprovacao',
    'aprovada',
    'concluida',
    'entregue',
    'cancelada'
  )),

  -- Prioridade
  prioridade TEXT DEFAULT 'normal' CHECK (prioridade IN ('baixa', 'normal', 'alta', 'urgente')),

  -- Garantia
  garantia_dias INTEGER DEFAULT 90,

  -- Datas
  data_entrada TIMESTAMPTZ DEFAULT NOW(),
  data_previsao TIMESTAMPTZ,
  data_conclusao TIMESTAMPTZ,
  data_entrega TIMESTAMPTZ,

  -- Itens/Serviços detalhados (JSON array)
  itens JSONB DEFAULT '[]'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_service_orders_numero ON service_orders(numero_os);
CREATE INDEX IF NOT EXISTS idx_service_orders_status ON service_orders(status);
CREATE INDEX IF NOT EXISTS idx_service_orders_lead ON service_orders(lead_id);
CREATE INDEX IF NOT EXISTS idx_service_orders_cliente_telefone ON service_orders(cliente_telefone);
CREATE INDEX IF NOT EXISTS idx_service_orders_data_entrada ON service_orders(data_entrada DESC);
CREATE INDEX IF NOT EXISTS idx_service_orders_tecnico ON service_orders(tecnico_id);
CREATE INDEX IF NOT EXISTS idx_service_orders_prioridade ON service_orders(prioridade);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_service_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_service_orders_updated_at
  BEFORE UPDATE ON service_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_service_orders_updated_at();

-- Sequência para número da OS (formato: OS-YYYYMMDD-XXXX)
CREATE OR REPLACE FUNCTION generate_os_number()
RETURNS TEXT AS $$
DECLARE
  today_str TEXT;
  seq_num INTEGER;
  os_number TEXT;
BEGIN
  today_str := TO_CHAR(NOW(), 'YYYYMMDD');

  SELECT COALESCE(MAX(
    CAST(SPLIT_PART(numero_os, '-', 3) AS INTEGER)
  ), 0) + 1
  INTO seq_num
  FROM service_orders
  WHERE numero_os LIKE 'OS-' || today_str || '-%';

  os_number := 'OS-' || today_str || '-' || LPAD(seq_num::TEXT, 4, '0');
  RETURN os_number;
END;
$$ LANGUAGE plpgsql;

-- RLS (Row Level Security)
ALTER TABLE service_orders ENABLE ROW LEVEL SECURITY;

-- Política permissiva para todas as operações
CREATE POLICY "allow_all_service_orders"
  ON service_orders FOR ALL
  USING (true)
  WITH CHECK (true);

-- Se a política acima não funcionar, execute este comando para desativar RLS:
-- ALTER TABLE service_orders DISABLE ROW LEVEL SECURITY;
