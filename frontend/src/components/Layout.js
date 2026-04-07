import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MdDashboard, MdPeople, MdAssessment, MdDescription, MdBuild, MdSettings, MdMenu, MdClose } from 'react-icons/md';
import savorkaLogo from '../assets/savorka-logo.png';

const Navbar = ({ onToggleSidebar, sidebarExpanded, onLogoClick }) => {
  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 shadow-sm z-40">
      <div className="h-full px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Toggle Button */}
          <button
            onClick={onToggleSidebar}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-300 focus:outline-none"
            title={sidebarExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {sidebarExpanded ? (
              <MdClose size={24} className="text-gray-700" />
            ) : (
              <MdMenu size={24} className="text-gray-700" />
            )}
          </button>

          {/* Logo Only */}
          <button
            onClick={onLogoClick}
            className="flex items-center justify-center cursor-pointer transition-transform duration-300 hover:scale-105 focus:outline-none"
            title="Go to dashboard"
          >
            <img
              src={savorkaLogo}
              alt="Savorka Logo"
              className="h-[60px] w-auto object-contain"
            />
          </button>
        </div>

        {/* Placeholder for future user menu */}
        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center cursor-pointer hover:bg-blue-600 text-white font-bold">
          A
        </div>
      </div>
    </nav>
  );
};

const Sidebar = ({ expanded, menuItems, currentPath, onNavigate }) => {
  const [hoveredItem, setHoveredItem] = useState(null);

  return (
    <aside
      className={`fixed left-0 top-16 bottom-0 bg-white border-r border-gray-200 shadow-sm transition-all duration-300 z-30 ${
        expanded ? 'w-64' : 'w-20'
      }`}
    >
      {/* Sidebar Content */}
      <div className="h-full overflow-y-auto">
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => {
            const isActive = currentPath === item.path;
            return (
              <div key={item.text} className="relative">
                <button
                  onClick={() => onNavigate(item.path)}
                  onMouseEnter={() => setHoveredItem(item.text)}
                  onMouseLeave={() => setHoveredItem(null)}
                  className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {/* Left Border for Active */}
                  {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 rounded-r-full" />
                  )}

                  {/* Icon */}
                  <span className={`flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-gray-600'}`}>
                    {item.icon}
                  </span>

                  {/* Text (visible only when expanded) */}
                  {expanded && (
                    <span className="font-medium text-sm flex-1 text-left">
                      {item.text}
                    </span>
                  )}
                </button>

                {/* Tooltip (visible when collapsed and hovering) */}
                {!expanded && hoveredItem === item.text && (
                  <div className="absolute left-24 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white text-sm px-3 py-1 rounded-md whitespace-nowrap pointer-events-none z-50">
                    {item.text}
                    <div className="absolute right-full top-1/2 transform -translate-y-1/2 border-4 border-transparent border-r-gray-800" />
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>
    </aside>
  );
};

const Layout = ({ children }) => {
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { text: 'Dashboard', icon: <MdDashboard size={24} />, path: '/' },
    { text: 'Leads', icon: <MdPeople size={24} />, path: '/leads' },
    { text: 'Survey', icon: <MdAssessment size={24} />, path: '/survey' },
    { text: 'Proposal', icon: <MdDescription size={24} />, path: '/proposal' },
    { text: 'Installation', icon: <MdBuild size={24} />, path: '/installation' },
    { text: 'Settings', icon: <MdSettings size={24} />, path: '/settings' },
  ];

  const handleToggleSidebar = () => {
    setSidebarExpanded(!sidebarExpanded);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Navbar
        onToggleSidebar={handleToggleSidebar}
        sidebarExpanded={sidebarExpanded}
        onLogoClick={() => navigate('/')}
      />

      <div className="flex flex-1 mt-16 overflow-hidden">
        <Sidebar
          expanded={sidebarExpanded}
          menuItems={menuItems}
          currentPath={location.pathname}
          onNavigate={navigate}
        />

        {/* Main Content */}
        <main
          className={`flex-1 overflow-y-auto transition-all duration-300 ${
            sidebarExpanded ? 'ml-64' : 'ml-20'
          }`}
        >
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;