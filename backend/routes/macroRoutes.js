const express = require("express");
const { getMacroHistory } = require("../controllers/macroController");
const { authenticate } = require("../middleware/authMiddleware");

const router = express.Router();

// --- UPDATED ROUTE ---
// GET /api/macro/:id/history - fetch past 7 days for a specific user ID
// The 'authenticate' middleware ensures that only logged-in users can access this.
router.get("/:id/history", authenticate, getMacroHistory);

module.exports = router;