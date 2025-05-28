const multer = require('multer');

// Use memory storage to avoid writing files to disk
const storage = multer.memoryStorage();

const upload = multer({ storage });

module.exports = upload;
