import React, { useState, useMemo, useCallback } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { APP_REFERENCE_DATE, addCalendarDays } from '@/data/mockData';
import { CalendarEvent } from '@/types/operations';
import {
  Calendar,
  Plus,
  X,
  Trash2,
  Sun,
  CloudRain,
  PartyPopper,
  Megaphone,
  Trophy,
  HelpCircle,
  Pencil,
} from 'lucide-react';

const eventTypes: { value: CalendarEvent['type']; label: string; icon: React.ReactNode; color: string }[] = [
  { value: 'festival', label: 'Festival', icon: <PartyPopper size={12} />, color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { value: 'weather', label: 'Weather', icon: <CloudRain size={12} />, color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { value: 'holiday', label: 'Holiday', icon: <Sun size={12} />, color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { value: 'promotion', label: 'Promotion', icon: <Megaphone size={12} />, color: 'bg-pink-100 text-pink-700 border-pink-200' },
  { value: 'sports', label: 'Sports', icon: <Trophy size={12} />, color: 'bg-green-100 text-green-700 border-green-200' },
  { value: 'other', label: 'Other', icon: <HelpCircle size={12} />, color: 'bg-gray-100 text-gray-700 border-gray-200' },
];

const CALENDAR_DAYS = 28;

const EventCalendar: React.FC = () => {
  const { events, addEvent, updateEvent, removeEvent } = useAppContext();
  const [showForm, setShowForm] = useState(false);

  const [formName, setFormName] = useState('');
  const [formDate, setFormDate] = useState(() => addCalendarDays(APP_REFERENCE_DATE, 4));
  const [formType, setFormType] = useState<CalendarEvent['type']>('festival');
  const [formImpact, setFormImpact] = useState(0);
  const [formNotes, setFormNotes] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<CalendarEvent>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;
    addEvent({
      date: formDate,
      name: formName.trim(),
      type: formType,
      impactPercent: formImpact,
      notes: formNotes,
    });
    setFormName('');
    setFormNotes('');
    setFormImpact(0);
    setFormDate(addCalendarDays(APP_REFERENCE_DATE, 4));
    setShowForm(false);
  };

  const startEdit = useCallback((ev: CalendarEvent) => {
    setEditingId(ev.id);
    setEditForm({ ...ev });
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingId(null);
    setEditForm({});
  }, []);

  const saveEdit = useCallback(async () => {
    if (!editingId || !editForm.name?.trim() || !editForm.date) return;
    await updateEvent(editingId, {
      date: editForm.date,
      name: editForm.name.trim(),
      type: editForm.type!,
      impactPercent: editForm.impactPercent ?? 0,
      notes: editForm.notes ?? '',
    });
    cancelEdit();
  }, [editingId, editForm, updateEvent, cancelEdit]);

  const sortedEvents = useMemo(() =>
    [...events].sort((a, b) => a.date.localeCompare(b.date)),
    [events]
  );

  const upcomingEvents = sortedEvents.filter(e => e.date >= APP_REFERENCE_DATE);
  const pastEvents = sortedEvents.filter(e => e.date < APP_REFERENCE_DATE);

  const getTypeInfo = (type: CalendarEvent['type']) =>
    eventTypes.find(t => t.value === type) || eventTypes[5];

  const calendarDays = useMemo(() => {
    const days: { date: string; label: string; dayName: string; events: CalendarEvent[] }[] = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const start = new Date(`${APP_REFERENCE_DATE}T12:00:00`);
    for (let i = 0; i < CALENDAR_DAYS; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      days.push({
        date: dateStr,
        label: `${d.getMonth() + 1}/${d.getDate()}`,
        dayName: dayNames[d.getDay()],
        events: events.filter(e => e.date === dateStr),
      });
    }
    return days;
  }, [events]);

  const renderEventRow = (ev: CalendarEvent, opts: { showDelete?: boolean; muted?: boolean }) => {
    const info = getTypeInfo(ev.type);
    const isEditing = editingId === ev.id;

    if (isEditing) {
      return (
        <div
          key={ev.id}
          className={`px-4 py-3 border-b border-gray-100 ${opts.muted ? 'opacity-90' : ''}`}
        >
          <div className="text-xs font-semibold text-[#E91E63] mb-2">Edit event</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-gray-500 block mb-0.5">Date</label>
              <input
                type="date"
                value={editForm.date ?? ''}
                onChange={e => setEditForm(f => ({ ...f, date: e.target.value }))}
                className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#E91E63]"
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 block mb-0.5">Name</label>
              <input
                type="text"
                value={editForm.name ?? ''}
                onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#E91E63]"
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 block mb-0.5">Type</label>
              <select
                value={editForm.type ?? 'other'}
                onChange={e => setEditForm(f => ({ ...f, type: e.target.value as CalendarEvent['type'] }))}
                className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#E91E63]"
              >
                {eventTypes.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-gray-500 block mb-0.5">
                Impact: <span className="font-mono">{(editForm.impactPercent ?? 0) > 0 ? '+' : ''}{editForm.impactPercent ?? 0}%</span>
              </label>
              <input
                type="range"
                min={-50}
                max={200}
                value={editForm.impactPercent ?? 0}
                onChange={e => setEditForm(f => ({ ...f, impactPercent: parseInt(e.target.value, 10) }))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#E91E63]"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-[10px] text-gray-500 block mb-0.5">Notes</label>
              <input
                type="text"
                value={editForm.notes ?? ''}
                onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))}
                className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#E91E63]"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-3">
            <button type="button" onClick={cancelEdit} className="text-xs px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg">
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void saveEdit()}
              className="text-xs px-3 py-1.5 bg-[#E91E63] text-white rounded-lg hover:bg-[#D81B60]"
            >
              Save
            </button>
          </div>
        </div>
      );
    }

    return (
      <div
        key={ev.id}
        className={`px-4 py-3 flex items-center justify-between hover:bg-gray-50/50 transition-colors group border-b border-gray-50 ${opts.muted ? 'opacity-60' : ''}`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center border shrink-0 ${info.color}`}>
            {info.icon}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium text-[#1a1a1a] truncate">{ev.name}</div>
            <div className="text-xs text-gray-400 truncate">{ev.date} — {ev.notes || '—'}</div>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <span className={`text-sm font-mono font-bold ${ev.impactPercent >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            {ev.impactPercent > 0 ? '+' : ''}{ev.impactPercent}%
          </span>
          <button
            type="button"
            onClick={() => startEdit(ev)}
            className="p-1.5 text-gray-400 hover:text-[#E91E63] rounded transition-colors"
            title="Edit"
          >
            <Pencil size={14} />
          </button>
          {opts.showDelete && (
            <button
              type="button"
              onClick={() => removeEvent(ev.id)}
              className="opacity-0 group-hover:opacity-100 p-1 text-gray-300 hover:text-red-500 transition-all"
              title="Remove"
            >
              <Trash2 size={12} />
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1a1a1a] flex items-center gap-2">
            <Calendar size={22} className="text-[#E91E63]" />
            Event Calendar
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Plan for events that impact demand — tap edit to change date or details</p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#E91E63] text-white text-xs font-medium rounded-lg hover:bg-[#D81B60] transition-colors"
        >
          {showForm ? <X size={12} /> : <Plus size={12} />}
          {showForm ? 'Cancel' : 'Add Event'}
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-4 overflow-x-auto">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-[#1a1a1a]">Next {CALENDAR_DAYS} days</h3>
          <span className="text-[10px] text-gray-400">Today: {APP_REFERENCE_DATE}</span>
        </div>
        <div className="grid grid-cols-7 gap-1 min-w-[560px]">
          {calendarDays.map((day, i) => (
            <div
              key={day.date}
              className={`rounded-lg p-1.5 text-center border transition-colors ${
                day.date === APP_REFERENCE_DATE ? 'border-[#E91E63] bg-pink-50' : 'border-gray-100 bg-gray-50/50'
              } ${day.events.length > 0 ? 'ring-1 ring-[#E91E63]/25' : ''}`}
            >
              <div className="text-[9px] text-gray-400 font-medium leading-tight">{day.dayName}</div>
              <div className="text-[11px] font-mono font-bold text-[#1a1a1a] leading-tight">{day.label}</div>
              {day.events.length > 0 && (
                <div className="mt-1 space-y-0.5 text-left max-h-[72px] overflow-y-auto">
                  {day.events.map(ev => {
                    const info = getTypeInfo(ev.type);
                    return (
                      <button
                        key={ev.id}
                        type="button"
                        onClick={() => startEdit(ev)}
                        className={`w-full text-left text-[8px] px-0.5 py-0.5 rounded ${info.color} truncate border leading-tight hover:opacity-90`}
                        title={`${ev.name} — edit`}
                      >
                        {ev.name.slice(0, 12)}{ev.name.length > 12 ? '…' : ''}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border-2 border-[#E91E63]/20 p-4">
          <h3 className="text-sm font-semibold text-[#1a1a1a] mb-3">New Event</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Event Name</label>
                <input
                  type="text"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  placeholder="e.g., Local Festival"
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#E91E63]"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Date</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={e => setFormDate(e.target.value)}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#E91E63]"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Type</label>
                  <select
                    value={formType}
                    onChange={e => setFormType(e.target.value as CalendarEvent['type'])}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#E91E63]"
                  >
                    {eventTypes.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Notes</label>
                <input
                  type="text"
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  placeholder="Additional context..."
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#E91E63]"
                />
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 block mb-1">
                  Expected Impact: <span className={`font-mono font-bold ${formImpact >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{formImpact > 0 ? '+' : ''}{formImpact}%</span>
                </label>
                <input
                  type="range"
                  min={-50}
                  max={200}
                  value={formImpact}
                  onChange={e => setFormImpact(parseInt(e.target.value, 10))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#E91E63]"
                />
                <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                  <span>-50%</span>
                  <span>0%</span>
                  <span>+100%</span>
                  <span>+200%</span>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-500">
                <p className="font-medium text-[#1a1a1a] mb-1">Impact Guide:</p>
                <ul className="space-y-0.5">
                  <li>Heavy rain: -20% to -30%</li>
                  <li>Local festival: +30% to +60%</li>
                  <li>Holiday: -15% to -40%</li>
                  <li>Promotion: +20% to +50%</li>
                </ul>
              </div>
              <button
                type="submit"
                className="w-full px-3 py-2 bg-[#E91E63] text-white text-sm font-medium rounded-lg hover:bg-[#D81B60] transition-colors"
              >
                Add Event
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-100">
            <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Upcoming Events</h3>
          </div>
          <div>
            {upcomingEvents.map(ev => renderEventRow(ev, { showDelete: true }))}
            {upcomingEvents.length === 0 && (
              <div className="px-4 py-8 text-center text-xs text-gray-400">No upcoming events</div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-100">
            <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Past Events</h3>
          </div>
          <div>
            {pastEvents.length > 0 ? (
              pastEvents.map(ev => renderEventRow(ev, { muted: true, showDelete: false }))
            ) : (
              <div className="px-4 py-8 text-center text-xs text-gray-400">No past events in range</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventCalendar;
