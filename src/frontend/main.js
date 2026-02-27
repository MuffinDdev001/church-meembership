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
  autoUpdater.quitAndInstall(false, true);
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
  const template = [
    {
      label: "File",
      submenu: [
        {
          label: "Check for Updates",
          click: () => {
            autoUpdater.checkForUpdates();
          }
        },
        { type: "separator" },
        {
          label: "Exit",
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: "Help",
      submenu: [
        {
          label: "About",
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
