import React from 'react';
import GlassCard from './GlassCard';

const StatCard = ({ title, value, icon: Icon, description, trend, trendType = 'neutral', glowColor = 'indigo' }) => {
  const getGlowStyle = () => {
    switch (glowColor) {
      case 'emerald':
        return 'rgba(16, 185, 129, 0.08)';
      case 'rose':
        return 'rgba(244, 63, 94, 0.08)';
      case 'sky':
        return 'rgba(56, 189, 248, 0.08)';
      case 'indigo':
      default:
        return 'rgba(99, 102, 241, 0.08)';
    }
  };

  const getTrendColor = () => {
    if (trendType === 'up') return 'text-emerald-500';
    if (trendType === 'down') return 'text-rose-500';
    return 'text-themeTextMuted';
  };

  return (
    <GlassCard className="relative overflow-hidden" style={{ backgroundColor: getGlowStyle() }}>
      {/* Decorative background glow sphere */}
      <div 
        className="absolute -right-4 -top-4 w-24 h-24 rounded-full filter blur-xl opacity-30" 
        style={{
          background: glowColor === 'emerald' ? '#10b981' : 
                      glowColor === 'rose' ? '#f43f5e' :
                      glowColor === 'sky' ? '#38bdf8' : '#6366f1'
        }}
      />
      
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-semibold tracking-wide uppercase text-themeTextMuted">{title}</p>
          <h3 className="text-3xl font-extrabold tracking-tight mt-2 text-themeText">{value}</h3>
        </div>
        <div className={`p-3 rounded-xl bg-themeBorder text-themePrimary flex items-center justify-center`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      
      {(description || trend) && (
        <div className="mt-4 flex items-center space-x-2 text-sm">
          {trend && (
            <span className={`font-bold ${getTrendColor()}`}>
              {trend}
            </span>
          )}
          {description && (
            <span className="text-themeTextMuted font-medium">{description}</span>
          )}
        </div>
      )}
    </GlassCard>
  );
};

export default StatCard;
