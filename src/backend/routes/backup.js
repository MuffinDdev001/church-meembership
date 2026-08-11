const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const backupController = require('../controllers/backupController');

const os = require('os');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, os.tmpdir());
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + '.sql');
    }
});

const upload = multer({ storage: storage });

// Define routes
router.get('/download', backupController.downloadBackup);

router.post('/restore', (req, res, next) => {
    console.log('[UPLOAD] Starting file upload for restore...');
    upload.single('backupFile')(req, res, (err) => {
        if (err) {
            console.error('[UPLOAD ERROR] Multer error during file upload:', err);
            return res.status(500).json({ message: 'File upload failed.', error: err.message });
        }
        console.log('[UPLOAD SUCCESS] File uploaded to temporary directory.');
        next();
    });
}, backupController.restoreBackup);

// Automated Backup Routes
router.get('/settings', backupController.getSettings);
router.post('/settings', backupController.updateSettings);
router.get('/download-latest', backupController.downloadAutomatedBackup);

module.exports = router;
