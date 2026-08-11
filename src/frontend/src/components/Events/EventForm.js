import React, { useState, useEffect } from 'react';
import axios from 'axios';

const EventForm = ({ event, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    duration: '',
    eventType: '',
    groupId: ''
  });
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    fetchGroups();
    if (event) {
      // Input type="datetime-local" format YYYY-MM-DDTHH:mm
      let formattedDate = '';
      if (event.date) {
        const localDate = new Date(event.date);
        const tzOffset = localDate.getTimezoneOffset() * 60000;
        formattedDate = new Date(localDate.getTime() - tzOffset).toISOString().slice(0, 16);
      }

      setFormData({
        title: event.title || '',
        description: event.description || '',
        date: formattedDate,
        duration: event.duration || '',
        eventType: event.eventType || '',
        groupId: event.groupId || ''
      });
    }
  }, [event]);

  const fetchGroups = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/groups`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setGroups(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
         ...formData,
         date: new Date(formData.date).toISOString() // Send exact ISO string
      };
      
      const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
      
      let response;
      if (event && event.id) {
         response = await axios.put(`${process.env.REACT_APP_API_URL}/events/${event.id}`, payload, config);
      } else {
         response = await axios.post(`${process.env.REACT_APP_API_URL}/events`, payload, config);
      }
      onSave(response.data);
      onClose();
    } catch (err) {
      console.error('Save failed', err);
      alert('Failed to save event');
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
      <div className="relative bg-white p-5 border w-96 shadow-lg rounded-md">
        <h3 className="text-lg font-bold mb-4">{event && event.id ? 'Edit Event' : 'Add Event'}</h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">Title</label>
            <input required type="text" name="title" value={formData.title} onChange={handleChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">Date & Time</label>
            <input required type="datetime-local" name="date" value={formData.date} onChange={handleChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">Duration (minutes)</label>
            <input type="number" name="duration" value={formData.duration} onChange={handleChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">Event Type</label>
            <select required name="eventType" value={formData.eventType} onChange={handleChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
              <option value="">Select Type</option>
              <option value="Service">Service</option>
              <option value="Meeting">Meeting</option>
              <option value="Activity">Activity</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">Group (Optional)</label>
            <select name="groupId" value={formData.groupId} onChange={handleChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
              <option value="">None / Church-wide</option>
              {groups.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">Description</label>
            <textarea name="description" value={formData.description} onChange={handleChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"></textarea>
          </div>
          <div className="flex items-center justify-between">
            <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">Save</button>
            <button type="button" onClick={onClose} className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventForm;
