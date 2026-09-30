import React from 'react';
import { NavigationProvider } from './NavigationContext';
import { UserSessionProvider } from './UserSessionContext';
import { EngagementProvider } from './EngagementContext';

export const AppContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <NavigationProvider>
      <UserSessionProvider>
        <EngagementProvider>
          {children}
        </EngagementProvider>
      </UserSessionProvider>
    </NavigationProvider>
  );
};
