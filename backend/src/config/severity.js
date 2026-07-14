/**
 * Severity Scoring Configuration
 * Rule-based severity calculation for issues
 */

// Base severity scores for each category
const categorySeverity = {
  pothole: { base: 'high', score: 8 },
  road_damage: { base: 'high', score: 7 },
  water_leakage: { base: 'high', score: 8 },
  drainage: { base: 'medium', score: 6 },
  garbage: { base: 'medium', score: 5 },
  streetlight: { base: 'low', score: 4 },
  illegal_parking: { base: 'low', score: 3 },
  noise: { base: 'low', score: 3 },
  air_pollution: { base: 'medium', score: 5 },
  others: { base: 'medium', score: 5 }
};

// Keywords that increase severity
const severityKeywords = {
  critical: ['emergency', 'accident', 'danger', 'dangerous', 'urgent', 'life-threatening', 'flooding', 'collapse'],
  high: ['major', 'broken', 'blocked', 'severe', 'large', 'overflowing', 'hazard'],
  medium: ['moderate', 'damaged', 'needs repair', 'issue'],
  low: ['minor', 'small', 'slight']
};

// Severity level mapping
const severityLevels = {
  critical: { min: 9, max: 10 },
  high: { min: 7, max: 8 },
  medium: { min: 4, max: 6 },
  low: { min: 1, max: 3 }
};

/**
 * Calculate severity based on category and description
 */
const calculateSeverity = (category, description = '') => {
  // Get base severity for category
  const baseSeverity = categorySeverity[category] || categorySeverity.others;
  let score = baseSeverity.score;
  let level = baseSeverity.base;
  
  // Analyze description for keywords
  const lowerDesc = description.toLowerCase();
  
  // Check for critical keywords
  if (severityKeywords.critical.some(keyword => lowerDesc.includes(keyword))) {
    score = Math.min(10, score + 2);
    level = 'critical';
  }
  // Check for high severity keywords
  else if (severityKeywords.high.some(keyword => lowerDesc.includes(keyword))) {
    score = Math.min(10, score + 1);
    if (level === 'low' || level === 'medium') level = 'high';
  }
  // Check for low severity keywords (might reduce severity)
  else if (severityKeywords.low.some(keyword => lowerDesc.includes(keyword))) {
    score = Math.max(1, score - 1);
    if (level === 'high') level = 'medium';
    if (level === 'medium') level = 'low';
  }
  
  // Determine final level based on score
  if (score >= severityLevels.critical.min) level = 'critical';
  else if (score >= severityLevels.high.min) level = 'high';
  else if (score >= severityLevels.medium.min) level = 'medium';
  else level = 'low';
  
  return {
    severity: level,
    severityScore: score
  };
};

/**
 * Get severity color for UI
 */
const getSeverityColor = (severity) => {
  const colors = {
    critical: '#DC2626', // red-600
    high: '#EA580C',     // orange-600
    medium: '#CA8A04',   // yellow-600
    low: '#16A34A'       // green-600
  };
  return colors[severity] || colors.medium;
};

/**
 * Get severity badge class for UI
 */
const getSeverityBadgeClass = (severity) => {
  const classes = {
    critical: 'bg-red-100 text-red-800',
    high: 'bg-orange-100 text-orange-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-green-100 text-green-800'
  };
  return classes[severity] || classes.medium;
};

module.exports = {
  categorySeverity,
  severityKeywords,
  severityLevels,
  calculateSeverity,
  getSeverityColor,
  getSeverityBadgeClass
};
