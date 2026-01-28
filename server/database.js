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

    // Identifica o tipo de chave sendo usada
    const isServiceRole = SUPABASE_KEY.startsWith('eyJ') && SUPABASE_KEY.includes('service_role');
    console.log(`✅ Supabase conectado com sucesso! (Chave: ${isServiceRole ? 'service_role ✓' : 'anon ⚠️ - RLS será aplicado'})`);
    if (!isServiceRole) {
      console.log('💡 Dica: Use a chave service_role no SUPABASE_KEY para ignorar RLS no backend.');
    }
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
        unread: row.unread || 0,
        labelId: row.label_id || null,
        onHold: row.on_hold || false
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
        unread: data.unread || 0,
        labelId: data.label_id || null,
        onHold: data.on_hold || false
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
        unread: data.unread || 0,
        labelId: data.label_id || null,
        onHold: data.on_hold || false
      };
    } catch (error) {
      console.error('Erro ao salvar conversa:', error);
      return conversation;
    }
  },

  async setOnHold(userId, onHold) {
    if (!isConnected) return false;

    try {
      const { error } = await supabase
        .from('conversations')
        .update({
          on_hold: onHold,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Erro ao definir status de espera:', error);
      return false;
    }
  },

  async addMessage(userId, message) {
    if (!isConnected) return null;

    try {
      const conversation = await this.findByUserId(userId);
      if (!conversation) return null;

      const messages = [...conversation.messages, message];

      // Define a mensagem de preview baseado no tipo
      let lastMessage = message.text;
      if (message.type === 'audio') {
        lastMessage = '🎤 Áudio';
      } else if (message.type === 'file') {
        lastMessage = `📎 ${message.fileName || 'Arquivo'}`;
      }

      return await this.createOrUpdate(userId, {
        ...conversation,
        messages,
        lastMessage,
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

// Funções para Quick Messages
export const QuickMessageDB = {
  async findAll() {
    if (!isConnected) return [];

    try {
      const { data, error } = await supabase
        .from('quick_messages')
        .select('*')
        .eq('enabled', true)
        .order('order', { ascending: true });

      if (error) throw error;

      return data.map(row => ({
        id: row.id,
        text: row.text,
        emoji: row.emoji,
        category: row.category,
        shortcut: row.shortcut,
        order: row.order,
        enabled: row.enabled,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));
    } catch (error) {
      console.error('Erro ao buscar quick messages:', error);
      return [];
    }
  },

  async findById(id) {
    if (!isConnected) return null;

    try {
      const { data, error } = await supabase
        .from('quick_messages')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      return {
        id: data.id,
        text: data.text,
        emoji: data.emoji,
        category: data.category,
        shortcut: data.shortcut,
        order: data.order,
        enabled: data.enabled,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (error) {
      console.error('Erro ao buscar quick message:', error);
      return null;
    }
  },

  async create(quickMessage) {
    if (!isConnected) return null;

    try {
      const { data, error } = await supabase
        .from('quick_messages')
        .insert({
          text: quickMessage.text,
          emoji: quickMessage.emoji || null,
          category: quickMessage.category || 'general',
          shortcut: quickMessage.shortcut || null,
          order: quickMessage.order || 0,
          enabled: quickMessage.enabled !== undefined ? quickMessage.enabled : true
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        text: data.text,
        emoji: data.emoji,
        category: data.category,
        shortcut: data.shortcut,
        order: data.order,
        enabled: data.enabled,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (error) {
      console.error('Erro ao criar quick message:', error);
      return null;
    }
  },

  async update(id, quickMessage) {
    if (!isConnected) return null;

    try {
      const updateData = {
        updated_at: new Date().toISOString()
      };

      if (quickMessage.text !== undefined) updateData.text = quickMessage.text;
      if (quickMessage.emoji !== undefined) updateData.emoji = quickMessage.emoji;
      if (quickMessage.category !== undefined) updateData.category = quickMessage.category;
      if (quickMessage.shortcut !== undefined) updateData.shortcut = quickMessage.shortcut;
      if (quickMessage.order !== undefined) updateData.order = quickMessage.order;
      if (quickMessage.enabled !== undefined) updateData.enabled = quickMessage.enabled;

      const { data, error } = await supabase
        .from('quick_messages')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        text: data.text,
        emoji: data.emoji,
        category: data.category,
        shortcut: data.shortcut,
        order: data.order,
        enabled: data.enabled,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (error) {
      console.error('Erro ao atualizar quick message:', error);
      return null;
    }
  },

  async delete(id) {
    if (!isConnected) return false;

    try {
      const { error } = await supabase
        .from('quick_messages')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Erro ao deletar quick message:', error);
      return false;
    }
  },

  async reorder(orderedIds) {
    if (!isConnected) return false;

    try {
      // Atualiza a ordem de cada mensagem
      for (let i = 0; i < orderedIds.length; i++) {
        await supabase
          .from('quick_messages')
          .update({ order: i, updated_at: new Date().toISOString() })
          .eq('id', orderedIds[i]);
      }

      return true;
    } catch (error) {
      console.error('Erro ao reordenar quick messages:', error);
      return false;
    }
  }
};

// Funções para Leads (controle de trava)
export const LeadDB = {
  async getTravaStatus(userId) {
    if (!isConnected) return false;

    try {
      const { data, error } = await supabase
        .from('leads')
        .select('trava')
        .eq('telefone', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return false; // Lead não existe, considera não travado
        throw error;
      }

      return data.trava || false;
    } catch (error) {
      console.error('Erro ao buscar status de trava:', error);
      return false;
    }
  },

  async setTrava(userId, travaValue) {
    if (!isConnected) return false;

    try {
      const { error } = await supabase
        .from('leads')
        .update({ trava: travaValue })
        .eq('telefone', userId);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Erro ao atualizar trava:', error);
      return false;
    }
  },

  async toggleTrava(userId) {
    if (!isConnected) return null;

    try {
      const currentStatus = await this.getTravaStatus(userId);
      const newStatus = !currentStatus;

      const success = await this.setTrava(userId, newStatus);

      if (success) {
        return newStatus;
      }

      return null;
    } catch (error) {
      console.error('Erro ao alternar trava:', error);
      return null;
    }
  },

  async findAll() {
    if (!isConnected) return [];

    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map(row => ({
        uuid: row.id,
        telefone: row.telefone,
        nome: row.nome,
        email: row.email,
        status: row.status || 'novo',
        trava: row.trava || false,
        observacoes: row.observacoes || '',
        createdAt: row.created_at
      }));
    } catch (error) {
      console.error('Erro ao buscar leads:', error);
      return [];
    }
  },

  async findByUuid(uuid) {
    if (!isConnected) return null;

    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('id', uuid)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      return {
        uuid: data.id,
        telefone: data.telefone,
        nome: data.nome,
        email: data.email,
        status: data.status || 'novo',
        trava: data.trava || false,
        observacoes: data.observacoes || '',
        createdAt: data.created_at
      };
    } catch (error) {
      console.error('Erro ao buscar lead:', error);
      return null;
    }
  },

  async updateStatus(identifier, status) {
    if (!isConnected) return null;

    try {
      console.log('🔍 Buscando lead com identificador:', identifier);
      console.log('🔍 Tipo do identificador:', typeof identifier);

      // Limpa o telefone de caracteres especiais se for telefone
      const cleanIdentifier = String(identifier).replace(/\D/g, '');
      console.log('🔍 Identificador limpo (sem caracteres especiais):', cleanIdentifier);

      // Tenta buscar por UUID primeiro, depois por telefone
      let query = supabase.from('leads').select('*');

      // Se o identificador parece ser um UUID (tem hífens e letras), busca por uuid
      if (identifier.includes('-') && /[a-f]/.test(String(identifier).toLowerCase())) {
        console.log('🔍 Buscando por UUID');
        query = query.eq('id', identifier);
      } else {
        // Caso contrário, busca por telefone
        console.log('🔍 Buscando por telefone');
        // Tenta com o valor original e com o valor limpo
        query = query.or(`telefone.eq.${identifier},telefone.eq.${cleanIdentifier}`);
      }

      const { data: existingLead, error: findError } = await query.maybeSingle();

      if (findError) {
        console.error('❌ Erro ao buscar lead:', findError);
        return null;
      }

      if (!existingLead) {
        console.error('❌ Lead não encontrado no Supabase');
        console.error('❌ Identificador buscado:', identifier);
        console.error('❌ Identificador limpo:', cleanIdentifier);

        // Lista todos os leads para debug
        const { data: allLeads } = await supabase
          .from('leads')
          .select('id, telefone, nome')
          .limit(10);
        console.log('📋 Primeiros leads no banco:', allLeads);

        return null;
      }

      console.log('✅ Lead encontrado:', existingLead);

      // Atualiza o status usando o uuid encontrado
      const { data, error } = await supabase
        .from('leads')
        .update({ status })
        .eq('id', existingLead.id)
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao atualizar status:', error);
        throw error;
      }

      console.log('✅ Status atualizado com sucesso:', data);

      return {
        uuid: data.id,
        telefone: data.telefone,
        nome: data.nome,
        email: data.email,
        status: data.status || 'novo',
        trava: data.trava || false,
        observacoes: data.observacoes || '',
        createdAt: data.created_at
      };
    } catch (error) {
      console.error('❌ Erro ao atualizar status do lead:', error);
      console.error('Stack trace:', error.stack);
      return null;
    }
  },

  async create(leadData) {
    if (!isConnected) return null;

    try {
      const { data, error } = await supabase
        .from('leads')
        .insert({
          telefone: leadData.telefone,
          nome: leadData.nome,
          email: leadData.email || null,
          status: leadData.status || 'novo',
          trava: false,
          observacoes: leadData.observacoes || ''
        })
        .select()
        .single();

      if (error) throw error;

      return {
        uuid: data.id,
        telefone: data.telefone,
        nome: data.nome,
        email: data.email,
        status: data.status || 'novo',
        trava: data.trava || false,
        observacoes: data.observacoes || '',
        createdAt: data.created_at
      };
    } catch (error) {
      console.error('Erro ao criar lead:', error);
      return null;
    }
  },

  async update(identifier, leadData) {
    if (!isConnected) return null;

    try {
      console.log('🔍 Atualizando lead com identificador:', identifier);
      console.log('🔍 Tipo do identificador:', typeof identifier);
      console.log('🔍 Dados para atualizar:', leadData);

      const identifierStr = String(identifier);

      // Limpa o telefone de caracteres especiais se for telefone
      const cleanIdentifier = identifierStr.replace(/\D/g, '');

      // Tenta buscar por UUID primeiro, depois por telefone
      let query = supabase.from('leads').select('*');

      // UUID tem formato: 8-4-4-4-12 caracteres hexadecimais separados por hífen
      const isUUID = identifierStr.includes('-') && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifierStr);

      if (isUUID) {
        console.log('🔍 Detectado como UUID, buscando por id');
        query = query.eq('id', identifier);
      } else {
        // Caso contrário, busca por telefone
        console.log('🔍 Detectado como telefone, buscando por telefone');
        console.log('🔍 Telefone original:', identifier);
        console.log('🔍 Telefone limpo:', cleanIdentifier);
        query = query.or(`telefone.eq.${identifier},telefone.eq.${cleanIdentifier}`);
      }

      console.log('🔍 Executando busca no Supabase...');
      const { data: existingLead, error: findError } = await query.maybeSingle();

      if (findError) {
        console.error('❌ Erro ao buscar lead:', findError);
        console.error('❌ Código do erro:', findError.code);
        console.error('❌ Mensagem do erro:', findError.message);
        return null;
      }

      if (!existingLead) {
        console.error('❌ Lead não encontrado no banco de dados');
        console.error('❌ Identificador usado:', identifier);
        console.error('❌ É UUID?', isUUID);

        // Debug: Lista alguns leads para verificar
        const { data: allLeads } = await supabase
          .from('leads')
          .select('id, telefone, nome')
          .limit(5);
        console.log('📋 Primeiros 5 leads no banco:', allLeads);

        return null;
      }

      console.log('✅ Lead encontrado:', existingLead);

      const updateData = {
        updated_at: new Date().toISOString()
      };

      if (leadData.nome !== undefined) updateData.nome = leadData.nome;
      if (leadData.telefone !== undefined) updateData.telefone = leadData.telefone;
      if (leadData.email !== undefined) updateData.email = leadData.email;
      if (leadData.status !== undefined) updateData.status = leadData.status;
      if (leadData.observacoes !== undefined) updateData.observacoes = leadData.observacoes;

      console.log('🔄 Dados que serão atualizados:', updateData);
      console.log('🔄 Atualizando lead com ID:', existingLead.id);

      const { data, error } = await supabase
        .from('leads')
        .update(updateData)
        .eq('id', existingLead.id)
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao executar UPDATE no Supabase:', error);
        console.error('❌ Código do erro:', error.code);
        console.error('❌ Mensagem do erro:', error.message);
        console.error('❌ Detalhes do erro:', error.details);
        throw error;
      }

      console.log('✅ Lead atualizado com sucesso:', data);

      return {
        uuid: data.id,
        telefone: data.telefone,
        nome: data.nome,
        email: data.email,
        status: data.status || 'novo',
        trava: data.trava || false,
        observacoes: data.observacoes || '',
        createdAt: data.created_at
      };
    } catch (error) {
      console.error('❌ ERRO GERAL ao atualizar lead:', error);
      console.error('❌ Stack trace:', error.stack);
      return null;
    }
  },

  async delete(identifier) {
    if (!isConnected) return false;

    try {
      console.log('🔍 Deletando lead com identificador:', identifier);

      const identifierStr = String(identifier);

      // Limpa o telefone de caracteres especiais se for telefone
      const cleanIdentifier = identifierStr.replace(/\D/g, '');

      // Tenta buscar por UUID primeiro, depois por telefone
      let query = supabase.from('leads').select('*');

      // UUID tem formato: 8-4-4-4-12 caracteres hexadecimais separados por hífen
      const isUUID = identifierStr.includes('-') && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifierStr);

      if (isUUID) {
        console.log('🔍 Detectado como UUID, buscando por id');
        query = query.eq('id', identifier);
      } else {
        // Caso contrário, busca por telefone
        console.log('🔍 Detectado como telefone, buscando por telefone');
        query = query.or(`telefone.eq.${identifier},telefone.eq.${cleanIdentifier}`);
      }

      const { data: existingLead, error: findError } = await query.maybeSingle();

      if (findError) {
        console.error('❌ Erro ao buscar lead:', findError);
        return false;
      }

      if (!existingLead) {
        console.error('❌ Lead não encontrado');
        return false;
      }

      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', existingLead.id);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Erro ao deletar lead:', error);
      return false;
    }
  }
};

// Funções para Etiquetas (Labels)
export const LabelDB = {
  async findAll() {
    if (!isConnected) return [];

    try {
      const { data, error } = await supabase
        .from('labels')
        .select('*')
        .order('order', { ascending: true });

      if (error) throw error;

      return data.map(row => ({
        id: row.id,
        name: row.name,
        color: row.color,
        order: row.order,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));
    } catch (error) {
      console.error('Erro ao buscar etiquetas:', error);
      return [];
    }
  },

  async findById(id) {
    if (!isConnected) return null;

    try {
      const { data, error } = await supabase
        .from('labels')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      return {
        id: data.id,
        name: data.name,
        color: data.color,
        order: data.order,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (error) {
      console.error('Erro ao buscar etiqueta:', error);
      return null;
    }
  },

  async create(labelData) {
    if (!isConnected) return null;

    try {
      // Pega a maior ordem atual para colocar no final
      const { data: maxOrderData } = await supabase
        .from('labels')
        .select('order')
        .order('order', { ascending: false })
        .limit(1);

      const nextOrder = maxOrderData && maxOrderData.length > 0 ? (maxOrderData[0].order || 0) + 1 : 1;

      const { data, error } = await supabase
        .from('labels')
        .insert({
          name: labelData.name,
          color: labelData.color || '#25D366',
          order: labelData.order ?? nextOrder
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        name: data.name,
        color: data.color,
        order: data.order,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (error) {
      console.error('Erro ao criar etiqueta:', error);
      return null;
    }
  },

  async update(id, labelData) {
    if (!isConnected) return null;

    try {
      const updateData = {
        updated_at: new Date().toISOString()
      };

      if (labelData.name !== undefined) updateData.name = labelData.name;
      if (labelData.color !== undefined) updateData.color = labelData.color;
      if (labelData.order !== undefined) updateData.order = labelData.order;

      const { data, error } = await supabase
        .from('labels')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        name: data.name,
        color: data.color,
        order: data.order,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (error) {
      console.error('Erro ao atualizar etiqueta:', error);
      return null;
    }
  },

  async delete(id) {
    if (!isConnected) return false;

    try {
      // Remove a etiqueta das conversas primeiro (já é tratado pelo ON DELETE SET NULL)
      const { error } = await supabase
        .from('labels')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Erro ao deletar etiqueta:', error);
      return false;
    }
  },

  async reorder(orderedIds) {
    if (!isConnected) return false;

    try {
      for (let i = 0; i < orderedIds.length; i++) {
        await supabase
          .from('labels')
          .update({ order: i, updated_at: new Date().toISOString() })
          .eq('id', orderedIds[i]);
      }

      return true;
    } catch (error) {
      console.error('Erro ao reordenar etiquetas:', error);
      return false;
    }
  }
};

// Funções para Etiquetas em Conversas
export const ConversationLabelDB = {
  async setLabel(userId, labelId) {
    if (!isConnected) return false;

    try {
      const { error } = await supabase
        .from('conversations')
        .update({
          label_id: labelId,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Erro ao definir etiqueta da conversa:', error);
      return false;
    }
  },

  async removeLabel(userId) {
    if (!isConnected) return false;

    try {
      const { error } = await supabase
        .from('conversations')
        .update({
          label_id: null,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Erro ao remover etiqueta da conversa:', error);
      return false;
    }
  },

  async getConversationsByLabel(labelId) {
    if (!isConnected) return [];

    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('label_id', labelId)
        .order('last_timestamp', { ascending: false });

      if (error) throw error;

      return data.map(row => ({
        userId: row.user_id,
        userName: row.user_name,
        messages: row.messages || [],
        lastMessage: row.last_message,
        lastTimestamp: row.last_timestamp,
        unread: row.unread || 0,
        labelId: row.label_id,
        onHold: row.on_hold || false
      }));
    } catch (error) {
      console.error('Erro ao buscar conversas por etiqueta:', error);
      return [];
    }
  }
};

// Funções para Ordens de Serviço
export const ServiceOrderDB = {
  async generateNumeroOS() {
    if (!isConnected) {
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
      return `OS-${dateStr}-0001`;
    }

    try {
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');

      // Tenta contar as OS do dia para gerar o próximo número
      const { count, error } = await supabase
        .from('service_orders')
        .select('*', { count: 'exact', head: true })
        .like('numero_os', `OS-${dateStr}-%`);

      if (error) {
        console.log('⚠️ Erro ao contar OS do dia (tabela pode não existir):', error.message);
        return `OS-${dateStr}-0001`;
      }

      const seq = (count || 0) + 1;
      return `OS-${dateStr}-${String(seq).padStart(4, '0')}`;
    } catch (error) {
      console.error('Erro ao gerar número da OS:', error);
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
      return `OS-${dateStr}-0001`;
    }
  },

  async findAll(filters = {}) {
    if (!isConnected) return [];

    try {
      let query = supabase
        .from('service_orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.prioridade) {
        query = query.eq('prioridade', filters.prioridade);
      }
      if (filters.tecnico_id) {
        query = query.eq('tecnico_id', filters.tecnico_id);
      }
      if (filters.search) {
        query = query.or(
          `numero_os.ilike.%${filters.search}%,cliente_nome.ilike.%${filters.search}%,cliente_telefone.ilike.%${filters.search}%,equipamento.ilike.%${filters.search}%`
        );
      }

      const { data, error } = await query;

      if (error) throw error;

      return data.map(row => ({
        id: row.id,
        numeroOs: row.numero_os,
        leadId: row.lead_id,
        clienteNome: row.cliente_nome,
        clienteTelefone: row.cliente_telefone,
        clienteEmail: row.cliente_email,
        clienteEndereco: row.cliente_endereco,
        clienteCpfCnpj: row.cliente_cpf_cnpj,
        descricao: row.descricao,
        observacoes: row.observacoes,
        diagnostico: row.diagnostico,
        solucao: row.solucao,
        equipamento: row.equipamento,
        marca: row.marca,
        modelo: row.modelo,
        numeroSerie: row.numero_serie,
        tecnicoNome: row.tecnico_nome,
        tecnicoId: row.tecnico_id,
        valorServico: parseFloat(row.valor_servico) || 0,
        valorPecas: parseFloat(row.valor_pecas) || 0,
        desconto: parseFloat(row.desconto) || 0,
        valorTotal: parseFloat(row.valor_total) || 0,
        formaPagamento: row.forma_pagamento,
        status: row.status,
        prioridade: row.prioridade,
        garantiaDias: row.garantia_dias,
        dataEntrada: row.data_entrada,
        dataPrevisao: row.data_previsao,
        dataConclusao: row.data_conclusao,
        dataEntrega: row.data_entrega,
        itens: row.itens || [],
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));
    } catch (error) {
      console.error('Erro ao buscar ordens de serviço:', error);
      return [];
    }
  },

  async findById(id) {
    if (!isConnected) return null;

    try {
      const { data, error } = await supabase
        .from('service_orders')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      return {
        id: data.id,
        numeroOs: data.numero_os,
        leadId: data.lead_id,
        clienteNome: data.cliente_nome,
        clienteTelefone: data.cliente_telefone,
        clienteEmail: data.cliente_email,
        clienteEndereco: data.cliente_endereco,
        clienteCpfCnpj: data.cliente_cpf_cnpj,
        descricao: data.descricao,
        observacoes: data.observacoes,
        diagnostico: data.diagnostico,
        solucao: data.solucao,
        equipamento: data.equipamento,
        marca: data.marca,
        modelo: data.modelo,
        numeroSerie: data.numero_serie,
        tecnicoNome: data.tecnico_nome,
        tecnicoId: data.tecnico_id,
        valorServico: parseFloat(data.valor_servico) || 0,
        valorPecas: parseFloat(data.valor_pecas) || 0,
        desconto: parseFloat(data.desconto) || 0,
        valorTotal: parseFloat(data.valor_total) || 0,
        formaPagamento: data.forma_pagamento,
        status: data.status,
        prioridade: data.prioridade,
        garantiaDias: data.garantia_dias,
        dataEntrada: data.data_entrada,
        dataPrevisao: data.data_previsao,
        dataConclusao: data.data_conclusao,
        dataEntrega: data.data_entrega,
        itens: data.itens || [],
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (error) {
      console.error('Erro ao buscar ordem de serviço:', error);
      return null;
    }
  },

  async create(osData) {
    if (!isConnected) return null;

    try {
      const numeroOs = osData.numeroOs || await this.generateNumeroOS();

      const valorServico = parseFloat(osData.valorServico) || 0;
      const valorPecas = parseFloat(osData.valorPecas) || 0;
      const desconto = parseFloat(osData.desconto) || 0;
      const valorTotal = osData.valorTotal || (valorServico + valorPecas - desconto);

      const { data, error } = await supabase
        .from('service_orders')
        .insert({
          numero_os: numeroOs,
          lead_id: osData.leadId || null,
          cliente_nome: osData.clienteNome,
          cliente_telefone: osData.clienteTelefone || null,
          cliente_email: osData.clienteEmail || null,
          cliente_endereco: osData.clienteEndereco || null,
          cliente_cpf_cnpj: osData.clienteCpfCnpj || null,
          descricao: osData.descricao,
          observacoes: osData.observacoes || null,
          diagnostico: osData.diagnostico || null,
          solucao: osData.solucao || null,
          equipamento: osData.equipamento || null,
          marca: osData.marca || null,
          modelo: osData.modelo || null,
          numero_serie: osData.numeroSerie || null,
          tecnico_nome: osData.tecnicoNome || null,
          tecnico_id: osData.tecnicoId || null,
          valor_servico: valorServico,
          valor_pecas: valorPecas,
          desconto: desconto,
          valor_total: valorTotal,
          forma_pagamento: osData.formaPagamento || 'dinheiro',
          status: osData.status || 'aberta',
          prioridade: osData.prioridade || 'normal',
          garantia_dias: osData.garantiaDias || 90,
          data_entrada: osData.dataEntrada || new Date().toISOString(),
          data_previsao: osData.dataPrevisao || null,
          itens: osData.itens || []
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        numeroOs: data.numero_os,
        leadId: data.lead_id,
        clienteNome: data.cliente_nome,
        clienteTelefone: data.cliente_telefone,
        clienteEmail: data.cliente_email,
        clienteEndereco: data.cliente_endereco,
        clienteCpfCnpj: data.cliente_cpf_cnpj,
        descricao: data.descricao,
        observacoes: data.observacoes,
        diagnostico: data.diagnostico,
        solucao: data.solucao,
        equipamento: data.equipamento,
        marca: data.marca,
        modelo: data.modelo,
        numeroSerie: data.numero_serie,
        tecnicoNome: data.tecnico_nome,
        tecnicoId: data.tecnico_id,
        valorServico: parseFloat(data.valor_servico) || 0,
        valorPecas: parseFloat(data.valor_pecas) || 0,
        desconto: parseFloat(data.desconto) || 0,
        valorTotal: parseFloat(data.valor_total) || 0,
        formaPagamento: data.forma_pagamento,
        status: data.status,
        prioridade: data.prioridade,
        garantiaDias: data.garantia_dias,
        dataEntrada: data.data_entrada,
        dataPrevisao: data.data_previsao,
        dataConclusao: data.data_conclusao,
        dataEntrega: data.data_entrega,
        itens: data.itens || [],
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (error) {
      console.error('❌ Erro ao criar ordem de serviço:', error.message || error);
      console.error('❌ Código:', error.code);
      if (error.details) console.error('❌ Detalhes:', error.details);
      if (error.hint) console.error('❌ Dica:', error.hint);

      // Re-throw with more context for the API layer
      const enhancedError = new Error(error.message || 'Erro desconhecido');
      enhancedError.code = error.code;
      enhancedError.details = error.details;
      enhancedError.hint = error.hint;
      throw enhancedError;
    }
  },

  async update(id, osData) {
    if (!isConnected) return null;

    try {
      const updateData = {
        updated_at: new Date().toISOString()
      };

      if (osData.clienteNome !== undefined) updateData.cliente_nome = osData.clienteNome;
      if (osData.clienteTelefone !== undefined) updateData.cliente_telefone = osData.clienteTelefone;
      if (osData.clienteEmail !== undefined) updateData.cliente_email = osData.clienteEmail;
      if (osData.clienteEndereco !== undefined) updateData.cliente_endereco = osData.clienteEndereco;
      if (osData.clienteCpfCnpj !== undefined) updateData.cliente_cpf_cnpj = osData.clienteCpfCnpj;
      if (osData.leadId !== undefined) updateData.lead_id = osData.leadId;
      if (osData.descricao !== undefined) updateData.descricao = osData.descricao;
      if (osData.observacoes !== undefined) updateData.observacoes = osData.observacoes;
      if (osData.diagnostico !== undefined) updateData.diagnostico = osData.diagnostico;
      if (osData.solucao !== undefined) updateData.solucao = osData.solucao;
      if (osData.equipamento !== undefined) updateData.equipamento = osData.equipamento;
      if (osData.marca !== undefined) updateData.marca = osData.marca;
      if (osData.modelo !== undefined) updateData.modelo = osData.modelo;
      if (osData.numeroSerie !== undefined) updateData.numero_serie = osData.numeroSerie;
      if (osData.tecnicoNome !== undefined) updateData.tecnico_nome = osData.tecnicoNome;
      if (osData.tecnicoId !== undefined) updateData.tecnico_id = osData.tecnicoId;
      if (osData.valorServico !== undefined) updateData.valor_servico = parseFloat(osData.valorServico) || 0;
      if (osData.valorPecas !== undefined) updateData.valor_pecas = parseFloat(osData.valorPecas) || 0;
      if (osData.desconto !== undefined) updateData.desconto = parseFloat(osData.desconto) || 0;
      if (osData.formaPagamento !== undefined) updateData.forma_pagamento = osData.formaPagamento;
      if (osData.status !== undefined) updateData.status = osData.status;
      if (osData.prioridade !== undefined) updateData.prioridade = osData.prioridade;
      if (osData.garantiaDias !== undefined) updateData.garantia_dias = osData.garantiaDias;
      if (osData.dataPrevisao !== undefined) updateData.data_previsao = osData.dataPrevisao;
      if (osData.dataConclusao !== undefined) updateData.data_conclusao = osData.dataConclusao;
      if (osData.dataEntrega !== undefined) updateData.data_entrega = osData.dataEntrega;
      if (osData.itens !== undefined) updateData.itens = osData.itens;

      // Recalcula valor total se algum valor mudou
      if (osData.valorServico !== undefined || osData.valorPecas !== undefined || osData.desconto !== undefined) {
        const valorServico = parseFloat(osData.valorServico ?? updateData.valor_servico ?? 0);
        const valorPecas = parseFloat(osData.valorPecas ?? updateData.valor_pecas ?? 0);
        const desconto = parseFloat(osData.desconto ?? updateData.desconto ?? 0);
        updateData.valor_total = valorServico + valorPecas - desconto;
      }
      if (osData.valorTotal !== undefined) updateData.valor_total = parseFloat(osData.valorTotal);

      const { data, error } = await supabase
        .from('service_orders')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        numeroOs: data.numero_os,
        leadId: data.lead_id,
        clienteNome: data.cliente_nome,
        clienteTelefone: data.cliente_telefone,
        clienteEmail: data.cliente_email,
        clienteEndereco: data.cliente_endereco,
        clienteCpfCnpj: data.cliente_cpf_cnpj,
        descricao: data.descricao,
        observacoes: data.observacoes,
        diagnostico: data.diagnostico,
        solucao: data.solucao,
        equipamento: data.equipamento,
        marca: data.marca,
        modelo: data.modelo,
        numeroSerie: data.numero_serie,
        tecnicoNome: data.tecnico_nome,
        tecnicoId: data.tecnico_id,
        valorServico: parseFloat(data.valor_servico) || 0,
        valorPecas: parseFloat(data.valor_pecas) || 0,
        desconto: parseFloat(data.desconto) || 0,
        valorTotal: parseFloat(data.valor_total) || 0,
        formaPagamento: data.forma_pagamento,
        status: data.status,
        prioridade: data.prioridade,
        garantiaDias: data.garantia_dias,
        dataEntrada: data.data_entrada,
        dataPrevisao: data.data_previsao,
        dataConclusao: data.data_conclusao,
        dataEntrega: data.data_entrega,
        itens: data.itens || [],
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (error) {
      console.error('Erro ao atualizar ordem de serviço:', error);
      return null;
    }
  },

  async updateStatus(id, status) {
    if (!isConnected) return null;

    try {
      const updateData = { status, updated_at: new Date().toISOString() };

      if (status === 'concluida') {
        updateData.data_conclusao = new Date().toISOString();
      } else if (status === 'entregue') {
        updateData.data_entrega = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('service_orders')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        numeroOs: data.numero_os,
        status: data.status,
        dataConclusao: data.data_conclusao,
        dataEntrega: data.data_entrega
      };
    } catch (error) {
      console.error('Erro ao atualizar status da OS:', error);
      return null;
    }
  },

  async delete(id) {
    if (!isConnected) return false;

    try {
      const { error } = await supabase
        .from('service_orders')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Erro ao deletar ordem de serviço:', error);
      return false;
    }
  },

  async getStats() {
    if (!isConnected) return null;

    try {
      const { data, error } = await supabase
        .from('service_orders')
        .select('status, valor_total');

      if (error) throw error;

      const stats = {
        total: data.length,
        abertas: data.filter(d => d.status === 'aberta').length,
        emAndamento: data.filter(d => d.status === 'em_andamento').length,
        aguardandoPeca: data.filter(d => d.status === 'aguardando_peca').length,
        aguardandoAprovacao: data.filter(d => d.status === 'aguardando_aprovacao').length,
        concluidas: data.filter(d => d.status === 'concluida').length,
        entregues: data.filter(d => d.status === 'entregue').length,
        canceladas: data.filter(d => d.status === 'cancelada').length,
        valorTotal: data.reduce((sum, d) => sum + (parseFloat(d.valor_total) || 0), 0),
        valorConcluidas: data
          .filter(d => ['concluida', 'entregue'].includes(d.status))
          .reduce((sum, d) => sum + (parseFloat(d.valor_total) || 0), 0)
      };

      return stats;
    } catch (error) {
      console.error('Erro ao buscar estatísticas de OS:', error);
      return null;
    }
  }
};
