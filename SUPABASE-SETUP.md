# 💾 Setup Supabase - Persistência de Dados

Este guia mostra como configurar o Supabase para manter o histórico de conversas.

## 🎯 Por que Supabase?

- ✅ **Gratuito** até 500MB de dados
- ✅ **PostgreSQL** completo
- ✅ **Tempo real** nativo
- ✅ **Fácil de usar**
- ✅ **Já está configurado** no seu projeto

## 📋 Passo 1: Criar a Tabela

1. Acesse o [Supabase Dashboard](https://app.supabase.com)
2. Selecione seu projeto: `hyhagshrpmsrzheljtel`
3. Vá em **SQL Editor** (ícone de raio no menu lateral)
4. Clique em **New Query**
5. Cole este SQL:

```sql
-- Cria a tabela conversations
CREATE TABLE IF NOT EXISTS conversations (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,
  user_name TEXT NOT NULL,
  messages JSONB DEFAULT '[]'::jsonb,
  last_message TEXT,
  last_timestamp TIMESTAMPTZ DEFAULT NOW(),
  unread INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_timestamp ON conversations(last_timestamp DESC);

-- Comentários para documentação
COMMENT ON TABLE conversations IS 'Armazena conversas do chat dashboard';
COMMENT ON COLUMN conversations.user_id IS 'ID único do usuário (telefone, email, etc)';
COMMENT ON COLUMN conversations.messages IS 'Array de mensagens em formato JSON';
```

6. Clique em **Run** (ou pressione Ctrl+Enter)
7. Você deve ver: ✅ **Success. No rows returned**

## 📋 Passo 2: Configurar Variáveis de Ambiente no Render

1. Acesse o [Render Dashboard](https://dashboard.render.com)
2. Selecione seu serviço: `dash_v1`
3. Vá em **Environment** no menu lateral
4. Adicione estas variáveis:

### SUPABASE_URL
```
https://hyhagshrpmsrzheljtel.supabase.co
```

### SUPABASE_KEY
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5aGFnc2hycG1zcnpoZWxqdGVsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDc4Mzc0MiwiZXhwIjoyMDgwMzU5NzQyfQ.ijRQwaTe4B4sLkpTYOad_u5UK7KiBGYZKUV5346dd6c
```

5. Clique em **Save Changes**
6. O Render vai reiniciar automaticamente

## ✅ Passo 3: Verificar Conexão

Após o deploy, verifique os logs do Render:

```
💾 Usando Supabase para persistência
✅ Supabase conectado com sucesso!
```

Se aparecer:
```
⚠️  SUPABASE_URL ou SUPABASE_KEY não configurados
💭 Usando armazenamento em memória
```

Significa que as variáveis não foram configuradas corretamente.

## 🧪 Passo 4: Testar

1. Envie uma mensagem pelo n8n para o dashboard
2. Recarregue a página do dashboard
3. A mensagem deve continuar lá! ✅

## 📊 Visualizar Dados no Supabase

1. No Supabase Dashboard
2. Vá em **Table Editor**
3. Selecione a tabela `conversations`
4. Você verá todas as conversas armazenadas

## 🔍 Estrutura dos Dados

### Tabela: conversations

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | BIGSERIAL | ID auto-incrementado |
| `user_id` | TEXT | ID único do usuário (ex: telefone) |
| `user_name` | TEXT | Nome do usuário |
| `messages` | JSONB | Array de mensagens |
| `last_message` | TEXT | Última mensagem enviada |
| `last_timestamp` | TIMESTAMPTZ | Timestamp da última mensagem |
| `unread` | INTEGER | Número de mensagens não lidas |
| `created_at` | TIMESTAMPTZ | Data de criação |
| `updated_at` | TIMESTAMPTZ | Data da última atualização |

### Formato do campo messages (JSONB):

```json
[
  {
    "text": "Olá, preciso de ajuda",
    "isBot": false,
    "timestamp": "2026-01-12T10:30:00Z"
  },
  {
    "text": "Olá! Como posso ajudar?",
    "isBot": true,
    "isAgent": false,
    "timestamp": "2026-01-12T10:30:05Z"
  }
]
```

## 🛡️ Segurança

A **service_role_key** fornecida tem acesso total ao banco. Para produção:

1. No Supabase Dashboard, vá em **Settings** → **API**
2. Use a **anon key** para leitura pública
3. Configure Row Level Security (RLS) para proteger dados

## 🔄 Migração de Dados em Memória

Se você já tem conversas em memória e quer migrá-las:

1. As novas conversas serão automaticamente salvas no Supabase
2. Conversas antigas em memória serão perdidas ao reiniciar
3. Não há migração automática (dados em memória não persistem)

## ⚙️ Configuração Local

Para testar localmente, crie um arquivo `.env`:

```env
SUPABASE_URL=https://hyhagshrpmsrzheljtel.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 🐛 Troubleshooting

### Erro: "relation conversations does not exist"

A tabela não foi criada. Execute o SQL do Passo 1 novamente.

### Erro: "Invalid API key"

A SUPABASE_KEY está incorreta. Verifique se copiou corretamente.

### Conversas não aparecem após reload

1. Verifique os logs do servidor
2. Confirme que vê "✅ Supabase conectado"
3. Verifique se a tabela existe no Supabase

### Erro: "Column user_id violates unique constraint"

Tentativa de criar conversa duplicada. Normal, o sistema faz upsert automático.

## 📈 Limites do Plano Gratuito

- ✅ 500MB de dados
- ✅ 50.000 usuários ativos mensais
- ✅ 2GB de transferência
- ✅ Backups automáticos (7 dias)

Para este chat dashboard, é mais do que suficiente!

## 🎉 Pronto!

Agora suas conversas são persistentes e sobrevivem a reinicializações do servidor! 🚀

---

**Precisa de ajuda?** Consulte a [documentação do Supabase](https://supabase.com/docs)
