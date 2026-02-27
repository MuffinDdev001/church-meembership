import React, { useState, useEffect } from 'react';

const UpdateChecker = () => {
    const [status, setStatus] = useState('idle'); // idle, checking, available, not-available, downloading, downloaded, error
    const [progress, setProgress] = useState(0);
    const [version, setVersion] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    // Check if running in Electron and API is available
    const isElectron = window.electronAPI !== undefined;

    useEffect(() => {
        if (!isElectron) return;

        const handleUpdateAvailable = (info) => {
            setStatus('available');
            setVersion(info.version);
        };

        const handleUpdateNotAvailable = (info) => {
            setStatus('not-available');
            setVersion(info.version);
            setTimeout(() => setStatus('idle'), 3000);
        };

        const handleDownloadProgress = (progressObj) => {
            setStatus('downloading');
            setProgress(progressObj.percent);
        };

        const handleUpdateDownloaded = (info) => {
            setStatus('downloaded');
        };

        const handleError = (message) => {
            setStatus('error');
            setErrorMessage(message);
            setTimeout(() => setStatus('idle'), 5000);
        };

        window.electronAPI.onUpdateAvailable(handleUpdateAvailable);
        window.electronAPI.onUpdateNotAvailable(handleUpdateNotAvailable);
        window.electronAPI.onDownloadProgress(handleDownloadProgress);
        window.electronAPI.onUpdateDownloaded(handleUpdateDownloaded);
        window.electronAPI.onUpdateError(handleError);

        return () => {
            window.electronAPI.removeListeners();
        };
    }, [isElectron]);

    const checkForUpdates = () => {
        setStatus('checking');
        window.electronAPI.checkForUpdates();
    };

    const downloadUpdate = () => {
        window.electronAPI.downloadUpdate();
    };

    const restartAndInstall = () => {
        window.electronAPI.quitAndInstall();
    };

    // Fallback for non-Electron environment or missing API
    // This helps verify if the component is mounted at all
    if (!isElectron) {
        return (
            <div className="px-4 py-3 bg-gray-900 border-t border-gray-700">
                <div className="text-xs text-gray-400">
                    <div className="flex items-center gap-2 w-full text-left cursor-not-allowed opacity-50">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span>Updates unavailable (Web Mode)</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="px-4 py-3 bg-gray-900 border-t border-gray-700">
            <div className="text-xs text-gray-400">
                {status === 'idle' && (
                    <button
                        onClick={checkForUpdates}
                        className="hover:text-white transition-colors flex items-center gap-2 w-full text-left"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span>Check for updates</span>
                    </button>
                )}

                {status === 'checking' && (
                    <div className="flex items-center gap-2 text-blue-400">
                        <svg className="animate-spin h-3 w-3 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Checking...</span>
                    </div>
                )}

                {status === 'available' && (
                    <div className="flex flex-col gap-2">
                        <span className="text-green-400 font-medium">Update available (v{version})</span>
                        <button
                            onClick={downloadUpdate}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-xs w-full transition-colors font-medium"
                        >
                            Download Update
                        </button>
                    </div>
                )}

                {status === 'not-available' && (
                    <div className="flex items-center gap-2 text-green-400">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>App is up to date</span>
                    </div>
                )}

                {status === 'downloading' && (
                    <div className="w-full">
                        <div className="flex justify-between mb-1 text-blue-300">
                            <span>Downloading...</span>
                            <span>{Math.floor(progress)}%</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-1.5 overflow-hidden">
                            <div
                                className="bg-blue-500 h-1.5 rounded-full transition-all duration-300 ease-out"
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>
                    </div>
                )}

                {status === 'downloaded' && (
                    <div className="flex flex-col gap-2">
                        <span className="text-green-400 font-medium">Update ready to install</span>
                        <button
                            onClick={restartAndInstall}
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded text-xs w-full transition-colors font-medium"
                        >
                            Restart & Install
                        </button>
                    </div>
                )}

                {status === 'error' && (
                    <div className="text-red-400 flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>Update failed</span>
                        </div>
                        <span className="text-[10px] opacity-75 truncate" title={errorMessage}>{errorMessage}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UpdateChecker;
