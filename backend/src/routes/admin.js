import express from 'express';
import bcrypt from 'bcryptjs';
import { authenticate, authorize } from '../middleware/auth.js';
import User from '../models/User.js';
import PatientReport from '../models/PatientReport.js';
import DoctorProfile from '../models/DoctorProfile.js';

const router = express.Router();

router.use(authenticate);
router.use(authorize('ADMIN'));

router.get('/dashboard/stats', async (req, res) => {
  const totalPatients = await User.countDocuments({ role: 'PATIENT' });
  const totalDoctors = await User.countDocuments({ role: 'DOCTOR' });
  const totalReports = await PatientReport.countDocuments();
  const pendingReports = await PatientReport.countDocuments({ assignmentStatus: 'PENDING' });
  
  res.json({ totalPatients, totalDoctors, totalReports, pendingReports });
});

router.get('/reports', async (req, res) => {
  const reports = await PatientReport.find()
    .populate('patientId', 'name email')
    .populate('assignedDoctor', 'name email')
    .sort('-createdAt');
  res.json(reports);
});

router.get('/reports/:id', async (req, res) => {
  const report = await PatientReport.findById(req.params.id)
    .populate('patientId', 'name email phone')
    .populate('assignedDoctor', 'name email specialization');
  
  if (!report) return res.status(404).json({ error: 'Report not found' });
  res.json(report);
});

router.patch('/reports/:id/assign-doctor', async (req, res) => {
  try {
    const { doctorId } = req.body;
    const report = await PatientReport.findById(req.params.id);
    if (!report) return res.status(404).json({ error: 'Report not found' });
    
    report.assignedDoctor = doctorId;
    report.assignmentStatus = 'ASSIGNED';
    await report.save();
    
    const doctorProfile = await DoctorProfile.findOne({ userId: doctorId });
    if (doctorProfile) {
      doctorProfile.totalPatients += 1;
      await doctorProfile.save();
    }
    
    res.json({ success: true, report });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/reports/:id/reanalyze', async (req, res) => {
  try {
    const report = await PatientReport.findById(req.params.id);
    if (!report) return res.status(404).json({ error: 'Report not found' });
    
    const textToAnalyze = (report.transcript + ' ' + (report.symptoms || '')).toLowerCase();
    
    const DOCTOR_CATEGORIES = {
      'General Physician': ['fever', 'cold', 'cough', 'weakness', 'fatigue', 'headache'],
      'Cardiologist': ['chest pain', 'heart', 'blood pressure', 'ecg', 'cardiac'],
      'Dermatologist': ['skin', 'rash', 'allergy', 'hair', 'acne'],
      'Orthopedic': ['bone', 'joint', 'fracture', 'x-ray', 'back pain']
    };
    
    let bestMatch = { category: 'General Physician', confidence: 0.5 };
    for (const [category, keywords] of Object.entries(DOCTOR_CATEGORIES)) {
      const matchedKeywords = keywords.filter(kw => textToAnalyze.includes(kw));
      if (matchedKeywords.length > 0) {
        bestMatch = { category, confidence: Math.min(0.9, 0.5 + matchedKeywords.length * 0.1) };
      }
    }
    
    report.aiAnalysis = {
      suggestedCategory: bestMatch.category,
      confidence: bestMatch.confidence,
      urgency: 'MEDIUM',
      reason: 'Re-analysis completed',
      keywords: [],
      manualReviewRequired: false
    };
    report.analysisSource = 'FALLBACK_RULE_ENGINE';
    await report.save();
    
    res.json({ success: true, analysis: report.aiAnalysis });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/doctors', async (req, res) => {
  const doctors = await User.find({ role: 'DOCTOR' }).select('-password');
  const doctorsWithProfiles = await Promise.all(doctors.map(async (doctor) => {
    const profile = await DoctorProfile.findOne({ userId: doctor._id });
    return { ...doctor.toObject(), profile };
  }));
  res.json(doctorsWithProfiles);
});

router.post('/doctors', async (req, res) => {
  try {
    const { email, password, name, specialization, experience, qualification, consultationFee } = req.body;
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hashedPassword, name, role: 'DOCTOR' });
    await user.save();
    
    const doctorProfile = new DoctorProfile({
      userId: user._id,
      specialization,
      experience: parseInt(experience),
      qualification,
      consultationFee: consultationFee ? parseInt(consultationFee) : 0
    });
    await doctorProfile.save();
    
    res.status(201).json({ success: true, doctor: { ...user.toObject(), profile: doctorProfile } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/doctors/:id', async (req, res) => {
  try {
    const { isAvailable, specialization, experience, qualification } = req.body;
    const doctorProfile = await DoctorProfile.findOne({ userId: req.params.id });
    
    if (!doctorProfile) return res.status(404).json({ error: 'Doctor not found' });
    
    if (isAvailable !== undefined) doctorProfile.isAvailable = isAvailable;
    if (specialization) doctorProfile.specialization = specialization;
    if (experience) doctorProfile.experience = experience;
    if (qualification) doctorProfile.qualification = qualification;
    
    await doctorProfile.save();
    res.json({ success: true, doctor: doctorProfile });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/doctors/:id', async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    await DoctorProfile.findOneAndDelete({ userId: req.params.id });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/patients', async (req, res) => {
  const patients = await User.find({ role: 'PATIENT' }).select('-password').sort('-createdAt');
  res.json(patients);
});

export default router;