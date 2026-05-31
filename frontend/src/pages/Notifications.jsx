import React from 'react';
import { useNotifications } from '../context/NotificationContext';
import GlassCard from '../components/GlassCard';
import { Bell, Check, Trash2, CheckCircle2, AlertTriangle, ShieldAlert, Sparkles, Clock } from 'lucide-react';

const Notifications = ({ showToast }) => {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();

  const getAlertIcon = (type) => {
    switch (type) {
      case 'BudgetExceeded':
        return <AlertTriangle className="w-5 h-5 text-rose-500 animate-pulse" />;
      case 'GoalAchieved':
        return <Sparkles className="w-5 h-5 text-emerald-400 animate-bounce" style={{ animationDuration: '3s' }} />;
      case 'SMSDetected':
        return <Bell className="w-5 h-5 text-sky-400" />;
      case 'General':
      default:
        return <CheckCircle2 className="w-5 h-5 text-themePrimary" />;
    }
  };

  const getBorderColor = (type, isRead) => {
    if (isRead) return 'border-themeBorder/40 opacity-75';
    if (type === 'BudgetExceeded') return 'border-l-4 border-rose-500 bg-rose-500/5';
    if (type === 'GoalAchieved') return 'border-l-4 border-emerald-500 bg-emerald-500/5';
    return 'border-l-4 border-themePrimary bg-themePrimary/5';
  };

  const handleMarkRead = (id) => {
    markRead(id);
    showToast('Alert marked as read', 'success');
  };

  const handleMarkAllRead = () => {
    if (unreadCount === 0) return;
    markAllRead();
    showToast('All alerts marked as read', 'success');
  };

  return (
    <div className="space-y-6 select-none animate-in fade-in duration-300">
      
      {/* Title & trigger buttons */}
      <div className="flex justify-between items-center pl-1">
        <div>
          <h3 className="text-sm font-extrabold tracking-wide uppercase text-themeTextMuted">
            Notification Center ({unreadCount} unread)
          </h3>
        </div>
        
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="py-2 px-4 rounded-xl bg-themeBorder hover:bg-themePrimary hover:text-white transition-all text-xs font-bold flex items-center space-x-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Mark All as Read</span>
          </button>
        )}
      </div>

      {/* Notifications list grid */}
      <GlassCard className="space-y-4">
        {notifications.length > 0 ? (
          <div className="space-y-3 max-h-[550px] overflow-y-auto pr-1">
            {notifications.map((notif) => {
              const Icon = getAlertIcon(notif.type);
              return (
                <div
                  key={notif._id}
                  className={`p-4 rounded-xl border flex justify-between items-start space-x-4 transition-all duration-300 ${getBorderColor(
                    notif.type,
                    notif.isRead
                  )}`}
                >
                  
                  {/* Left Side Icon and Content */}
                  <div className="flex items-start space-x-3.5 flex-1 min-w-0">
                    <div className="p-2.5 rounded-xl bg-themeBorder flex items-center justify-center mt-0.5 select-none">
                      {Icon}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-bold leading-relaxed text-themeText ${notif.isRead ? 'font-semibold text-themeTextMuted' : ''}`}>
                        {notif.message}
                      </p>
                      
                      <p className="text-[10px] text-themeTextMuted mt-1.5 flex items-center select-none font-bold">
                        <Clock className="w-3.5 h-3.5 mr-1" />
                        <span>
                          {new Date(notif.createdAt || notif.date).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Mark single read button */}
                  {!notif.isRead && (
                    <button
                      onClick={() => handleMarkRead(notif._id)}
                      className="p-1.5 rounded-lg border border-themeBorder text-themeTextMuted hover:text-themePrimary hover:bg-themeBorder transition-all self-center select-none"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}

                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-24 text-themeTextMuted flex flex-col items-center">
            <Bell className="w-12 h-12 mb-2 text-themeBorder" />
            <p className="text-xs font-bold">Your notification alert log is empty</p>
          </div>
        )}
      </GlassCard>

    </div>
  );
};

export default Notifications;
