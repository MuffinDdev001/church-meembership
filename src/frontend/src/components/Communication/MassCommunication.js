import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const MassCommunication = () => {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('compose');
  const [groups, setGroups] = useState([]);
  
  // Compose State
  const [audience, setAudience] = useState('ALL_MEMBERS');
  const [groupId, setGroupId] = useState('');
  const [type, setType] = useState('SMS');
  const [content, setContent] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  // History State
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    fetchGroups();
  }, []);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab]);

  const fetchGroups = async () => {
    try {
      const response = await axios.get(`${API_URL}/groups`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGroups(response.data);
    } catch (error) {
      console.error('Error fetching groups:', error);
    }
  };

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const response = await axios.get(`${API_URL}/communication/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHistory(response.data);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);
    try {
      const payload = {
        audience,
        type,
        content,
        groupId: audience === 'SPECIFIC_GROUPS' ? parseInt(groupId) : null,
        scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null
      };
      
      const res = await axios.post(`${API_URL}/communication/broadcast`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage({ type: 'success', text: `Broadcast initiated to ${res.data.recipientCount} recipients.` });
      setContent('');
      setScheduledAt('');
    } catch (error) {
      console.error('Error sending broadcast:', error);
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to send broadcast.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Mass Communication (SMS & WhatsApp)</h2>
      
      <div className="flex border-b mb-6">
        <button 
          className={`py-2 px-4 font-semibold ${activeTab === 'compose' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('compose')}
        >
          Compose Broadcast
        </button>
        <button 
          className={`py-2 px-4 font-semibold ${activeTab === 'history' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('history')}
        >
          History & Logs
        </button>
      </div>

      {activeTab === 'compose' && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {message && (
            <div className={`p-4 rounded ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {message.text}
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Audience</label>
              <select 
                value={audience} 
                onChange={(e) => setAudience(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="ALL_MEMBERS">All Active Members</option>
                <option value="SPECIFIC_GROUPS">Specific Group</option>
              </select>
            </div>

            {audience === 'SPECIFIC_GROUPS' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Group</label>
                <select 
                  value={groupId} 
                  onChange={(e) => setGroupId(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">-- Select Group --</option>
                  {groups.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Channel Type</label>
              <select 
                value={type} 
                onChange={(e) => setType(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="SMS">SMS Message</option>
                <option value="WHATSAPP">WhatsApp</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Schedule At (Optional)</label>
              <input 
                type="datetime-local" 
                value={scheduledAt} 
                onChange={(e) => setScheduledAt(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
              />
              <span className="text-xs text-gray-500">Leave blank to send immediately</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message Content</label>
            <textarea 
              value={content} 
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              required
              className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
              placeholder="Type your message here..."
            />
            <div className="text-xs text-gray-500 text-right mt-1">
              Characters: {content.length}
            </div>
          </div>

          <div className="flex justify-end">
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded focus:outline-none focus:shadow-outline disabled:opacity-50 transition-colors duration-200"
            >
              {isSubmitting ? 'Processing...' : (scheduledAt ? 'Schedule Broadcast' : 'Send Broadcast Now')}
            </button>
          </div>
        </form>
      )}

      {activeTab === 'history' && (
        <div>
          {loadingHistory ? (
            <p className="text-gray-500">Loading history...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200 rounded">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-3 px-4 border-b text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date/Scheduled</th>
                    <th className="py-3 px-4 border-b text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</th>
                    <th className="py-3 px-4 border-b text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Audience</th>
                    <th className="py-3 px-4 border-b text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                    <th className="py-3 px-4 border-b text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Recipients</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {history.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-700">
                        {log.scheduledAt ? new Date(log.scheduledAt).toLocaleString() : new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {log.type}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700">
                        {log.audience === 'ALL_MEMBERS' ? 'All Members' : `Group: ${log.group?.name || 'N/A'}`}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${log.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 
                            log.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 
                            log.status === 'FAILED' ? 'bg-red-100 text-red-800' : 
                            'bg-blue-100 text-blue-800'}`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-500">
                        {log._count?.recipients || 0}
                      </td>
                    </tr>
                  ))}
                  {history.length === 0 && (
                    <tr>
                      <td colSpan="5" className="py-4 text-center text-gray-500">No communication history found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MassCommunication;
