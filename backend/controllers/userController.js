const supabase = require('../models/supabaseClient');

exports.getProfile = async (req, res) => {
  const user = req.user;
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.status(200).json({ profile: data });
};
