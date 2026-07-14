/**
 * Issue Model - MongoDB Schema
 * Core model for civic issues reported by users
 */

const mongoose = require('mongoose');

// Timeline entry sub-schema for tracking issue history
const timelineEntrySchema = new mongoose.Schema({
  status: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  note: {
    type: String,
    default: ''
  }
}, { _id: false });

// Main Issue Schema
const issueSchema = new mongoose.Schema({
  // Image URL from Cloudinary
  imageUrl: {
    type: String,
    required: [true, 'Issue image is required']
  },
  
  // Additional images (optional)
  additionalImages: [{
    type: String
  }],
  
  // Geolocation
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: [true, 'Location coordinates are required'],
      validate: {
        validator: function(v) {
          return v.length === 2 && 
                 v[0] >= -180 && v[0] <= 180 && // longitude
                 v[1] >= -90 && v[1] <= 90;     // latitude
        },
        message: 'Invalid coordinates'
      }
    }
  },
  
  // Human-readable address
  address: {
    type: String,
    default: ''
  },
  
  // User description of the issue
  description: {
    type: String,
    required: [true, 'Description is required'],
    minlength: [10, 'Description must be at least 10 characters'],
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  
  // AI-detected category
  category: {
    type: String,
    enum: ['pothole', 'garbage', 'water_leakage', 'streetlight', 'drainage', 'road_damage', 'illegal_parking', 'noise', 'air_pollution', 'others'],
    required: true
  },
  
  // AI confidence score (0-100)
  aiConfidence: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  
  // Severity level (calculated based on rules)
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    required: true
  },
  
  // Severity score (1-10) for sorting
  severityScore: {
    type: Number,
    min: 1,
    max: 10,
    default: 5
  },
  
  // Current status
  status: {
    type: String,
    enum: ['pending', 'verified', 'under_review', 'in_progress', 'resolved', 'rejected', 'duplicate'],
    default: 'pending'
  },
  
  // Community verification count
  verifications: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Users who verified this issue
  verifiedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Is issue marked as authentic (verifications > 3)
  isAuthentic: {
    type: Boolean,
    default: false
  },
  
  // Auto-assigned department based on category
  assignedDepartment: {
    type: String,
    enum: ['roads', 'sanitation', 'water', 'electricity', 'general'],
    required: true
  },
  
  // Assigned authority/volunteer
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  
  // Reporter
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Resolution details
  resolution: {
    resolvedAt: Date,
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    proofImage: String,
    notes: String
  },
  
  // Status history timeline
  timeline: [timelineEntrySchema],
  
  // Predicted resolution time (in hours)
  predictedResolutionTime: {
    type: Number,
    default: null
  },
  
  // Priority boost from verifications
  priorityBoost: {
    type: Number,
    default: 0
  },
  
  // Tags for searching
  tags: [{
    type: String,
    lowercase: true
  }],
  
  // Comments/notes
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    text: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// ===================
// Indexes for Performance
// ===================
issueSchema.index({ location: '2dsphere' }); // Geospatial queries
issueSchema.index({ status: 1 });
issueSchema.index({ category: 1 });
issueSchema.index({ severity: 1 });
issueSchema.index({ assignedDepartment: 1 });
issueSchema.index({ reportedBy: 1 });
issueSchema.index({ createdAt: -1 });
issueSchema.index({ severityScore: -1, createdAt: -1 }); // For priority sorting

// ===================
// Pre-save Middleware
// ===================
issueSchema.pre('save', function(next) {
  // Auto-mark as authentic if verifications > 3
  if (this.verifications >= 3 && !this.isAuthentic) {
    this.isAuthentic = true;
    // Add verification status to timeline
    this.timeline.push({
      status: 'verified',
      timestamp: new Date(),
      note: 'Community verified (3+ verifications)'
    });
  }
  
  // Calculate priority boost based on verifications
  this.priorityBoost = Math.min(this.verifications * 0.5, 3);
  
  next();
});

// ===================
// Instance Methods
// ===================

/**
 * Add verification from a user
 */
issueSchema.methods.addVerification = async function(userId) {
  // Check if user already verified
  if (this.verifiedBy.includes(userId)) {
    throw new Error('User has already verified this issue');
  }
  
  this.verifiedBy.push(userId);
  this.verifications = this.verifiedBy.length;
  
  await this.save();
  return this;
};

/**
 * Update status with timeline entry
 */
issueSchema.methods.updateStatus = async function(newStatus, userId, note = '') {
  this.status = newStatus;
  this.timeline.push({
    status: newStatus,
    timestamp: new Date(),
    updatedBy: userId,
    note
  });
  
  // If resolved, set resolution time
  if (newStatus === 'resolved') {
    this.resolution = {
      ...this.resolution,
      resolvedAt: new Date(),
      resolvedBy: userId
    };
  }
  
  await this.save();
  return this;
};

/**
 * Get formatted issue for API response
 */
issueSchema.methods.toJSON = function() {
  const obj = this.toObject();
  obj.id = obj._id;
  delete obj._id;
  delete obj.__v;
  return obj;
};

// ===================
// Static Methods
// ===================

/**
 * Find issues near a location
 */
issueSchema.statics.findNearby = function(longitude, latitude, maxDistance = 5000) {
  return this.find({
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        $maxDistance: maxDistance // in meters
      }
    }
  });
};

/**
 * Get issue statistics
 */
issueSchema.statics.getStats = async function() {
  const stats = await this.aggregate([
    {
      $facet: {
        byStatus: [
          { $group: { _id: '$status', count: { $sum: 1 } } }
        ],
        byCategory: [
          { $group: { _id: '$category', count: { $sum: 1 } } }
        ],
        bySeverity: [
          { $group: { _id: '$severity', count: { $sum: 1 } } }
        ],
        byDepartment: [
          { $group: { _id: '$assignedDepartment', count: { $sum: 1 } } }
        ],
        total: [
          { $count: 'count' }
        ],
        resolved: [
          { $match: { status: 'resolved' } },
          { $count: 'count' }
        ]
      }
    }
  ]);
  
  return stats[0];
};

/**
 * Get hotspot clusters for heatmap
 */
issueSchema.statics.getHotspots = async function() {
  return this.aggregate([
    {
      $match: {
        status: { $nin: ['resolved', 'rejected'] }
      }
    },
    {
      $group: {
        _id: {
          lat: { $round: [{ $arrayElemAt: ['$location.coordinates', 1] }, 3] },
          lng: { $round: [{ $arrayElemAt: ['$location.coordinates', 0] }, 3] }
        },
        count: { $sum: 1 },
        avgSeverity: { $avg: '$severityScore' }
      }
    },
    {
      $project: {
        _id: 0,
        latitude: '$_id.lat',
        longitude: '$_id.lng',
        count: 1,
        intensity: { $multiply: ['$count', '$avgSeverity'] }
      }
    }
  ]);
};

const Issue = mongoose.model('Issue', issueSchema);

module.exports = Issue;
