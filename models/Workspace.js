const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

class Workspace {
  static async create(name, createdBy) {
    const { data, error } = await supabase
      .from('workspaces')
      .insert([{ name, owner_id: createdBy }])
      .select()
      .single();

    if (error) throw error;

    // Add creator as member
    await supabase
      .from('workspace_members')
      .insert([{ workspace_id: data.id, user_id: createdBy, role: 'owner' }]);

    return data;
  }

  static async findById(id) {
    const { data, error } = await supabase
      .from('workspaces')
      .select('*, workspace_members(user_id, role, users(full_name, email))')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  static async findByUserId(userId) {
    const { data, error } = await supabase
      .from('workspace_members')
      .select('workspace_id, role, workspaces(id, name, created_at)')
      .eq('user_id', userId);

    if (error) throw error;
    return data.map(item => ({
      ...item.workspaces,
      role: item.role
    }));
  }

  static async addMember(workspaceId, userId, role = 'member') {
    const { data, error } = await supabase
      .from('workspace_members')
      .insert([{ workspace_id: workspaceId, user_id: userId, role }])
      .select();

    if (error) throw error;
    return data[0];
  }

  static async isMember(workspaceId, userId) {
    const { data, error } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', userId)
      .single();

    return !error && data;
  }
}

module.exports = Workspace;