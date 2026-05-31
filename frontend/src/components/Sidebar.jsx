import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  TrendingUp, 
  Wallet, 
  Heart, 
  Bell, 
  ShieldAlert, 
  LogOut,
  Sparkles
} from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab }) => {
  const { user, logout } = useAuth();

  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'transactions', name: 'Transactions', icon: TrendingUp },
    { id: 'budgets', name: 'Budgets Limit', icon: Wallet },
    { id: 'wishlist', name: 'Wishlist Goals', icon: Heart },
    { id: 'notifications', name: 'Alerts', icon: Bell, badge: true },
  ];

  if (user && user.isAdmin) {
    menuItems.push({ id: 'admin', name: 'Admin Console', icon: ShieldAlert });
  }

  return (
    <aside className="fixed bottom-0 left-0 z-40 w-full md:sticky md:top-0 md:h-screen md:w-64 glass-panel md:rounded-r-3xl md:rounded-l-none border-t border-r-0 md:border-t-0 md:border-r border-themeBorder flex flex-col justify-between py-4 md:py-8 px-4 md:px-6">
      
      {/* Brand Logo Container */}
      <div className="hidden md:flex items-center space-x-3 mb-10 pl-2">
        <div className="p-2.5 rounded-xl bg-themePrimary text-white shadow-neon-glow flex items-center justify-center">
          <Sparkles className="w-6 h-6 animate-pulse" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-themePrimary to-themeAccent">
            Trackyo
          </h1>
          <p className="text-[10px] text-themeTextMuted font-bold tracking-widest uppercase">
            AI Expense Tracker
          </p>
        </div>
      </div>

      {/* Navigation Links Grid */}
      <nav className="w-full flex md:flex-col flex-row justify-around md:justify-start md:space-y-2 select-none">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col md:flex-row items-center md:space-x-3.5 px-3 py-2 md:px-4 md:py-3.5 rounded-xl font-semibold text-xs md:text-sm tracking-wide transition-all duration-200 w-full ${
                isActive
                  ? 'bg-themePrimary text-white shadow-neon-glow font-bold scale-[1.03]'
                  : 'text-themeTextMuted hover:text-themeText hover:bg-themeBorder'
              }`}
            >
              <Icon className="w-5 h-5 mb-1 md:mb-0" />
              <span className="text-[10px] md:text-sm">{item.name}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer Profile Box (Hidden on Mobile) */}
      <div className="hidden md:flex flex-col border-t border-themeBorder pt-6 mt-6">
        <div className="flex items-center space-x-3 mb-4 pl-1">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-themePrimary to-themeAccent flex items-center justify-center font-extrabold text-white">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="overflow-hidden">
            <h4 className="text-sm font-bold text-themeText truncate leading-tight">{user?.name || 'Trackyo User'}</h4>
            <p className="text-[11px] text-themeTextMuted truncate mt-0.5">{user?.email || 'user@trackyo.in'}</p>
          </div>
        </div>
        
        <button
          onClick={logout}
          className="flex items-center justify-center space-x-2 w-full py-2.5 px-4 rounded-xl border border-themeBorder text-rose-500 hover:bg-rose-500 hover:text-white transition-all font-bold text-sm tracking-wide"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>

    </aside>
  );
};

export default Sidebar;
