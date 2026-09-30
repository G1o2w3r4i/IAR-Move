import React from 'react';
import { PhaseNavigation } from './PhaseNavigation';
import { UserRoleMenu } from './UserRoleMenu';
import { NotificationDrawer } from './NotificationDrawer';
import jjLogo from '../../assets/jj-logo.png';

export const Header: React.FC = () => {
  return (
    <header className="jnj-app-header">
      {/* Top White Bar */}
      <div className="jnj-app-header-inner">
        {/* Left: Authentic Johnson & Johnson Brand Logo + Subtitle */}
        <div className="jnj-logo-container">
          <img src={jjLogo} alt="Johnson & Johnson" className="jnj-logo-img" />
          <div className="jnj-logo-subtitle">
            GA&A INTERNAL AUDIT REPORTING
          </div>
        </div>

        {/* Center: 6-Phase Audit Lifecycle Navigation with Red Underline */}
        <PhaseNavigation />

        {/* Right Tools: Bell Notification & User Profile Menu */}
        <div className="jnj-header-tools">
          <NotificationDrawer />
          <UserRoleMenu />
        </div>
      </div>

      {/* Corporate Patterned Blue Ribbon directly beneath the white header */}
      <div className="jnj-blue-ribbon" />
    </header>
  );
};
