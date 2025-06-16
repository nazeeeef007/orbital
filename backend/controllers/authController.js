const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)

const signup = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ error: 'Email and password required' });

  // Password validation
  const isLongEnough = password.length >= 10;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);

  if (!isLongEnough || !hasUppercase || !hasLowercase || !hasNumber) {
    return res.status(400).json({
      error:
        'Password must be at least 10 characters long and include at least one uppercase letter, one lowercase letter, and one number.',
    });
  }

  try {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (error) {
      console.error(error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ message: 'User created', user: data.user });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Unexpected error during signup' });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return res.status(400).json({ error: error.message });
  
  res.status(200).json({ message: 'User logged in successfully', data });
};

const logout = async (req, res) => {
  const token = req.headers['authorization']?.split(' ')[1];

  if (!token) return res.status(400).json({ error: 'No token provided' });

  try {
    // Supabase does not have a backend signOut, but you can revoke the token:
    const { error } = await supabase.auth.admin.signOut(token);

    if (error) {
      console.error('Logout failed:', error.message);
      return res.status(500).json({ error: 'Failed to log out' });
    }

    return res.status(200).json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error('Unexpected error during logout:', err);
    return res.status(500).json({ error: 'Unexpected error during logout' });
  }
};

module.exports = {
  signup,
  login,
  logout
};