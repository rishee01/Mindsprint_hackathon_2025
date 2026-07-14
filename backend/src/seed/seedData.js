/**
 * Seed Data Script
 * Populates the database with demo data for testing
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Import models
const User = require('../models/User');
const Issue = require('../models/Issue');

// Sample locations (various cities - you can customize these)
const sampleLocations = [
  { lat: 28.6139, lng: 77.2090, address: 'Connaught Place, New Delhi' },
  { lat: 28.6304, lng: 77.2177, address: 'Karol Bagh, New Delhi' },
  { lat: 28.5672, lng: 77.2100, address: 'Saket, New Delhi' },
  { lat: 28.6448, lng: 77.2167, address: 'Paharganj, New Delhi' },
  { lat: 28.6280, lng: 77.2789, address: 'Laxmi Nagar, New Delhi' },
  { lat: 19.0760, lng: 72.8777, address: 'Mumbai Central, Mumbai' },
  { lat: 19.0178, lng: 72.8478, address: 'Bandra, Mumbai' },
  { lat: 19.0596, lng: 72.8295, address: 'Andheri, Mumbai' },
  { lat: 12.9716, lng: 77.5946, address: 'MG Road, Bangalore' },
  { lat: 12.9352, lng: 77.6245, address: 'Koramangala, Bangalore' },
  { lat: 13.0358, lng: 77.5970, address: 'Yeshwanthpur, Bangalore' },
  { lat: 17.3850, lng: 78.4867, address: 'Hyderabad Central, Hyderabad' },
  { lat: 17.4399, lng: 78.4983, address: 'Secunderabad, Hyderabad' },
  { lat: 13.0827, lng: 80.2707, address: 'T. Nagar, Chennai' },
  { lat: 22.5726, lng: 88.3639, address: 'Park Street, Kolkata' }
];

// Sample issue data
const sampleIssues = [
  {
    category: 'pothole',
    descriptions: [
      'Large pothole in the middle of the road causing traffic issues',
      'Deep pothole near bus stop, very dangerous for two-wheelers',
      'Multiple potholes on main road, needs urgent repair',
      'Pothole filled with water, hard to see at night'
    ],
    severity: 'high',
    severityScore: 8
  },
  {
    category: 'garbage',
    descriptions: [
      'Garbage dump overflowing onto the street',
      'Waste pile not collected for 3 days',
      'Illegal dumping of construction debris',
      'Open garbage attracts stray animals'
    ],
    severity: 'medium',
    severityScore: 5
  },
  {
    category: 'water_leakage',
    descriptions: [
      'Water pipe burst, water flowing onto road',
      'Major leakage from underground pipe',
      'Continuous water leakage for past 2 days',
      'Leak causing water wastage and road damage'
    ],
    severity: 'high',
    severityScore: 8
  },
  {
    category: 'streetlight',
    descriptions: [
      'Streetlight not working for a week',
      'Multiple lights out on this stretch',
      'Flickering streetlight, very dim',
      'Complete darkness at night, safety concern'
    ],
    severity: 'low',
    severityScore: 4
  },
  {
    category: 'drainage',
    descriptions: [
      'Drain blocked, water logging during rain',
      'Open drain cover, safety hazard',
      'Sewage overflow from blocked drain',
      'Drain clogged with garbage'
    ],
    severity: 'medium',
    severityScore: 6
  },
  {
    category: 'road_damage',
    descriptions: [
      'Road surface damaged after recent rains',
      'Large cracks developing on highway',
      'Road edge broken, dangerous for vehicles',
      'Surface erosion causing bumpy ride'
    ],
    severity: 'high',
    severityScore: 7
  }
];

// Department mapping
const categoryToDepartment = {
  pothole: 'roads',
  garbage: 'sanitation',
  water_leakage: 'water',
  streetlight: 'electricity',
  drainage: 'water',
  road_damage: 'roads',
  illegal_parking: 'general',
  others: 'general'
};

// Status options with weights
const statuses = [
  { status: 'pending', weight: 30 },
  { status: 'verified', weight: 15 },
  { status: 'under_review', weight: 15 },
  { status: 'in_progress', weight: 20 },
  { status: 'resolved', weight: 20 }
];

// Sample image URLs (placeholder images)
const sampleImages = [
  'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800',
  'https://images.unsplash.com/photo-1605600659908-0ef719419d41?w=800',
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
  'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=800',
  'https://images.unsplash.com/photo-1567095761054-7a02e69e5c43?w=800'
];

// Helper function to get random item from array
const getRandomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Helper function to get weighted random status
const getWeightedStatus = () => {
  const totalWeight = statuses.reduce((sum, s) => sum + s.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const item of statuses) {
    random -= item.weight;
    if (random <= 0) return item.status;
  }
  return 'pending';
};

// Generate random date within last 30 days
const getRandomDate = (daysBack = 30) => {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysBack));
  date.setHours(Math.floor(Math.random() * 24));
  date.setMinutes(Math.floor(Math.random() * 60));
  return date;
};

// Main seed function
const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/civicsense';
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');
    
    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await User.deleteMany({});
    await Issue.deleteMany({});
    
    // Create admin user
    console.log('👤 Creating users...');
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@civicsense.com',
      passwordHash: adminPassword,
      role: 'admin',
      isActive: true,
      trustScore: 100
    });
    console.log(`   Created admin: ${admin.email}`);
    
    // Create regular users
    const userPassword = await bcrypt.hash('user123', 10);
    const users = [];
    
    const userNames = [
      'Rahul Sharma', 'Priya Patel', 'Amit Kumar', 'Sneha Gupta',
      'Vikram Singh', 'Anita Reddy', 'Suresh Nair', 'Meera Iyer',
      'Rajesh Verma', 'Kavita Desai'
    ];
    
    for (let i = 0; i < userNames.length; i++) {
      const user = await User.create({
        name: userNames[i],
        email: `user${i + 1}@example.com`,
        passwordHash: userPassword,
        role: 'user',
        isActive: true,
        trustScore: Math.floor(Math.random() * 50) + 10,
        issuesReported: Math.floor(Math.random() * 10),
        issuesVerified: Math.floor(Math.random() * 15)
      });
      users.push(user);
    }
    console.log(`   Created ${users.length} regular users`);
    
    // Create authority users
    const authorityUsers = [];
    const departments = ['roads', 'sanitation', 'water', 'electricity'];
    
    for (const dept of departments) {
      const authority = await User.create({
        name: `${dept.charAt(0).toUpperCase() + dept.slice(1)} Authority`,
        email: `${dept}@civicsense.gov`,
        passwordHash: userPassword,
        role: 'authority',
        department: dept,
        isActive: true,
        trustScore: 80
      });
      authorityUsers.push(authority);
    }
    console.log(`   Created ${authorityUsers.length} authority users`);
    
    // Create issues
    console.log('📝 Creating issues...');
    const issues = [];
    
    for (let i = 0; i < 50; i++) {
      const issueType = getRandomItem(sampleIssues);
      const location = getRandomItem(sampleLocations);
      const reporter = getRandomItem(users);
      const status = getWeightedStatus();
      const createdAt = getRandomDate();
      
      // Generate verifications
      const verificationCount = Math.floor(Math.random() * 6);
      const verifiedBy = users
        .filter(u => u._id.toString() !== reporter._id.toString())
        .sort(() => Math.random() - 0.5)
        .slice(0, verificationCount)
        .map(u => u._id);
      
      // Create timeline
      const timeline = [{
        status: 'pending',
        timestamp: createdAt,
        updatedBy: reporter._id,
        note: 'Issue reported'
      }];
      
      // Add more timeline entries based on status
      if (['verified', 'under_review', 'in_progress', 'resolved'].includes(status)) {
        if (verificationCount >= 3) {
          const verifyDate = new Date(createdAt);
          verifyDate.setHours(verifyDate.getHours() + Math.floor(Math.random() * 24));
          timeline.push({
            status: 'verified',
            timestamp: verifyDate,
            note: 'Community verified'
          });
        }
      }
      
      if (['under_review', 'in_progress', 'resolved'].includes(status)) {
        const reviewDate = new Date(timeline[timeline.length - 1].timestamp);
        reviewDate.setHours(reviewDate.getHours() + Math.floor(Math.random() * 48));
        timeline.push({
          status: 'under_review',
          timestamp: reviewDate,
          updatedBy: admin._id,
          note: 'Assigned to department'
        });
      }
      
      if (['in_progress', 'resolved'].includes(status)) {
        const progressDate = new Date(timeline[timeline.length - 1].timestamp);
        progressDate.setHours(progressDate.getHours() + Math.floor(Math.random() * 72));
        timeline.push({
          status: 'in_progress',
          timestamp: progressDate,
          updatedBy: getRandomItem(authorityUsers)._id,
          note: 'Work in progress'
        });
      }
      
      // Create issue object
      const issueData = {
        imageUrl: getRandomItem(sampleImages),
        location: {
          type: 'Point',
          coordinates: [
            location.lng + (Math.random() - 0.5) * 0.02,
            location.lat + (Math.random() - 0.5) * 0.02
          ]
        },
        address: location.address,
        description: getRandomItem(issueType.descriptions),
        category: issueType.category,
        aiConfidence: 75 + Math.floor(Math.random() * 20),
        severity: issueType.severity,
        severityScore: issueType.severityScore,
        status,
        verifications: verificationCount,
        verifiedBy,
        isAuthentic: verificationCount >= 3,
        assignedDepartment: categoryToDepartment[issueType.category],
        reportedBy: reporter._id,
        predictedResolutionTime: 24 + Math.floor(Math.random() * 72),
        timeline,
        createdAt,
        updatedAt: timeline[timeline.length - 1].timestamp
      };
      
      // Add resolution for resolved issues
      if (status === 'resolved') {
        const resolveDate = new Date(timeline[timeline.length - 1].timestamp);
        resolveDate.setHours(resolveDate.getHours() + Math.floor(Math.random() * 48));
        
        issueData.resolution = {
          resolvedAt: resolveDate,
          resolvedBy: getRandomItem(authorityUsers)._id,
          notes: 'Issue has been successfully resolved'
        };
        
        timeline.push({
          status: 'resolved',
          timestamp: resolveDate,
          updatedBy: issueData.resolution.resolvedBy,
          note: 'Issue resolved'
        });
      }
      
      const issue = await Issue.create(issueData);
      issues.push(issue);
    }
    
    console.log(`   Created ${issues.length} issues`);
    
    // Update user statistics
    console.log('📊 Updating user statistics...');
    for (const user of users) {
      const reportedCount = issues.filter(i => 
        i.reportedBy.toString() === user._id.toString()
      ).length;
      
      const verifiedCount = issues.filter(i => 
        i.verifiedBy.some(v => v.toString() === user._id.toString())
      ).length;
      
      await User.findByIdAndUpdate(user._id, {
        issuesReported: reportedCount,
        issuesVerified: verifiedCount
      });
    }
    
    console.log('\n✅ Database seeded successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('   Admin: admin@civicsense.com / admin123');
    console.log('   User:  user1@example.com / user123');
    console.log('   (user1 through user10 available)');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
};

// Run seed
seedDatabase();
