const supabase = require('../models/supabaseClient');

exports.authenticate = async (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  req.token = token; // make it available to downstream handlers

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return res.status(401).json({ error: 'Invalid token' });
  // console.log("token is okay!")
  req.user = user;
  next();
};
