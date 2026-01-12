# 🔄 Webhook Bidirecional com n8n

Este dashboard suporta comunicação **bidirecional** com o n8n:

1. **n8n → Dashboard**: Recebe mensagens do bot via webhook
2. **Dashboard → n8n**: Envia mensagens do atendente via webhook

## 📥 Fluxo de Entrada (n8n → Dashboard)

Quando seu agente IA responde no n8n:

```
n8n Workflow → HTTP Request → Dashboard
```

**Endpoint:** `https://dash-v1-x9aw.onrender.com/api/webhook/message`

**Payload:**
```json
{
  "userId": "551191565696",
  "userName": "Carlos",
  "message": "Resposta do bot",
  "isBot": true,
  "timestamp": "2026-01-12T10:30:00Z"
}
```

## 📤 Fluxo de Saída (Dashboard → n8n)

Quando o atendente responde manualmente no dashboard:

```
Dashboard → Webhook n8n → Seu Workflow
```

**Webhook n8n:** `https://webhookworkflow.carrilhodev.com/webhook/agentteste`

**Payload enviado:**
```json
{
  "userId": "551191565696",
  "userName": "Carlos",
  "message": "Mensagem do atendente",
  "isAgent": true,
  "messageId": "1768216647873",
  "timestamp": "2026-01-12T10:35:00Z",
  "source": "dashboard"
}
```

## ⚙️ Configuração

### 1. No Render.com

Adicione a variável de ambiente:

- **Key:** `N8N_WEBHOOK_URL`
- **Value:** `https://webhookworkflow.carrilhodev.com/webhook/agentteste`

### 2. No n8n - Criar Webhook de Recebimento

Crie um novo workflow:

```
1. [Webhook Trigger]
   - HTTP Method: POST
   - Path: agentteste
   ↓
2. [Function/Code Node]
   - Extrai userId, userName, message
   ↓
3. [Enviar para WhatsApp/Canal]
   - Usa userId para identificar destinatário
   - Envia message
```

### 3. Exemplo de Workflow n8n

**Node 1: Webhook**
```
Method: POST
Path: /webhook/agentteste
Response: 200 OK
```

**Node 2: Extract Data**
```javascript
const data = $input.first().json.body;

return [{
  json: {
    userId: data.userId,
    userName: data.userName,
    message: data.message,
    isAgent: data.isAgent,
    timestamp: data.timestamp
  }
}];
```

**Node 3: Send to WhatsApp** (exemplo)
```
Para: {{ $json.userId }}
Mensagem: {{ $json.message }}
```

## 🔍 Como Funciona

### Cenário Completo:

1. **Cliente envia mensagem pelo WhatsApp**
   ```
   WhatsApp → n8n → Agente IA → Dashboard (webhook)
   ```

2. **Bot responde automaticamente**
   ```
   Agente IA → Dashboard (webhook) → WhatsApp
   ```

3. **Atendente intervém manualmente**
   ```
   Dashboard → n8n (webhook) → WhatsApp
   ```

4. **Cliente responde**
   ```
   WhatsApp → n8n → Dashboard (webhook)
   ```

## 📊 Campos do Payload

### Campos Enviados (Dashboard → n8n):

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `userId` | string | ID único do usuário (telefone, email, etc) |
| `userName` | string | Nome do usuário |
| `message` | string | Mensagem digitada pelo atendente |
| `isAgent` | boolean | Sempre `true` (identifica mensagem de atendente) |
| `messageId` | string | ID único da mensagem |
| `timestamp` | string | ISO 8601 timestamp |
| `source` | string | Sempre `"dashboard"` (identifica origem) |

### Uso no n8n:

```javascript
// Verificar se é mensagem de atendente
if ($json.isAgent && $json.source === 'dashboard') {
  // Enviar via WhatsApp/outro canal
  return {
    to: $json.userId,
    message: $json.message
  };
}
```

## 🧪 Teste Local

Para testar localmente, configure no `.env`:

```env
N8N_WEBHOOK_URL=http://localhost:5678/webhook/agentteste
```

Ou use o ngrok para expor seu n8n local:

```bash
ngrok http 5678
```

Então configure:
```env
N8N_WEBHOOK_URL=https://abc123.ngrok.io/webhook/agentteste
```

## 🐛 Troubleshooting

### Webhook não está sendo chamado

1. Verifique os logs do Render:
   ```
   📤 Enviando webhook para n8n: https://...
   ✅ Webhook enviado com sucesso para n8n
   ```

2. Teste manualmente:
   ```bash
   curl -X POST https://webhookworkflow.carrilhodev.com/webhook/agentteste \
     -H "Content-Type: application/json" \
     -d '{"userId":"test","userName":"Teste","message":"Olá","isAgent":true}'
   ```

### n8n não recebe os dados

1. Verifique o webhook trigger no n8n
2. Certifique-se que está usando POST
3. Verifique os logs de execução no n8n

### Timeout ao enviar webhook

O webhook é enviado de forma **não-bloqueante**. Se falhar, não afeta a mensagem no dashboard.

Verifique:
- URL do webhook está correta
- n8n está acessível publicamente
- Não há firewall bloqueando

## 📝 Logs

O servidor registra todas as tentativas de webhook:

```
📤 Enviando webhook para n8n: https://webhookworkflow.carrilhodev.com/webhook/agentteste
✅ Webhook enviado com sucesso para n8n
```

Ou em caso de erro:
```
❌ Erro ao enviar webhook para n8n: 404
```

## 🔐 Segurança (Opcional)

Para adicionar autenticação ao webhook, modifique o código:

```javascript
const webhookResponse = await fetch(N8N_WEBHOOK_URL, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.N8N_WEBHOOK_TOKEN}`
  },
  body: JSON.stringify(webhookPayload)
});
```

E adicione ao `.env`:
```env
N8N_WEBHOOK_TOKEN=seu_token_secreto
```

---

**Pronto!** Agora você tem comunicação bidirecional completa entre o dashboard e o n8n! 🎉
