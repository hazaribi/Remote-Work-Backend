const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

class Message {
  static async create(content, workspaceId, senderId, messageType = 'text') {
    const { data, error } = await supabase
      .from('messages')
      .insert([{
        content,
        workspace_id: workspaceId,
        sender_id: senderId,
        message_type: messageType
      }])
      .select(`
        *,
        users!sender_id(id, full_name, email)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  static async findByWorkspace(workspaceId, limit = 50) {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        users!sender_id(id, full_name, email)
      `)
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data.reverse();
  }

  static async delete(messageId, userId) {
    const { data, error } = await supabase
      .from('messages')
      .delete()
      .eq('id', messageId)
      .eq('sender_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

module.exports = Message;