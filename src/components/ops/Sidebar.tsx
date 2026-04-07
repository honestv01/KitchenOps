import React from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { ViewType } from '@/types/operations';
import {
  LayoutDashboard,
  Factory,
  ShoppingCart,
  Trash2,
  AlertTriangle,
  Calendar,
  Tag,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Utensils,
} from 'lucide-react';

const navItems: { view: ViewType; label: string; icon: React.ReactNode }[] = [
  { view: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { view: 'production', label: 'Production Plan', icon: <Factory size={18} /> },
  { view: 'sales', label: 'Sales Data', icon: <ShoppingCart size={18} /> },
  { view: 'waste', label: 'Waste Tracking', icon: <Trash2 size={18} /> },
  { view: 'stockouts', label: 'Stockout Log', icon: <AlertTriangle size={18} /> },
  { view: 'events', label: 'Event Calendar', icon: <Calendar size={18} /> },
  { view: 'anomalies', label: 'Anomaly Tags', icon: <Tag size={18} /> },
  { view: 'analytics', label: 'Analytics', icon: <BarChart3 size={18} /> },
];

const Sidebar: React.FC = () => {
  const { sidebarOpen, toggleSidebar, currentView, setCurrentView } = useAppContext();

  return (
    <aside
      className={`fixed left-0 top-0 h-full bg-[#1a1a1a] text-white z-40 transition-all duration-300 flex flex-col ${
        sidebarOpen ? 'w-56' : 'w-16'
      }`}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 h-14 border-b border-white/10 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-[#E91E63] flex items-center justify-center shrink-0">
          <Utensils size={16} className="text-white" />
        </div>
        {sidebarOpen && (
          <span className="font-bold text-sm tracking-tight whitespace-nowrap">KitchenOps</span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {navItems.map(({ view, label, icon }) => {
          const active = currentView === view;
          return (
            <button
              key={view}
              onClick={() => setCurrentView(view)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                active
                  ? 'bg-[#E91E63] text-white font-medium'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
              title={!sidebarOpen ? label : undefined}
            >
              <span className="shrink-0">{icon}</span>
              {sidebarOpen && <span className="whitespace-nowrap">{label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Collapse */}
      <button
        onClick={toggleSidebar}
        className="flex items-center justify-center h-12 border-t border-white/10 text-gray-400 hover:text-white transition-colors"
      >
        {sidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
      </button>
    </aside>
  );
};

export default Sidebar;
