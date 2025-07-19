const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)

const getAllIngredients = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('ingredients')
            .select('*');

        if (error) {
            console.error('Error fetching all ingredients:', error.message);
            return res.status(500).json({ error: 'Internal Server Error', details: error.message });
        }

        res.status(200).json(data);
    } catch (err) {
        console.error('Unexpected error in getAllIngredients:', err.message);
        res.status(500).json({ error: 'Internal Server Error', details: err.message });
    }
};

const getIngredientsById = async (req, res) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from('ingredients')
            .select('*')
            .eq('id', id) // Assuming 'id' is the primary key you want to query by
            .single(); // Use .single() if you expect only one record

        if (error) {
            if (error.code === 'PGRST116') { // No rows found
                return res.status(404).json({ error: 'Ingredient not found' });
            }
            console.error(`Error fetching ingredient with ID ${id}:`, error.message);
            return res.status(500).json({ error: 'Internal Server Error', details: error.message });
        }

        if (!data) {
            return res.status(404).json({ error: 'Ingredient not found' });
        }

        res.status(200).json(data);
    } catch (err) {
        console.error('Unexpected error in getIngredientsById:', err.message);
        res.status(500).json({ error: 'Internal Server Error', details: err.message });
    }
};

const searchIngredients = async (req, res) => {
    try {
        const { query } = req.query; // Get the search query from URL parameters, e.g., /ingredients/search?query=app

        if (!query) {
            return res.status(400).json({ error: 'Search query is required.' });
        }

        // Use ILIKE for case-insensitive prefix matching
        // The '%' wildcard after the query ensures prefix matching
        const { data, error } = await supabase
            .from('ingredients')
            .select('*')
            .ilike('name', `${query}%`); // Case-insensitive LIKE with prefix

        if (error) {
            console.error('Error searching ingredients:', error.message);
            return res.status(500).json({ error: 'Internal Server Error', details: error.message });
        }

        res.status(200).json(data);
    } catch (err) {
        console.error('Unexpected error in searchIngredients:', err.message);
        res.status(500).json({ error: 'Internal Server Error', details: err.message });
    }
};

module.exports = {
    getAllIngredients,
    getIngredientsById,
    searchIngredients
};