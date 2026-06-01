import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from './models/User.js';
import DoctorProfile from './models/DoctorProfile.js';

dotenv.config();

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    await User.deleteMany({});
    await DoctorProfile.deleteMany({});
    
    const adminPassword = await bcrypt.hash('admin123', 10);
    await User.create({
      email: 'admin@shotlin.com',
      password: adminPassword,
      name: 'System Administrator',
      role: 'ADMIN'
    });
    
    const doctors = [
      { name: 'Dr. Sarah Smith', email: 'sarah.smith@hospital.com', specialization: 'General Physician', experience: 8, qualification: 'MD, Family Medicine' },
      { name: 'Dr. Michael Johnson', email: 'michael.johnson@hospital.com', specialization: 'Cardiologist', experience: 12, qualification: 'MD, Cardiology' },
      { name: 'Dr. Emily Williams', email: 'emily.williams@hospital.com', specialization: 'Dermatologist', experience: 6, qualification: 'MD, Dermatology' },
      { name: 'Dr. James Brown', email: 'james.brown@hospital.com', specialization: 'Orthopedic', experience: 10, qualification: 'MS, Orthopedics' },
      { name: 'Dr. Lisa Garcia', email: 'lisa.garcia@hospital.com', specialization: 'Neurologist', experience: 7, qualification: 'MD, Neurology' },
      { name: 'Dr. Robert Wilson', email: 'robert.wilson@hospital.com', specialization: 'Gynecologist', experience: 9, qualification: 'MD, Gynecology' }
    ];
    
    for (const doc of doctors) {
      const hashedPassword = await bcrypt.hash('doctor123', 10);
      const user = await User.create({
        email: doc.email,
        password: hashedPassword,
        name: doc.name,
        role: 'DOCTOR'
      });
      await DoctorProfile.create({
        userId: user._id,
        specialization: doc.specialization,
        experience: doc.experience,
        qualification: doc.qualification,
        isAvailable: true
      });
    }
    
    const patientPassword = await bcrypt.hash('patient123', 10);
    await User.create({
      email: 'patient@example.com',
      password: patientPassword,
      name: 'John Doe',
      role: 'PATIENT'
    });
    
    console.log('\n✅ Database seeded successfully!\n');
    console.log('📋 Test Credentials:');
    console.log('═'.repeat(50));
    console.log('👑 ADMIN:');
    console.log('   Email: admin@shotlin.com');
    console.log('   Password: admin123\n');
    console.log('👨‍⚕️ DOCTORS:');
    console.log('   Email: sarah.smith@hospital.com / doctor123');
    console.log('   Email: michael.johnson@hospital.com / doctor123');
    console.log('   Email: emily.williams@hospital.com / doctor123\n');
    console.log('👤 PATIENT:');
    console.log('   Email: patient@example.com');
    console.log('   Password: patient123\n');
    console.log('═'.repeat(50));
    
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
}

seed();