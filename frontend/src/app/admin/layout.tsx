'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  ChartBarIcon,
  ExclamationCircleIcon,
  Cog6ToothIcon,
  HomeIcon,
  Bars3Icon,
  XMarkIcon,
  SparklesIcon,
  ChevronLeftIcon
} from '@heroicons/react/24/outline';
import { useAuthStore, useHasHydrated } from '@/store/authStore';
import clsx from 'clsx';

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: ChartBarIcon },
  { name: 'Issues', href: '/admin/issues', icon: ExclamationCircleIcon },
  { name: 'Settings', href: '/admin/settings', icon: Cog6ToothIcon },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading: loading } = useAuthStore();
  const hasHydrated = useHasHydrated();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    if (isLoginPage) return;
    if (!hasHydrated) return;
    if (!loading && !isAuthenticated) {
      router.push('/admin/login');
    } else if (!loading && user && !['admin', 'authority'].includes(user.role)) {
      router.push('/');
    }
  }, [loading, isAuthenticated, user, router, isLoginPage, hasHydrated]);

  if (isLoginPage) return <>{children}</>;

  if (!hasHydrated || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-purple-500/30"></div>
            <div className="absolute inset-0 rounded-full border-4 border-purple-400 border-t-transparent animate-spin"></div>
            <SparklesIcon className="absolute inset-0 m-auto w-8 h-8 text-purple-400 animate-pulse" />
          </div>
          <p className="text-purple-200 font-medium">Loading Admin Panel...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user || !['admin', 'authority'].includes(user.role)) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={clsx(
        'fixed inset-y-0 left-0 z-50 bg-white/5 backdrop-blur-2xl border-r border-white/10 shadow-2xl transition-all duration-300 ease-in-out',
        'lg:translate-x-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        collapsed ? 'lg:w-20' : 'lg:w-64',
        'w-72'
      )}>
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-white/10">
          <Link href="/admin" className="flex items-center gap-3 overflow-hidden">
            <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30">
              <SparklesIcon className="w-6 h-6 text-white" />
            </div>
            <span className={clsx('text-xl font-bold text-white whitespace-nowrap transition-opacity duration-300', collapsed ? 'lg:opacity-0 lg:w-0' : 'opacity-100')}>
              CivicSense
            </span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1 flex-1">
          {!collapsed && <p className="px-3 py-2 text-xs font-semibold text-purple-300/70 uppercase tracking-wider">Management</p>}
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={clsx(
                  'flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 group',
                  isActive
                    ? 'bg-gradient-to-r from-purple-500/30 to-pink-500/30 text-white shadow-lg border border-purple-500/30'
                    : 'text-purple-200/70 hover:bg-white/5 hover:text-white'
                )}
              >
                <div className={clsx('flex-shrink-0 p-2 rounded-lg transition-all', isActive ? 'bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg' : 'bg-white/5 group-hover:bg-white/10')}>
                  <item.icon className="w-5 h-5" />
                </div>
                <span className={clsx('whitespace-nowrap transition-opacity duration-300', collapsed ? 'lg:opacity-0 lg:w-0 lg:hidden' : 'opacity-100')}>{item.name}</span>
                {isActive && !collapsed && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse"></div>}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-white/10 space-y-1">
          <Link href="/" className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-purple-200/70 hover:bg-white/5 hover:text-white transition-all group">
            <div className="flex-shrink-0 p-2 rounded-lg bg-white/5 group-hover:bg-white/10 transition-all">
              <HomeIcon className="w-5 h-5" />
            </div>
            <span className={clsx('whitespace-nowrap transition-opacity duration-300', collapsed ? 'lg:opacity-0 lg:w-0 lg:hidden' : 'opacity-100')}>Back to Site</span>
          </Link>
          
          {/* Collapse button - desktop only */}
          <button onClick={() => setCollapsed(!collapsed)} className="hidden lg:flex w-full items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-purple-200/70 hover:bg-white/5 hover:text-white transition-all group">
            <div className="flex-shrink-0 p-2 rounded-lg bg-white/5 group-hover:bg-white/10 transition-all">
              <ChevronLeftIcon className={clsx('w-5 h-5 transition-transform duration-300', collapsed && 'rotate-180')} />
            </div>
            <span className={clsx('whitespace-nowrap transition-opacity duration-300', collapsed ? 'lg:opacity-0 lg:w-0 lg:hidden' : 'opacity-100')}>Collapse</span>
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <div className={clsx('transition-all duration-300 ease-in-out', collapsed ? 'lg:ml-20' : 'lg:ml-64')}>
        {/* Mobile header */}
        <header className="sticky top-0 z-30 lg:hidden bg-white/5 backdrop-blur-xl border-b border-white/10">
          <div className="flex items-center justify-between h-16 px-4">
            <button onClick={() => setSidebarOpen(true)} className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all">
              <Bars3Icon className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2">
              <SparklesIcon className="w-6 h-6 text-purple-400" />
              <span className="text-lg font-bold text-white">Admin</span>
            </div>
            <div className="w-10" />
          </div>
        </header>

        {/* Page content */}
        <main className="min-h-screen">{children}</main>
      </div>
    </div>
  );
}
