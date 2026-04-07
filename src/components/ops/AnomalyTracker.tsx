import React, { useState, useMemo } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { AnomalyTag } from '@/types/operations';
import {
  Tag,
  Plus,
  X,
  Trash2,
  CloudRain,
  Users,
  Wrench,
  Truck,
  HelpCircle,
  Zap,
  Shield,
  ShieldOff,
} from 'lucide-react';

const anomalyTypes: { value: AnomalyTag['type']; label: string; icon: React.ReactNode; color: string }[] = [
  { value: 'weather', label: 'Weather', icon: <CloudRain size={14} />, color: 'bg-blue-100 text-blue-700' },
  { value: 'staffing', label: 'Staffing', icon: <Users size={14} />, color: 'bg-purple-100 text-purple-700' },
  { value: 'equipment', label: 'Equipment', icon: <Wrench size={14} />, color: 'bg-amber-100 text-amber-700' },
  { value: 'supply', label: 'Supply Chain', icon: <Truck size={14} />, color: 'bg-green-100 text-green-700' },
  { value: 'other', label: 'Other', icon: <HelpCircle size={14} />, color: 'bg-gray-100 text-gray-700' },
];

const severityOptions: { value: AnomalyTag['severity']; label: string; color: string }[] = [
  { value: 'low', label: 'Low', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'medium', label: 'Medium', color: 'bg-orange-100 text-orange-700' },
  { value: 'high', label: 'High', color: 'bg-red-100 text-red-700' },
];

const AnomalyTracker: React.FC = () => {
  const { anomalies, addAnomaly, removeAnomaly } = useAppContext();
  const [showForm, setShowForm] = useState(false);

  // Form
  const [formDate, setFormDate] = useState('2026-04-06');
  const [formType, setFormType] = useState<AnomalyTag['type']>('weather');
  const [formSeverity, setFormSeverity] = useState<AnomalyTag['severity']>('medium');
  const [formDesc, setFormDesc] = useState('');
  const [formExclude, setFormExclude] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDesc.trim()) return;
    addAnomaly({
      date: formDate,
      type: formType,
      severity: formSeverity,
      description: formDesc.trim(),
      excludeFromBaseline: formExclude,
    });
    setFormDesc('');
    setShowForm(false);
  };

  const handleQuickTag = (type: AnomalyTag['type']) => {
    const descriptions: Record<AnomalyTag['type'], string> = {
      weather: 'Weather disruption today',
      staffing: 'Staffing issue today',
      equipment: 'Equipment problem today',
      supply: 'Supply chain issue today',
      other: 'Unusual day - other reason',
    };
    addAnomaly({
      date: '2026-04-06',
      type,
      severity: 'medium',
      description: descriptions[type],
      excludeFromBaseline: true,
    });
  };

  const sorted = useMemo(() =>
    [...anomalies].sort((a, b) => b.date.localeCompare(a.date)),
    [anomalies]
  );

  const getTypeInfo = (type: AnomalyTag['type']) =>
    anomalyTypes.find(t => t.value === type) || anomalyTypes[4];

  const getSeverityInfo = (severity: AnomalyTag['severity']) =>
    severityOptions.find(s => s.value === severity) || severityOptions[0];

  const excludedCount = anomalies.filter(a => a.excludeFromBaseline).length;
  const highSeverity = anomalies.filter(a => a.severity === 'high').length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1a1a1a] flex items-center gap-2">
            <Tag size={22} className="text-[#E91E63]" />
            Anomaly Tags
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Tag unusual days to improve production accuracy</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#E91E63] text-white text-xs font-medium rounded-lg hover:bg-[#D81B60] transition-colors"
        >
          {showForm ? <X size={12} /> : <Plus size={12} />}
          {showForm ? 'Cancel' : 'Tag Day'}
        </button>
      </div>

      {/* Quick Tag Today */}
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <h3 className="text-sm font-semibold text-[#1a1a1a] mb-3 flex items-center gap-2">
          <Zap size={14} className="text-[#E91E63]" />
          Quick Tag Today
        </h3>
        <div className="flex flex-wrap gap-2">
          {anomalyTypes.map(t => (
            <button
              key={t.value}
              onClick={() => handleQuickTag(t.value)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-colors hover:shadow-sm ${t.color}`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
          <div className="text-3xl font-bold font-mono text-[#1a1a1a]">{anomalies.length}</div>
          <div className="text-xs text-gray-500 mt-1">Total Tags</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
          <div className="text-3xl font-bold font-mono text-[#E91E63]">{excludedCount}</div>
          <div className="text-xs text-gray-500 mt-1">Excluded from Baseline</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
          <div className="text-3xl font-bold font-mono text-red-500">{highSeverity}</div>
          <div className="text-xs text-gray-500 mt-1">High Severity</div>
        </div>
      </div>

      {/* Detailed Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border-2 border-[#E91E63]/20 p-4">
          <h3 className="text-sm font-semibold text-[#1a1a1a] mb-3">Tag Anomaly Day</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
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
                <div className="flex flex-wrap gap-2">
                  {anomalyTypes.map(t => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setFormType(t.value)}
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs border transition-colors ${
                        formType === t.value ? 'border-[#E91E63] bg-pink-50 text-[#E91E63] font-medium' : 'border-gray-200 text-gray-500 hover:border-gray-300'
                      }`}
                    >
                      {t.icon} {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Severity</label>
                <div className="flex gap-2">
                  {severityOptions.map(s => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => setFormSeverity(s.value)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        formSeverity === s.value ? `${s.color} border-current` : 'border-gray-200 text-gray-400'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Description</label>
                <textarea
                  value={formDesc}
                  onChange={e => setFormDesc(e.target.value)}
                  placeholder="What happened?"
                  rows={3}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#E91E63] resize-none"
                  required
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formExclude}
                  onChange={e => setFormExclude(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-[#E91E63] focus:ring-[#E91E63]"
                />
                <span className="text-xs text-gray-600">Exclude from baseline calculations</span>
              </label>
              <button
                type="submit"
                className="w-full px-3 py-2 bg-[#E91E63] text-white text-sm font-medium rounded-lg hover:bg-[#D81B60] transition-colors"
              >
                Tag Anomaly
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Anomaly List */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-100">
          <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Tagged Days</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {sorted.map(a => {
            const typeInfo = getTypeInfo(a.type);
            const sevInfo = getSeverityInfo(a.severity);
            return (
              <div key={a.id} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50/50 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${typeInfo.color}`}>
                    {typeInfo.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-[#1a1a1a]">{a.description}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${sevInfo.color}`}>
                        {a.severity}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-400 font-mono">{a.date}</span>
                      {a.excludeFromBaseline ? (
                        <span className="flex items-center gap-0.5 text-[10px] text-[#E91E63]">
                          <ShieldOff size={9} /> Excluded
                        </span>
                      ) : (
                        <span className="flex items-center gap-0.5 text-[10px] text-gray-400">
                          <Shield size={9} /> Included
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => removeAnomaly(a.id)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-300 hover:text-red-500 transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}
          {sorted.length === 0 && (
            <div className="px-4 py-8 text-center text-xs text-gray-400">No anomalies tagged yet</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnomalyTracker;
