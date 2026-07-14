/**
 * Issue Routes
 * CRUD operations for civic issues
 */

const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { Issue, User } = require('../models');
const { verifyToken, optionalAuth, requireAdmin, requireAuthority } = require('../middleware/auth');
const { uploadIssueImage, uploadProofImage } = require('../config/cloudinary');
const { getDepartmentForCategory, getPredictedResolutionTime } = require('../config/departments');
const { calculateSeverity } = require('../config/severity');

const router = express.Router();

// ===================
// Validation Rules
// ===================
const createIssueValidation = [
  body('description')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Description must be 10-500 characters'),
  body('latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Invalid latitude'),
  body('longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Invalid longitude'),
  body('category')
    .optional()
    .isIn(['pothole', 'garbage', 'water_leakage', 'streetlight', 'drainage', 'road_damage', 'illegal_parking', 'noise', 'air_pollution', 'others'])
    .withMessage('Invalid category')
];

// ===================
// Routes
// ===================

/**
 * GET /api/issues
 * Get all issues with filters
 */
router.get('/', optionalAuth, async (req, res) => {
  try {
    const {
      status,
      category,
      severity,
      department,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      lat,
      lng,
      radius = 5000, // meters
      search
    } = req.query;
    
    // Build filter object
    const filter = {};
    
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (severity) filter.severity = severity;
    if (department) filter.assignedDepartment = department;
    
    // Text search
    if (search) {
      filter.$or = [
        { description: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Geospatial query
    if (lat && lng) {
      filter.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: parseInt(radius)
        }
      };
    }
    
    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    
    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [issues, total] = await Promise.all([
      Issue.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .populate('reportedBy', 'name avatar')
        .populate('assignedTo', 'name avatar')
        .lean(),
      Issue.countDocuments(filter)
    ]);
    
    res.json({
      success: true,
      data: {
        issues,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get issues error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch issues',
      error: error.message
    });
  }
});

/**
 * GET /api/issues/map
 * Get issues for map display (minimal data)
 */
router.get('/map', async (req, res) => {
  try {
    const { status, category, severity } = req.query;
    
    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (severity) filter.severity = severity;
    
    // Only get active issues for map
    if (!status) {
      filter.status = { $nin: ['resolved', 'rejected'] };
    }
    
    const issues = await Issue.find(filter)
      .select('location category severity status verifications imageUrl description')
      .lean();
    
    // Format for map markers
    const markers = issues.map(issue => ({
      id: issue._id,
      latitude: issue.location.coordinates[1],
      longitude: issue.location.coordinates[0],
      category: issue.category,
      severity: issue.severity,
      status: issue.status,
      verifications: issue.verifications,
      imageUrl: issue.imageUrl,
      description: issue.description?.substring(0, 100)
    }));
    
    res.json({
      success: true,
      data: markers
    });
  } catch (error) {
    console.error('Get map issues error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch map data',
      error: error.message
    });
  }
});

/**
 * GET /api/issues/heatmap
 * Get heatmap data for issue hotspots
 */
router.get('/heatmap', async (req, res) => {
  try {
    const hotspots = await Issue.getHotspots();
    
    // Format for heatmap layer (handle empty/null results)
    const heatmapData = (hotspots || []).map(spot => ({
      latitude: spot.latitude,
      longitude: spot.longitude,
      weight: spot.intensity || 1
    })).filter(spot => spot.latitude && spot.longitude);
    
    res.json({
      success: true,
      data: heatmapData
    });
  } catch (error) {
    console.error('Get heatmap error:', error);
    // Return empty array on error instead of failing
    res.json({
      success: true,
      data: []
    });
  }
});

/**
 * GET /api/issues/:id
 * Get single issue by ID
 */
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id)
      .populate('reportedBy', 'name avatar trustScore')
      .populate('assignedTo', 'name avatar department')
      .populate('verifiedBy', 'name avatar')
      .populate('timeline.updatedBy', 'name')
      .populate('comments.user', 'name avatar');
    
    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found'
      });
    }
    
    res.json({
      success: true,
      data: issue
    });
  } catch (error) {
    console.error('Get issue error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch issue',
      error: error.message
    });
  }
});

/**
 * POST /api/issues
 * Create a new issue
 */
router.post('/', verifyToken, uploadIssueImage.single('image'), createIssueValidation, async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    
    const { description, latitude, longitude, category, address, aiConfidence } = req.body;
    
    // Get image URL from Cloudinary upload
    let imageUrl = req.body.imageUrl; // Allow direct URL
    if (req.file) {
      imageUrl = req.file.path;
    }
    
    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        message: 'Issue image is required'
      });
    }
    
    // Calculate severity based on category and description
    const { severity, severityScore } = calculateSeverity(category, description);
    
    // Get department assignment
    const assignedDepartment = getDepartmentForCategory(category);
    
    // Get predicted resolution time
    const predictedResolutionTime = getPredictedResolutionTime(category, severity);
    
    // Create issue
    const issue = new Issue({
      imageUrl,
      location: {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)]
      },
      address: address || '',
      description,
      category: category || 'others',
      aiConfidence: aiConfidence || 0,
      severity,
      severityScore,
      status: 'pending',
      assignedDepartment,
      predictedResolutionTime,
      reportedBy: req.userId,
      timeline: [{
        status: 'pending',
        timestamp: new Date(),
        updatedBy: req.userId,
        note: 'Issue reported'
      }]
    });
    
    await issue.save();
    
    // Update user's reported issues count
    await User.findByIdAndUpdate(req.userId, {
      $inc: { issuesReported: 1 }
    });
    
    // Populate reporter info
    await issue.populate('reportedBy', 'name avatar');
    
    res.status(201).json({
      success: true,
      message: 'Issue reported successfully',
      data: issue
    });
  } catch (error) {
    console.error('Create issue error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create issue',
      error: error.message
    });
  }
});

/**
 * PATCH /api/issues/:id
 * Update issue (admin/authority only)
 */
router.patch('/:id', verifyToken, requireAuthority, async (req, res) => {
  try {
    const { status, assignedTo, note } = req.body;
    
    const issue = await Issue.findById(req.params.id);
    
    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found'
      });
    }
    
    // Update status with timeline
    if (status && status !== issue.status) {
      await issue.updateStatus(status, req.userId, note || `Status changed to ${status}`);
    }
    
    // Assign to user
    if (assignedTo !== undefined) {
      issue.assignedTo = assignedTo;
      await issue.save();
    }
    
    await issue.populate('reportedBy', 'name avatar');
    await issue.populate('assignedTo', 'name avatar');
    
    res.json({
      success: true,
      message: 'Issue updated',
      data: issue
    });
  } catch (error) {
    console.error('Update issue error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update issue',
      error: error.message
    });
  }
});

/**
 * POST /api/issues/:id/verify
 * Verify an issue (community verification)
 */
router.post('/:id/verify', verifyToken, async (req, res) => {
  try {
    let issue = await Issue.findById(req.params.id);
    
    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found'
      });
    }
    
    // Check if user is the reporter
    if (issue.reportedBy && issue.reportedBy.toString() === req.userId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot verify your own issue'
      });
    }
    
    // Check if user already verified
    if (issue.verifiedBy && issue.verifiedBy.some(id => id.toString() === req.userId.toString())) {
      return res.status(400).json({
        success: false,
        message: 'You have already verified this issue'
      });
    }
    
    // Add verification directly (more reliable than method)
    issue.verifiedBy = issue.verifiedBy || [];
    issue.verifiedBy.push(req.userId);
    issue.verifications = issue.verifiedBy.length;
    
    // Auto-mark as authentic if verifications >= 3
    if (issue.verifications >= 3 && !issue.isAuthentic) {
      issue.isAuthentic = true;
      issue.status = 'verified';
      issue.timeline = issue.timeline || [];
      issue.timeline.push({
        status: 'verified',
        timestamp: new Date(),
        updatedBy: req.userId,
        note: 'Community verified (3+ verifications)'
      });
    }
    
    await issue.save();
    
    // Update user's verified issues count and trust score
    await User.findByIdAndUpdate(req.userId, {
      $inc: { issuesVerified: 1, trustScore: 1 }
    });
    
    // Fetch the updated issue with populated fields
    issue = await Issue.findById(req.params.id)
      .populate('reportedBy', 'name avatar')
      .populate('verifiedBy', 'name')
      .populate('assignedTo', 'name email');
    
    res.json({
      success: true,
      message: 'Issue verified successfully',
      data: issue
    });
  } catch (error) {
    console.error('Verify issue error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify issue',
      error: error.message
    });
  }
});

/**
 * POST /api/issues/:id/resolve
 * Resolve an issue with proof
 */
router.post('/:id/resolve', verifyToken, requireAuthority, uploadProofImage.single('proofImage'), async (req, res) => {
  try {
    const { notes } = req.body;
    
    const issue = await Issue.findById(req.params.id);
    
    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found'
      });
    }
    
    // Get proof image URL
    let proofImage = req.body.proofImageUrl;
    if (req.file) {
      proofImage = req.file.path;
    }
    
    // Update resolution details
    issue.resolution = {
      resolvedAt: new Date(),
      resolvedBy: req.userId,
      proofImage,
      notes
    };
    
    // Update status
    await issue.updateStatus('resolved', req.userId, notes || 'Issue resolved');
    
    await issue.populate('reportedBy', 'name avatar');
    await issue.populate('resolution.resolvedBy', 'name');
    
    res.json({
      success: true,
      message: 'Issue resolved',
      data: issue
    });
  } catch (error) {
    console.error('Resolve issue error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resolve issue',
      error: error.message
    });
  }
});

/**
 * POST /api/issues/:id/comment
 * Add a comment to an issue
 */
router.post('/:id/comment', verifyToken, async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text || text.trim().length < 1) {
      return res.status(400).json({
        success: false,
        message: 'Comment text is required'
      });
    }
    
    const issue = await Issue.findByIdAndUpdate(
      req.params.id,
      {
        $push: {
          comments: {
            user: req.userId,
            text: text.trim(),
            createdAt: new Date()
          }
        }
      },
      { new: true }
    ).populate('comments.user', 'name avatar');
    
    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Comment added',
      data: issue.comments[issue.comments.length - 1]
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add comment',
      error: error.message
    });
  }
});

/**
 * DELETE /api/issues/:id
 * Delete an issue (admin only or own issue)
 */
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);
    
    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found'
      });
    }
    
    // Check permission
    const isOwner = issue.reportedBy.toString() === req.userId.toString();
    const isAdmin = req.user.role === 'admin';
    
    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this issue'
      });
    }
    
    await Issue.findByIdAndDelete(req.params.id);
    
    // Update user's reported issues count
    if (isOwner) {
      await User.findByIdAndUpdate(req.userId, {
        $inc: { issuesReported: -1 }
      });
    }
    
    res.json({
      success: true,
      message: 'Issue deleted'
    });
  } catch (error) {
    console.error('Delete issue error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete issue',
      error: error.message
    });
  }
});

/**
 * GET /api/issues/user/my-issues
 * Get current user's reported issues
 */
router.get('/user/my-issues', verifyToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    
    const filter = { reportedBy: req.userId };
    if (status) filter.status = status;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [issues, total] = await Promise.all([
      Issue.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Issue.countDocuments(filter)
    ]);
    
    res.json({
      success: true,
      data: {
        issues,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get user issues error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch issues',
      error: error.message
    });
  }
});

module.exports = router;
