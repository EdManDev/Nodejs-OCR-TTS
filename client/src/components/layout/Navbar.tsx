import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bell, Settings, Search, Home, FileText, Briefcase, Shield, Menu, X, User } from 'lucide-react';
import { clsx } from 'clsx';

const mobileNavigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Documents', href: '/documents', icon: FileText },
  { name: 'Jobs', href: '/jobs', icon: Briefcase },
  { name: 'Admin', href: '/admin', icon: Shield },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export const Navbar: React.FC = () => {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <>
      {/* Desktop Navigation Bar - Only visible on desktop */}
      <nav className="hidden lg:block fixed top-0 left-0 right-0 z-40 nav-backdrop border-b border-gray-200/50 shadow-sm">
        <div className="flex items-center justify-between px-6 py-4">
          {/* Logo */}
          <Link to="/" className="text-2xl font-bold text-primary-600">
            OCR TTS Platform
          </Link>

          {/* Search Bar - Desktop */}
          <div className="flex-1 max-w-lg mx-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search documents..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent nav-backdrop"
              />
            </div>
          </div>

          {/* Right side actions */}
          <div className="flex items-center space-x-4">
            <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100/50 rounded-lg transition-colors">
              <Bell className="h-5 w-5" />
            </button>
            
            <Link
              to="/settings"
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100/50 rounded-lg transition-colors"
            >
              <Settings className="h-5 w-5" />
            </Link>
            
            <div className="flex items-center space-x-2">
              <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100/50 rounded-lg transition-colors">
                <User className="h-5 w-5" />
              </button>
              <span className="text-sm text-gray-700">Admin</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Top Bar - Only visible on mobile */}
      <nav className="lg:hidden fixed top-0 left-0 right-0 z-50 nav-backdrop border-b border-gray-200/50 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Logo */}
          <Link to="/" className="text-lg font-bold text-primary-600">
            OCR TTS
          </Link>

          {/* Search Bar - Mobile */}
          <div className="flex-1 max-w-xs mx-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent nav-backdrop text-sm"
              />
            </div>
          </div>

          {/* Menu Button */}
          <button
            onClick={toggleMenu}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100/50 rounded-lg transition-colors"
            aria-label="Toggle navigation menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </nav>

      {/* Mobile Bottom Navigation Bar - Always visible icons */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 nav-backdrop border-t border-gray-200/50 shadow-lg">
        <div className="flex items-center justify-around px-2 py-3">
          {mobileNavigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={clsx(
                  'flex flex-col items-center space-y-1 p-2 rounded-lg transition-all duration-200',
                  isActive
                    ? 'text-primary-600 bg-primary-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/50'
                )}
                title={item.name}
              >
                <item.icon className={clsx(
                  'h-6 w-6',
                  isActive ? 'text-primary-600' : 'text-gray-600'
                )} />
                <span className={clsx(
                  'text-xs font-medium',
                  isActive ? 'text-primary-600' : 'text-gray-600'
                )}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Mobile Navigation Menu - Overlay */}
      {isMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-70 bg-black bg-opacity-50">
          <div className="absolute top-0 left-0 right-0 bg-white nav-backdrop border-b border-gray-200/50 shadow-lg">
            <div className="flex items-center justify-between px-4 py-3">
              <Link to="/" className="text-lg font-bold text-primary-600">
                OCR TTS
              </Link>
              <button
                onClick={toggleMenu}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100/50 rounded-lg transition-colors"
                aria-label="Close navigation menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* Quick Actions */}
            <div className="px-4 py-4 border-t border-gray-200/50">
              <div className="flex items-center justify-center space-x-4">
                <button className="p-3 text-gray-600 hover:text-gray-900 hover:bg-gray-100/50 rounded-lg transition-colors">
                  <Bell className="h-5 w-5" />
                </button>
                
                <Link
                  to="/settings"
                  onClick={() => setIsMenuOpen(false)}
                  className="p-3 text-gray-600 hover:text-gray-900 hover:bg-gray-100/50 rounded-lg transition-colors"
                >
                  <Settings className="h-5 w-5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};