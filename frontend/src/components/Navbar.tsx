/**
 * Navigation Bar Component
 * Responsive navbar with user menu and navigation links
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Bars3Icon, 
  XMarkIcon,
  MapPinIcon,
  PlusCircleIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { useAuthStore, useIsAdmin } from '@/store/authStore';
import { logOut } from '@/lib/firebase';
import clsx from 'clsx';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuthStore();
  const isAdmin = useIsAdmin();

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Issues Map', href: '/issues' },
    { name: 'Report Issue', href: '/report', requireAuth: true },
  ];

  const handleLogout = async () => {
    await logOut();
    logout();
    setUserMenuOpen(false);
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and main nav */}
          <div className="flex">
            <Link href="/" className="flex items-center">
              <MapPinIcon className="h-8 w-8 text-primary-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">
                CivicSense
              </span>
            </Link>
            
            {/* Desktop navigation */}
            <div className="hidden sm:ml-10 sm:flex sm:space-x-4">
              {navigation.map((item) => {
                if (item.requireAuth && !isAuthenticated) return null;
                
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={clsx(
                      'inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                      isActive 
                        ? 'bg-primary-50 text-primary-700' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    )}
                  >
                    {item.name}
                  </Link>
                );
              })}
              
              {isAdmin && (
                <Link
                  href="/admin"
                  className={clsx(
                    'inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                    pathname.startsWith('/admin')
                      ? 'bg-purple-50 text-purple-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  )}
                >
                  <ShieldCheckIcon className="w-4 h-4 mr-1" />
                  Admin
                </Link>
              )}
            </div>
          </div>

          {/* Right side - auth buttons or user menu */}
          <div className="flex items-center">
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                    {user?.avatar ? (
                      <img 
                        src={user.avatar} 
                        alt={user.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-sm font-medium text-primary-700">
                        {user?.name?.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <span className="hidden md:block text-sm font-medium text-gray-700">
                    {user?.name}
                  </span>
                </button>
                
                {/* User dropdown menu */}
                {userMenuOpen && (
                  <>
                    <div 
                      className="fixed inset-0" 
                      onClick={() => setUserMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg ring-1 ring-gray-100 py-1 z-50">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                        <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded text-xs font-medium bg-primary-100 text-primary-700 capitalize">
                          {user?.role}
                        </span>
                      </div>
                      
                      <Link
                        href="/profile"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <UserCircleIcon className="w-4 h-4 mr-2" />
                        My Profile
                      </Link>
                      
                      <Link
                        href="/profile"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <MapPinIcon className="w-4 h-4 mr-2" />
                        My Reported Issues
                      </Link>
                      
                      {isAdmin && (
                        <Link
                          href="/admin"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <ShieldCheckIcon className="w-4 h-4 mr-2" />
                          Admin Dashboard
                        </Link>
                      )}
                      
                      <div className="border-t border-gray-100 mt-1">
                        <button
                          onClick={handleLogout}
                          className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          <ArrowRightOnRectangleIcon className="w-4 h-4 mr-2" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="hidden sm:flex sm:items-center sm:space-x-3">
                <Link
                  href="/login"
                  className="text-sm font-medium text-gray-600 hover:text-gray-900 px-3 py-2"
                >
                  Sign In
                </Link>
                <Link
                  href="/admin/login"
                  className="text-sm font-medium text-purple-600 hover:text-purple-700 px-3 py-2 flex items-center"
                >
                  <ShieldCheckIcon className="w-4 h-4 mr-1" />
                  Admin
                </Link>
                <Link
                  href="/register"
                  className="btn-primary text-sm"
                >
                  Get Started
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="sm:hidden ml-2 p-2 rounded-lg text-gray-500 hover:bg-gray-50"
            >
              {mobileMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden bg-white border-t border-gray-100">
          <div className="px-4 py-3 space-y-1">
            {navigation.map((item) => {
              if (item.requireAuth && !isAuthenticated) return null;
              
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={clsx(
                    'block px-3 py-2 rounded-lg text-base font-medium',
                    isActive 
                      ? 'bg-primary-50 text-primary-700' 
                      : 'text-gray-600 hover:bg-gray-50'
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              );
            })}
            
            {isAdmin && (
              <Link
                href="/admin"
                className={clsx(
                  'block px-3 py-2 rounded-lg text-base font-medium',
                  pathname.startsWith('/admin')
                    ? 'bg-purple-50 text-purple-700'
                    : 'text-gray-600 hover:bg-gray-50'
                )}
                onClick={() => setMobileMenuOpen(false)}
              >
                Admin Dashboard
              </Link>
            )}
            
            {!isAuthenticated && (
              <div className="pt-4 border-t border-gray-100 space-y-2">
                <Link
                  href="/login"
                  className="block w-full text-center px-4 py-2 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  href="/admin/login"
                  className="flex items-center justify-center w-full px-4 py-2 text-purple-600 font-medium rounded-lg hover:bg-purple-50"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <ShieldCheckIcon className="w-4 h-4 mr-2" />
                  Admin Sign In
                </Link>
                <Link
                  href="/register"
                  className="block w-full text-center btn-primary"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
