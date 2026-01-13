# 📨 Sistema de Mensagens Rápidas - Guia Completo

## 🎯 Visão Geral

O sistema de **Mensagens Rápidas (Quick Messages)** foi implementado para permitir que os agentes enviem respostas pré-configuradas de forma rápida e eficiente durante o atendimento.

### ✨ Funcionalidades

- ✅ **Mensagens pré-configuradas** salvas no banco de dados Supabase
- ✅ **Persistência de conversas** - as mensagens não somem ao recarregar a página
- ✅ **Criação, edição e exclusão** de mensagens rápidas
- ✅ **Categorização** (Saudação, Suporte, Pergunta, Encerramento, etc.)
- ✅ **Emojis personalizados** para cada mensagem
- ✅ **Atalhos opcionais** (exemplo: /obg → expande para "Obrigado!")
- ✅ **Habilitação/Desabilitação** de mensagens sem excluir
- ✅ **Sincronização em tempo real** via WebSocket
- ✅ **Interface intuitiva** integrada ao chat

---

## 📋 Pré-requisitos

### 1. Configurar Supabase

Você precisa ter um projeto no **Supabase** configurado. Se ainda não tem:

1. Acesse [https://app.supabase.com](https://app.supabase.com)
2. Crie uma conta (se não tiver)
3. Crie um novo projeto
4. Anote a **URL** e a **ANON KEY** do projeto

### 2. Configurar Variáveis de Ambiente

Crie ou edite o arquivo `.env` na raiz do projeto:

```env
# Supabase Configuration
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_KEY=sua-chave-anon-key-aqui

# n8n Webhook (já existente)
N8N_WEBHOOK_URL=https://webhookworkflow.carrilhodev.com/webhook/agentteste
```

---

## 🗄️ Configuração do Banco de Dados

### Passo 1: Executar o SQL no Supabase

1. Abra o **Supabase Dashboard**: [https://app.supabase.com](https://app.supabase.com)
2. Selecione seu projeto
3. No menu lateral, clique em **"SQL Editor"**
4. Abra o arquivo `supabase-schema.sql` (na raiz do projeto)
5. **Copie todo o conteúdo** do arquivo
6. **Cole no SQL Editor** do Supabase
7. Clique em **"Run"** ou pressione `Ctrl + Enter`

### O que o SQL faz?

- ✅ Cria a tabela `conversations` (para persistir conversas)
- ✅ Cria a tabela `quick_messages` (para mensagens rápidas)
- ✅ Adiciona índices para melhor performance
- ✅ Insere **8 mensagens rápidas padrão** como exemplo
- ✅ Configura as políticas de segurança (Row Level Security)

### Passo 2: Verificar se as Tabelas Foram Criadas

1. No Supabase Dashboard, vá em **"Database"** → **"Tables"**
2. Você deve ver:
   - `conversations` (com colunas: id, user_id, user_name, messages, last_message, etc.)
   - `quick_messages` (com colunas: id, text, emoji, category, order, enabled, etc.)

---

## 🚀 Como Usar

### 1. Iniciar o Projeto

```bash
# Instalar dependências (se ainda não instalou)
npm install

# Modo desenvolvimento (frontend + backend)
npm run dev

# Ou rodar separadamente:
npm run dev:backend  # Porta 3001
npm run dev:frontend # Porta 3000
```

### 2. Acessar o Dashboard

Abra o navegador em: [http://localhost:3000](http://localhost:3000)

### 3. Usar Mensagens Rápidas no Chat

1. **Selecione uma conversa** na barra lateral
2. **Veja as mensagens rápidas** aparecendo acima do campo de input
3. **Clique em uma mensagem rápida** para enviá-la automaticamente
4. **Clique no botão "⚙️"** para gerenciar as mensagens

---

## 🛠️ Gerenciador de Mensagens Rápidas

### Acessar o Gerenciador

- Clique no ícone **⚙️** (engrenagem) na barra de mensagens rápidas
- Ou clique em **"+ Adicionar mensagens rápidas"** se não houver nenhuma cadastrada

### Adicionar Nova Mensagem

1. Preencha o **texto da mensagem** (obrigatório)
2. Escolha um **emoji** (opcional)
3. Selecione a **categoria**:
   - Geral
   - Saudação
   - Suporte
   - Pergunta
   - Encerramento
4. Adicione um **atalho** (opcional) - exemplo: `obg`
5. Clique em **"Adicionar"**

### Editar Mensagem

1. Na lista de mensagens cadastradas, clique em **"Editar"**
2. Modifique os campos desejados
3. Clique em **"Atualizar"**

### Excluir Mensagem

1. Clique em **"Excluir"** na mensagem desejada
2. Confirme a exclusão

### Habilitar/Desabilitar Mensagem

Use o **toggle switch** ao lado de cada mensagem para ativar/desativar sem excluir.

---

## 🔌 API Endpoints

O backend expõe os seguintes endpoints:

### Quick Messages

```
GET    /api/quick-messages        # Lista todas as mensagens habilitadas
GET    /api/quick-messages/:id    # Busca mensagem por ID
POST   /api/quick-messages        # Cria nova mensagem
PUT    /api/quick-messages/:id    # Atualiza mensagem
DELETE /api/quick-messages/:id    # Remove mensagem
POST   /api/quick-messages/reorder # Reordena mensagens
```

### Conversas (já existentes)

```
GET    /api/conversations          # Lista todas as conversas
GET    /api/conversations/:userId  # Busca conversa específica
POST   /api/conversations/:userId/send # Envia mensagem
POST   /api/webhook/message        # Recebe mensagens do n8n
```

---

## 🧩 Estrutura de Arquivos Criados/Modificados

### Backend

```
server/
├── database.js          # ✅ Atualizado - Adicionado QuickMessageDB
└── index.js             # ✅ Atualizado - Adicionados endpoints de Quick Messages
```

### Frontend

```
src/
├── components/
│   ├── QuickMessagesBar.jsx         # 🆕 Barra de mensagens rápidas
│   ├── QuickMessagesBar.css         # 🆕 Estilos da barra
│   ├── QuickMessagesManager.jsx     # 🆕 Modal de gerenciamento
│   ├── QuickMessagesManager.css     # 🆕 Estilos do modal
│   └── ChatWindow.jsx               # ✅ Atualizado - Integrado QuickMessagesBar
└── App.jsx                          # ✅ Atualizado - Socket global
```

### SQL

```
supabase-schema.sql     # 🆕 Schema completo do banco de dados
```

---

## 🎨 Personalização

### Adicionar Mais Emojis

Edite o arquivo `src/components/QuickMessagesManager.jsx`:

```javascript
const EMOJI_OPTIONS = [
  '👍', '⏰', '✅', '🤔', '✨', '⏳', '👨‍💼', '💬',
  '📝', '🎯', '💡', '🚀', '📞', '✔️', '❌',
  // Adicione mais emojis aqui
  '🔥', '💰', '🎉', '👏'
];
```

### Adicionar Novas Categorias

Edite o mesmo arquivo:

```javascript
const CATEGORIES = [
  { value: 'general', label: 'Geral' },
  { value: 'greeting', label: 'Saudação' },
  { value: 'support', label: 'Suporte' },
  { value: 'question', label: 'Pergunta' },
  { value: 'closing', label: 'Encerramento' },
  // Adicione novas categorias aqui
  { value: 'sales', label: 'Vendas' },
  { value: 'technical', label: 'Técnico' }
];
```

### Modificar Número de Mensagens Visíveis

Edite `src/components/QuickMessagesBar.jsx`:

```javascript
// Linha ~51
const displayedMessages = showAll ? quickMessages : quickMessages.slice(0, 5);
//                                                                          ↑
//                                                                  Altere aqui
```

---

## 🔍 Troubleshooting

### Mensagens Rápidas Não Aparecem

1. Verifique se o Supabase está conectado:
   - No console do backend, você deve ver: `✅ Supabase conectado com sucesso!`
2. Verifique se as tabelas foram criadas corretamente no Supabase
3. Verifique se há mensagens habilitadas (`enabled = true`)

### Erro ao Criar/Editar Mensagens

1. Verifique o console do navegador (`F12` → Console)
2. Verifique o console do backend (terminal)
3. Confirme que as variáveis de ambiente estão configuradas
4. Verifique as permissões (Row Level Security) no Supabase

### Mensagens Não Persistem ao Recarregar

1. Verifique se o Supabase está conectado
2. Se estiver usando "armazenamento em memória", configure o Supabase
3. Veja os logs do backend para identificar o problema

### WebSocket Não Sincroniza

1. Verifique se a conexão WebSocket está ativa:
   ```javascript
   console.log(window.socket.connected) // Deve retornar true
   ```
2. Reinicie o backend
3. Limpe o cache do navegador

---

## 📊 Mensagens Rápidas Padrão

O sistema vem com 8 mensagens pré-configuradas:

| Emoji | Texto | Categoria |
|-------|-------|-----------|
| 👍 | Obrigado! Estou aqui para ajudar. | Saudação |
| ⏰ | Já retorno com você em breve. | Suporte |
| ✅ | Entendi, vou verificar isso. | Suporte |
| 🤔 | Pode me fornecer mais detalhes? | Pergunta |
| ✨ | Perfeito! Resolvido. | Encerramento |
| ⏳ | Aguarde um momento, por favor. | Suporte |
| 👨‍💼 | Vou transferir você para um especialista. | Suporte |
| 💬 | Posso ajudar com mais alguma coisa? | Encerramento |

---

## 🔐 Segurança

### Row Level Security (RLS)

As tabelas estão configuradas com RLS habilitado e políticas permissivas (`USING (true)`).

**Para produção**, você deve ajustar as políticas conforme sua necessidade:

```sql
-- Exemplo: Apenas usuários autenticados podem modificar
CREATE POLICY "Only authenticated users can modify"
ON quick_messages FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);
```

---

## 📈 Melhorias Futuras (Opcionais)

Possíveis funcionalidades adicionais:

- [ ] Variáveis dinâmicas nas mensagens (ex: `{userName}`)
- [ ] Atalhos de teclado (ex: digitar `/obg` e expandir)
- [ ] Filtro por categoria
- [ ] Pesquisa de mensagens
- [ ] Drag & Drop para reordenar
- [ ] Templates com múltiplas mensagens
- [ ] Estatísticas de uso
- [ ] Importação/Exportação de mensagens

---

## 🤝 Suporte

Em caso de dúvidas ou problemas:

1. Verifique este README
2. Confira os logs do console (navegador e backend)
3. Revise as configurações do Supabase
4. Verifique se todas as dependências estão instaladas

---

## ✅ Checklist de Instalação

- [ ] Criar projeto no Supabase
- [ ] Configurar variáveis de ambiente (`.env`)
- [ ] Executar SQL no Supabase Dashboard
- [ ] Verificar criação das tabelas
- [ ] Instalar dependências (`npm install`)
- [ ] Iniciar o projeto (`npm run dev`)
- [ ] Testar criação de mensagem rápida
- [ ] Testar envio de mensagem rápida no chat
- [ ] Testar sincronização em tempo real

---

**🎉 Pronto! Seu sistema de mensagens rápidas está funcionando!**

As mensagens agora são salvas no Supabase e não desaparecem ao recarregar a página. Aproveite! 🚀
