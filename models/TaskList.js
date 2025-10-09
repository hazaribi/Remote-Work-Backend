const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

class TaskList {
  static async create(title, workspaceId, position) {
    const { data, error } = await supabase
      .from('task_lists')
      .insert([{ title, workspace_id: workspaceId, position }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async findByWorkspace(workspaceId) {
    const { data, error } = await supabase
      .from('task_lists')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('position', { ascending: true });

    if (error) throw error;
    return data;
  }

  static async update(id, updates) {
    const { data, error } = await supabase
      .from('task_lists')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async delete(id) {
    const { data, error } = await supabase
      .from('task_lists')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updatePositions(updates) {
    const { data, error } = await supabase
      .from('task_lists')
      .upsert(updates, { onConflict: 'id' })
      .select();

    if (error) throw error;
    return data;
  }
}

module.exports = TaskList;