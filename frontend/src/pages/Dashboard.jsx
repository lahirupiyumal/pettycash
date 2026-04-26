import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTransactions } from '../hooks/useTransactions';
import { useSummary } from '../hooks/useSummary';
import { useRecords } from '../hooks/useRecords';
import SummaryCards from '../components/SummaryCards';
import RecordTable from '../components/RecordTable';
import ExcelImportForm from '../components/ExcelImportForm';

export default function Dashboard() {
  const { user, logout } = useAuth();
  
  // Keep transactions for backwards compatibility with summary cards if needed
  const { transactions } = useTransactions();
  const { summary } = useSummary(transactions);
  
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { records, loading: recordsLoading, error: recordsError } = useRecords(refreshTrigger);
  
  const [activeTab, setActiveTab] = useState('OVERVIEW');

  const handleImportSuccess = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  const menuItems = ['OVERVIEW', 'INVOICE TOTAL', 'CASH IN HAND', 'VARIANCE', 'Monthly Performance', 'Import Excel File'];

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg flex flex-col">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-2xl font-bold text-blue-700">Petty Cash</h2>
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map(item => (
            <button 
              key={item} 
              onClick={() => setActiveTab(item)}
              className={`w-full text-left block px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === item 
                  ? 'bg-blue-50 text-blue-700' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600'
              }`}
            >
              {item}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center z-10 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-800">
            {activeTab === 'OVERVIEW' ? 'Dashboard Overview' : activeTab}
          </h1>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700 font-bold text-lg">
                {user?.name?.charAt(0)?.toUpperCase()}
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-semibold text-gray-700">{user?.name}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.role || 'User'}</p>
              </div>
            </div>
            <div className="h-6 w-px bg-gray-200 mx-2"></div>
            <button 
              onClick={logout} 
              className="text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors border border-transparent hover:border-red-100"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Scrollable Page Content */}
        <main className="flex-1 p-8 overflow-y-auto bg-gray-100">
          <div className="max-w-5xl mx-auto">
            {activeTab === 'Import Excel File' ? (
              <ExcelImportForm onImportSuccess={handleImportSuccess} />
            ) : (
              <>
                <SummaryCards summary={summary} />
                
                <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <h3 className="font-semibold text-gray-800">Regional Petty Cash Records</h3>
                    <span className="text-xs font-medium bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded">{records?.length || 0} Records</span>
                  </div>
                  <div className="p-0">
                    {recordsError && <p className="text-red-500 text-sm m-6 bg-red-50 p-3 rounded">{recordsError}</p>}
                    {recordsLoading ? (
                      <div className="flex justify-center items-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    ) : (
                      <RecordTable records={records} />
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
