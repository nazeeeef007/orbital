const supabase = require('../models/supabaseClient');
const path = require('path');
const fs = require('fs');

const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      username,
      display_name,
      bio,
      location,
      website,
      daily_calories,
      protein_goal,
      carbs_goal,
      fat_goal,
    } = req.body;

    // Handle avatar upload file path (optional)
    let avatar_url = null;
    if (req.file) {
      avatar_url = `/uploads/${req.file.filename}`;
    }

    // Check if a profile row already exists
    const { data: existingProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();

    // If not found (PGRST116), insert one with a temporary username
if (fetchError && fetchError.code === 'PGRST116') {
  const tempUsername = `user_${userId.slice(0, 8)}`; // generate temp unique username
  const { error: insertError } = await supabase
    .from('profiles')
    .insert([{ 
      id: userId, 
      username: tempUsername 
    }]);

  if (insertError) {
    console.error('Error inserting profile:', insertError);
    return res.status(500).json({ error: 'Failed to initialize user profile' });
  }
} else if (fetchError) {
  // Other errors
  console.error('Error fetching profile:', fetchError);
  return res.status(500).json({ error: 'Failed to check profile' });
}


    // Check username uniqueness
    if (username) {
      const { data: existingUser, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username)
        .neq('id', userId)
        .single();

      if (existingUser) {
        return res.status(400).json({ error: 'Username already taken' });
      }
    }

    // Prepare update payload
    const updates = {
      username,
      display_name,
      bio,
      location,
      website,
      daily_calories,
      protein_goal,
      carbs_goal,
      fat_goal,
      updated_at: new Date().toISOString(),
    };

    if (avatar_url) updates.avatar_url = avatar_url;

    // Clean undefined fields
    Object.keys(updates).forEach(
      (key) => updates[key] === undefined && delete updates[key]
    );

    // Update profile
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Supabase update error:', error);
      return res.status(500).json({ error: error.message });
    }

    res.status(200).json({ message: 'Profile updated', profile: data });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Unexpected error updating profile' });
  }
};

const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: profile, error } = await supabase
      .from('profiles')
      .select(
        'username, display_name, bio, location, website, daily_calories, protein_goal, carbs_goal, fat_goal, avatar_url'
      )
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return res.status(500).json({ error: 'Failed to fetch profile' });
    }

    return res.json(profile);
  } catch (err) {
    console.error('Unexpected error in getProfile:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};


module.exports = {
  updateProfile,
  getProfile
};
