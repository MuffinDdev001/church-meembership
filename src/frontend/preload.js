const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    checkForUpdates: () => ipcRenderer.send('check-for-updates'),
    downloadUpdate: () => ipcRenderer.send('download-update'),
    quitAndInstall: () => ipcRenderer.send('quit-and-install'),
    onUpdateAvailable: (callback) => ipcRenderer.on('update-available', (event, ...args) => callback(...args)),
    onUpdateNotAvailable: (callback) => ipcRenderer.on('update-not-available', (event, ...args) => callback(...args)),
    onDownloadProgress: (callback) => ipcRenderer.on('download-progress', (event, ...args) => callback(...args)),
    onUpdateDownloaded: (callback) => ipcRenderer.on('update-downloaded', (event, ...args) => callback(...args)),
    onUpdateError: (callback) => ipcRenderer.on('update-error', (event, ...args) => callback(...args)),
    removeListeners: () => {
        ipcRenderer.removeAllListeners('update-available');
        ipcRenderer.removeAllListeners('update-not-available');
        ipcRenderer.removeAllListeners('download-progress');
        ipcRenderer.removeAllListeners('update-downloaded');
        ipcRenderer.removeAllListeners('update-error');
    }
});
