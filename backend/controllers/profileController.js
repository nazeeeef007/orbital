const supabase = require("../models/supabaseClient");

exports.getProfile = async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "Unauthorized" });

  const token = authHeader.split(" ")[1];

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(token);

  if (userError) return res.status(401).json({ error: "Invalid token" });

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(200).json(data);
};

exports.updateProfile = async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "Unauthorized" });

  const token = authHeader.split(" ")[1];

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(token);

  if (userError) return res.status(401).json({ error: "Invalid token" });

  const { height, weight, calories } = req.body;

  const { data, error } = await supabase
    .from("profiles")
    .upsert({
      user_id: user.id,
      height,
      weight,
      calories,
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  res.status(200).json({ message: "Profile updated", profile: data });
};
