/**
 * User Model - MongoDB Schema
 * Handles user accounts with role-based access (user/admin)
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Firebase UID for authentication
  firebaseUid: {
    type: String,
    unique: true,
    sparse: true // Allows null values while maintaining uniqueness
  },
  
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  
  // Password hash (for local auth fallback)
  passwordHash: {
    type: String,
    minlength: 6,
    select: false // Don't include in queries by default
  },
  
  // User role for access control
  role: {
    type: String,
    enum: ['user', 'admin', 'authority'],
    default: 'user'
  },
  
  // Department assignment for authority users
  department: {
    type: String,
    enum: ['roads', 'sanitation', 'water', 'electricity', 'general', null],
    default: null
  },
  
  // Profile photo URL
  avatar: {
    type: String,
    default: null
  },
  
  // User's phone number (optional)
  phone: {
    type: String,
    trim: true
  },
  
  // Statistics
  issuesReported: {
    type: Number,
    default: 0
  },
  
  issuesVerified: {
    type: Number,
    default: 0
  },
  
  // Trust score based on activity
  trustScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  
  // Account status
  isActive: {
    type: Boolean,
    default: true
  },
  
  lastLogin: {
    type: Date,
    default: null
  }
}, {
  timestamps: true // Adds createdAt and updatedAt
});

// ===================
// Indexes
// ===================
// Note: email and firebaseUid indexes are already created by "unique: true" in schema
// Only add additional indexes that aren't already defined
userSchema.index({ role: 1 });

// ===================
// Pre-save Middleware
// ===================
userSchema.pre('save', async function(next) {
  // Only hash password if it's modified
  if (!this.isModified('passwordHash') || !this.passwordHash) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// ===================
// Instance Methods
// ===================

/**
 * Compare password for login
 */
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.passwordHash) return false;
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

/**
 * Get public profile (excludes sensitive data)
 */
userSchema.methods.toPublicJSON = function() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    department: this.department,
    avatar: this.avatar,
    issuesReported: this.issuesReported,
    issuesVerified: this.issuesVerified,
    trustScore: this.trustScore,
    createdAt: this.createdAt
  };
};

/**
 * Increment trust score
 */
userSchema.methods.incrementTrustScore = async function(points = 1) {
  this.trustScore = Math.min(100, this.trustScore + points);
  await this.save();
};

// ===================
// Static Methods
// ===================

/**
 * Find user by email
 */
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

/**
 * Find user by Firebase UID
 */
userSchema.statics.findByFirebaseUid = function(uid) {
  return this.findOne({ firebaseUid: uid });
};

/**
 * Get all admins
 */
userSchema.statics.getAdmins = function() {
  return this.find({ role: 'admin', isActive: true });
};

/**
 * Get authorities by department
 */
userSchema.statics.getByDepartment = function(department) {
  return this.find({ 
    role: 'authority', 
    department, 
    isActive: true 
  });
};

const User = mongoose.model('User', userSchema);

module.exports = User;
