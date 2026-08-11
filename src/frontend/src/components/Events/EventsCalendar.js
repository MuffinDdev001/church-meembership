import React, { useState, useEffect, useRef } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import axios from 'axios';
import { PageLoader } from '../common/Loader';
import EventForm from './EventForm';

const locales = {
  'en-US': require('date-fns/locale/en-US'),
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const EventsCalendar = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const componentRef = useRef();

  const handlePrint = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/events/pdf`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = url;
      document.body.appendChild(iframe);
      iframe.onload = () => {
        iframe.contentWindow.print();
      };
    } catch (error) {
      console.error('Error generating events PDF:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/events`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      // Convert dates and build standard calendar struct
      const formattedEvents = response.data.map(event => {
        const start = new Date(event.date);
        const end = event.duration 
          ? new Date(start.getTime() + event.duration * 60000) 
          : new Date(start.getTime() + 60 * 60000); // default 1 hr
          
        let displayTitle = event.title;
        if (event.eventType) displayTitle += ` • ${event.eventType}`;
        if (event.group) displayTitle += ` (${event.group.name})`;

        return {
          ...event,
          title: displayTitle,
          start,
          end,
        };
      });
      setEvents(formattedEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSlot = (slotInfo) => {
    setSelectedEvent({ date: slotInfo.start });
    setShowForm(true);
  };

  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setSelectedEvent(null);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this event?")) {
      try {
        await axios.delete(`${process.env.REACT_APP_API_URL}/events/${id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        fetchEvents();
        closeForm();
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="p-4 bg-gray-100 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Events Calendar</h1>
        <div className="space-x-4">
          <button 
            onClick={handlePrint}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          >
            Print
          </button>
          <button 
            onClick={() => { setSelectedEvent(null); setShowForm(true); }}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Add Event
          </button>
        </div>
      </div>

      {loading ? (
        <PageLoader />
      ) : (
        <div className="bg-white p-4 rounded shadow">
          <div className="h-[800px] bg-white">
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              style={{ height: '100%' }}
              onSelectEvent={handleSelectEvent}
              onSelectSlot={handleSelectSlot}
              selectable
              views={['month', 'week', 'agenda']}
              defaultView="month"
            />
          </div>
        </div>
      )}

      {showForm && (
        <EventForm 
          event={selectedEvent} 
          onClose={closeForm} 
          onSave={() => {
            fetchEvents();
          }} 
        />
      )}
      
      {showForm && selectedEvent && selectedEvent.id && (
         <button 
         type="button"
         onClick={() => handleDelete(selectedEvent.id)}
         className="fixed z-[60] bottom-20 right-20 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded shadow-lg"
       >
         Delete Event
       </button>
      )}
    </div>
  );
};

export default EventsCalendar;
