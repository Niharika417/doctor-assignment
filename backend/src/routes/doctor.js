import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import PatientReport from '../models/PatientReport.js';
import DoctorProfile from '../models/DoctorProfile.js';
import User from '../models/User.js';

const router = express.Router();

// Apply authentication and doctor role authorization to all routes
router.use(authenticate);
router.use(authorize('DOCTOR'));

// Get all reports assigned to this doctor
router.get('/reports', async (req, res) => {
  try {
    // Find the doctor profile for this user
    const doctorProfile = await DoctorProfile.findOne({ userId: req.user.id });
    if (!doctorProfile) {
      return res.status(404).json({ error: 'Doctor profile not found' });
    }
    
    // Find all reports assigned to this doctor
    const reports = await PatientReport.find({ assignedDoctor: req.user.id })
      .populate('patientId', 'name email')
      .populate('assignedDoctor', 'name email')
      .sort('-createdAt');
    
    res.json(reports);
  } catch (error) {
    console.error('Error fetching doctor reports:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get specific report details
router.get('/reports/:id', async (req, res) => {
  try {
    const report = await PatientReport.findById(req.params.id)
      .populate('patientId', 'name email phone')
      .populate('assignedDoctor', 'name email');
    
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    // Verify this report is assigned to the current doctor
    if (report.assignedDoctor?._id.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied. This report is not assigned to you.' });
    }
    
    res.json(report);
  } catch (error) {
    console.error('Error fetching report details:', error);
    res.status(500).json({ error: error.message });
  }
});

// Mark a report as reviewed
router.patch('/reports/:id/mark-reviewed', async (req, res) => {
  try {
    const { notes } = req.body;
    const report = await PatientReport.findById(req.params.id);
    
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    // Verify this report is assigned to the current doctor
    if (report.assignedDoctor?.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Update report status
    report.assignmentStatus = 'REVIEWED';
    report.reviewedByDoctor = req.user.id;
    report.reviewedAt = new Date();
    if (notes) {
      report.doctorNotes = notes;
    }
    
    await report.save();
    
    res.json({ 
      success: true, 
      message: 'Report marked as reviewed',
      report 
    });
  } catch (error) {
    console.error('Error marking report as reviewed:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get doctor statistics
router.get('/stats', async (req, res) => {
  try {
    // Find doctor profile
    const doctorProfile = await DoctorProfile.findOne({ userId: req.user.id })
      .populate('userId', 'name email');
    
    if (!doctorProfile) {
      return res.status(404).json({ error: 'Doctor profile not found' });
    }
    
    // Get report statistics
    const totalAssigned = await PatientReport.countDocuments({ assignedDoctor: req.user.id });
    const pendingReview = await PatientReport.countDocuments({ 
      assignedDoctor: req.user.id, 
      assignmentStatus: 'ASSIGNED' 
    });
    const completed = await PatientReport.countDocuments({ 
      assignedDoctor: req.user.id, 
      assignmentStatus: 'REVIEWED' 
    });
    
    res.json({
      totalAssigned,
      pendingReview,
      completed,
      profile: {
        name: doctorProfile.userId?.name,
        specialization: doctorProfile.specialization,
        experience: doctorProfile.experience,
        qualification: doctorProfile.qualification,
        isAvailable: doctorProfile.isAvailable
      }
    });
  } catch (error) {
    console.error('Error fetching doctor stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get doctor profile
router.get('/profile', async (req, res) => {
  try {
    const doctorProfile = await DoctorProfile.findOne({ userId: req.user.id })
      .populate('userId', 'name email');
    
    if (!doctorProfile) {
      return res.status(404).json({ error: 'Doctor profile not found' });
    }
    
    res.json(doctorProfile);
  } catch (error) {
    console.error('Error fetching doctor profile:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update doctor profile
router.patch('/profile', async (req, res) => {
  try {
    const { specialization, experience, qualification, isAvailable } = req.body;
    
    const doctorProfile = await DoctorProfile.findOne({ userId: req.user.id });
    if (!doctorProfile) {
      return res.status(404).json({ error: 'Doctor profile not found' });
    }
    
    if (specialization) doctorProfile.specialization = specialization;
    if (experience) doctorProfile.experience = experience;
    if (qualification) doctorProfile.qualification = qualification;
    if (isAvailable !== undefined) doctorProfile.isAvailable = isAvailable;
    
    await doctorProfile.save();
    
    res.json({ success: true, profile: doctorProfile });
  } catch (error) {
    console.error('Error updating doctor profile:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;