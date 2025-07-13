import React, { useEffect, useState, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import axios from '../axios';
import { useToast } from '../components/ToastContext';
import { jwtDecode } from 'jwt-decode';
import { motion } from 'framer-motion';

const Sessions = () => {
  const [sessions, setSessions] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [matches, setMatches] = useState([]);
  const [form, setForm] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    location: '',
    participants: [],
  });
  const [submitting, setSubmitting] = useState(false);
  const calendarRef = useRef(null);
  const { addToast } = useToast();
  const token = localStorage.getItem('token');
  const userId = token ? jwtDecode(token).userId : null;
  const [detailModal, setDetailModal] = useState({ open: false, session: null, edit: false });

  useEffect(() => {
    fetchSessions();
    fetchMatches();
  }, []);

  const fetchSessions = async () => {
    try {
      const res = await axios.get('/api/sessions');
      setSessions(res.data);
    } catch (err) {
      // Handle error
    }
  };

  const fetchMatches = async () => {
    try {
      const res = await axios.get('/api/users/matches');
      setMatches(res.data.filter(m => m.connectionStatus === 'accepted'));
    } catch (err) {
      // Handle error
    }
  };

  const handleDateClick = (arg) => {
    setSelectedDate(arg.dateStr);
    setForm({
      title: '',
      description: '',
      startTime: arg.dateStr + 'T10:00',
      endTime: arg.dateStr + 'T11:00',
      location: '',
      participants: [],
    });
    setShowModal(true);
  };

  const handleEventClick = (info) => {
    setDetailModal({ open: true, session: info.event.extendedProps, edit: false });
  };

  const handleEditClick = () => {
    setForm({
      title: detailModal.session.title,
      description: detailModal.session.description,
      startTime: detailModal.session.startTime.slice(0, 16),
      endTime: detailModal.session.endTime.slice(0, 16),
      location: detailModal.session.location,
      participants: detailModal.session.participants.map(p => p._id || p),
    });
    setDetailModal((prev) => ({ ...prev, edit: true }));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.patch(`/api/sessions/${detailModal.session._id}`, form);
      addToast('Session updated!', 'success');
      setDetailModal({ open: false, session: null, edit: false });
      fetchSessions();
    } catch (err) {
      addToast('Failed to update session.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this session?')) return;
    setSubmitting(true);
    try {
      await axios.delete(`/api/sessions/${detailModal.session._id}`);
      addToast('Session deleted.', 'success');
      setDetailModal({ open: false, session: null, edit: false });
      fetchSessions();
    } catch (err) {
      addToast('Failed to delete session.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setForm((prev) => ({
        ...prev,
        participants: checked
          ? [...prev.participants, value]
          : prev.participants.filter((id) => id !== value),
      }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.post('/api/sessions', form);
      addToast('Session scheduled!', 'success');
      setShowModal(false);
      fetchSessions();
    } catch (err) {
      addToast('Failed to schedule session.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Map sessions to FullCalendar events
  const events = sessions.map(session => ({
    id: session._id,
    title: session.title,
    start: session.startTime,
    end: session.endTime,
    extendedProps: session,
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto mt-20 p-6">
        <div className="flex justify-between items-center mb-8">
          <motion.h1 
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
          >
            Study Sessions Calendar
          </motion.h1>
          <motion.button
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setForm({
                title: '',
                description: '',
                startTime: new Date().toISOString().slice(0, 16),
                endTime: new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16),
                location: '',
                participants: [],
              });
              setShowModal(true);
            }}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:shadow-lg transition-all duration-300 font-semibold"
          >
            + Quick Schedule
          </motion.button>
        </div>
        
        {/* Quick Guide */}
        <motion.div 
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="bg-blue-50/80 backdrop-blur-sm border border-blue-200/50 rounded-2xl p-6 mb-8 shadow-lg"
        >
          <h3 className="text-lg font-semibold text-blue-800 mb-3">📅 How to Schedule Sessions:</h3>
          <ul className="text-blue-700 space-y-2">
            <li>• <strong>Click any date</strong> on the calendar to schedule a session</li>
            <li>• <strong>Click "Quick Schedule"</strong> to create a session starting now</li>
            <li>• <strong>Click on existing sessions</strong> to view/edit details</li>
            <li>• <strong>Invite your study buddies</strong> from your matches list</li>
          </ul>
        </motion.div>

        <motion.div 
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="bg-white/80 backdrop-blur-sm border border-blue-200/50 rounded-2xl shadow-xl p-6"
        >
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay',
            }}
            events={events}
            dateClick={handleDateClick}
            eventClick={handleEventClick}
            height="auto"
            eventColor="#3b82f6"
            eventTextColor="#ffffff"
          />
        </motion.div>
      </div>
      {/* Modal for creating a new session */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <h2 className="text-xl font-bold mb-4">Schedule New Session</h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleFormChange}
                placeholder="Session Title"
                className="p-2 border rounded"
                required
              />
              <textarea
                name="description"
                value={form.description}
                onChange={handleFormChange}
                placeholder="Description"
                className="p-2 border rounded"
              />
              <input
                type="datetime-local"
                name="startTime"
                value={form.startTime}
                onChange={handleFormChange}
                className="p-2 border rounded"
                required
              />
              <input
                type="datetime-local"
                name="endTime"
                value={form.endTime}
                onChange={handleFormChange}
                className="p-2 border rounded"
                required
              />
              <input
                type="text"
                name="location"
                value={form.location}
                onChange={handleFormChange}
                placeholder="Location"
                className="p-2 border rounded"
              />
              <div>
                <div className="font-semibold mb-1">Invite Buddies:</div>
                <div className="flex flex-wrap gap-2">
                  {matches.length === 0 && <span className="text-gray-400">No buddies to invite.</span>}
                  {matches.map((m) => (
                    <label key={m.id} className="flex items-center gap-1">
                      <input
                        type="checkbox"
                        name="participants"
                        value={m.id}
                        checked={form.participants.includes(m.id)}
                        onChange={handleFormChange}
                      />
                      <span>{m.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition"
                  disabled={submitting}
                >
                  {submitting ? 'Scheduling...' : 'Schedule'}
                </button>
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition"
                  onClick={() => setShowModal(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Session Detail/Edit Modal */}
      {detailModal.open && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            {detailModal.edit ? (
              <>
                <h2 className="text-xl font-bold mb-4">Edit Session</h2>
                <form onSubmit={handleUpdate} className="flex flex-col gap-3">
                  <input type="text" name="title" value={form.title} onChange={handleFormChange} placeholder="Session Title" className="p-2 border rounded" required />
                  <textarea name="description" value={form.description} onChange={handleFormChange} placeholder="Description" className="p-2 border rounded" />
                  <input type="datetime-local" name="startTime" value={form.startTime} onChange={handleFormChange} className="p-2 border rounded" required />
                  <input type="datetime-local" name="endTime" value={form.endTime} onChange={handleFormChange} className="p-2 border rounded" required />
                  <input type="text" name="location" value={form.location} onChange={handleFormChange} placeholder="Location" className="p-2 border rounded" />
                  <div>
                    <div className="font-semibold mb-1">Invite Buddies:</div>
                    <div className="flex flex-wrap gap-2">
                      {matches.length === 0 && <span className="text-gray-400">No buddies to invite.</span>}
                      {matches.map((m) => (
                        <label key={m.id} className="flex items-center gap-1">
                          <input type="checkbox" name="participants" value={m.id} checked={form.participants.includes(m.id)} onChange={handleFormChange} />
                          <span>{m.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button type="submit" className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition" disabled={submitting}>{submitting ? 'Saving...' : 'Save'}</button>
                    <button type="button" className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition" onClick={() => setDetailModal({ open: false, session: null, edit: false })} disabled={submitting}>Cancel</button>
                  </div>
                </form>
              </>
            ) : (
              <>
                <h2 className="text-xl font-bold mb-4">Session Details</h2>
                <div className="mb-2"><span className="font-semibold">Title:</span> {detailModal.session.title}</div>
                <div className="mb-2"><span className="font-semibold">Description:</span> {detailModal.session.description || '—'}</div>
                <div className="mb-2"><span className="font-semibold">Time:</span> {new Date(detailModal.session.startTime).toLocaleString()} - {new Date(detailModal.session.endTime).toLocaleString()}</div>
                <div className="mb-2"><span className="font-semibold">Location:</span> {detailModal.session.location || '—'}</div>
                <div className="mb-2"><span className="font-semibold">Participants:</span>
                  <ul className="ml-4 list-disc">
                    {detailModal.session.participants.map((p) => (
                      <li key={p._id || p} className="flex items-center gap-2">
                        <span>{p.name}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex gap-2 mt-4">
                  {detailModal.session.createdBy === userId && (
                    <>
                      <button className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition" onClick={handleEditClick}>Edit</button>
                      <button className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition" onClick={handleDelete} disabled={submitting}>{submitting ? 'Deleting...' : 'Delete'}</button>
                    </>
                  )}
                  <button className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition" onClick={() => setDetailModal({ open: false, session: null, edit: false })}>Close</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Sessions; 