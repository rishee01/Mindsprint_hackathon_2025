/**
 * TypeScript Type Definitions
 * Shared types used across the application
 */

// ===================
// Issue Types
// ===================
export type IssueCategory = 
  | 'pothole' 
  | 'garbage' 
  | 'water_leakage' 
  | 'streetlight' 
  | 'drainage' 
  | 'road_damage' 
  | 'illegal_parking' 
  | 'noise' 
  | 'air_pollution' 
  | 'others';

export type IssueSeverity = 'low' | 'medium' | 'high' | 'critical';

export type IssueStatus = 
  | 'pending' 
  | 'verified' 
  | 'under_review' 
  | 'in_progress' 
  | 'resolved' 
  | 'rejected' 
  | 'duplicate';

export type Department = 'roads' | 'sanitation' | 'water' | 'electricity' | 'general';

// Timeline entry type
export interface TimelineEntry {
  status: string;
  timestamp: string;
  updatedBy?: {
    _id: string;
    name: string;
  };
  note?: string;
}

// Comment type
export interface Comment {
  _id: string;
  user: {
    _id: string;
    name: string;
    avatar?: string;
  };
  text: string;
  createdAt: string;
}

// Resolution type
export interface Resolution {
  resolvedAt?: string;
  resolvedBy?: {
    _id: string;
    name: string;
  };
  proofImage?: string;
  notes?: string;
}

// Main Issue type
export interface Issue {
  _id: string;
  id: string;
  imageUrl: string;
  additionalImages?: string[];
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
    address?: string;
  };
  address?: string;
  description: string;
  category: IssueCategory;
  aiClassification?: {
    category: IssueCategory;
    confidence: number;
  };
  aiConfidence: number;
  severity: IssueSeverity;
  severityScore: number;
  status: IssueStatus;
  verifications: number;
  verifiedCount: number;
  fakeCount: number;
  verifiedBy: string[];
  isAuthentic: boolean;
  department: Department;
  assignedDepartment: Department;
  assignedTo?: {
    _id: string;
    name: string;
    avatar?: string;
    department?: string;
  };
  reportedBy: {
    _id: string;
    name: string;
    avatar?: string;
    trustScore?: number;
  };
  resolution?: Resolution;
  timeline: TimelineEntry[];
  predictedResolutionTime?: number;
  priorityBoost: number;
  tags?: string[];
  comments?: Comment[];
  createdAt: string;
  updatedAt: string;
}

// Map marker type
export interface MapMarker {
  id: string;
  latitude: number;
  longitude: number;
  category: IssueCategory;
  severity: IssueSeverity;
  status: IssueStatus;
  verifications: number;
  imageUrl: string;
  description?: string;
}

// Heatmap point type
export interface HeatmapPoint {
  latitude: number;
  longitude: number;
  weight: number;
}

// ===================
// Statistics Types
// ===================
export interface StatsOverview {
  total: number;
  resolved: number;
  pending: number;
  inProgress: number;
  resolutionRate: number;
  userCount: number; // Active citizens who contributed
  activeCitizens: number; // Same as userCount (explicit)
  totalUsers: number; // All registered users
  byStatus: Record<string, number>;
  byCategory: Record<string, number>;
  bySeverity: Record<string, number>;
  byDepartment: Record<string, number>;
}

export interface DailyStats {
  _id: string; // date string
  reported: number;
  resolved: number;
}

export interface DepartmentStats {
  department: Department;
  total: number;
  pending: number;
  inProgress: number;
  resolved: number;
  avgSeverity: number;
  resolutionRate: number;
}

// ===================
// Classification Types
// ===================
export interface ClassificationResult {
  type: IssueCategory;
  confidence: number;
  displayName: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  aiDescription?: string;
  alternatives: Array<{
    type: IssueCategory;
    confidence: number;
    displayName?: string;
  }>;
  analysisTime: number;
  modelVersion: string;
  analysis: {
    primaryCategory?: string;
    description?: string;
    severityLevel?: string;
    confidenceLevel?: string;
    objectsDetected?: string[];
    imageQuality?: number;
    locationRelevance?: number;
  };
}

// ===================
// Pagination Types
// ===================
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: Pagination;
}

// ===================
// API Response Types
// ===================
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  error?: string;
}

// ===================
// Form Types
// ===================
export interface ReportIssueForm {
  image: File | null;
  imageUrl?: string;
  latitude: number;
  longitude: number;
  address: string;
  description: string;
  category: IssueCategory | '';
}

// ===================
// Constants
// ===================
export const CATEGORY_LABELS: Record<IssueCategory, string> = {
  pothole: 'Pothole',
  garbage: 'Garbage',
  water_leakage: 'Water Leakage',
  streetlight: 'Streetlight',
  drainage: 'Drainage',
  road_damage: 'Road Damage',
  illegal_parking: 'Illegal Parking',
  noise: 'Noise',
  air_pollution: 'Air Pollution',
  others: 'Others',
};

export const STATUS_LABELS: Record<IssueStatus, string> = {
  pending: 'Pending',
  verified: 'Verified',
  under_review: 'Under Review',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  rejected: 'Rejected',
  duplicate: 'Duplicate',
};

export const SEVERITY_LABELS: Record<IssueSeverity, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
};

export const DEPARTMENT_LABELS: Record<Department, string> = {
  roads: 'Roads Department',
  sanitation: 'Sanitation Department',
  water: 'Water Department',
  electricity: 'Electricity Department',
  general: 'General Administration',
};

export const SEVERITY_COLORS: Record<IssueSeverity, string> = {
  low: '#16A34A',
  medium: '#CA8A04',
  high: '#EA580C',
  critical: '#DC2626',
};

export const STATUS_COLORS: Record<IssueStatus, string> = {
  pending: '#6B7280',
  verified: '#3B82F6',
  under_review: '#8B5CF6',
  in_progress: '#F59E0B',
  resolved: '#10B981',
  rejected: '#EF4444',
  duplicate: '#9CA3AF',
};
