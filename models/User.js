const supabase = require('../config/supabase');
const bcrypt = require('bcryptjs');

class User {
  static async create({ email, password, full_name }) {
    const password_hash = await bcrypt.hash(password, 10);
    
    const { data, error } = await supabase
      .from('users')
      .insert([{ email, password_hash, full_name }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async findByEmail(email) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  static async validatePassword(password, hash) {
    return await bcrypt.compare(password, hash);
  }
}

module.exports = User;