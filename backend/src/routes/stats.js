/**
 * Statistics Routes
 * Dashboard analytics and statistics
 */

const express = require('express');
const { Issue, User } = require('../models');
const { verifyToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/stats/overview
 * Get general statistics overview
 */
router.get('/overview', async (req, res) => {
  try {
    const stats = await Issue.getStats();
    
    // Format stats for response
    const byStatus = {};
    stats.byStatus.forEach(s => { byStatus[s._id] = s.count; });
    
    const byCategory = {};
    stats.byCategory.forEach(s => { byCategory[s._id] = s.count; });
    
    const bySeverity = {};
    stats.bySeverity.forEach(s => { bySeverity[s._id] = s.count; });
    
    const byDepartment = {};
    stats.byDepartment.forEach(s => { byDepartment[s._id] = s.count; });
    
    const total = stats.total[0]?.count || 0;
    const resolved = stats.resolved[0]?.count || 0;
    const pending = byStatus.pending || 0;
    const inProgress = byStatus.in_progress || 0;
    const verified = byStatus.verified || 0;
    
    // Calculate resolution rate
    const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;
    
    // Get active citizens count - users who have reported OR verified at least 1 issue
    const activeCitizensCount = await User.countDocuments({
      role: 'user',
      isActive: true,
      $or: [
        { issuesReported: { $gt: 0 } },
        { issuesVerified: { $gt: 0 } }
      ]
    });
    
    // Get total registered users count (for reference)
    const totalUsersCount = await User.countDocuments({ role: 'user', isActive: true });
    
    // Format arrays for frontend charts
    const issuesByCategory = stats.byCategory.map(s => ({ _id: s._id, count: s.count }));
    const issuesBySeverity = stats.bySeverity.map(s => ({ _id: s._id, count: s.count }));
    const issuesByStatus = stats.byStatus.map(s => ({ _id: s._id, count: s.count }));
    
    res.json({
      success: true,
      data: {
        // Legacy field names (for backward compatibility)
        total,
        resolved,
        pending,
        inProgress,
        resolutionRate,
        userCount: activeCitizensCount, // Active citizens who have contributed
        activeCitizens: activeCitizensCount, // Explicit field name
        totalUsers: totalUsersCount, // Total registered users
        byStatus,
        byCategory,
        bySeverity,
        byDepartment,
        // New field names (expected by admin dashboard)
        totalIssues: total,
        pendingIssues: pending,
        inProgressIssues: inProgress,
        resolvedIssues: resolved,
        verifiedIssues: verified,
        averageResolutionTime: 48, // Default placeholder
        issuesByCategory,
        issuesBySeverity,
        issuesByStatus
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
});

/**
 * GET /api/stats/trends
 * Get issue trends over time
 */
router.get('/trends', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    
    // Get issues grouped by day
    const dailyIssues = await Issue.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          reported: { $sum: 1 },
          resolved: {
            $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] }
          }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);
    
    // Get resolutions grouped by day
    const dailyResolutions = await Issue.aggregate([
      {
        $match: {
          'resolution.resolvedAt': { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$resolution.resolvedAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);
    
    res.json({
      success: true,
      data: {
        dailyIssues,
        dailyResolutions,
        period: parseInt(days)
      }
    });
  } catch (error) {
    console.error('Get trends error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trends',
      error: error.message
    });
  }
});

/**
 * GET /api/stats/leaderboard
 * Get top contributors
 */
router.get('/leaderboard', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    // Top reporters
    const topReporters = await User.find({ isActive: true })
      .sort({ issuesReported: -1 })
      .limit(parseInt(limit))
      .select('name avatar issuesReported trustScore');
    
    // Top verifiers
    const topVerifiers = await User.find({ isActive: true })
      .sort({ issuesVerified: -1 })
      .limit(parseInt(limit))
      .select('name avatar issuesVerified trustScore');
    
    res.json({
      success: true,
      data: {
        topReporters,
        topVerifiers
      }
    });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leaderboard',
      error: error.message
    });
  }
});

/**
 * GET /api/stats/departments
 * Get department-wise statistics
 */
router.get('/departments', verifyToken, requireAdmin, async (req, res) => {
  try {
    const departmentStats = await Issue.aggregate([
      {
        $group: {
          _id: '$assignedDepartment',
          total: { $sum: 1 },
          pending: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          inProgress: {
            $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] }
          },
          resolved: {
            $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] }
          },
          avgSeverity: { $avg: '$severityScore' }
        }
      },
      {
        $project: {
          _id: 0,
          department: '$_id',
          total: 1,
          pending: 1,
          inProgress: 1,
          resolved: 1,
          avgSeverity: { $round: ['$avgSeverity', 1] },
          resolutionRate: {
            $round: [
              { $multiply: [{ $divide: ['$resolved', '$total'] }, 100] },
              1
            ]
          }
        }
      }
    ]);
    
    res.json({
      success: true,
      data: departmentStats
    });
  } catch (error) {
    console.error('Get department stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch department statistics',
      error: error.message
    });
  }
});

/**
 * GET /api/stats/average-resolution-time
 * Get average resolution time by category
 */
router.get('/resolution-time', async (req, res) => {
  try {
    const resolutionTimes = await Issue.aggregate([
      {
        $match: {
          status: 'resolved',
          'resolution.resolvedAt': { $exists: true }
        }
      },
      {
        $project: {
          category: 1,
          resolutionTime: {
            $divide: [
              { $subtract: ['$resolution.resolvedAt', '$createdAt'] },
              1000 * 60 * 60 // Convert to hours
            ]
          }
        }
      },
      {
        $group: {
          _id: '$category',
          avgTime: { $avg: '$resolutionTime' },
          minTime: { $min: '$resolutionTime' },
          maxTime: { $max: '$resolutionTime' },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          category: '$_id',
          avgTime: { $round: ['$avgTime', 1] },
          minTime: { $round: ['$minTime', 1] },
          maxTime: { $round: ['$maxTime', 1] },
          count: 1
        }
      }
    ]);
    
    res.json({
      success: true,
      data: resolutionTimes
    });
  } catch (error) {
    console.error('Get resolution time error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch resolution time statistics',
      error: error.message
    });
  }
});

module.exports = router;
