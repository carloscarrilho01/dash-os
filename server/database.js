import { createClient } from '@supabase/supabase-js';

let supabase = null;
let isConnected = false;

// Conecta ao Supabase
export async function connectDatabase() {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_KEY;

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.warn('⚠️  SUPABASE_URL ou SUPABASE_KEY não configurados. Usando armazenamento em memória.');
    return false;
  }

  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    // Testa a conexão
    const { error } = await supabase.from('conversations').select('count', { count: 'exact', head: true });

    if (error && error.code === '42P01') {
      // Tabela não existe
      console.log('⚠️  Tabela "conversations" não existe. Crie-a no Supabase Dashboard.');
      console.log('SQL: Ver instruções no console');
      return false;
    } else if (error) {
      throw error;
    }

    console.log('✅ Supabase conectado com sucesso!');
    isConnected = true;
    return true;
  } catch (error) {
    console.error('❌ Erro ao conectar no Supabase:', error.message);
    console.warn('⚠️  Continuando com armazenamento em memória.');
    return false;
  }
}

// Funções do banco de dados
export const ConversationDB = {
  async findAll() {
    if (!isConnected) return [];

    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .order('last_timestamp', { ascending: false });

      if (error) throw error;

      return data.map(row => ({
        userId: row.user_id,
        userName: row.user_name,
        messages: row.messages || [],
        lastMessage: row.last_message,
        lastTimestamp: row.last_timestamp,
        unread: row.unread || 0
      }));
    } catch (error) {
      console.error('Erro ao buscar conversas:', error);
      return [];
    }
  },

  async findByUserId(userId) {
    if (!isConnected) return null;

    try {
      const { data, error} = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      return {
        userId: data.user_id,
        userName: data.user_name,
        messages: data.messages || [],
        lastMessage: data.last_message,
        lastTimestamp: data.last_timestamp,
        unread: data.unread || 0
      };
    } catch (error) {
      console.error('Erro ao buscar conversa:', error);
      return null;
    }
  },

  async createOrUpdate(userId, conversation) {
    if (!isConnected) return conversation;

    try {
      const { data, error } = await supabase
        .from('conversations')
        .upsert({
          user_id: userId,
          user_name: conversation.userName,
          messages: conversation.messages || [],
          last_message: conversation.lastMessage,
          last_timestamp: conversation.lastTimestamp,
          unread: conversation.unread || 0,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })
        .select()
        .single();

      if (error) throw error;

      return {
        userId: data.user_id,
        userName: data.user_name,
        messages: data.messages || [],
        lastMessage: data.last_message,
        lastTimestamp: data.last_timestamp,
        unread: data.unread || 0
      };
    } catch (error) {
      console.error('Erro ao salvar conversa:', error);
      return conversation;
    }
  },

  async addMessage(userId, message) {
    if (!isConnected) return null;

    try {
      const conversation = await this.findByUserId(userId);
      if (!conversation) return null;

      const messages = [...conversation.messages, message];

      return await this.createOrUpdate(userId, {
        ...conversation,
        messages,
        lastMessage: message.text,
        lastTimestamp: message.timestamp
      });
    } catch (error) {
      console.error('Erro ao adicionar mensagem:', error);
      return null;
    }
  },

  async markAsRead(userId) {
    if (!isConnected) return;

    try {
      await supabase
        .from('conversations')
        .update({ unread: 0 })
        .eq('user_id', userId);
    } catch (error) {
      console.error('Erro ao marcar como lida:', error);
    }
  }
};
