// Script de teste para webhook
// Execute: node test-webhook.js

const testAudio = 'data:audio/webm;base64,GkXfo59ChoEBQveBAULygQRC84EIQoKEd2VibUKHgQRChYECGFOAZwH/////////FUmpZpkq17GDD0JATYCGQ2hyb21lV0GGQ2hyb21lFlSua7+uvdeBAXPFh1WVwdYCvggECGRuAacBAAAAAAACVhJO';

const testImage = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAAA//EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AH//Z';

async function testWebhook(message, description) {
  console.log(`\n📤 Testando: ${description}`);
  console.log('Primeiros 100 chars:', message.substring(0, 100) + '...');

  const payload = {
    userId: 'teste-webhook-12345',
    userName: 'Teste Webhook',
    message: message,
    isBot: true,
    timestamp: new Date().toISOString()
  };

  try {
    const response = await fetch('http://localhost:3001/api/webhook/message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ Sucesso:', result);
    } else {
      console.log('❌ Erro:', response.status, result);
    }
  } catch (error) {
    console.error('❌ Erro na requisição:', error.message);
  }
}

async function main() {
  console.log('🧪 Iniciando testes de webhook...\n');
  console.log('Servidor deve estar rodando em http://localhost:3001');
  console.log('=' .repeat(60));

  // Teste 1: Áudio com prefixo correto
  await testWebhook(testAudio, 'Áudio com prefixo data:audio/webm;base64,');

  // Aguarda 1 segundo
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Teste 2: Imagem com prefixo correto
  await testWebhook(testImage, 'Imagem com prefixo data:image/jpeg;base64,');

  // Aguarda 1 segundo
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Teste 3: Texto simples
  await testWebhook('Olá! Esta é uma mensagem de texto comum.', 'Texto simples');

  // Aguarda 1 segundo
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Teste 4: Base64 SEM prefixo (simulando erro comum)
  const audioSemPrefixo = testAudio.replace('data:audio/webm;base64,', '');
  await testWebhook(audioSemPrefixo, 'Áudio SEM prefixo (deve falhar)');

  console.log('\n' + '='.repeat(60));
  console.log('✅ Testes concluídos!');
  console.log('\n📝 Próximos passos:');
  console.log('1. Verifique o console do servidor para ver os logs de detecção');
  console.log('2. Abra http://localhost:3000 para ver as mensagens no painel');
  console.log('3. Mensagens com áudio devem mostrar player 🎤');
  console.log('4. Mensagens com imagem devem mostrar preview 📷');
  console.log('5. Base64 sem prefixo deve aparecer como texto (esperado)');
}

main().catch(console.error);
