const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
require('dotenv').config();

const { connectDB } = require('./mongoose');
const User = require('../models/User');
const Domain = require('../models/Domain');
const Resource = require('../models/Resource');

async function seed() {
  try {
    // Connect to MongoDB
    await connectDB();

    // Create uploads directory if it doesn't exist
    const uploadDir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const sampleFile = path.join(uploadDir, 'SampleNotes.txt');
    if (!fs.existsSync(sampleFile)) {
      fs.writeFileSync(
        sampleFile,
        'Sample notes for the Resource Manager project. Replace with your own files!'
      );
    }

    // Clear existing data (optional - comment out if you want to keep existing data)
    console.log('🗑️  Clearing existing data...');
    await User.deleteMany({});
    await Domain.deleteMany({});
    await Resource.deleteMany({});
    await require('../models/Comment').deleteMany({});
    await require('../models/ResourceVote').deleteMany({});

    // Create sample user
    const userEmail = 'student@example.com';
    let user = await User.findOne({ email: userEmail });

    if (!user) {
      const hash = await bcrypt.hash('password123', 10);
      user = new User({
        fullName: 'Sample Student',
        email: userEmail,
        passwordHash: hash,
        username: 'student',
        isAdmin: false,
        displayName: 'Demo User',
        bio: 'A sample student account for testing the Resource Hub.',
      });
      await user.save();
      console.log('✅ Created sample user: student@example.com / password123');
    } else {
      console.log('ℹ️  Sample user already exists');
    }

    // Create admin user
    const adminEmail = 'admin@example.com';
    let admin = await User.findOne({ email: adminEmail });

    if (!admin) {
      const hash = await bcrypt.hash('Admin123', 10);
      admin = new User({
        fullName: 'Site Admin',
        email: adminEmail,
        passwordHash: hash,
        username: 'admin',
        isAdmin: true,
        displayName: 'Admin',
        bio: 'Site administrator for WebHub Resource Manager.',
      });
      await admin.save();
      console.log('✅ Created admin user: admin@example.com / Admin123');
    } else {
      if (!admin.isAdmin) {
        admin.isAdmin = true;
        await admin.save();
        console.log('✅ Updated existing admin@example.com to admin privileges.');
      } else {
        console.log('ℹ️  Admin user already exists');
      }
    }

    // Create domains
    const domainNames = [
      { name: 'Programming', description: 'Code, snippets, and docs' },
      { name: 'Video Editing', description: 'Tutorials and reference files' },
      { name: 'Design', description: 'UI inspiration and assets' },
    ];

    const domains = [];
    for (const domainData of domainNames) {
      let domain = await Domain.findOne({ name: domainData.name });
      if (!domain) {
        domain = new Domain(domainData);
        await domain.save();
        console.log(`✅ Created domain: ${domainData.name}`);
      }
      domains.push(domain);
    }

    const programmingDomain = domains.find((d) => d.name === 'Programming');
    const videoDomain = domains.find((d) => d.name === 'Video Editing');

    // Create sample resources
    const existingResources = await Resource.countDocuments({ userId: user._id });
    if (existingResources === 0) {
      // Resource 1: Java Basics Notes
      const resource1 = new Resource({
        userId: user._id,
        domainId: programmingDomain ? programmingDomain._id : null,
        title: 'Java Basics Notes',
        description: 'Lecture slides and summary for Intro to Java.',
        type: 'FILE',
        filePath: path.basename(sampleFile),
        imagePath: null,
        url: null,
        purpose: 'Study',
        guideText: 'Read through the PDF, then practice each exercise in your IDE.',
        isFavorite: true,
        isPublic: true,
        status: 'APPROVED',
      });
      await resource1.save();

      // Resource 2: Premiere Pro Tutorial
      const resource2 = new Resource({
        userId: user._id,
        domainId: videoDomain ? videoDomain._id : null,
        title: 'Premiere Pro Tutorial',
        description: 'YouTube playlist for fast color grading tips.',
        type: 'LINK',
        filePath: null,
        imagePath: null,
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        purpose: 'Video Editing',
        guideText: 'Watch the first episode, practice with sample footage, then tweak color wheels.',
        isFavorite: false,
        isPublic: true,
        status: 'APPROVED',
      });
      await resource2.save();

      console.log('✅ Inserted sample resources.');
    } else {
      console.log('ℹ️  Sample resources already exist');
    }

    console.log('✅ Seeding complete.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seed();

