import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNotifications } from '../context/NotificationContext';
import { 
  Bell, 
  Sun, 
  Moon, 
  Zap, 
  Sliders, 
  LogOut,
  Check
} from 'lucide-react';

const Navbar = ({ activeTab, onNotificationClick }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { unreadCount } = useNotifications();
  const [showThemeDropdown, setShowThemeDropdown] = useState(false);

  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Terminal Dashboard';
      case 'transactions':
        return 'Expense Ledger';
      case 'budgets':
        return 'Budget Caps & Limits';
      case 'wishlist':
        return 'Wishlist Savings Goal';
      case 'notifications':
        return 'Notification Alerts';
      case 'admin':
        return 'System Administration';
      default:
        return 'Trackyo Finance';
    }
  };

  const themes = [
    { id: 'dark', name: 'Dark Slate', icon: Moon },
    { id: 'light', name: 'Light Mode', icon: Sun },
    { id: 'neon', name: 'Cyber Neon', icon: Zap },
    { id: 'minimal', name: 'Terminal Mono', icon: Sliders },
  ];

  return (
    <header className="w-full glass-panel rounded-2xl md:rounded-3xl border border-themeBorder px-6 py-4 flex items-center justify-between z-30 select-none">
      
      {/* Title */}
      <div>
        <h2 className="text-lg md:text-xl font-extrabold tracking-tight text-themeText capitalize">
          {getPageTitle()}
        </h2>
        <p className="hidden md:block text-[11px] text-themeTextMuted mt-0.5 font-semibold">
          {user ? `Welcome back, ${user.name} — tracking with ${theme} aesthetics.` : 'Manage your Indian platforms expenditure'}
        </p>
      </div>

      {/* Action Controls */}
      <div className="flex items-center space-x-3.5 relative">
        
        {/* Notification Bell */}
        <button
          data-testid="notification-bell"
          onClick={onNotificationClick}
          className="relative p-2.5 rounded-xl border border-themeBorder text-themeTextMuted hover:text-themeText hover:bg-themeBorder transition-all"
        >
          <Bell className="w-4.5 h-4.5" />
          {unreadCount > 0 && (
            <div className="absolute -top-1.5 -right-1.5 min-w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center font-black text-[9px] px-1 animate-pulse">
              {unreadCount}
            </div>
          )}
        </button>

        {/* Theme Preference Dropdown Toggle */}
        <div className="relative">
          <button
            onClick={() => setShowThemeDropdown(!showThemeDropdown)}
            className="p-2.5 rounded-xl border border-themeBorder text-themeTextMuted hover:text-themeText hover:bg-themeBorder transition-all flex items-center space-x-1.5"
          >
            {theme === 'dark' && <Moon className="w-4.5 h-4.5" />}
            {theme === 'light' && <Sun className="w-4.5 h-4.5" />}
            {theme === 'neon' && <Zap className="w-4.5 h-4.5 text-themePrimary" />}
            {theme === 'minimal' && <Sliders className="w-4.5 h-4.5" />}
            <span className="hidden md:inline text-xs font-bold capitalize">{theme}</span>
          </button>

          {showThemeDropdown && (
            <div className="absolute right-0 mt-2.5 w-48 glass-panel rounded-xl border border-themeBorder p-1.5 shadow-glass z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              {themes.map((t) => {
                const Icon = t.icon;
                const isSelected = theme === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      toggleTheme(t.id);
                      setShowThemeDropdown(false);
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all ${
                      isSelected
                        ? 'bg-themePrimary text-white shadow-neon-glow'
                        : 'text-themeTextMuted hover:text-themeText hover:bg-themeBorder'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2 inline-block" />
                    <span>{t.name}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 ml-auto inline-block" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Logout Mobile Icon (Visible only on Mobile) */}
        <button
          onClick={logout}
          className="md:hidden p-2.5 rounded-xl border border-themeBorder text-rose-500 hover:bg-rose-500 hover:text-white transition-all"
        >
          <LogOut className="w-4.5 h-4.5" />
        </button>

      </div>
    </header>
  );
};

export default Navbar;
