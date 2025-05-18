const express = require("express");
const router = express.Router();
const { getProfile, updateProfile } = require("../controllers/profileController");

router.get("/", getProfile);
router.post("/", updateProfile); // can also be put as PUT method

module.exports = router;
