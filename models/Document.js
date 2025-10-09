const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

class Document {
  static async create(title, workspaceId, createdBy) {
    const { data, error } = await supabase
      .from('documents')
      .insert([{
        title,
        workspace_id: workspaceId,
        created_by: createdBy,
        content: '',
        yjs_state: null
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async findByWorkspace(workspaceId) {
    const { data, error } = await supabase
      .from('documents')
      .select(`
        *,
        creator:created_by(id, full_name, email)
      `)
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  static async findById(id) {
    const { data, error } = await supabase
      .from('documents')
      .select(`
        *,
        creator:created_by(id, full_name, email)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  static async updateSnapshot(id, yjsState, content) {
    const { data, error } = await supabase
      .from('documents')
      .update({
        yjs_state: yjsState,
        content: content,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async update(id, updates) {
    const { data, error } = await supabase
      .from('documents')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async delete(id) {
    const { data, error } = await supabase
      .from('documents')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

module.exports = Document;