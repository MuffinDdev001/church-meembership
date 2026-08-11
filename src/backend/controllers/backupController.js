const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const getDatabaseUrl = () => {
    return process.env.DATABASE_URL;
};

exports.downloadBackup = async (req, res) => {
    try {
        const dbUrl = getDatabaseUrl();
        if (!dbUrl) {
            return res.status(500).json({ message: 'DATABASE_URL not found in environment variables.' });
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupFileName = `backup-${timestamp}.sql`;
        const backupFilePath = path.join(__dirname, '..', 'public', 'uploads', backupFileName);

        // Ensure uploads directory exists
        const uploadsDir = path.join(__dirname, '..', 'public', 'uploads');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }

        // Run pg_dump command (ONLY dumping the 'public' schema to avoid Supabase system schemas)
        const command = `pg_dump --clean --if-exists --no-owner --no-privileges --schema=public -d "${dbUrl}" -f "${backupFilePath}"`;

        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`Backup error: ${error.message}`);
                let userMessage = 'Failed to generate backup.';
                if (error.message.includes('server version mismatch')) {
                    userMessage = 'Backup failed: The database server version is newer than the pg_dump client installed on this server. Please upgrade your postgresql-client to version 17 or higher.';
                }
                return res.status(500).json({ message: userMessage, error: error.message });
            }

            res.download(backupFilePath, backupFileName, (err) => {
                if (err) {
                    console.error(`Download error: ${err.message}`);
                }
                // Clean up file after download
                fs.unlink(backupFilePath, (unlinkErr) => {
                    if (unlinkErr) console.error(`Failed to delete temporary backup file: ${unlinkErr}`);
                });
            });
        });

    } catch (error) {
        console.error('Download Backup Error:', error);
        res.status(500).json({ message: 'Server error during backup.', error: error.message });
    }
};

exports.restoreBackup = async (req, res) => {
    console.log('[RESTORE] Started restore process...');
    try {
        if (!req.file) {
            console.error('[RESTORE ERROR] No backup file was found in the request.');
            return res.status(400).json({ message: 'No backup file uploaded.' });
        }
        
        console.log(`[RESTORE] Received file: ${req.file.originalname} (Size: ${req.file.size} bytes)`);
        console.log(`[RESTORE] Saved temporary file to: ${req.file.path}`);

        const dbUrl = getDatabaseUrl();
        if (!dbUrl) {
            console.error('[RESTORE ERROR] DATABASE_URL not found in environment variables.');
            return res.status(500).json({ message: 'DATABASE_URL not found in environment variables.' });
        }

        const backupFilePath = req.file.path;

        // Run psql command to restore the file
        // Mask the password in the URL for logging purposes
        const safeDbUrl = dbUrl.replace(/:([^:@]+)@/, ':***@');
        console.log(`[RESTORE] Executing restore command on DB: ${safeDbUrl}`);
        
        const command = `psql -d "${dbUrl}" -f "${backupFilePath}"`;

        exec(command, (error, stdout, stderr) => {
            console.log(`[RESTORE] Finished executing command.`);
            
            // Clean up the uploaded file
            fs.unlink(backupFilePath, (unlinkErr) => {
                if (unlinkErr) console.error(`[RESTORE WARNING] Failed to delete uploaded backup file: ${unlinkErr}`);
                else console.log(`[RESTORE] Cleaned up temporary file: ${backupFilePath}`);
            });

            if (stderr) {
                console.log(`[RESTORE STDERR] ${stderr}`);
            }

            if (error) {
                console.error(`[RESTORE CRITICAL ERROR] Command execution failed: ${error.message}`);
                return res.status(500).json({ message: 'Failed to restore backup.', error: error.message, details: stderr });
            }

            if (stdout) {
                console.log(`[RESTORE STDOUT] ${stdout}`);
            }

            console.log('[RESTORE SUCCESS] Backup restored successfully.');
            res.json({ message: 'Backup restored successfully.' });
        });

    } catch (error) {
        console.error('[RESTORE CATCH ERROR] Server error during restore process:', error);
        res.status(500).json({ message: 'Server error during restore.', error: error.message });
    }
};

const backupService = require('../services/backupService');

exports.getSettings = async (req, res) => {
    try {
        const settings = backupService.getSettings();
        const status = backupService.getBackupStatus();
        res.json({ settings, status });
    } catch (error) {
        res.status(500).json({ message: 'Failed to retrieve automated backup settings.', error: error.message });
    }
};

exports.updateSettings = async (req, res) => {
    try {
        const { enabled, frequency } = req.body;
        const newSettings = backupService.updateSettings({ enabled, frequency });
        res.json({ message: 'Settings updated successfully.', settings: newSettings });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update automated backup settings.', error: error.message });
    }
};

exports.downloadAutomatedBackup = async (req, res) => {
    try {
        const status = backupService.getBackupStatus();
        if (!status.exists) {
            return res.status(404).json({ message: 'No automated backup available yet.' });
        }
        
        const fileName = `automated-backup-${new Date(status.lastBackupDate).toISOString().split('T')[0]}.sql`;
        res.download(backupService.automatedBackupPath, fileName, (err) => {
            if (err) {
                console.error(`Download automated backup error: ${err.message}`);
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to download automated backup.', error: error.message });
    }
};
