/**
 * IssueCard Component
 * Displays issue preview in card format for lists
 */

'use client';

import Link from 'next/link';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { 
  MapPinIcon, 
  CheckBadgeIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { Issue, CATEGORY_LABELS, SEVERITY_LABELS, STATUS_LABELS } from '@/types';
import clsx from 'clsx';

interface IssueCardProps {
  issue: Issue;
  compact?: boolean;
}

export default function IssueCard({ issue, compact = false }: IssueCardProps) {
  const timeAgo = formatDistanceToNow(new Date(issue.createdAt), { addSuffix: true });

  return (
    <Link href={`/issues/${issue._id}`}>
      <div className="card-hover group cursor-pointer h-full">
        {/* Image */}
        <div className="relative aspect-video overflow-hidden bg-gray-100">
          <img
            src={issue.imageUrl}
            alt={issue.description}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          
          {/* Severity badge */}
          <div className="absolute top-3 left-3">
            <span className={clsx(
              'badge',
              issue.severity === 'critical' && 'badge-severity-critical',
              issue.severity === 'high' && 'badge-severity-high',
              issue.severity === 'medium' && 'badge-severity-medium',
              issue.severity === 'low' && 'badge-severity-low',
            )}>
              {SEVERITY_LABELS[issue.severity]}
            </span>
          </div>
          
          {/* Status badge */}
          <div className="absolute top-3 right-3">
            <span className={clsx(
              'badge',
              `badge-status-${issue.status}`
            )}>
              {STATUS_LABELS[issue.status]}
            </span>
          </div>
          
          {/* Verified badge */}
          {issue.isAuthentic && (
            <div className="absolute bottom-3 right-3 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center">
              <CheckBadgeIcon className="w-3 h-3 mr-1" />
              Verified
            </div>
          )}
        </div>
        
        {/* Content */}
        <div className="p-4">
          {/* Category */}
          <div className="text-xs font-medium text-primary-600 uppercase tracking-wide mb-1">
            {CATEGORY_LABELS[issue.category]}
          </div>
          
          {/* Description */}
          <h3 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-primary-600 transition-colors">
            {issue.description}
          </h3>
          
          {!compact && (
            <>
              {/* Location */}
              {issue.address && (
                <div className="flex items-center text-sm text-gray-500 mt-2">
                  <MapPinIcon className="w-4 h-4 mr-1 flex-shrink-0" />
                  <span className="truncate">{issue.address}</span>
                </div>
              )}
              
              {/* Footer */}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center text-sm text-gray-500">
                  <ClockIcon className="w-4 h-4 mr-1" />
                  {timeAgo}
                </div>
                
                <div className="flex items-center space-x-3 text-sm">
                  {/* Verifications */}
                  <div className="flex items-center text-gray-500">
                    <CheckBadgeIcon className="w-4 h-4 mr-1" />
                    {issue.verifications}
                  </div>
                  
                  {/* AI Confidence */}
                  {issue.aiConfidence > 0 && (
                    <div className="text-gray-500">
                      AI: {issue.aiConfidence}%
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}
