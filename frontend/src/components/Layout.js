import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MdDashboard, MdPeople, MdSettings, MdMenu, MdClose, MdLogout, MdExpandMore, MdShoppingCart, MdInventory, MdAccountBalance, MdBusiness, MdCampaign, MdAssignment, MdAssessment } from 'react-icons/md';
import { useAuth } from '../contexts/AuthContext';
import savorkaLogo from '../assets/savorka-logo.png';

const Navbar = ({ onToggleSidebar, sidebarExpanded, onLogoClick }) => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

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

        {/* User Menu */}
        <div className="flex items-center gap-4">
          {/* User Info */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-medium text-gray-900">
                {user?.first_name || user?.username}
              </div>
              <div className="text-xs text-gray-500">
                {isAdmin() ? 'Administrator' : 'User'}
              </div>
            </div>

            {/* User Avatar */}
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm">
              {getInitials(user?.first_name + ' ' + user?.last_name) || getInitials(user?.username)}
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            title="Logout"
          >
            <MdLogout size={18} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

const Sidebar = ({ expanded, menuConfig, currentPath, onNavigate }) => {
  const [hoveredItem, setHoveredItem] = useState(null);
  const [openMenus, setOpenMenus] = useState({});

  const toggleMenu = (label) => {
    setOpenMenus(prev => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <aside
      className={`h-full bg-white border-r border-gray-200 shadow-sm transition-all duration-300 ${
        expanded ? 'w-64' : 'w-20'
      }`}
    >
      {/* Sidebar Content */}
      <div className="h-full overflow-y-auto">
        <nav className="p-4 space-y-2">
          {menuConfig.map((item) => {
            if (item.children) {
              const isAnyChildActive = item.children.some(child => currentPath === child.path);
              const isOpen = openMenus[item.label] || isAnyChildActive;
              return (
                <div key={item.label}>
                  <button
                    onClick={() => toggleMenu(item.label)}
                    onMouseEnter={() => setHoveredItem(item.label)}
                    onMouseLeave={() => setHoveredItem(null)}
                    className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-200 ${
                      isOpen
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {/* Left Border for Active */}
                    {isAnyChildActive && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 rounded-r-full" />
                    )}

                    {/* Icon */}
                    <span className={`flex-shrink-0 ${isOpen ? 'text-blue-600' : 'text-gray-600'}`}>
                      {item.icon}
                    </span>

                    {/* Text (visible only when expanded) */}
                    {expanded && (
                      <>
                        <span className="font-medium text-sm flex-1 text-left">
                          {item.label}
                        </span>
                        <MdExpandMore className={`transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} size={20} />
                      </>
                    )}
                  </button>

                  {/* Tooltip (visible when collapsed and hovering) */}
                  {!expanded && hoveredItem === item.label && (
                    <div className="absolute left-24 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white text-sm px-3 py-1 rounded-md whitespace-nowrap pointer-events-none z-50">
                      {item.label}
                      <div className="absolute right-full top-1/2 transform -translate-y-1/2 border-4 border-transparent border-r-gray-800" />
                    </div>
                  )}

                  {/* Children */}
                  {expanded && isOpen && (
                    <div className="ml-8 space-y-1 transition-all duration-200">
                      {item.children.map((child) => {
                        const isChildActive = currentPath === child.path;
                        return (
                          <button
                            key={child.path}
                            onClick={() => onNavigate(child.path)}
                            className={`w-full flex items-center gap-4 px-4 py-2 rounded-lg transition-all duration-200 ${
                              isChildActive
                                ? 'bg-blue-50 text-blue-600'
                                : 'text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            {/* Left Border for Active */}
                            {isChildActive && (
                              <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 rounded-r-full" />
                            )}

                            <span className="font-medium text-sm flex-1 text-left">
                              {child.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            } else {
              const isActive = currentPath === item.path;
              return (
                <div key={item.label} className="relative">
                  <button
                    onClick={() => onNavigate(item.path)}
                    onMouseEnter={() => setHoveredItem(item.label)}
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
                        {item.label}
                      </span>
                    )}
                  </button>

                  {/* Tooltip (visible when collapsed and hovering) */}
                  {!expanded && hoveredItem === item.label && (
                    <div className="absolute left-24 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white text-sm px-3 py-1 rounded-md whitespace-nowrap pointer-events-none z-50">
                      {item.label}
                      <div className="absolute right-full top-1/2 transform -translate-y-1/2 border-4 border-transparent border-r-gray-800" />
                    </div>
                  )}
                </div>
              );
            }
          })}
        </nav>
      </div>
    </aside>
  );
};

const Layout = ({ children }) => {
  // Auto-collapse sidebar on mobile (< 768px)
  const [isMobile, setIsMobile] = React.useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Check if mobile on mount and window resize
  React.useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setSidebarExpanded(!mobile); // Expand on desktop, collapse on mobile
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const menuConfig = [
    { label: 'Dashboard', icon: <MdDashboard size={24} />, path: '/' },
    {
      label: 'Sales',
      icon: <MdShoppingCart size={24} />,
      children: [
        { label: 'Leads', path: '/leads' },
        { label: 'Follow-ups', path: '/follow-ups' },
        { label: 'Conversions', path: '/conversions' },
        { label: 'Sales Products', path: '/sales-products' }
      ]
    },
    {
      label: 'Operations',
      icon: <MdBusiness size={24} />,
      children: [
        { label: 'Survey', path: '/survey' },
        { label: 'Installation', path: '/installation' }
      ]
    },
    {
      label: 'Inventory',
      icon: <MdInventory size={24} />,
      children: [
        { label: 'Products', path: '/products' },
        { label: 'Stock', path: '/stock' },
        { label: 'Suppliers', path: '/suppliers' }
      ]
    },
    {
      label: 'Finance',
      icon: <MdAccountBalance size={24} />,
      children: [
        { label: 'Loans', path: '/loans' },
        { label: 'Subsidy', path: '/subsidy' }
      ]
    },
    {
      label: 'Customers',
      icon: <MdPeople size={24} />,
      children: [
        { label: 'Customers', path: '/customers' }
      ]
    },
    {
      label: 'Tasks',
      icon: <MdAssignment size={24} />,
      path: '/tasks'
    },
    {
      label: 'Reports',
      icon: <MdAssessment size={24} />,
      path: '/reports'
    },
    {
      label: 'Marketing',
      icon: <MdCampaign size={24} />,
      children: [
        { label: 'Campaigns', path: '/campaigns' },
        { label: 'Broadcasts', path: '/broadcasts' },
        { label: 'Automation', path: '/automation' },
        { label: 'Engagement', path: '/engagement' }
      ]
    },
    {
      label: 'Settings',
      icon: <MdSettings size={24} />,
      children: [
        { label: 'Users', path: '/users' },
        { label: 'Audit Logs', path: '/audit-logs' },
        { label: 'Settings', path: '/settings' }
      ]
    },
  ];

  const handleToggleSidebar = () => {
    setSidebarExpanded(!sidebarExpanded);
  };

  const handleNavigate = (path) => {
    navigate(path);
    // Close sidebar on mobile after navigation
    if (isMobile) setSidebarExpanded(false);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Navbar
        onToggleSidebar={handleToggleSidebar}
        sidebarExpanded={sidebarExpanded}
        onLogoClick={() => navigate('/')}
      />

      <div className="flex flex-1 mt-16 overflow-hidden relative">
        {/* Mobile overlay when sidebar is open */}
        {sidebarExpanded && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
            onClick={() => setSidebarExpanded(false)}
          />
        )}

        {/* Sidebar - slide-in on mobile */}
        <div
          className={`fixed md:static top-16 left-0 bottom-0 z-30 h-[calc(100vh-4rem)] md:h-auto transition-transform duration-300 ${
            sidebarExpanded ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
        >
          <Sidebar
            expanded={sidebarExpanded}
            menuConfig={menuConfig}
            currentPath={location.pathname}
            onNavigate={handleNavigate}
          />
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;