const supabase = require('../utils/supabaseClient');

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
    // Note: supabase.auth.admin.signOut() expects a user ID, not a token.
    // If you want to invalidate a session from the server, you'd typically delete the session.
    // For client-side logout, just removing the token from SecureStore is usually sufficient.
    // If you specifically need to revoke a token from the server, you'd need to find the session ID
    // associated with the token and then use `supabase.auth.admin.deleteSession(sessionId)`.
    // For now, I'll remove the `signOut` call as it's likely not doing what's intended here.
    // The client-side `logout` function in `useAuth` handles clearing the token.

    // If you had a mechanism to get session_id from token:
    // const { data: { session }, error: sessionError } = await supabase.auth.getSession(token);
    // if (session && !sessionError) {
    //   await supabase.auth.admin.deleteSession(session.id);
    // }

    return res.status(200).json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error('Unexpected error during logout:', err);
    return res.status(500).json({ error: 'Unexpected error during logout' });
  }
};

// NEW FUNCTION: Get authenticated user's details
const getUser = async (req, res) => {
  // The 'authenticate' middleware already populates req.user
  // req.user will contain the user object from Supabase if authentication was successful
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized: User not found in request' });
  }
  console.log("got user!");
  // Return the user object directly as expected by Profile.tsx
  return res.status(200).json({ user: req.user });
};


module.exports = {
  signup,
  login,
  logout,
  getUser // Export the new function
};
