const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)

const path = require('path');
const fs = require('fs');
const { redisClient } = require('../utils/redis'); // ✅ import Redis client

// Helper: Calculate TTL until next 12AM SGT
function secondsUntilMidnightSGT() {
  const now = new Date();
  const utc8 = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Singapore' }));
  const nextMidnight = new Date(utc8);
  nextMidnight.setDate(utc8.getDate() + 1);
  nextMidnight.setHours(0, 0, 0, 0);
  return Math.floor((nextMidnight - utc8) / 1000);
}


// ... (previous imports and supabase client setup)

const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      username,
      display_name,
      bio,
      location,
      website,
      daily_calories, // These are the problematic fields
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
      const fileName = `avatars/${userId}-${Date.now()}${fileExt}`; // Fixed template literal syntax
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

    // Check if profile exists (existing logic is fine here)
    const { data: existingProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();

    if (fetchError && fetchError.code === 'PGRST116') {
      const tempUsername = `user_${userId.slice(0, 8)}`; // Fixed template literal syntax
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

    // Username uniqueness check (existing logic is fine here)
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

    // --- Start of FIX for integer conversion error ---
    // Build update payload
    const updates = {
      // Conditionally add numeric fields, converting to Number or null/undefined
      username,
      display_name,
      bio,
      location,
      website,
      // For numeric fields, convert to Number. If it's an empty string, set to null or omit.
      // Omit if you want to skip updating the field when empty.
      // Set to null if you want to explicitly set the database field to NULL.
      daily_calories: daily_calories ? Number(daily_calories) : null, // Assuming column allows NULL
      daily_protein: daily_protein ? Number(daily_protein) : null,
      daily_carbs: daily_carbs ? Number(daily_carbs) : null,
      daily_fat: daily_fat ? Number(daily_fat) : null,
      calories_goal: calories_goal ? Number(calories_goal) : null,
      protein_goal: protein_goal ? Number(protein_goal) : null,
      carbs_goal: carbs_goal ? Number(carbs_goal) : null,
      fat_goal: fat_goal ? Number(fat_goal) : null,
      updated_at: new Date().toISOString(),
    };

    if (avatar_url) updates.avatar_url = avatar_url;

    // Filter out undefined values (which is fine, but now nulls are explicitly handled for numbers)
    Object.keys(updates).forEach(
      (key) => updates[key] === undefined && delete updates[key]
    );

    // Filter out nulls if you prefer to not update the field when client sends empty string
    // Example: (updates[key] === null && typeof updates[key] === 'object') && delete updates[key]
    // Or, more simply, if you want to explicitly set nulls in DB, the above is fine.
    // If your DB columns are NOT NULL, you must send a valid number or handle validation on frontend.

    // --- End of FIX ---

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Supabase update error:', error);
      // More specific error message for client
      if (error.code === '22P02') { // Postgres "invalid text representation"
        return res.status(400).json({ error: 'Invalid format for a numeric field. Please enter numbers only.' });
      }
      return res.status(500).json({ error: error.message });
    }

    res.status(200).json({ message: 'Profile updated', profile: data });

  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Unexpected error updating profile' });
  }
};



// const getProfile = async (req, res) => {
//   console.log("reached getProfile!");
//   try {
//     // Get the target user ID from the URL parameters
//     const targetUserId = req.params.id;

//     // Optional: You could add a check here if req.user.id is authorized to view targetUserId's profile
//     // For now, any authenticated user can view any profile.

//     console.log(`Getting profile for user ID: ${targetUserId}`);
//     const { data: profile, error } = await supabase
//       .from('profiles')
//       .select(
//         'id, username, display_name, bio, location, website, avatar_url, ' +
//         'daily_calories, daily_protein, daily_carbs, daily_fat, ' +
//         'calories_goal, protein_goal, carbs_goal, fat_goal'
//       )
//       .eq('id', targetUserId) // Use targetUserId from params
//       .single();

//     if (error) {
//       console.error('Error fetching profile:', error);
//       // If no profile is found for the given ID (PGRST116), return 404
//       if (error.code === 'PGRST116') {
//         return res.status(404).json({ error: 'Profile not found' });
//       }
//       return res.status(500).json({ error: 'Failed to fetch profile' });
//     }

//     // Return the profile data, which now includes the 'id' field
//     return res.json(profile);
//   } catch (err) {
//     console.error('Unexpected error in getProfile:', err);
//     return res.status(500).json({ error: 'Server error' });
//   }
// };



const getProfile = async (req, res) => {
  console.log("reached getProfile!");

  const targetUserId = req.params.id;
  const isSelf = req.user && req.user.id === targetUserId;

  const cacheKey = `user_profile:${targetUserId}`;

  // ✅ Try cache if user is requesting their own profile
  if (isSelf) {
    try {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        console.log(`💾 Returned cached profile for user ${targetUserId}`);
        return res.json(JSON.parse(cached));
      }
    } catch (err) {
      console.error('❌ Redis GET failed:', err.message);
    }
  }

  try {
    console.log(`Getting profile for user ID: ${targetUserId}`);
    const { data: profile, error } = await supabase
      .from('profiles')
      .select(
        'id, username, display_name, bio, location, website, avatar_url, ' +
        'daily_calories, daily_protein, daily_carbs, daily_fat, ' +
        'calories_goal, protein_goal, carbs_goal, fat_goal'
      )
      .eq('id', targetUserId)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Profile not found' });
      }
      return res.status(500).json({ error: 'Failed to fetch profile' });
    }

    // ✅ Cache the profile if it’s for the current user
    if (isSelf) {
      try {
        const ttl = secondsUntilMidnightSGT();
        await redisClient.setEx(cacheKey, ttl, JSON.stringify(profile));
        console.log(`📦 Cached profile for user ${targetUserId} (expires in ${ttl}s)`);
      } catch (err) {
        console.error('❌ Redis SETEX failed:', err.message);
      }
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
