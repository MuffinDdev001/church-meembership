import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Select from 'react-select';

const EmailCompose = () => {
  const [members, setMembers] = useState([]);
  const [visitors, setVisitors] = useState([]);
  const [supporters, setSupporters] = useState([]);
  const [recipientMode, setRecipientMode] = useState('manual'); // 'manual' | 'member' | 'visitor' | 'supporter'
  const [selectedRecipient, setSelectedRecipient] = useState(null);
  const [form, setForm] = useState({ to: '', subject: '', body: '' });
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null); // { type: 'success'|'error', message }

  useEffect(() => {
    const headers = { Authorization: `Bearer ${localStorage.getItem('token')}` };
    const api = process.env.REACT_APP_API_URL;
    Promise.all([
      axios.get(`${api}/members`, { headers }),
      axios.get(`${api}/visitors`, { headers }).catch(() => ({ data: [] })),
      axios.get(`${api}/supporters`, { headers }).catch(() => ({ data: [] }))
    ]).then(([m, v, s]) => {
      setMembers(m.data.filter(x => x.email));
      setVisitors((v.data?.visitors || v.data || []).filter(x => x.email));
      setSupporters((s.data || []).filter(x => x.email));
    }).catch(() => {});
  }, []);

  const listOptions = (arr) =>
    arr.map(p => ({
      value: p.email,
      label: `${p.lastName}, ${p.firstName} — ${p.email}`
    }));

  const handleRecipientSelect = (opt) => {
    setSelectedRecipient(opt);
    setForm(f => ({ ...f, to: opt ? opt.value : '' }));
  };

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setResult(null);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!form.to || !form.subject || !form.body) {
      setResult({ type: 'error', message: 'Please fill in all fields.' });
      return;
    }
    setSending(true);
    setResult(null);
    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/communication/email`,
        { to: form.to, subject: form.subject, body: form.body },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setResult({ type: 'success', message: `Email sent to ${form.to}.` });
      setForm({ to: '', subject: '', body: '' });
      setSelectedRecipient(null);
    } catch (err) {
      setResult({ type: 'error', message: err.response?.data?.message || 'Failed to send email.' });
    } finally {
      setSending(false);
    }
  };

  const modeOptions = [
    { value: 'manual', label: 'Enter email manually' },
    { value: 'member', label: 'Choose a Member' },
    { value: 'visitor', label: 'Choose a Visitor' },
    { value: 'supporter', label: 'Choose a Supporter' },
  ];

  const personList = recipientMode === 'member' ? members
    : recipientMode === 'visitor' ? visitors
    : recipientMode === 'supporter' ? supporters
    : [];

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 rounded-lg p-2">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Compose Email</h1>
              <p className="text-blue-100 text-sm">Send an email to members, visitors, or any address</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSend} className="p-6 space-y-5">
          {result && (
            <div className={`rounded-lg px-4 py-3 text-sm font-medium border ${
              result.type === 'success'
                ? 'bg-green-50 text-green-700 border-green-200'
                : 'bg-red-50 text-red-700 border-red-200'
            }`}>
              {result.message}
            </div>
          )}

          {/* Recipient source */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Recipient Source</label>
            <div className="flex flex-wrap gap-2">
              {modeOptions.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    setRecipientMode(opt.value);
                    setSelectedRecipient(null);
                    if (opt.value === 'manual') setForm(f => ({ ...f, to: '' }));
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    recipientMode === opt.value
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* To field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">To</label>
            {recipientMode === 'manual' ? (
              <input
                type="email"
                name="to"
                value={form.to}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            ) : (
              <Select
                options={listOptions(personList)}
                value={selectedRecipient}
                onChange={handleRecipientSelect}
                isSearchable
                isClearable
                placeholder=""
                className="text-sm"
              />
            )}
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject</label>
            <input
              type="text"
              name="subject"
              value={form.subject}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Body */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Message</label>
            <textarea
              name="body"
              value={form.body}
              onChange={handleChange}
              rows={8}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={sending}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:bg-blue-300 transition-colors flex items-center gap-2"
            >
              {sending ? (
                <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>Sending...</>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Send Email
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmailCompose;
