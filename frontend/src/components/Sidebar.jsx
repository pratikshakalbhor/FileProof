import { motion } from 'framer-motion';

import {
  LayoutDashboard,
  UploadCloud,
  ShieldCheck,
  Folder,
  Activity,
  Bell,
  User,
  LogOut,
} from 'lucide-react';

const NAV = [
  { id: 'dashboard',      label: 'Dashboard',      icon: LayoutDashboard },
  { id: 'upload',         label: 'Upload File',    icon: UploadCloud },
  { id: 'verify',         label: 'Verify File',    icon: ShieldCheck },
  { id: 'my-files',       label: 'My Files',       icon: Folder },
  { id: 'blockchain-log', label: 'Blockchain Log', icon: Activity },
  { id: 'alerts',         label: 'Alerts',         icon: Bell },
  { id: 'profile',        label: 'Profile',        icon: User },
];

export default function Sidebar({ activePage, onNavigate, onLogout }) {
  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="logo-area">
        <div className="logo-icon"><ShieldCheck size={24} /></div>
        <div>
          <div className="logo-name">BlockVerify</div>
          <div className="logo-sub">Secure File Storage</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="nav">
        {NAV.map(n => {
          const Icon = n.icon;
          return (
            <button
              key={n.id}
              className={`nav-btn${activePage === n.id ? ' active' : ''}`}
              onClick={() => onNavigate(n.id)}
            >
              <Icon size={18} className="nav-icon" style={{ marginRight: 10 }} />
              {n.label}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="sidebar-foot">
        {/* Network badge */}
        <div className="net-badge" style={{ marginBottom: 10 }}>
          <span className="dot" />
          Sepolia Testnet
        </div>

        {/* Logout */}
        {onLogout && (
          <motion.button
            className="logout-btn"
            whileHover={{ x: 3, backgroundColor: 'rgba(255,68,68,0.10)' }}
            whileTap={{ scale: 0.97 }}
            onClick={onLogout}
          >
            <span className="logout-icon"><LogOut size={14} /></span>
            <span>Disconnect Wallet</span>
          </motion.button>
        )}
      </div>
    </aside>
  );
}