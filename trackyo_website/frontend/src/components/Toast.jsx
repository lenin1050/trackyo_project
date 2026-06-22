import React, { useEffect } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

const Toast = ({ message, type = 'success', onClose, duration = 3000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getStyles = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'rgba(16, 185, 129, 0.1)',
          border: 'border-emerald-500/30',
          text: 'text-emerald-400',
          icon: CheckCircle2,
        };
      case 'warning':
        return {
          bg: 'rgba(245, 158, 11, 0.1)',
          border: 'border-amber-500/30',
          text: 'text-amber-400',
          icon: AlertTriangle,
        };
      case 'danger':
      case 'error':
        return {
          bg: 'rgba(244, 63, 94, 0.1)',
          border: 'border-rose-500/30',
          text: 'text-rose-400',
          icon: XCircle,
        };
      case 'info':
      default:
        return {
          bg: 'rgba(59, 130, 246, 0.1)',
          border: 'border-blue-500/30',
          text: 'text-blue-400',
          icon: Info,
        };
    }
  };

  const styles = getStyles();
  const Icon = styles.icon;

  return (
    <div
      className={`fixed top-4 right-4 z-50 flex items-center justify-between p-4 rounded-xl border backdrop-blur-md shadow-lg animate-in slide-in-from-top-4 duration-300 ${styles.border}`}
      style={{ backgroundColor: styles.bg }}
    >
      <div className="flex items-center space-x-3 pr-4">
        <Icon className={`w-5 h-5 ${styles.text}`} />
        <p className="text-sm font-bold text-themeText">{message}</p>
      </div>
      <button onClick={onClose} className="text-themeTextMuted hover:text-themeText transition-all">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default Toast;
