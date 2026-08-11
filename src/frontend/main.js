const { app, BrowserWindow, Menu, dialog, ipcMain } = require("electron");
const { autoUpdater } = require("electron-updater");
const path = require("path");

let mainWindow;
const gotTheLock = app.requestSingleInstanceLock();

// Configure auto-updater
autoUpdater.autoDownload = false; // Don't auto-download, ask user first
autoUpdater.autoInstallOnAppQuit = true; // Auto-install when app quits

// IMPORTANT: Disable signature validation on Mac for unsigned apps
// Remove this in production with proper code signing!
if (process.platform === 'darwin') {
  autoUpdater.forceDevUpdateConfig = true;
  // Additional Mac-specific configuration
  app.commandLine.appendSwitch('disable-features', 'OutOfBlinkCors');
}

// Auto-updater event handlers
autoUpdater.on("checking-for-update", () => {
  console.log("Checking for updates...");
});

autoUpdater.on("update-available", (info) => {
  console.log("Update available:", info.version);
  if (mainWindow) {
    mainWindow.webContents.send('update-available', info);
  }
});

autoUpdater.on("update-not-available", (info) => {
  console.log("Update not available. Current version:", info.version);
  if (mainWindow) {
    mainWindow.webContents.send('update-not-available', info);
  }
});

autoUpdater.on("error", (err) => {
  console.error("Error in auto-updater:", err);
  if (mainWindow) {
    mainWindow.webContents.send('update-error', err.message);
  }
});

autoUpdater.on("download-progress", (progressObj) => {
  let log_message = "Download speed: " + progressObj.bytesPerSecond;
  log_message = log_message + " - Downloaded " + progressObj.percent + "%";
  log_message = log_message + " (" + progressObj.transferred + "/" + progressObj.total + ")";
  console.log(log_message);

  // Update window title with progress
  if (mainWindow) {
    mainWindow.setTitle(`Church Membership - Downloading Update ${Math.floor(progressObj.percent)}%`);
    mainWindow.webContents.send('download-progress', progressObj);
  }
});

autoUpdater.on("update-downloaded", (info) => {
  console.log("Update downloaded");

  // Restore original title
  if (mainWindow) {
    mainWindow.setTitle("Church Membership");
    mainWindow.webContents.send('update-downloaded', info);
  }
});

// IPC Handlers
ipcMain.on('check-for-updates', () => {
  autoUpdater.checkForUpdates();
});

ipcMain.on('download-update', () => {
  autoUpdater.downloadUpdate();
});

ipcMain.on('quit-and-install', () => {
  console.log("Quit and install requested from renderer");
  autoUpdater.quitAndInstall();
});

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    title: "Church Membership",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js")
    }
  });

  mainWindow.loadFile(path.join(__dirname, "build", "index.html"));

  // Create menu with update option
  createMenu();
}

function createMenu() {
  const isMac = process.platform === 'darwin';

  const navigate = (route) => {
    if (mainWindow) {
      // Directly set the hash — far more reliable than IPC listener for HashRouter apps
      mainWindow.webContents.executeJavaScript(`window.location.hash = '#${route}'`);
    }
  };

  const template = [
    // { role: 'appMenu' } on macOS
    ...(isMac ? [{
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    }] : []),
    {
      label: 'File',
      submenu: [
        {
          label: 'Check for Updates',
          click: () => autoUpdater.checkForUpdates()
        },
        { type: 'separator' },
        isMac ? { role: 'close' } : { role: 'quit' },
        {
          label: 'Data Backup',
          click: () => navigate('/admin/backup')
        }
      ]
    },
    {
      label: 'Profile',
      submenu: [
        { label: 'Member Profile', click: () => navigate('/member-lookup') },
        { label: 'Visitor Profile', click: () => navigate('/visitor-lookup') },
        { label: 'Supporter Profile', click: () => navigate('/supporter-lookup') }
      ]
    },
    {
      label: 'Groups',
      submenu: [
        { label: 'Group Lookup', click: () => navigate('/group-lookup') },
        { label: 'Group Member Form', click: () => navigate('/group-membership-form') }
      ]
    },
    {
      label: 'Donation',
      submenu: [
        { label: 'Member Donation', click: () => navigate('/member-donation-entry') },
        { label: 'Visitor Donation', click: () => navigate('/visitor-donation-entry') },
        { label: 'Supporter Donation', click: () => navigate('/supporter-donation-entry') },
        { label: 'Donation Lookup', click: () => navigate('/donation-lookup') },
        { label: 'Donation Types', click: () => navigate('/donation-types-dropdown') }
      ]
    },
    {
      label: 'Accounting',
      submenu: [
        { label: 'Charges', click: () => navigate('/charges') },
        { label: 'Deposits', click: () => navigate('/deposit-dropdown') },
        { label: 'Expenses', click: () => navigate('/expense-categories') },
        { label: 'Vendors', click: () => navigate('/vendor') },
        { label: 'Checks', click: () => navigate('/reports/check-generator') },
        { label: 'Banks', click: () => navigate('/bank-dropdown') }
      ]
    },
    {
      label: 'Administration',
      submenu: [
        { label: 'Users', click: () => navigate('/admin/users') }
      ]
    },
    {
      label: 'Reports',
      submenu: [
        { label: 'All Reports Dashboard', click: () => navigate('/reports') }
      ]
    },
    {
      label: 'Communication',
      submenu: [
        { label: 'Send Email', click: () => navigate('/communication/email') },
        { label: 'Send Text Message', click: () => navigate('/communication/sms') },
        { label: 'Mass Communication', click: () => navigate('/communication/mass') }
      ]
    },
    {
      label: 'Event',
      submenu: [
        { label: 'Events Calendar', click: () => navigate('/events') }
      ]
    },
    {
      role: 'help',
      submenu: [
        {
          label: 'Learn More',
          click: async () => {
            const { shell } = require('electron')
            await shell.openExternal('https://electronjs.org')
          }
        },
        { type: "separator" },
        {
          label: "About Church Membership",
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: "info",
              title: "About Church Membership",
              message: `Church Membership Management System`,
              detail: `Version: ${app.getVersion()}\n\nA comprehensive solution for managing church membership, groups, and reports.`
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// Main App Logic
if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", (event, argv, workingDirectory) => {
    // Someone tried to run a second instance, we should focus our window.
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    createWindow();

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
      app.quit();
    }
  });
}
