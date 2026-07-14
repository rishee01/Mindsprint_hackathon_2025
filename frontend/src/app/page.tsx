/**
 * Home Page
 * Landing page with hero section, stats, and recent issues
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  MapPinIcon, 
  CameraIcon, 
  CheckBadgeIcon,
  ChartBarIcon,
  ArrowRightIcon,
  ShieldCheckIcon,
  ClockIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import { statsAPI, issuesAPI } from '@/lib/api';
import { useIsAuthenticated } from '@/store/authStore';
import IssueCard from '@/components/IssueCard';
import { Issue, StatsOverview } from '@/types';

export default function HomePage() {
  const [stats, setStats] = useState<StatsOverview | null>(null);
  const [recentIssues, setRecentIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const isAuthenticated = useIsAuthenticated();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, issuesRes] = await Promise.all([
          statsAPI.getOverview(),
          issuesAPI.getAll({ limit: 6, sortBy: 'createdAt', sortOrder: 'desc' })
        ]);
        
        if (statsRes.data.success) {
          setStats(statsRes.data.data);
        }
        
        if (issuesRes.data.success) {
          setRecentIssues(issuesRes.data.data.issues);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const features = [
    {
      icon: CameraIcon,
      title: 'Easy Reporting',
      description: 'Snap a photo, add location, and submit. Our AI handles the rest.',
    },
    {
      icon: ShieldCheckIcon,
      title: 'AI Classification',
      description: 'Automatic issue detection and categorization with high accuracy.',
    },
    {
      icon: CheckBadgeIcon,
      title: 'Community Verification',
      description: 'Issues are verified by community members to prevent spam.',
    },
    {
      icon: ChartBarIcon,
      title: 'Real-time Tracking',
      description: 'Track your reported issues from submission to resolution.',
    },
    {
      icon: ClockIcon,
      title: 'Fast Resolution',
      description: 'Auto-routing ensures issues reach the right department quickly.',
    },
    {
      icon: UserGroupIcon,
      title: 'Transparent Process',
      description: 'View status updates and resolution timelines publicly.',
    },
  ];

  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center px-4 py-2 bg-white/10 rounded-full text-sm font-medium backdrop-blur-sm">
                <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
                AI-Powered Civic Platform
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
                Report Issues.
                <br />
                <span className="text-primary-200">Transform Your City.</span>
              </h1>
              
              <p className="text-lg sm:text-xl text-primary-100 max-w-lg">
                CivicSense uses AI to classify and route civic issues automatically. 
                Join thousands making their cities responsive, transparent, and safe.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link 
                  href="/report" 
                  className="btn-primary bg-white text-primary-700 hover:bg-primary-50 px-8 py-3 text-lg"
                >
                  <CameraIcon className="w-5 h-5 mr-2" />
                  Report an Issue
                </Link>
                <Link 
                  href="/issues" 
                  className="btn-outline border-white text-white hover:bg-white/10 px-8 py-3 text-lg"
                >
                  <MapPinIcon className="w-5 h-5 mr-2" />
                  View Issues Map
                </Link>
              </div>
            </div>
            
            <div className="hidden lg:block relative group animate-float">
              {/* Main Image Container with animations */}
              <div className="relative z-10 rounded-3xl shadow-2xl overflow-hidden transform transition-all duration-500 ease-out group-hover:scale-105 group-hover:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] animate-glow">
                {/* Animated border gradient */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary-400 via-white to-primary-400 opacity-50 animate-pulse"></div>
                <div className="relative m-1 rounded-3xl overflow-hidden">
                  <Image
                    src="/hero-image.jpg"
                    alt="Civic Issues - Report & Repair"
                    width={700}
                    height={470}
                    className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-110"
                    priority
                  />
                  {/* Overlay gradient on hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  
                  {/* Floating badge */}
                  <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-500">
                    <div className="bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-lg">
                      <div className="flex items-center justify-between">
                        <span className="badge badge-severity-high animate-pulse">Multiple Issues Detected</span>
                        <span className="text-sm text-gray-600 font-medium">AI Powered</span>
                      </div>
                      <p className="text-gray-700 text-sm mt-2">Pothole • Garbage • Air Pollution • Water Leakage</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Animated decorative elements */}
              <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full opacity-60 blur-3xl animate-pulse"></div>
              <div className="absolute -top-8 -right-8 w-32 h-32 bg-gradient-to-br from-primary-300 to-primary-500 rounded-full opacity-60 blur-2xl animate-bounce" style={{ animationDuration: '3s' }}></div>
              <div className="absolute top-1/2 -right-4 w-20 h-20 bg-white/20 rounded-full blur-xl animate-ping" style={{ animationDuration: '2s' }}></div>
              
              {/* Floating icons */}
              <div className="absolute -top-4 left-10 bg-white rounded-full p-3 shadow-lg animate-bounce" style={{ animationDuration: '2s', animationDelay: '0.5s' }}>
                <CameraIcon className="w-6 h-6 text-primary-600" />
              </div>
              <div className="absolute -bottom-4 right-10 bg-white rounded-full p-3 shadow-lg animate-bounce" style={{ animationDuration: '2.5s', animationDelay: '1s' }}>
                <CheckBadgeIcon className="w-6 h-6 text-green-500" />
              </div>
            </div>
          </div>
        </div>
        
        {/* Wave decoration */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="#F9FAFB"/>
          </svg>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="card p-6 text-center">
              <div className="text-3xl font-bold text-primary-600">
                {loading ? '...' : stats?.total || 0}
              </div>
              <div className="text-gray-600 mt-1">Issues Reported</div>
            </div>
            <div className="card p-6 text-center">
              <div className="text-3xl font-bold text-green-600">
                {loading ? '...' : stats?.resolved || 0}
              </div>
              <div className="text-gray-600 mt-1">Issues Resolved</div>
            </div>
            <div className="card p-6 text-center">
              <div className="text-3xl font-bold text-amber-600">
                {loading ? '...' : `${stats?.resolutionRate || 0}%`}
              </div>
              <div className="text-gray-600 mt-1">Resolution Rate</div>
            </div>
            <div className="card p-6 text-center">
              <div className="text-3xl font-bold text-purple-600">
                {loading ? '...' : stats?.userCount || 0}
              </div>
              <div className="text-gray-600 mt-1">Active Citizens</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              How CivicSense Works
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Our AI-powered platform makes reporting and tracking civic issues effortless
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="card-hover p-6 group"
              >
                <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary-600 transition-colors">
                  <feature.icon className="w-6 h-6 text-primary-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Issues Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Recent Issues
            </h2>
            <Link 
              href="/issues" 
              className="text-primary-600 hover:text-primary-700 font-medium flex items-center"
            >
              View All
              <ArrowRightIcon className="w-4 h-4 ml-1" />
            </Link>
          </div>
          
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
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentIssues.map((issue) => (
                <IssueCard key={issue._id} issue={issue} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Ready to Make a Difference?
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Join our community of active citizens and help make your city a better place.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isAuthenticated ? (
              <Link 
                href="/report" 
                className="btn bg-white text-primary-700 hover:bg-primary-50 px-8 py-3 text-lg"
              >
                Report an Issue Now
              </Link>
            ) : (
              <>
                <Link 
                  href="/register" 
                  className="btn bg-white text-primary-700 hover:bg-primary-50 px-8 py-3 text-lg"
                >
                  Create Account
                </Link>
                <Link 
                  href="/login" 
                  className="btn border-2 border-white text-white hover:bg-white/10 px-8 py-3 text-lg"
                >
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
