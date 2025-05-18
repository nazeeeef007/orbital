const supabase = require('../models/supabaseClient');

async function reportIncident(req, res) {
  try {
    const { title, location, description, category, date } = req.body;

    // Validate required fields again (optional)

    // Insert into Supabase table 'incidents'
    const { data, error } = await supabase
      .from('incidents')
      .insert([{ title, location, description, category, date }]);

    if (error) {
      console.error('Supabase insert error:', error);
      return res.status(500).json({ error: 'Database insert failed' });
    }

    return res.status(201).json({ message: 'Incident reported', incident: data });
  } catch (err) {
    console.error('Unexpected server error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}

module.exports = { reportIncident };