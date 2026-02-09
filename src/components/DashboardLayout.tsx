import { ReactNode } from 'react';
import { useCostStore, DashboardPage } from '../store/useCostStore';

const menuItems: { id: DashboardPage; label: string; icon: string }[] = [
  { id: 'home', label: '대시보드', icon: '📊' },
  { id: 'cost-simulator', label: '원가 시뮬레이터', icon: '🧮' },
  { id: 'production', label: '생산 관리', icon: '🏭' },
  { id: 'quality', label: '품질 관리', icon: '✅' },
  { id: 'settings', label: '설정', icon: '⚙️' },
];

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { currentPage, sidebarOpen, setCurrentPage, setSidebarOpen } = useCostStore();

  return (
    <div className="min-h-screen bg-slate-100 flex">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 bg-slate-900 text-white transition-all duration-300 flex flex-col ${
          sidebarOpen ? 'w-60' : 'w-16'
        }`}
      >
        {/* Logo / Header */}
        <div className="flex items-center h-16 px-4 border-b border-slate-700">
          {sidebarOpen && (
            <div className="flex-1 min-w-0">
              <h1 className="text-sm font-bold truncate">GaN EPI</h1>
              <p className="text-[10px] text-slate-400 truncate">Manufacturing Dashboard</p>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-md hover:bg-slate-700 text-slate-400 hover:text-white transition-colors flex-shrink-0"
          >
            {sidebarOpen ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 space-y-1 px-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`w-full flex items-center rounded-lg px-3 py-2.5 text-sm transition-colors ${
                currentPage === item.id
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
              title={item.label}
            >
              <span className="text-lg flex-shrink-0">{item.icon}</span>
              {sidebarOpen && <span className="ml-3 truncate">{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* Footer */}
        {sidebarOpen && (
          <div className="p-4 border-t border-slate-700">
            <p className="text-[10px] text-slate-500 text-center">v1.0.0</p>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-60' : 'ml-16'}`}>
        {/* Top Bar */}
        <header className="sticky top-0 z-20 bg-white border-b h-14 flex items-center px-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800">
            {menuItems.find((m) => m.id === currentPage)?.icon}{' '}
            {menuItems.find((m) => m.id === currentPage)?.label}
          </h2>
        </header>

        {/* Page Content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
