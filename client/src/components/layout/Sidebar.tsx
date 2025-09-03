import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  FileText,
  Briefcase,
  Settings,
  Shield,
  Activity,
  Upload,
  BarChart3,
  Menu
} from 'lucide-react';
import { clsx } from 'clsx';

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Documents', href: '/documents', icon: FileText },
  { name: 'Jobs', href: '/jobs', icon: Briefcase },
  { name: 'Admin', href: '/admin', icon: Shield },
  { name: 'Settings', href: '/settings', icon: Settings },
];

const quickActions = [
  { name: 'Upload Document', href: '/documents?upload=true', icon: Upload },
  { name: 'View Stats', href: '/admin', icon: BarChart3 },
  { name: 'System Health', href: '/admin?tab=health', icon: Activity },
];

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggle }) => {
  const location = useLocation();

  return (
    <div className={clsx(
      "fixed top-20 bottom-0 left-0 nav-sidebar nav-transition",
      "nav-backdrop border-r border-gray-200/50",
      isCollapsed ? "w-16" : "w-64"
    )}>
      <div className="flex flex-col h-full">
        {/* Hamburger Menu Toggle Button */}
        <div className="flex justify-center py-4 border-b border-gray-200/50">
          <button
            onClick={onToggle}
            className="p-2 rounded-lg hover:bg-gray-100/50 transition-colors"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <Menu className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
          <nav className="flex-1 px-4 space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={clsx(
                    'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-all duration-200',
                    isActive
                      ? 'bg-primary-500/20 text-primary-700 shadow-lg shadow-primary-500/25'
                      : 'text-gray-600 hover:bg-gray-100/50 hover:text-gray-900'
                  )}
                  title={isCollapsed ? item.name : undefined}
                >
                  <item.icon
                    className={clsx(
                      'flex-shrink-0 transition-all duration-200',
                      isCollapsed ? 'h-5 w-5 mx-auto' : 'mr-3 h-5 w-5',
                      isActive
                        ? 'text-primary-500'
                        : 'text-gray-400 group-hover:text-gray-500'
                    )}
                  />
                  {!isCollapsed && item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {!isCollapsed && (
          <div className="px-4 py-4 border-t border-gray-200/50">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Quick Actions
            </h3>
            <div className="space-y-1">
              {quickActions.map((action) => (
                <Link
                  key={action.name}
                  to={action.href}
                  className="group flex items-center px-2 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-100/50 hover:text-gray-900 transition-colors"
                >
                  <action.icon className="mr-3 h-4 w-4 flex-shrink-0 text-gray-400 group-hover:text-gray-500" />
                  {action.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};