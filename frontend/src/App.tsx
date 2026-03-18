import { useState } from 'react';
import './styles/global.css';

import Login         from './pages/Login';
import Sidebar       from './components/Sidebar';
import Topbar        from './components/Topbar';
import Dashboard     from './pages/Dashboard';
import Upload        from './pages/Upload';
import Verify        from './pages/Verify';
import Files         from './pages/Files';
import BlockchainLog from './pages/BlockchainLog';
import Profile       from './pages/Profile';
import NotFound      from './pages/NotFound';

const NAV_LABELS: Record<string, string> = {
  dashboard:  'Dashboard',
  upload:     'Upload & Seal',
  verify:     'Verify File',
  files:      'My Files',
  blockchain: 'Blockchain Log',
  profile:    'My Profile',
};

const VALID_PAGES = ['dashboard', 'upload', 'verify', 'files', 'blockchain', 'profile'];

export default function App() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [activePage,    setActivePage]    = useState('dashboard');
  const [notification,  setNotification]  = useState<{ msg: string; type: string } | null>(null);

  const showNotif = (msg: string, type: string) => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleNavigate = (page: string) => {
    if (VALID_PAGES.includes(page)) {
      setActivePage(page);
    } else {
      setActivePage('404');
    }
  };

  const handleConnected = (address: string) => {
    setWalletAddress(address);
    setActivePage('dashboard');
    showNotif('✅ Wallet connected successfully!', 'success');
  };

  const handleLogout = () => {
    setWalletAddress(null);
    setActivePage('dashboard');
    showNotif('👋 Wallet disconnected.', 'info');
  };

  // ── Not logged in ──
  if (!walletAddress) {
    return (
      <>
        <div className="grid-bg" />
        <Login onConnected={handleConnected} />
      </>
    );
  }

  const pageTitle = NAV_LABELS[activePage] || 'Not Found';

  return (
    <>
      <div className="grid-bg" />
      <div className="noise" />

      <div className="app">
        <Sidebar
          activePage={activePage}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
          walletAddress={walletAddress}
        />

        <main className="main">
          <Topbar
            pageTitle={pageTitle}
            walletAddress={walletAddress}
            onDisconnect={handleLogout}
          />

          <div className="content">
            {activePage === 'dashboard'  && <Dashboard     onNavigate={handleNavigate} />}
            {activePage === 'upload'     && <Upload        onNotify={showNotif} />}
            {activePage === 'verify'     && <Verify        onNotify={showNotif} />}
            {activePage === 'files'      && <Files         onNavigate={handleNavigate} />}
            {activePage === 'blockchain' && <BlockchainLog />}
            {activePage === 'profile'    && <Profile       walletAddress={walletAddress} onNavigate={handleNavigate} />}
            {activePage === '404'        && <NotFound      onNavigate={handleNavigate} />}
          </div>
        </main>
      </div>

      {notification && (
        <div className={`notification ${notification.type}`}>
          {notification.msg}
        </div>
      )}
    </>
  );
}