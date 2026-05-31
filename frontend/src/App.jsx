import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Budgets from './pages/Budgets';
import Wishlist from './pages/Wishlist';
import Notifications from './pages/Notifications';
import Admin from './pages/Admin';
import AuthPages from './pages/AuthPages';
import ExpenseModal from './components/ExpenseModal';
import SMSParserModal from './components/SMSParserModal';
import OCRScannerModal from './components/OCRScannerModal';
import Toast from './components/Toast';

const AppContent = () => {
  const { user, loading } = useAuth();
  
  // Navigation State
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Modals States
  const [isExpenseOpen, setIsExpenseOpen] = useState(false);
  const [activeExpenseId, setActiveExpenseId] = useState(null);
  const [isSMSOpen, setIsSMSOpen] = useState(false);
  const [isOCROpen, setIsOCROpen] = useState(false);

  // Toast Alerts States
  const [toast, setToast] = useState(null);
  
  // Refresh Trigger to re-fetch statistics across tabs when updating databases
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleEditExpense = (id) => {
    setActiveExpenseId(id);
    setIsExpenseOpen(true);
  };

  const handleAddExpenseClick = () => {
    setActiveExpenseId(null);
    setIsExpenseOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#080c14] text-white select-none">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
        <p className="text-sm font-bold tracking-widest text-slate-400 uppercase animate-pulse">Initializing Trackyo...</p>
      </div>
    );
  }

  // Not Authenticated view
  if (!user) {
    return (
      <>
        <AuthPages showToast={showToast} />
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-themeBg text-themeText font-sans transition-colors duration-300 pb-16 md:pb-0">
      
      {/* 1. Sidebar Nav menu drawer */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      {/* 2. Main Content container */}
      <main className="flex-1 p-4 md:p-8 flex flex-col space-y-6 overflow-x-hidden md:h-screen md:overflow-y-auto select-none">
        
        {/* Navbar Headers */}
        <Navbar 
          activeTab={activeTab} 
          onNotificationClick={() => setActiveTab('notifications')} 
        />
        
        {/* Pages render routes block */}
        <div className="flex-1">
          {activeTab === 'dashboard' && (
            <Dashboard
              onAddExpense={handleAddExpenseClick}
              onScanReceipt={() => setIsOCROpen(true)}
              onSimulateSMS={() => setIsSMSOpen(true)}
              showToast={showToast}
              refreshTrigger={refreshTrigger}
            />
          )}

          {activeTab === 'transactions' && (
            <Transactions
              onEditExpense={handleEditExpense}
              showToast={showToast}
              refreshTrigger={refreshTrigger}
            />
          )}

          {activeTab === 'budgets' && (
            <Budgets 
              showToast={showToast} 
              refreshTrigger={refreshTrigger} 
            />
          )}

          {activeTab === 'wishlist' && (
            <Wishlist 
              showToast={showToast} 
              refreshTrigger={refreshTrigger} 
            />
          )}

          {activeTab === 'notifications' && (
            <Notifications 
              showToast={showToast} 
            />
          )}

          {activeTab === 'admin' && (
            <Admin 
              showToast={showToast} 
            />
          )}
        </div>

      </main>

      {/* 3. Global Modals and Portals list */}
      <ExpenseModal
        isOpen={isExpenseOpen}
        onClose={() => setIsExpenseOpen(false)}
        expenseId={activeExpenseId}
        onSave={handleRefresh}
        showToast={showToast}
      />

      <SMSParserModal
        isOpen={isSMSOpen}
        onClose={() => setIsSMSOpen(false)}
        onSave={handleRefresh}
        showToast={showToast}
      />

      <OCRScannerModal
        isOpen={isOCROpen}
        onClose={() => setIsOCROpen(false)}
        onSave={handleRefresh}
        showToast={showToast}
      />

      {/* Toast Alert Banner */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

    </div>
  );
};

export default AppContent;
