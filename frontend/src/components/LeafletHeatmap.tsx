/**
 * Leaflet Heatmap Component
 * 
 * Features:
 * - Visualizes all reported civic issues on a map with OpenStreetMap
 * - Displays heatmap showing high-density issue areas
 * - Shows severity-based colored markers (Red=High, Orange=Medium, Green=Low)
 * - Popup with issue details on marker click
 * - Automatic map initialization and cleanup
 */

'use client';

import { useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Types
export interface MapIssue {
  _id: string;
  latitude: number;
  longitude: number;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: string;
  description?: string;
  imageUrl?: string;
}

interface LeafletHeatmapProps {
  issues: MapIssue[];
  center?: [number, number]; // [latitude, longitude]
  zoom?: number;
  showHeatmap?: boolean;
  showMarkers?: boolean;
  height?: string;
  onMarkerClick?: (issue: MapIssue) => void;
}

// Severity color mapping
const SEVERITY_COLORS: Record<string, string> = {
  critical: '#DC2626', // Red-600
  high: '#EF4444',     // Red-500
  medium: '#F97316',   // Orange-500
  low: '#22C55E',      // Green-500
};

// Severity weights for heatmap intensity
const SEVERITY_WEIGHTS: Record<string, number> = {
  critical: 1.0,
  high: 0.75,
  medium: 0.5,
  low: 0.25,
};

// Category labels for display
const CATEGORY_LABELS: Record<string, string> = {
  pothole: 'Pothole',
  garbage: 'Garbage/Waste',
  water_leakage: 'Water Leakage',
  streetlight: 'Streetlight Issue',
  drainage: 'Drainage Problem',
  road_damage: 'Road Damage',
  illegal_parking: 'Illegal Parking',
  noise: 'Noise Pollution',
  air_pollution: 'Air Pollution',
  others: 'Other Issue',
};

// Status labels with colors
const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pending', color: '#F59E0B' },
  verified: { label: 'Verified', color: '#3B82F6' },
  under_review: { label: 'Under Review', color: '#8B5CF6' },
  in_progress: { label: 'In Progress', color: '#06B6D4' },
  resolved: { label: 'Resolved', color: '#10B981' },
  rejected: { label: 'Rejected', color: '#EF4444' },
  duplicate: { label: 'Duplicate', color: '#6B7280' },
};

// Simple heatmap implementation using canvas overlay
class HeatmapLayer extends L.Layer {
  private _canvas: HTMLCanvasElement | null = null;
  private _ctx: CanvasRenderingContext2D | null = null;
  private _data: { lat: number; lng: number; weight: number }[] = [];
  private _leafletMap: L.Map | null = null;

  constructor(data: { lat: number; lng: number; weight: number }[]) {
    super();
    this._data = data;
  }

  onAdd(map: L.Map): this {
    this._leafletMap = map;
    
    // Create canvas element
    this._canvas = L.DomUtil.create('canvas', 'leaflet-heatmap-layer') as HTMLCanvasElement;
    this._ctx = this._canvas.getContext('2d');
    
    const size = map.getSize();
    this._canvas.width = size.x;
    this._canvas.height = size.y;
    this._canvas.style.position = 'absolute';
    this._canvas.style.top = '0';
    this._canvas.style.left = '0';
    this._canvas.style.pointerEvents = 'none';
    this._canvas.style.opacity = '0.6';
    
    map.getPanes().overlayPane?.appendChild(this._canvas);
    
    map.on('moveend', this._redraw, this);
    map.on('zoomend', this._redraw, this);
    map.on('resize', this._resize, this);
    
    this._redraw();
    
    return this;
  }

  onRemove(map: L.Map): this {
    if (this._canvas && this._canvas.parentNode) {
      this._canvas.parentNode.removeChild(this._canvas);
    }
    
    map.off('moveend', this._redraw, this);
    map.off('zoomend', this._redraw, this);
    map.off('resize', this._resize, this);
    
    this._canvas = null;
    this._ctx = null;
    this._leafletMap = null;
    
    return this;
  }

  private _resize(): void {
    if (!this._leafletMap || !this._canvas) return;
    
    const size = this._leafletMap.getSize();
    this._canvas.width = size.x;
    this._canvas.height = size.y;
    this._redraw();
  }

  private _redraw(): void {
    if (!this._leafletMap || !this._canvas || !this._ctx) return;
    
    const ctx = this._ctx;
    const canvas = this._canvas;
    const map = this._leafletMap;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Update canvas position
    const topLeft = map.containerPointToLayerPoint([0, 0]);
    L.DomUtil.setPosition(canvas, topLeft);
    
    // Calculate radius based on zoom
    const zoom = map.getZoom();
    const baseRadius = Math.max(20, 40 - zoom * 2);
    
    // Draw heatmap points
    this._data.forEach(point => {
      const latLng = L.latLng(point.lat, point.lng);
      const pixelPoint = map.latLngToContainerPoint(latLng);
      
      // Skip points outside visible area (with padding)
      if (pixelPoint.x < -baseRadius || pixelPoint.x > canvas.width + baseRadius ||
          pixelPoint.y < -baseRadius || pixelPoint.y > canvas.height + baseRadius) {
        return;
      }
      
      const radius = baseRadius * (0.5 + point.weight * 0.5);
      
      // Create radial gradient
      const gradient = ctx.createRadialGradient(
        pixelPoint.x, pixelPoint.y, 0,
        pixelPoint.x, pixelPoint.y, radius
      );
      
      // Color based on weight (severity)
      const intensity = point.weight;
      if (intensity >= 0.75) {
        gradient.addColorStop(0, 'rgba(220, 38, 38, 0.8)');  // Red
        gradient.addColorStop(0.5, 'rgba(239, 68, 68, 0.4)');
        gradient.addColorStop(1, 'rgba(239, 68, 68, 0)');
      } else if (intensity >= 0.5) {
        gradient.addColorStop(0, 'rgba(249, 115, 22, 0.7)'); // Orange
        gradient.addColorStop(0.5, 'rgba(251, 146, 60, 0.35)');
        gradient.addColorStop(1, 'rgba(251, 146, 60, 0)');
      } else {
        gradient.addColorStop(0, 'rgba(234, 179, 8, 0.6)');  // Yellow
        gradient.addColorStop(0.5, 'rgba(250, 204, 21, 0.3)');
        gradient.addColorStop(1, 'rgba(250, 204, 21, 0)');
      }
      
      ctx.beginPath();
      ctx.arc(pixelPoint.x, pixelPoint.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
    });
  }

  setData(data: { lat: number; lng: number; weight: number }[]): void {
    this._data = data;
    this._redraw();
  }
}

export default function LeafletHeatmap({
  issues,
  center = [28.6139, 77.2090], // Default: New Delhi
  zoom = 12,
  showHeatmap = true,
  showMarkers = true,
  height = '600px',
  onMarkerClick,
}: LeafletHeatmapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const heatmapLayerRef = useRef<HeatmapLayer | null>(null);

  // Create custom marker icon based on severity
  const createMarkerIcon = useCallback((severity: string): L.DivIcon => {
    const color = SEVERITY_COLORS[severity] || SEVERITY_COLORS.low;
    
    return L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="
          width: 24px;
          height: 24px;
          background-color: ${color};
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          cursor: pointer;
          transition: transform 0.2s ease;
        "></div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
      popupAnchor: [0, -12],
    });
  }, []);

  // Create popup content for an issue
  const createPopupContent = useCallback((issue: MapIssue): string => {
    const categoryLabel = CATEGORY_LABELS[issue.category] || issue.category;
    const severityColor = SEVERITY_COLORS[issue.severity] || '#6B7280';
    const statusConfig = STATUS_CONFIG[issue.status] || { label: issue.status, color: '#6B7280' };
    
    return `
      <div style="min-width: 220px; font-family: system-ui, -apple-system, sans-serif;">
        <div style="margin-bottom: 12px;">
          <span style="
            display: inline-block;
            background-color: ${severityColor}20;
            color: ${severityColor};
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
          ">${issue.severity}</span>
        </div>
        
        <div style="margin-bottom: 8px;">
          <div style="font-size: 11px; color: #6B7280; margin-bottom: 2px;">Category</div>
          <div style="font-weight: 600; color: #1F2937;">${categoryLabel}</div>
        </div>
        
        ${issue.description ? `
          <div style="margin-bottom: 8px;">
            <div style="font-size: 11px; color: #6B7280; margin-bottom: 2px;">Description</div>
            <div style="color: #374151; font-size: 13px; line-height: 1.4;">
              ${issue.description.length > 100 ? issue.description.substring(0, 100) + '...' : issue.description}
            </div>
          </div>
        ` : ''}
        
        <div style="
          display: flex;
          align-items: center;
          padding-top: 8px;
          border-top: 1px solid #E5E7EB;
        ">
          <span style="
            display: inline-flex;
            align-items: center;
            background-color: ${statusConfig.color}15;
            color: ${statusConfig.color};
            padding: 4px 10px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 500;
          ">
            <span style="
              width: 6px;
              height: 6px;
              background-color: ${statusConfig.color};
              border-radius: 50%;
              margin-right: 6px;
            "></span>
            ${statusConfig.label}
          </span>
        </div>
      </div>
    `;
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Create map instance
    const map = L.map(mapContainerRef.current, {
      center: center,
      zoom: zoom,
      zoomControl: true,
      scrollWheelZoom: true,
    });

    // Add OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    // Add zoom control to top-right
    map.zoomControl.setPosition('topright');

    // Create markers layer group
    markersLayerRef.current = L.layerGroup().addTo(map);

    mapRef.current = map;

    // Cleanup on unmount
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      markersLayerRef.current = null;
      heatmapLayerRef.current = null;
    };
  }, []);

  // Update markers and heatmap when issues change
  useEffect(() => {
    if (!mapRef.current || !markersLayerRef.current) return;

    const map = mapRef.current;

    // Clear existing markers
    markersLayerRef.current.clearLayers();

    // Remove existing heatmap layer
    if (heatmapLayerRef.current) {
      map.removeLayer(heatmapLayerRef.current);
      heatmapLayerRef.current = null;
    }

    if (!issues || issues.length === 0) return;

    // Add heatmap layer if enabled
    if (showHeatmap) {
      const heatmapData = issues.map(issue => ({
        lat: issue.latitude,
        lng: issue.longitude,
        weight: SEVERITY_WEIGHTS[issue.severity] || 0.25,
      }));

      heatmapLayerRef.current = new HeatmapLayer(heatmapData);
      map.addLayer(heatmapLayerRef.current);
    }

    // Add markers if enabled
    if (showMarkers) {
      issues.forEach(issue => {
        const marker = L.marker([issue.latitude, issue.longitude], {
          icon: createMarkerIcon(issue.severity),
        });

        // Bind popup with issue details
        marker.bindPopup(createPopupContent(issue), {
          maxWidth: 300,
          className: 'custom-popup',
        });

        // Add click handler if provided
        if (onMarkerClick) {
          marker.on('click', () => {
            onMarkerClick(issue);
          });
        }

        // Add hover effects
        marker.on('mouseover', function(this: L.Marker) {
          const icon = this.getElement();
          if (icon) {
            const innerDiv = icon.querySelector('div');
            if (innerDiv) {
              innerDiv.style.transform = 'scale(1.2)';
            }
          }
        });

        marker.on('mouseout', function(this: L.Marker) {
          const icon = this.getElement();
          if (icon) {
            const innerDiv = icon.querySelector('div');
            if (innerDiv) {
              innerDiv.style.transform = 'scale(1)';
            }
          }
        });

        markersLayerRef.current?.addLayer(marker);
      });
    }

    // Fit map to show all markers
    if (issues.length > 0) {
      const bounds = L.latLngBounds(
        issues.map(issue => [issue.latitude, issue.longitude] as [number, number])
      );
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [issues, showHeatmap, showMarkers, createMarkerIcon, createPopupContent, onMarkerClick]);

  // Update center when prop changes
  useEffect(() => {
    if (mapRef.current && center) {
      mapRef.current.setView(center, zoom);
    }
  }, [center, zoom]);

  return (
    <div 
      ref={mapContainerRef} 
      style={{ 
        height, 
        width: '100%',
        borderRadius: '8px',
        overflow: 'hidden',
      }}
      className="leaflet-container-wrapper"
    />
  );
}
