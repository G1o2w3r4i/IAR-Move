import React from 'react';
import { CheckSquare } from 'lucide-react';

export const WrapUpPlaceholder: React.FC = () => {
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
        <CheckSquare size={32} color="#000099" />
      </div>
      <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#212121', marginBottom: '8px' }}>
        Wrap-up Phase
      </h2>
      <p style={{ fontSize: '13px', color: '#63666a', lineHeight: '1.6' }}>
        Audit file archival, quality assurance reviews, final closing notifications, and remediation tracking will be coordinated here.
      </p>
    </div>
  );
};
