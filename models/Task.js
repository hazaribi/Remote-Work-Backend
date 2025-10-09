const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

class Task {
  static async create(title, description, listId, workspaceId, createdBy, position) {
    const { data, error } = await supabase
      .from('tasks')
      .insert([{
        title,
        description,
        list_id: listId,
        workspace_id: workspaceId,
        created_by: createdBy,
        position
      }])
      .select(`
        *,
        assigned_user:assigned_to(id, full_name, email),
        creator:created_by(id, full_name, email)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  static async findByWorkspace(workspaceId) {
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        assigned_user:assigned_to(id, full_name, email),
        creator:created_by(id, full_name, email)
      `)
      .eq('workspace_id', workspaceId)
      .order('position', { ascending: true });

    if (error) throw error;
    return data;
  }

  static async findByList(listId) {
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        assigned_user:assigned_to(id, full_name, email),
        creator:created_by(id, full_name, email)
      `)
      .eq('list_id', listId)
      .order('position', { ascending: true });

    if (error) throw error;
    return data;
  }

  static async update(id, updates) {
    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        assigned_user:assigned_to(id, full_name, email),
        creator:created_by(id, full_name, email)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  static async delete(id) {
    const { data, error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updatePositions(updates) {
    for (const update of updates) {
      const { error } = await supabase
        .from('tasks')
        .update({ 
          list_id: update.list_id, 
          position: update.position 
        })
        .eq('id', update.id);
      
      if (error) {
        console.error('Update error for task', update.id, ':', error);
        throw error;
      }
    }
    return updates;
  }
}

module.exports = Task;