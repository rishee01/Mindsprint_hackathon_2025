'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  UserCircleIcon,
  EnvelopeIcon,
  CalendarIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  PlusIcon,
  SparklesIcon,
  ShieldCheckIcon,
  TrophyIcon,
  MapPinIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { useAuthStore, useHasHydrated } from '@/store/authStore';
import { issuesAPI } from '@/lib/api';
import { Issue, STATUS_LABELS, CATEGORY_LABELS, SEVERITY_LABELS } from '@/types';
import { formatDistanceToNow, format } from 'date-fns';
import toast from 'react-hot-toast';
import clsx from 'clsx';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();
  const hasHydrated = useHasHydrated();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'resolved'>('all');

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });

  useEffect(() => {
    if (!hasHydrated) return;
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router, hasHydrated]);

  const fetchMyIssues = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {
        page: pagination.page,
        limit: pagination.limit
      };

      if (activeTab === 'pending') {
        params.status = 'pending,verified,in_progress';
      } else if (activeTab === 'resolved') {
        params.status = 'resolved';
      }

      const response = await issuesAPI.getMyIssues(params);

      if (response.data.success) {
        setIssues(response.data.data.issues);
        setPagination(prev => ({
          ...prev,
          total: response.data.data.pagination.total,
          pages: response.data.data.pagination.pages
        }));
      }
    } catch (error) {
      toast.error('Failed to fetch your issues');
    } finally {
      setLoading(false);
    }
  }, [activeTab, pagination.page, pagination.limit]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchMyIssues();
    }
  }, [isAuthenticated, fetchMyIssues]);

  useEffect(() => {
    const handleFocus = () => {
      if (isAuthenticated) {
        fetchMyIssues();
      }
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [isAuthenticated, fetchMyIssues]);

  if (!hasHydrated || authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-indigo-100"></div>
            <div className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin"></div>
          </div>
          <p className="text-gray-600 font-medium">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) return null;

  const stats = {
    total: pagination.total,
    pending: issues.filter(i => ['pending', 'verified', 'in_progress'].includes(i.status)).length,
    resolved: issues.filter(i => i.status === 'resolved').length
  };

  const statCards = [
    {
      name: 'Total Reports',
      value: stats.total,
      icon: ExclamationCircleIcon,
      gradient: 'from-blue-500 to-indigo-600',
      iconBg: 'bg-gradient-to-br from-blue-500 to-indigo-600',
      shadowColor: 'shadow-blue-500/20'
    },
    {
      name: 'In Progress',
      value: stats.pending,
      icon: ClockIcon,
      gradient: 'from-amber-400 to-orange-500',
      iconBg: 'bg-gradient-to-br from-amber-400 to-orange-500',
      shadowColor: 'shadow-amber-500/20'
    },
    {
      name: 'Resolved',
      value: stats.resolved,
      icon: CheckCircleIcon,
      gradient: 'from-emerald-400 to-teal-500',
      iconBg: 'bg-gradient-to-br from-emerald-400 to-teal-500',
      shadowColor: 'shadow-emerald-500/20'
    }
  ];

  const tabs = [
    { id: 'all', label: 'All Issues', count: stats.total },
    { id: 'pending', label: 'Pending', count: stats.pending },
    { id: 'resolved', label: 'Resolved', count: stats.resolved }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-indigo-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/3 -left-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative py-8 lg:py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-xl shadow-gray-200/30 border border-white/50 overflow-hidden">
            <div className="h-32 lg:h-40 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 relative"></div>
            
            <div className="px-6 lg:px-8 pb-8">
              <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between -mt-16 lg:-mt-20">
                <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5">
                  <div className="relative">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-28 h-28 lg:w-36 lg:h-36 rounded-2xl object-cover ring-4 ring-white shadow-2xl" />
                    ) : (
                      <div className="w-28 h-28 lg:w-36 lg:h-36 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center ring-4 ring-white shadow-2xl">
                        <UserCircleIcon className="w-16 h-16 lg:w-20 lg:h-20 text-indigo-500" />
                      </div>
                    )}
                    <div className="absolute -bottom-2 -right-2 p-2 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl shadow-lg">
                      <ShieldCheckIcon className="w-5 h-5 text-white" />
                    </div>
                  </div>

                  <div className="text-center sm:text-left mt-4 sm:mt-0 pb-2">
                    <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">{user.name}</h1>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2">
                      <div className="flex items-center justify-center sm:justify-start text-gray-500">
                        <EnvelopeIcon className="w-4 h-4 mr-1.5" />
                        <span className="text-sm">{user.email}</span>
                      </div>
                      {user.createdAt && (
                        <div className="flex items-center justify-center sm:justify-start text-gray-400 text-sm">
                          <CalendarIcon className="w-4 h-4 mr-1.5" />
                          Member since {format(new Date(user.createdAt), 'MMM yyyy')}
                        </div>
                      )}
                    </div>
                    <div className="mt-3">
                      <span className={clsx(
                        'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full ring-2',
                        user.role === 'admin' && 'bg-purple-100 text-purple-700 ring-purple-200',
                        user.role === 'authority' && 'bg-blue-100 text-blue-700 ring-blue-200',
                        user.role === 'user' && 'bg-emerald-100 text-emerald-700 ring-emerald-200'
                      )}>
                        <TrophyIcon className="w-3.5 h-3.5" />
                        {user.role === 'user' ? 'Citizen' : user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 lg:mt-0 flex justify-center lg:justify-end">
                  <Link href="/report" className="group inline-flex items-center px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
                    <PlusIcon className="w-5 h-5 mr-2 transition-transform group-hover:rotate-90 duration-300" />
                    Report New Issue
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {statCards.map((stat) => (
              <div key={stat.name} className={clsx('group relative overflow-hidden bg-white/70 backdrop-blur-xl rounded-2xl p-6 border border-white/50 transition-all duration-500 hover:scale-[1.02] shadow-xl', stat.shadowColor)}>
                <div className={clsx('absolute -top-10 -right-10 w-24 h-24 rounded-full bg-gradient-to-br opacity-20 blur-2xl', stat.gradient)}></div>
                <div className="relative flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  </div>
                  <div className={clsx('p-3 rounded-xl shadow-lg', stat.iconBg)}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className={clsx('absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r', stat.gradient)}></div>
              </div>
            ))}
          </div>

          <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 overflow-hidden">
            <div className="border-b border-gray-100/80">
              <div className="flex">
                {tabs.map((tab) => (
                  <button key={tab.id} onClick={() => { setActiveTab(tab.id as any); setPagination(prev => ({ ...prev, page: 1 })); }} className={clsx('relative flex-1 px-6 py-4 text-sm font-semibold', activeTab === tab.id ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700')}>
                    <span className="flex items-center justify-center gap-2">
                      {tab.label}
                      <span className={clsx('px-2 py-0.5 text-xs rounded-full', activeTab === tab.id ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500')}>{tab.count}</span>
                    </span>
                    {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-600"></div>}
                  </button>
                ))}
              </div>
            </div>

            <div className="divide-y divide-gray-100/80">
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <div key={i} className="p-6 animate-pulse">
                    <div className="flex items-start gap-5">
                      <div className="w-20 h-20 bg-gray-200/50 rounded-xl"></div>
                      <div className="flex-1 space-y-3">
                        <div className="h-5 bg-gray-200/50 rounded-lg w-3/4"></div>
                        <div className="h-4 bg-gray-200/30 rounded-lg w-1/2"></div>
                      </div>
                    </div>
                  </div>
                ))
              ) : issues.length === 0 ? (
                <div className="py-16 text-center">
                  <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-2xl flex items-center justify-center">
                    <ExclamationCircleIcon className="w-10 h-10 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No issues found</h3>
                  <p className="text-gray-500 mb-6">Start making a difference in your community</p>
                  <Link href="/report" className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-xl shadow-lg">
                    <SparklesIcon className="w-5 h-5 mr-2" />
                    Report Your First Issue
                  </Link>
                </div>
              ) : (
                issues.map((issue) => (
                  <Link key={issue._id} href={`/issues/${issue._id}`} className="group flex items-start gap-5 p-6 hover:bg-indigo-50/50 transition-all">
                    <div className="relative flex-shrink-0">
                      <img src={issue.imageUrl} alt="" className="w-20 h-20 rounded-xl object-cover ring-2 ring-white shadow-lg group-hover:scale-105 transition-transform" />
                      <div className={clsx('absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full border-2 border-white', issue.status === 'resolved' ? 'bg-emerald-500' : issue.status === 'in_progress' ? 'bg-blue-500' : 'bg-amber-500')}></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-base font-semibold text-gray-900 line-clamp-1 group-hover:text-indigo-600">{issue.description}</p>
                          <div className="flex items-center gap-1.5 text-gray-500 text-sm mt-1">
                            <MapPinIcon className="w-4 h-4" />
                            <span className="line-clamp-1">{issue.location?.address || 'Location not available'}</span>
                          </div>
                        </div>
                        <span className={clsx('flex-shrink-0 px-3 py-1.5 text-xs font-semibold rounded-lg', issue.status === 'resolved' ? 'bg-emerald-100 text-emerald-700' : issue.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700')}>{STATUS_LABELS[issue.status]}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 mt-3">
                        <span className="px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-lg">{CATEGORY_LABELS[issue.category]}</span>
                        <span className={clsx('px-2.5 py-1 text-xs font-bold rounded-lg', issue.severity === 'critical' ? 'bg-red-100 text-red-700' : issue.severity === 'high' ? 'bg-orange-100 text-orange-700' : issue.severity === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700')}>{SEVERITY_LABELS[issue.severity]}</span>
                        <span className="text-xs text-gray-400">{formatDistanceToNow(new Date(issue.createdAt), { addSuffix: true })}</span>
                      </div>
                    </div>
                    <ChevronRightIcon className="w-5 h-5 text-gray-300 group-hover:text-indigo-500 transition-colors mt-2" />
                  </Link>
                ))
              )}
            </div>

            {pagination.pages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
                <p className="text-sm text-gray-500">Page {pagination.page} of {pagination.pages}</p>
                <div className="flex gap-2">
                  <button onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))} disabled={pagination.page === 1} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border rounded-xl disabled:opacity-50">
                    <ChevronLeftIcon className="w-4 h-4 inline mr-1" />Previous
                  </button>
                  <button onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))} disabled={pagination.page === pagination.pages} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border rounded-xl disabled:opacity-50">
                    Next<ChevronRightIcon className="w-4 h-4 inline ml-1" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
