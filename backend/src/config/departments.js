/**
 * Department Auto-Routing Configuration
 * Maps issue categories to responsible departments
 */

// Category to Department mapping
const categoryToDepartment = {
  pothole: 'roads',
  road_damage: 'roads',
  garbage: 'sanitation',
  water_leakage: 'water',
  drainage: 'water',
  streetlight: 'electricity',
  illegal_parking: 'general',
  noise: 'general',
  air_pollution: 'general',
  others: 'general'
};

// Department information
const departments = {
  roads: {
    name: 'Roads Department',
    description: 'Handles road maintenance, potholes, and road damage',
    contactEmail: 'roads@civicsense.gov',
    responseTimeHours: 48
  },
  sanitation: {
    name: 'Sanitation Department',
    description: 'Handles garbage collection and waste management',
    contactEmail: 'sanitation@civicsense.gov',
    responseTimeHours: 24
  },
  water: {
    name: 'Water Department',
    description: 'Handles water supply, leakages, and drainage issues',
    contactEmail: 'water@civicsense.gov',
    responseTimeHours: 12
  },
  electricity: {
    name: 'Electricity Department',
    description: 'Handles streetlights and electrical infrastructure',
    contactEmail: 'electricity@civicsense.gov',
    responseTimeHours: 24
  },
  general: {
    name: 'General Administration',
    description: 'Handles miscellaneous civic issues',
    contactEmail: 'admin@civicsense.gov',
    responseTimeHours: 72
  }
};

/**
 * Get department for a category
 */
const getDepartmentForCategory = (category) => {
  return categoryToDepartment[category] || 'general';
};

/**
 * Get department details
 */
const getDepartmentDetails = (departmentId) => {
  return departments[departmentId] || departments.general;
};

/**
 * Get predicted resolution time based on category and severity
 */
const getPredictedResolutionTime = (category, severity) => {
  const department = getDepartmentForCategory(category);
  const baseTime = departments[department]?.responseTimeHours || 72;
  
  // Adjust based on severity
  const severityMultiplier = {
    low: 1.5,
    medium: 1.0,
    high: 0.75,
    critical: 0.5
  };
  
  return Math.round(baseTime * (severityMultiplier[severity] || 1));
};

module.exports = {
  categoryToDepartment,
  departments,
  getDepartmentForCategory,
  getDepartmentDetails,
  getPredictedResolutionTime
};
