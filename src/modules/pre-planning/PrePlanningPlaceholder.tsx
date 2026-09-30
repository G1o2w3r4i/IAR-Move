import React from 'react';
import { Calendar } from 'lucide-react';

export const PrePlanningPlaceholder: React.FC = () => {
  return (
    <div style={{ padding: '60px 24px', textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
      <div
        style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          backgroundColor: '#f1f4ff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px',
        }}
      >
        <Calendar size={32} color="#000099" />
      </div>
      <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#212121', marginBottom: '8px' }}>
        Pre-Planning Phase
      </h2>
      <p style={{ fontSize: '13px', color: '#63666a', lineHeight: '1.6' }}>
        Annual internal audit planning, audit universe risk ranking, and portfolio assessment capabilities will be configured here in future development waves.
      </p>
    </div>
  );
};
