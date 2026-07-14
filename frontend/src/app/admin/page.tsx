'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ExclamationCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  EyeIcon,
  ArrowPathIcon,
  UserGroupIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { statsAPI, issuesAPI } from '@/lib/api';
import { Issue, CATEGORY_LABELS, STATUS_LABELS, SEVERITY_LABELS } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import clsx from 'clsx';

interface StatsOverview {
  total: number;
  pending: number;
  verified: number;
  in_progress: number;
  resolved: number;
  rejected: number;
  activeCitizens: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<StatsOverview | null>(null);
  const [recentIssues, setRecentIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, issuesRes] = await Promise.all([
        statsAPI.getOverview(),
        issuesAPI.getAll({ limit: 5, sortBy: 'createdAt', sortOrder: 'desc' })
      ]);
      if (statsRes.data.success) setStats(statsRes.data.data);
      if (issuesRes.data.success) setRecentIssues(issuesRes.data.data.issues);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = stats ? [
    { name: 'Total Issues', value: stats.total, icon: ChartBarIcon, gradient: 'from-violet-500 to-purple-600', bgGlow: 'bg-violet-500' },
    { name: 'Pending', value: stats.pending, icon: ClockIcon, gradient: 'from-amber-400 to-orange-500', bgGlow: 'bg-amber-500' },
    { name: 'In Progress', value: stats.in_progress, icon: ArrowTrendingUpIcon, gradient: 'from-blue-500 to-cyan-500', bgGlow: 'bg-blue-500' },
    { name: 'Resolved', value: stats.resolved, icon: CheckCircleIcon, gradient: 'from-emerald-400 to-teal-500', bgGlow: 'bg-emerald-500' },
    { name: 'Citizens', value: stats.activeCitizens, icon: UserGroupIcon, gradient: 'from-pink-500 to-rose-500', bgGlow: 'bg-pink-500' }
  ] : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-purple-500/30"></div>
            <div className="absolute inset-0 rounded-full border-4 border-purple-400 border-t-transparent animate-spin"></div>
          </div>
          <p className="text-purple-200/70">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Background decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 right-1/4 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">
              <SparklesIcon className="w-7 h-7 text-purple-400" />
              Dashboard
            </h1>
            <p className="mt-1 text-sm text-purple-200/60">Monitor and manage civic issues</p>
          </div>
          <button 
            onClick={fetchDashboardData} 
            className="inline-flex items-center justify-center px-4 py-2.5 bg-white/10 backdrop-blur text-white text-sm font-medium rounded-xl border border-white/10 hover:bg-white/20 transition-all active:scale-95"
          >
            <ArrowPathIcon className="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>

        {/* Stats Grid - Responsive */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {statCards.map((stat, idx) => (
            <div 
              key={stat.name} 
              className="group relative overflow-hidden bg-white/5 backdrop-blur-xl rounded-2xl p-4 sm:p-5 border border-white/10 hover:bg-white/10 transition-all duration-300 hover:scale-[1.02]"
            >
              {/* Glow effect */}
              <div className={clsx('absolute -top-8 -right-8 w-20 h-20 rounded-full opacity-30 blur-2xl transition-opacity group-hover:opacity-50', stat.bgGlow)}></div>
              
              <div className="relative">
                <div className={clsx('inline-flex p-2.5 rounded-xl bg-gradient-to-br mb-3', stat.gradient)}>
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-white">{stat.value}</p>
                <p className="text-xs sm:text-sm text-purple-200/60 mt-0.5">{stat.name}</p>
              </div>
              
              {/* Bottom accent */}
              <div className={clsx('absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r opacity-60', stat.gradient)}></div>
            </div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
          {/* Recent Issues - Takes 2 columns on xl */}
          <div className="xl:col-span-2 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
            <div className="px-4 sm:px-6 py-4 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
                <ExclamationCircleIcon className="w-5 h-5 text-purple-400" />
                Recent Issues
              </h2>
              <Link href="/admin/issues" className="text-xs sm:text-sm text-purple-400 hover:text-purple-300 font-medium transition-colors">
                View all 
              </Link>
            </div>
            
            <div className="divide-y divide-white/5">
              {recentIssues.length === 0 ? (
                <div className="p-8 sm:p-12 text-center">
                  <ExclamationCircleIcon className="w-12 h-12 text-purple-400/30 mx-auto mb-3" />
                  <p className="text-purple-200/50">No issues reported yet</p>
                </div>
              ) : (
                recentIssues.map((issue) => (
                  <Link 
                    key={issue._id} 
                    href={'/issues/' + issue._id} 
                    className="group flex items-center gap-3 sm:gap-4 p-3 sm:p-4 hover:bg-white/5 transition-all"
                  >
                    <img 
                      src={issue.imageUrl} 
                      alt="" 
                      className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-cover ring-2 ring-white/10 group-hover:ring-purple-400/30 transition-all flex-shrink-0" 
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm sm:text-base text-white font-medium line-clamp-1 group-hover:text-purple-300 transition-colors">
                        {issue.description}
                      </p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-xs text-purple-200/40">{CATEGORY_LABELS[issue.category]}</span>
                        <span className={clsx(
                          'px-1.5 py-0.5 text-xs font-medium rounded-md',
                          issue.status === 'resolved' ? 'bg-emerald-500/20 text-emerald-300' : 
                          issue.status === 'in_progress' ? 'bg-blue-500/20 text-blue-300' : 
                          'bg-amber-500/20 text-amber-300'
                        )}>
                          {STATUS_LABELS[issue.status]}
                        </span>
                      </div>
                    </div>
                    <div className="hidden sm:block text-right flex-shrink-0">
                      <span className={clsx(
                        'px-2 py-1 text-xs font-bold rounded-lg',
                        issue.severity === 'critical' ? 'bg-red-500/20 text-red-300' : 
                        issue.severity === 'high' ? 'bg-orange-500/20 text-orange-300' : 
                        issue.severity === 'medium' ? 'bg-amber-500/20 text-amber-300' : 
                        'bg-emerald-500/20 text-emerald-300'
                      )}>
                        {SEVERITY_LABELS[issue.severity]}
                      </span>
                      <p className="text-xs text-purple-200/30 mt-1.5">
                        {formatDistanceToNow(new Date(issue.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                    <EyeIcon className="w-4 h-4 text-purple-400/30 group-hover:text-purple-400 transition-colors hidden sm:block" />
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4 sm:space-y-6">
            {/* Quick Actions */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-4 sm:p-5">
              <h3 className="text-base font-semibold text-white mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <Link href="/admin/issues" className="flex items-center gap-3 p-3 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl hover:from-purple-500/20 hover:to-pink-500/20 transition-all group border border-transparent hover:border-purple-500/20">
                  <div className="p-2 rounded-lg bg-purple-500/20">
                    <ExclamationCircleIcon className="w-5 h-5 text-purple-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium group-hover:text-purple-300">Manage Issues</p>
                    <p className="text-xs text-purple-200/40">Review and update</p>
                  </div>
                </Link>
                
                <Link href="/admin/settings" className="flex items-center gap-3 p-3 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-xl hover:from-emerald-500/20 hover:to-teal-500/20 transition-all group border border-transparent hover:border-emerald-500/20">
                  <div className="p-2 rounded-lg bg-emerald-500/20">
                    <UserGroupIcon className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium group-hover:text-emerald-300">User Management</p>
                    <p className="text-xs text-emerald-200/40">Manage authorities</p>
                  </div>
                </Link>
              </div>
            </div>

            {/* Resolution Rate */}
            {stats && (
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-4 sm:p-5">
                <h3 className="text-base font-semibold text-white mb-4">Resolution Rate</h3>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-purple-200/60">Progress</span>
                    <span className="text-sm font-bold text-emerald-400">
                      {stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0}%
                    </span>
                  </div>
                  <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full transition-all duration-1000" 
                      style={{ width: (stats.total > 0 ? (stats.resolved / stats.total) * 100 : 0) + '%' }}
                    ></div>
                  </div>
                  <p className="text-xs text-purple-200/40 mt-2">
                    {stats.resolved} of {stats.total} issues resolved
                  </p>
                </div>
              </div>
            )}

            {/* Status Breakdown */}
            {stats && (
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-4 sm:p-5">
                <h3 className="text-base font-semibold text-white mb-4">Status Breakdown</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-purple-200/60 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                      Pending
                    </span>
                    <span className="text-sm font-semibold text-white">{stats.pending}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-purple-200/60 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                      In Progress
                    </span>
                    <span className="text-sm font-semibold text-white">{stats.in_progress}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-purple-200/60 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                      Resolved
                    </span>
                    <span className="text-sm font-semibold text-white">{stats.resolved}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-purple-200/60 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-400"></span>
                      Rejected
                    </span>
                    <span className="text-sm font-semibold text-white">{stats.rejected}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
