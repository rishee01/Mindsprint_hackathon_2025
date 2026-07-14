/**
 * Issues List Page
 * Browse and filter issues
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ListBulletIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';
import { issuesAPI } from '@/lib/api';
import IssueCard from '@/components/IssueCard';
import { Issue, CATEGORY_LABELS, STATUS_LABELS, SEVERITY_LABELS } from '@/types';

export default function IssuesPage() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    severity: '',
    search: ''
  });
  
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 0
  });

  // Fetch issues
  const fetchIssues = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {
        page: pagination.page,
        limit: pagination.limit,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      };
      
      if (filters.status) params.status = filters.status;
      if (filters.category) params.category = filters.category;
      if (filters.severity) params.severity = filters.severity;
      if (filters.search) params.search = filters.search;
      
      const response = await issuesAPI.getAll(params);
      
      if (response.data.success) {
        setIssues(response.data.data.issues);
        setPagination(prev => ({
          ...prev,
          total: response.data.data.pagination.total,
          pages: response.data.data.pagination.pages
        }));
      }
    } catch (error) {
      console.error('Failed to fetch issues:', error);
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  // Refetch when window gains focus to show admin updates
  useEffect(() => {
    const handleFocus = () => {
      fetchIssues();
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [fetchIssues]);

  // Reset filters
  const resetFilters = () => {
    setFilters({ status: '', category: '', severity: '', search: '' });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Title */}
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">All Issues</h1>
              <span className="ml-3 bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm">
                {pagination.total} total
              </span>
            </div>
            
            {/* Search and Filters */}
            <div className="flex items-center gap-3">
              <form onSubmit={handleSearch} className="relative flex-1 md:w-64">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search issues..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="input pl-10 py-2"
                />
              </form>
              
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`btn-secondary py-2 ${showFilters ? 'bg-primary-50 text-primary-700' : ''}`}
              >
                <FunnelIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          {/* Filter Panel */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[150px]">
                  <label className="label">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                    className="input py-2"
                  >
                    <option value="">All Statuses</option>
                    {Object.entries(STATUS_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
                
                <div className="flex-1 min-w-[150px]">
                  <label className="label">Category</label>
                  <select
                    value={filters.category}
                    onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                    className="input py-2"
                  >
                    <option value="">All Categories</option>
                    {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
                
                <div className="flex-1 min-w-[150px]">
                  <label className="label">Severity</label>
                  <select
                    value={filters.severity}
                    onChange={(e) => setFilters(prev => ({ ...prev, severity: e.target.value }))}
                    className="input py-2"
                  >
                    <option value="">All Severities</option>
                    {Object.entries(SEVERITY_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
                
                <div className="flex items-end">
                  <button
                    onClick={resetFilters}
                    className="btn-secondary py-2"
                  >
                    <XMarkIcon className="w-5 h-5 mr-1" />
                    Reset
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card animate-pulse">
                <div className="aspect-video bg-gray-200"></div>
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : issues.length === 0 ? (
          <div className="text-center py-16">
            <ListBulletIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No issues found</h3>
            <p className="text-gray-500 mb-4">Try adjusting your filters or search query</p>
            <Link href="/report" className="btn-primary">
              Report an Issue
            </Link>
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {issues.map((issue) => (
                <IssueCard key={issue._id} issue={issue} />
              ))}
            </div>
            
            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex justify-center mt-8 gap-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                  className="btn-secondary py-2 disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="flex items-center px-4 text-gray-600">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page === pagination.pages}
                  className="btn-secondary py-2 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
