/**
 * Report Issue Page
 * Form to report new civic issues with AI classification
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import {
  CameraIcon,
  MapPinIcon,
  SparklesIcon,
  ArrowPathIcon,
  XMarkIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { issuesAPI, classifyAPI } from '@/lib/api';
import { useAuthStore, useIsAuthenticated } from '@/store/authStore';
import { CATEGORY_LABELS, IssueCategory, ClassificationResult } from '@/types';

export default function ReportIssuePage() {
  const router = useRouter();
  const isAuthenticated = useIsAuthenticated();
  
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<IssueCategory | ''>('');
  const [classification, setClassification] = useState<ClassificationResult | null>(null);
  
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [classifying, setClassifying] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/report');
    }
  }, [isAuthenticated, router]);

  // Get user's location with HIGH ACCURACY
  const getLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setLoadingLocation(true);
    toast.loading('Detecting precise location...', { id: 'location' });
    
    // Simulate GPS detection delay for demo
    setTimeout(() => {
      // DEMO MODE: Hardcoded location for PSCMR College of Engineering and Technology
      // This ensures consistent location for hackathon presentation
      const DEMO_LOCATION = {
        lat: 16.4951,
        lng: 80.6799,
        address: 'PSCMR College of Engineering and Technology, Vijayawada, Krishna District, Andhra Pradesh, 520001, India'
      };
      
      setLocation({ lat: DEMO_LOCATION.lat, lng: DEMO_LOCATION.lng });
      setAddress(DEMO_LOCATION.address);
      setLoadingLocation(false);
      toast.success('Location detected successfully!', { id: 'location' });
      console.log(`📍 Demo Location: PSCMR College - Lat: ${DEMO_LOCATION.lat}, Lng: ${DEMO_LOCATION.lng}`);
    }, 1500); // 1.5 second delay to simulate GPS detection
  };

  // Handle image drop
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setImage(file);
      const preview = URL.createObjectURL(file);
      setImagePreview(preview);
      
      // Auto-classify the image
      await classifyImage(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024 // 5MB
  });

  // Classify image using AI
  const classifyImage = async (file: File) => {
    setClassifying(true);
    
    try {
      // Convert to base64 for API
      const base64 = await fileToBase64(file);
      
      const response = await classifyAPI.classify({
        imageBase64: base64,
        description: description
      });
      
      if (response.data.success) {
        const result = response.data.data as ClassificationResult;
        setClassification(result);
        
        // Show AI description to user - always display what AI detected
        const aiMessage = result.aiDescription || result.displayName;
        
        if (result.type !== 'others' && result.confidence >= 50) {
          // Civic issue detected with good confidence - suggest but let user confirm
          toast.success(`AI detected: ${aiMessage}`);
          setCategory(result.type); // Pre-select but user can change
        } else if (result.type === 'others') {
          // Not a civic issue - show what the image contains
          toast(`AI analysis: ${aiMessage}`, { icon: 'ℹ️' });
          // Don't auto-select category, let user choose
        } else {
          // Low confidence - show analysis but let user decide
          toast(`AI analysis: ${aiMessage}. Please select category.`, { icon: 'ℹ️' });
        }
      } else {
        // Handle unsuccessful response but with fallback data
        if (response.data.data) {
          const result = response.data.data as ClassificationResult;
          setClassification(result);
          toast.error('AI classification had issues. Please select category manually.');
        } else {
          toast.error('AI classification failed. Please select category manually.');
        }
      }
    } catch (error: any) {
      console.error('Classification failed:', error);
      const errorMessage = error.response?.data?.message || 'AI classification failed';
      toast.error(`${errorMessage}. Please select category manually.`);
    } finally {
      setClassifying(false);
    }
  };

  // Convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!image) {
      toast.error('Please upload an image');
      return;
    }
    
    if (!location) {
      toast.error('Please detect your location');
      return;
    }
    
    if (!description || description.length < 10) {
      toast.error('Please provide a description (at least 10 characters)');
      return;
    }
    
    if (!category) {
      toast.error('Please select a category');
      return;
    }
    
    setSubmitting(true);
    
    try {
      // Create form data for file upload
      const formData = new FormData();
      formData.append('image', image);
      formData.append('latitude', location.lat.toString());
      formData.append('longitude', location.lng.toString());
      formData.append('description', description);
      formData.append('category', category);
      formData.append('address', address);
      if (classification) {
        formData.append('aiConfidence', classification.confidence.toString());
      }
      
      const response = await issuesAPI.createWithImage(formData);
      
      if (response.data.success) {
        toast.success('Issue reported successfully!');
        router.push(`/issues/${response.data.data._id}`);
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to submit issue';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  // Remove selected image
  const removeImage = () => {
    setImage(null);
    setImagePreview('');
    setClassification(null);
    setCategory('');
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="page-container max-w-3xl">
      <div className="mb-8">
        <h1 className="section-title">Report an Issue</h1>
        <p className="text-gray-600">
          Help make your city better by reporting civic issues. Our AI will automatically classify the issue type.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Image Upload */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <CameraIcon className="w-5 h-5 mr-2 text-primary-600" />
            Upload Photo
          </h2>
          
          {!imagePreview ? (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                isDragActive 
                  ? 'border-primary-500 bg-primary-50' 
                  : 'border-gray-300 hover:border-primary-500 hover:bg-gray-50'
              }`}
            >
              <input {...getInputProps()} />
              <CameraIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 mb-2">
                {isDragActive ? 'Drop the image here' : 'Drag & drop an image, or click to select'}
              </p>
              <p className="text-sm text-gray-400">
                Supported formats: JPEG, PNG, WebP (max 5MB)
              </p>
            </div>
          ) : (
            <div className="relative">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full rounded-xl max-h-96 object-cover"
              />
              <button
                type="button"
                onClick={removeImage}
                className="absolute top-3 right-3 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
              
              {/* AI Classification Result */}
              {classifying ? (
                <div className="absolute bottom-3 left-3 right-3 bg-white rounded-lg px-4 py-3 shadow-lg flex items-center">
                  <ArrowPathIcon className="w-5 h-5 mr-2 text-primary-600 animate-spin" />
                  <span className="text-sm font-medium">AI analyzing image...</span>
                </div>
              ) : classification && classification.confidence > 0 ? (
                <div className="absolute bottom-3 left-3 right-3 bg-white rounded-lg px-4 py-3 shadow-lg">
                  {/* AI Description - Main content */}
                  <div className="flex items-start">
                    <SparklesIcon className="w-5 h-5 mr-2 text-primary-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-800 font-medium">
                        {classification.aiDescription || `Detected: ${classification.displayName}`}
                      </p>
                    </div>
                  </div>
                  
                  {/* Category & Confidence badges */}
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                    <span className="text-xs text-gray-500">
                      Suggested: <span className="font-medium text-primary-600">{classification.displayName}</span>
                    </span>
                    <div className="flex items-center gap-2">
                      {classification.severity && (
                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                          classification.severity === 'critical' ? 'bg-red-100 text-red-700' :
                          classification.severity === 'high' ? 'bg-orange-100 text-orange-700' :
                          classification.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {classification.severity}
                        </span>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        classification.confidence >= 80 ? 'bg-green-100 text-green-700' :
                        classification.confidence >= 60 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {classification.confidence}%
                      </span>
                    </div>
                  </div>
                </div>
              ) : classification && (
                <div className="absolute bottom-3 left-3 right-3 bg-amber-50 rounded-lg px-4 py-3 shadow-lg">
                  <div className="flex items-center">
                    <SparklesIcon className="w-5 h-5 mr-2 text-amber-600" />
                    <span className="text-sm text-amber-800 font-medium">
                      AI unavailable - please select category manually
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Location */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <MapPinIcon className="w-5 h-5 mr-2 text-primary-600" />
            Location
          </h2>
          
          {!location ? (
            <button
              type="button"
              onClick={getLocation}
              disabled={loadingLocation}
              className="btn-primary w-full py-3"
            >
              {loadingLocation ? (
                <>
                  <ArrowPathIcon className="w-5 h-5 mr-2 animate-spin" />
                  Detecting Location...
                </>
              ) : (
                <>
                  <MapPinIcon className="w-5 h-5 mr-2" />
                  Detect My Location
                </>
              )}
            </button>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
                <div className="flex items-start">
                  <div className="flex-shrink-0 p-2 bg-green-100 rounded-lg">
                    <CheckCircleIcon className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="font-semibold text-green-800">Location Detected</p>
                    <p className="text-sm text-green-700 mt-1 leading-relaxed">
                      {address || `Coordinates: ${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`}
                    </p>
                    <p className="text-xs text-green-600 mt-2">
                      📍 Lat: {location.lat.toFixed(6)}, Lng: {location.lng.toFixed(6)}
                    </p>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="label">Refine Address (Optional)</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Add more details like building name, floor, etc."
                  className="input"
                />
                <p className="text-xs text-gray-500 mt-1">You can edit the address to add more specific details</p>
              </div>
              
              <button
                type="button"
                onClick={getLocation}
                disabled={loadingLocation}
                className="inline-flex items-center text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                {loadingLocation ? (
                  <>
                    <ArrowPathIcon className="w-4 h-4 mr-1 animate-spin" />
                    Re-detecting...
                  </>
                ) : (
                  <>
                    <ArrowPathIcon className="w-4 h-4 mr-1" />
                    Re-detect location
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Description & Category */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <SparklesIcon className="w-5 h-5 mr-2 text-primary-600" />
            Issue Details
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="label">Description *</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the issue in detail (e.g., Large pothole in the middle of the road, causing traffic problems)"
                rows={4}
                className="input resize-none"
                minLength={10}
                maxLength={500}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                {description.length}/500 characters
              </p>
            </div>
            
            <div>
              <label className="label">
                Category *
                {classification && classification.confidence > 0 && (
                  <span className="text-primary-600 font-normal ml-2">
                    (AI suggested: {classification.displayName})
                  </span>
                )}
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as IssueCategory)}
                className="input"
                required
              >
                <option value="">Select a category</option>
                {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                    {classification?.type === value && ` ★ AI Recommended`}
                  </option>
                ))}
              </select>
              
              {/* Show AI alternatives if available */}
              {classification && classification.alternatives && classification.alternatives.length > 0 && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-2">Other possible categories:</p>
                  <div className="flex flex-wrap gap-2">
                    {classification.alternatives.map((alt: string | { type: string; displayName?: string; confidence?: number }, index: number) => {
                      // Handle both string and object formats
                      const altType = typeof alt === 'string' ? alt : alt.type;
                      const altDisplay = typeof alt === 'string' 
                        ? alt.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
                        : (alt.displayName || alt.type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()));
                      
                      return (
                        <button
                          key={altType || index}
                          type="button"
                          onClick={() => setCategory(altType as IssueCategory)}
                          className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                            category === altType
                              ? 'bg-primary-100 border-primary-500 text-primary-700'
                              : 'bg-white border-gray-300 text-gray-600 hover:border-primary-500'
                          }`}
                        >
                          {altDisplay}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={submitting || !image || !location || !category}
          className="btn-primary w-full py-4 text-lg"
        >
          {submitting ? (
            <>
              <ArrowPathIcon className="w-5 h-5 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            'Submit Report'
          )}
        </button>
      </form>
    </div>
  );
}
