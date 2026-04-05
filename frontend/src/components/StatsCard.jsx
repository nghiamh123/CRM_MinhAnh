import React from 'react';

const StatsCard = ({ title, value, icon: Icon, color }) => {
  return (
    <div className="card" style={{ borderLeft: `4px solid ${color}` }}>
      <div className="flex-between">
        <div>
          <p style={{ color: 'var(--text-light)', fontSize: '0.875rem' }}>{title}</p>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '5px' }}>{value}</h3>
        </div>
        <div style={{ padding: '10px', borderRadius: '12px', background: `${color}15`, color: color }}>
          <Icon size={24} />
        </div>
      </div>
    </div>
  );
};

export default StatsCard;
