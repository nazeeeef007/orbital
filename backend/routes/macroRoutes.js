const express = require("express");
const { getMacroHistory } = require("../controllers/macroController");
const {authenticate} = require("../middleware/authMiddleware");

const router = express.Router();

// GET /api/macros/history - fetch past 7 days
router.get("/history", authenticate, getMacroHistory);

module.exports = router;
