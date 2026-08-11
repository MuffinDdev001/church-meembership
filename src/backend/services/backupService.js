const cron = require('node-cron');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const settingsPath = path.join(__dirname, '..', 'data', 'backupSettings.json');
const backupDir = path.join(__dirname, '..', 'public', 'backups');
const automatedBackupPath = path.join(backupDir, 'automated-backup.sql');

let currentCronJob = null;

const defaultSettings = {
    enabled: false,
    frequency: 'daily' // 'hourly', '12hours', 'daily', '2days', 'weekly'
};

const getCronExpression = (frequency) => {
    switch (frequency) {
        case 'hourly': return '0 * * * *';
        case '12hours': return '0 */12 * * *';
        case 'daily': return '0 0 * * *';
        case '2days': return '0 0 */2 * *';
        case 'weekly': return '0 0 * * 0';
        default: return '0 0 * * *'; // fallback daily
    }
};

const ensureDirectories = () => {
    const dataDir = path.dirname(settingsPath);
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }
};

const getSettings = () => {
    ensureDirectories();
    if (!fs.existsSync(settingsPath)) {
        fs.writeFileSync(settingsPath, JSON.stringify(defaultSettings, null, 2));
        return defaultSettings;
    }
    try {
        const data = fs.readFileSync(settingsPath, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error('Error reading backup settings:', err);
        return defaultSettings;
    }
};

const updateSettings = (newSettings) => {
    ensureDirectories();
    const settings = { ...getSettings(), ...newSettings };
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
    
    // Restart cron job if settings changed
    initAutomatedBackup();
    
    return settings;
};

const performAutomatedBackup = () => {
    console.log('Running automated database backup...');
    ensureDirectories();
    
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
        console.error('Automated Backup failed: DATABASE_URL not found.');
        return;
    }

    const command = `pg_dump --clean --if-exists --no-owner --no-privileges --schema=public -d "${dbUrl}" -f "${automatedBackupPath}"`;

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Automated Backup error: ${error.message}`);
            return;
        }
        console.log(`Automated Backup completed successfully at ${new Date().toISOString()}`);
    });
};

const initAutomatedBackup = () => {
    const settings = getSettings();
    
    // Stop existing job if there is one
    if (currentCronJob) {
        currentCronJob.stop();
        currentCronJob = null;
    }

    if (settings.enabled) {
        const cronExpr = getCronExpression(settings.frequency);
        currentCronJob = cron.schedule(cronExpr, () => {
            performAutomatedBackup();
        });
        console.log(`Automated Backup scheduled with frequency: ${settings.frequency} (${cronExpr})`);
    } else {
        console.log('Automated Backup is disabled.');
    }
};

const getBackupStatus = () => {
    if (fs.existsSync(automatedBackupPath)) {
        const stats = fs.statSync(automatedBackupPath);
        return {
            exists: true,
            lastBackupDate: stats.mtime,
            sizeBytes: stats.size
        };
    }
    return {
        exists: false,
        lastBackupDate: null,
        sizeBytes: 0
    };
};

module.exports = {
    initAutomatedBackup,
    getSettings,
    updateSettings,
    getBackupStatus,
    automatedBackupPath
};
