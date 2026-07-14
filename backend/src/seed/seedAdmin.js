/**
 * Admin Seeder Script
 * Creates default admin user for the system
 * 
 * Run with: node src/seed/seedAdmin.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Import User model
const User = require('../models/User');

// Default admin credentials
const DEFAULT_ADMIN = {
  name: 'System Admin',
  email: 'admin@civicsense.com',
  password: 'CivicAdmin@2025!Secure',
  role: 'admin'
};

// Additional demo accounts
const DEMO_ACCOUNTS = [
  {
    name: 'Roads Department',
    email: 'roads@civicsense.com',
    password: 'RoadsAuth@2025!Dept',
    role: 'authority',
    department: 'roads'
  },
  {
    name: 'Sanitation Department',
    email: 'sanitation@civicsense.com',
    password: 'SanitAuth@2025!Dept',
    role: 'authority',
    department: 'sanitation'
  },
  {
    name: 'Water Department',
    email: 'water@civicsense.com',
    password: 'WaterAuth@2025!Dept',
    role: 'authority',
    department: 'water'
  },
  {
    name: 'Electricity Department',
    email: 'electricity@civicsense.com',
    password: 'ElectAuth@2025!Dept',
    role: 'authority',
    department: 'electricity'
  }
];

async function seedAdmin() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('❌ MONGODB_URI not found in environment variables');
      process.exit(1);
    }

    console.log('📦 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Create default admin
    console.log('\n👤 Creating admin account...');
    
    const existingAdmin = await User.findOne({ email: DEFAULT_ADMIN.email });
    
    if (existingAdmin) {
      console.log(`ℹ️  Admin already exists: ${DEFAULT_ADMIN.email}`);
      // Update password in case it was changed
      existingAdmin.passwordHash = DEFAULT_ADMIN.password;
      existingAdmin.role = 'admin';
      await existingAdmin.save();
      console.log('✅ Admin password reset to default');
    } else {
      const admin = new User({
        name: DEFAULT_ADMIN.name,
        email: DEFAULT_ADMIN.email,
        passwordHash: DEFAULT_ADMIN.password,
        role: DEFAULT_ADMIN.role,
        isActive: true
      });
      await admin.save();
      console.log(`✅ Admin created: ${DEFAULT_ADMIN.email}`);
    }

    // Create department authority accounts
    console.log('\n🏛️  Creating department authority accounts...');
    
    for (const account of DEMO_ACCOUNTS) {
      const existing = await User.findOne({ email: account.email });
      
      if (existing) {
        console.log(`ℹ️  Already exists: ${account.email}`);
        // Update to ensure correct role and department
        existing.passwordHash = account.password;
        existing.role = account.role;
        existing.department = account.department;
        await existing.save();
      } else {
        const user = new User({
          name: account.name,
          email: account.email,
          passwordHash: account.password,
          role: account.role,
          department: account.department,
          isActive: true
        });
        await user.save();
        console.log(`✅ Created: ${account.email}`);
      }
    }

    // Print summary
    console.log('\n' + '='.repeat(50));
    console.log('🎉 Admin seeding completed!');
    console.log('='.repeat(50));
    console.log('\n📋 Admin Credentials:');
    console.log(`   Email:    ${DEFAULT_ADMIN.email}`);
    console.log(`   Password: ${DEFAULT_ADMIN.password}`);
    console.log(`   URL:      http://localhost:3000/admin/login`);
    console.log('\n📋 Department Authority Accounts:');
    DEMO_ACCOUNTS.forEach(acc => {
      console.log(`   ${acc.department.padEnd(12)} - ${acc.email} / ${acc.password}`);
    });
    console.log('\n');

  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('📦 Database connection closed');
    process.exit(0);
  }
}

// Run the seeder
seedAdmin();
