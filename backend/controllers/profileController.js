const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)
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
      daily_protein,
      daily_carbs,
      daily_fat,
      calories_goal,
      protein_goal,
      carbs_goal,
      fat_goal,
    } = req.body;

    let avatar_url = null;

    // Upload to Supabase bucket if avatar file exists
    if (req.file) {
      const fileExt = path.extname(req.file.originalname);
      const fileName = `avatars/${userId}-${Date.now()}${fileExt}`;
      const fileBuffer = req.file.buffer;


      const { error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(fileName, fileBuffer, {
          contentType: req.file.mimetype,
          upsert: true,
        });

      if (uploadError) {
        console.error('Error uploading avatar:', uploadError);
        return res.status(500).json({ error: 'Failed to upload avatar' });
      }

      // Get public URL of uploaded file
      const { data: publicUrlData } = supabase.storage
        .from('profile-images')
        .getPublicUrl(fileName);

      avatar_url = publicUrlData.publicUrl;
    }

    // Check if profile exists
    const { data: existingProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();

    if (fetchError && fetchError.code === 'PGRST116') {
      const tempUsername = `user_${userId.slice(0, 8)}`;
      const { error: insertError } = await supabase
        .from('profiles')
        .insert([{ id: userId, username: tempUsername }]);

      if (insertError) {
        console.error('Error inserting profile:', insertError);
        return res.status(500).json({ error: 'Failed to initialize user profile' });
      }
    } else if (fetchError) {
      console.error('Error fetching profile:', fetchError);
      return res.status(500).json({ error: 'Failed to check profile' });
    }

    // Username uniqueness check
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

    // Build update payload
    const updates = {
      username,
      display_name,
      bio,
      location,
      website,
      daily_calories,
      daily_protein,
      daily_carbs,
      daily_fat,
      calories_goal,
      protein_goal,
      carbs_goal,
      fat_goal,
      updated_at: new Date().toISOString(),
    };

    if (avatar_url) updates.avatar_url = avatar_url;

    Object.keys(updates).forEach(
      (key) => updates[key] === undefined && delete updates[key]
    );

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
  console.log("reached getProfile!")
  try {
    const userId = req.user.id;
    console.log("getting profile");
    const { data: profile, error } = await supabase
      .from('profiles')
      .select(
        'username, display_name, bio, location, website, avatar_url, ' +
        'daily_calories, daily_protein, daily_carbs, daily_fat, ' +
        'calories_goal, protein_goal, carbs_goal, fat_goal'
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
