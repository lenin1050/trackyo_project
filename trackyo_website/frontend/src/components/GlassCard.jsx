import React from 'react';

const GlassCard = ({ children, className = '', onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`glass-panel rounded-2xl p-6 transition-all duration-300 ${
        onClick ? 'cursor-pointer transform hover:-translate-y-1' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};

export default GlassCard;
