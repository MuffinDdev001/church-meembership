import React, { useState, useEffect } from 'react';

const BackupRestore = () => {
  const [downloading, setDownloading] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [file, setFile] = useState(null);

  // Automated Backup State
  const [autoSettings, setAutoSettings] = useState({ enabled: false, frequency: 'daily' });
  const [autoStatus, setAutoStatus] = useState({ exists: false, lastBackupDate: null });
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    fetchAutomatedSettings();
  }, []);

  const fetchAutomatedSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:4000'}/backup/settings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAutoSettings(data.settings);
        setAutoStatus(data.status);
      }
    } catch (err) {
      console.error('Failed to fetch automated backup settings:', err);
    }
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    setError('');
    setMessage('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:4000'}/backup/settings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(autoSettings)
      });
      if (!response.ok) throw new Error('Failed to save settings');
      setMessage('Automated backup settings saved successfully.');
    } catch (err) {
      console.error(err);
      setError('An error occurred while saving settings.');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleDownloadLatest = async () => {
    setError('');
    setMessage('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:4000'}/backup/download-latest`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to download automated backup');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `automated-backup-${new Date().toISOString().split('T')[0]}.sql`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      setMessage('Automated backup downloaded successfully.');
    } catch (err) {
      console.error(err);
      setError('An error occurred while downloading the automated backup.');
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    setError('');
    setMessage('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:4000'}/backup/download`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to download backup');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const contentDisposition = response.headers.get('content-disposition');
      let fileName = 'backup.sql';
      if (contentDisposition && contentDisposition.indexOf('attachment') !== -1) {
        const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
        const matches = filenameRegex.exec(contentDisposition);
        if (matches != null && matches[1]) {
          fileName = matches[1].replace(/['"]/g, '');
        }
      }
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      setMessage('Backup downloaded successfully.');
    } catch (err) {
      console.error(err);
      setError('An error occurred while downloading the backup. Make sure PostgreSQL tools are installed on the server.');
    } finally {
      setDownloading(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleRestore = async () => {
    if (!file) {
      setError('Please select a .sql backup file to restore.');
      return;
    }

    if (!window.confirm('WARNING: Restoring a backup will OVERWRITE your current database. Are you absolutely sure you want to proceed?')) {
      return;
    }

    setRestoring(true);
    setError('');
    setMessage('');

    const formData = new FormData();
    formData.append('backupFile', file);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:4000'}/backup/restore`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to restore backup');
      }

      setMessage('Backup restored successfully.');
      setFile(null);
      document.getElementById('backupFile').value = '';
    } catch (err) {
      console.error(err);
      setError(`An error occurred while restoring the backup: ${err.message}`);
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Database Backup & Restore</h1>

      {message && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative">
          {message}
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
      )}

      {/* Automated Backups Panel */}
      <div className="bg-white shadow rounded-lg p-6 border-t-4 border-indigo-500">
        <h2 className="text-xl font-semibold mb-4 border-b pb-2 text-indigo-700">Automated Backups</h2>
        <div className="flex flex-col md:flex-row gap-6 mb-6">
          <div className="flex-1 space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="autoEnabled"
                checked={autoSettings.enabled}
                onChange={(e) => setAutoSettings({ ...autoSettings, enabled: e.target.checked })}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 mr-2"
              />
              <label htmlFor="autoEnabled" className="font-medium text-gray-700">Enable Automated Backups</label>
            </div>

            <div className="flex flex-col">
              <label className="text-sm text-gray-600 mb-1">Backup Frequency</label>
              <select
                value={autoSettings.frequency}
                onChange={(e) => setAutoSettings({ ...autoSettings, frequency: e.target.value })}
                disabled={!autoSettings.enabled}
                className="border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 max-w-xs disabled:bg-gray-100"
              >
                <option value="hourly">Every Hour</option>
                <option value="12hours">Every 12 Hours</option>
                <option value="daily">Daily</option>
                <option value="2days">Every 2 Days</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>

            <button
              onClick={handleSaveSettings}
              disabled={savingSettings}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50 text-sm"
            >
              {savingSettings ? 'Saving...' : 'Save Settings'}
            </button>
          </div>

          <div className="flex-1 bg-gray-50 p-4 rounded-md border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Latest Automated Backup</h3>
            {autoStatus.exists ? (
              <div className="space-y-3">
                <p className="text-sm text-green-600 font-medium">Ready to download</p>
                <p className="text-xs text-gray-500">
                  Created: {new Date(autoStatus.lastBackupDate).toLocaleString()} <br />
                  Size: {(autoStatus.sizeBytes / 1024 / 1024).toFixed(2)} MB
                </p>
                <button
                  onClick={handleDownloadLatest}
                  className="bg-white border border-indigo-600 text-indigo-600 hover:bg-indigo-50 font-semibold py-1.5 px-4 rounded shadow-sm text-sm"
                >
                  Download Latest
                </button>
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">No automated backups available yet.</p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4 border-b pb-2">Manual Download Backup</h2>
        <p className="text-gray-600 mb-4 text-sm">
          Generate and download a full SQL backup of the current database instantly. Keep this file safe.
        </p>
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
        >
          {downloading ? 'Generating Backup...' : 'Download Database Backup'}
        </button>
      </div>

      <div className="bg-white shadow rounded-lg p-6 border-l-4 border-red-500">
        <h2 className="text-xl font-semibold mb-4 border-b pb-2 text-red-600">Restore Backup</h2>
        <p className="text-gray-600 mb-4 text-sm">
          <strong>Warning:</strong> Restoring a backup will permanently overwrite the current database. This action cannot be undone.
        </p>

        <div className="flex flex-col mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="backupFile">
            Select Backup File (.sql)
          </label>
          <input
            type="file"
            id="backupFile"
            accept=".sql"
            onChange={handleFileChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-2 max-w-md"
          />
        </div>

        <button
          onClick={handleRestore}
          disabled={restoring || !file}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
        >
          {restoring ? 'Restoring Database...' : 'Restore Backup'}
        </button>
      </div>
    </div>
  );
};

export default BackupRestore;
