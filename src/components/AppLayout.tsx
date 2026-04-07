import React from 'react';
import { useAppContext } from '@/contexts/AppContext';
import Sidebar from '@/components/ops/Sidebar';
import DashboardView from '@/components/ops/DashboardView';
import ProductionEngine from '@/components/ops/ProductionEngine';
import SalesView from '@/components/ops/SalesView';
import WasteTracker from '@/components/ops/WasteTracker';
import StockoutLogger from '@/components/ops/StockoutLogger';
import EventCalendar from '@/components/ops/EventCalendar';
import AnomalyTracker from '@/components/ops/AnomalyTracker';
import AnalyticsView from '@/components/ops/AnalyticsView';
import { useIsMobile } from '@/hooks/use-mobile';
import { Menu } from 'lucide-react';

const AppLayout: React.FC = () => {
  const { sidebarOpen, toggleSidebar, currentView } = useAppContext();
  const isMobile = useIsMobile();

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardView />;
      case 'production':
        return <ProductionEngine />;
      case 'sales':
        return <SalesView />;
      case 'waste':
        return <WasteTracker />;
      case 'stockouts':
        return <StockoutLogger />;
      case 'events':
        return <EventCalendar />;
      case 'anomalies':
        return <AnomalyTracker />;
      case 'analytics':
        return <AnalyticsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F8F8]">
      {/* Sidebar */}
      {(!isMobile || sidebarOpen) && <Sidebar />}

      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-30"
          onClick={toggleSidebar}
        />
      )}

      {/* Main Content */}
      <main
        className={`transition-all duration-300 min-h-screen ${
          sidebarOpen && !isMobile ? 'ml-56' : isMobile ? 'ml-0' : 'ml-16'
        }`}
      >
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isMobile && (
              <button
                onClick={toggleSidebar}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Menu size={18} className="text-gray-600" />
              </button>
            )}
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-gray-500 font-medium">System Active</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 hidden sm:block">KitchenOps v1.0</span>
            <div className="w-8 h-8 rounded-full bg-[#E91E63] flex items-center justify-center text-white text-xs font-bold">
              MG
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-4 sm:p-6 max-w-7xl">
          {renderView()}
        </div>
      </main>
    </div>
  );
};

export default AppLayout;
