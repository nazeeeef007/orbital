const express = require('express');
const router = express.Router();
const { reportIncident } = require('../controllers/incidentController');

router.post('/', reportIncident);

module.exports = router;
