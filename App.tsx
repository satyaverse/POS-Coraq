import React, { useState } from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { LoginScreen } from './components/Login';
import { POSView } from './components/POS/POSView';
import { KDSView } from './components/KDS/KDSView';
import { DashboardView } from './components/Admin/DashboardView';
import { MemberPortal } from './components/MemberPortal/MemberPortal';
import { Role } from './types';

const Main: React.FC = () => {
  const { currentUser } = useStore();
  const [currentAppView, setCurrentAppView] = useState<'EMPLOYEE' | 'MEMBER_PORTAL'>('EMPLOYEE');

  if (currentAppView === 'MEMBER_PORTAL') {
    return <MemberPortal onBack={() => setCurrentAppView('EMPLOYEE')} />;
  }

  if (!currentUser) {
    return <LoginScreen onNavigateToMemberPortal={() => setCurrentAppView('MEMBER_PORTAL')} />;
  }

  switch (currentUser.role) {
    case Role.CASHIER:
      return <POSView />;
    case Role.BARISTA:
    case Role.KITCHEN:
      return <KDSView />;
    case Role.ADMIN:
    case Role.MANAGER:
      return <DashboardView />;
    default:
      return <div className="text-white">Role not supported yet</div>;
  }
};

const App: React.FC = () => {
  return (
    <StoreProvider>
      <Main />
    </StoreProvider>
  );
};

export default App;
