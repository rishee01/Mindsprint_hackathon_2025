/**
 * Issue Detail Page
 * View full issue details, verify, and see timeline
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeftIcon,
  MapPinIcon,
  CalendarIcon,
  UserIcon,
  CheckBadgeIcon,
  HandThumbUpIcon,
  HandThumbDownIcon,
  ClockIcon,
  BuildingOfficeIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { CheckBadgeIcon as CheckBadgeSolid } from '@heroicons/react/24/solid';
import { formatDistanceToNow, format } from 'date-fns';
import toast from 'react-hot-toast';
import { issuesAPI } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Issue, CATEGORY_LABELS, STATUS_LABELS, SEVERITY_LABELS } from '@/types';
import clsx from 'clsx';

export default function IssueDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  
  const [issue, setIssue] = useState<Issue | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);

  const fetchIssue = useCallback(async () => {
    try {
      const response = await issuesAPI.getById(params.id as string);
      if (response.data.success) {
        setIssue(response.data.data);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load issue');
      router.push('/issues');
    } finally {
      setLoading(false);
    }
  }, [params.id, router]);

  useEffect(() => {
    if (params.id) {
      fetchIssue();
    }
  }, [params.id, fetchIssue]);

  // Refetch when window gains focus to show admin updates
  useEffect(() => {
    const handleFocus = () => {
      if (params.id) {
        fetchIssue();
      }
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [params.id, fetchIssue]);

  const handleVerify = async (isReal: boolean) => {
    if (!isAuthenticated) {
      toast.error('Please login to verify issues');
      return;
    }

    if (!issue) {
      toast.error('Issue not loaded');
      return;
    }

    setVerifying(true);
    try {
      const issueId = issue._id || issue.id;
      const response = await issuesAPI.verify(issueId, isReal);
      if (response.data.success) {
        setIssue(response.data.data);
        toast.success(`Issue verified successfully!`);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to verify issue';
      toast.error(errorMessage);
      console.error('Verification error:', error);
    } finally {
      setVerifying(false);
    }
  };

  // Check if current user has already verified
  const hasVerified = () => {
    if (!user || !issue) return false;
    if (!issue.verifiedBy || issue.verifiedBy.length === 0) return false;
    
    // Handle both populated (object with _id) and unpopulated (string) cases
    return issue.verifiedBy.some((v: any) => {
      const verifierId = typeof v === 'string' ? v : (v._id || v.id);
      return verifierId === user.id || verifierId === user._id;
    });
  };

  // Check if user is the reporter
  const isReporter = () => {
    if (!user || !issue) return false;
    const reporterId = typeof issue.reportedBy === 'string' 
      ? issue.reportedBy 
      : (issue.reportedBy?._id || issue.reportedBy?.id);
    return reporterId === user.id || reporterId === user._id;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="card">
              <div className="aspect-video bg-gray-200"></div>
              <div className="p-6 space-y-4">
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!issue) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Link
          href="/issues"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          Back to Issues
        </Link>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image */}
            <div className="card overflow-hidden">
              <div className="relative aspect-video">
                {issue?.imageUrl ? (
                  <Image
                    src={issue.imageUrl}
                    alt="Issue"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <p className="text-gray-500">No image available</p>
                  </div>
                )}
              </div>
            </div>

            {/* Details */}
            <div className="card p-6">
              <div className="flex flex-wrap gap-2 mb-4">
                <span className={`badge badge-severity-${issue?.severity || 'medium'}`}>
                  {issue?.severity ? SEVERITY_LABELS[issue.severity] : 'Unknown'}
                </span>
                <span className={`badge badge-status-${issue?.status || 'pending'}`}>
                  {issue?.status ? STATUS_LABELS[issue.status] : 'Unknown'}
                </span>
                <span className="badge bg-gray-100 text-gray-700">
                  {issue?.category ? CATEGORY_LABELS[issue.category] : 'Unknown'}
                </span>
              </div>

              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                {issue?.category ? CATEGORY_LABELS[issue.category] : 'Unknown'} Issue
              </h1>

              <p className="text-gray-600 mb-6">{issue?.description || 'No description available'}</p>

              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center text-gray-600">
                  <MapPinIcon className="w-5 h-5 mr-2 text-gray-400" />
                  {issue?.location?.address || 'Address not available'}
                </div>
                <div className="flex items-center text-gray-600">
                  <CalendarIcon className="w-5 h-5 mr-2 text-gray-400" />
                  {issue?.createdAt ? format(new Date(issue.createdAt), 'PPP') : 'Unknown date'}
                </div>
                <div className="flex items-center text-gray-600">
                  <BuildingOfficeIcon className="w-5 h-5 mr-2 text-gray-400" />
                  {issue?.department || 'Not assigned'}
                </div>
                <div className="flex items-center text-gray-600">
                  <UserIcon className="w-5 h-5 mr-2 text-gray-400" />
                  Reported by {issue?.reportedBy?.name || 'Anonymous'}
                </div>
              </div>

              {/* AI Classification */}
              {issue?.aiClassification && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <div className="flex items-center mb-2">
                    <ExclamationTriangleIcon className="w-5 h-5 text-blue-600 mr-2" />
                    <span className="font-medium text-blue-900">AI Classification</span>
                  </div>
                  <div className="text-sm text-blue-700">
                    <p>Category: <span className="font-medium">{CATEGORY_LABELS[issue.aiClassification.category] || 'Unknown'}</span></p>
                    <p>Confidence: <span className="font-medium">{((issue.aiClassification.confidence || 0) * 100).toFixed(0)}%</span></p>
                  </div>
                </div>
              )}
            </div>

            {/* Community Verification */}
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <CheckBadgeIcon className="w-6 h-6 mr-2 text-primary-600" />
                Community Verification
              </h2>
              
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center text-green-600">
                    <HandThumbUpIcon className="w-5 h-5 mr-1" />
                    <span className="font-medium">{issue?.verifiedCount ?? 0}</span>
                    <span className="text-gray-500 ml-1">verified</span>
                  </div>
                  <div className="flex items-center text-red-600">
                    <HandThumbDownIcon className="w-5 h-5 mr-1" />
                    <span className="font-medium">{issue?.fakeCount ?? 0}</span>
                    <span className="text-gray-500 ml-1">reported fake</span>
                  </div>
                </div>
                
                {(issue?.verifiedCount ?? 0) >= 3 && (
                  <div className="flex items-center text-green-600">
                    <CheckBadgeSolid className="w-6 h-6 mr-1" />
                    <span className="font-medium">Community Verified</span>
                  </div>
                )}
              </div>

              {isReporter() ? (
                <p className="text-center text-gray-500 py-2">
                  You cannot verify your own issue
                </p>
              ) : !hasVerified() ? (
                <div className="flex gap-3">
                  <button
                    onClick={() => handleVerify(true)}
                    disabled={verifying || !isAuthenticated}
                    className="flex-1 btn-primary py-3 disabled:opacity-50"
                  >
                    <HandThumbUpIcon className="w-5 h-5 mr-2" />
                    Verify as Real
                  </button>
                  <button
                    onClick={() => handleVerify(false)}
                    disabled={verifying || !isAuthenticated}
                    className="flex-1 btn-secondary py-3 text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    <HandThumbDownIcon className="w-5 h-5 mr-2" />
                    Report as Fake
                  </button>
                </div>
              ) : (
                <p className="text-center text-gray-500 py-2">
                  You have already verified this issue
                </p>
              )}
              
              {!isAuthenticated && (
                <p className="text-center text-sm text-gray-500 mt-2">
                  <Link href="/login" className="text-primary-600 hover:underline">Login</Link> to verify this issue
                </p>
              )}
            </div>

            {/* Timeline */}
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <ClockIcon className="w-6 h-6 mr-2 text-primary-600" />
                Status Timeline
              </h2>
              
              <div className="space-y-4">
                {issue.timeline && issue.timeline.length > 0 ? (
                  issue.timeline.map((event: any, index: number) => (
                    <div key={index} className="flex">
                      <div className="flex flex-col items-center mr-4">
                        <div className={clsx(
                          'w-3 h-3 rounded-full',
                          index === 0 ? 'bg-primary-600' : 'bg-gray-300'
                        )}></div>
                        {index < issue.timeline.length - 1 && (
                          <div className="w-0.5 h-full bg-gray-200 mt-1"></div>
                        )}
                      </div>
                      <div className="pb-4">
                        <p className="font-medium text-gray-900">
                          {STATUS_LABELS[event.status as keyof typeof STATUS_LABELS] || event.status}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
                        </p>
                        {event.note && (
                          <p className="text-sm text-gray-600 mt-1">{event.note}</p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">No timeline updates yet</p>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Location Info */}
            <div className="card overflow-hidden">
              <div className="h-48 bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center">
                <div className="text-center">
                  <MapPinIcon className="w-12 h-12 text-primary-600 mx-auto mb-2" />
                  <p className="text-primary-700 font-medium">Issue Location</p>
                </div>
              </div>
              <div className="p-4 border-t border-gray-100">
                <p className="text-sm text-gray-600">
                  {issue?.location?.address || 'Address not available'}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {issue?.location?.coordinates ? 
                    `${issue.location.coordinates[1]?.toFixed(6) || '0'}, ${issue.location.coordinates[0]?.toFixed(6) || '0'}` 
                    : 'Coordinates not available'}
                </p>
                {issue?.location?.coordinates && (
                  <a 
                    href={`https://www.google.com/maps?q=${issue.location.coordinates[1]},${issue.location.coordinates[0]}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-sm text-primary-600 hover:text-primary-700 mt-2"
                  >
                    <MapPinIcon className="w-4 h-4 mr-1" />
                    View on Google Maps
                  </a>
                )}
              </div>
            </div>

            {/* Quick Info */}
            <div className="card p-4">
              <h3 className="font-medium text-gray-900 mb-3">Quick Info</h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-500">Issue ID</dt>
                  <dd className="text-gray-900 font-mono text-xs">
                    {issue?._id?.slice(-8).toUpperCase() || 'N/A'}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Severity Score</dt>
                  <dd className="text-gray-900">{issue?.severityScore ?? 'N/A'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Last Updated</dt>
                  <dd className="text-gray-900">
                    {issue?.updatedAt ? formatDistanceToNow(new Date(issue.updatedAt), { addSuffix: true }) : 'N/A'}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
