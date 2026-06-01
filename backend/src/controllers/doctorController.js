// backend/src/controllers/doctorController.js
import PatientReport from '../models/PatientReport.js';
import DoctorProfile from '../models/DoctorProfile.js';

export const getAssignedReports = async (req, res) => {
  try {
    const doctor = await DoctorProfile.findOne({ userId: req.user.id });
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor profile not found' });
    }
    
    const reports = await PatientReport.find({ 
      assignedDoctor: doctor._id 
    })
    .populate('patientId', 'name email')
    .sort('-createdAt');
    
    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getReportDetails = async (req, res) => {
  try {
    const doctor = await DoctorProfile.findOne({ userId: req.user.id });
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor profile not found' });
    }
    
    const report = await PatientReport.findById(req.params.id)
      .populate('patientId', 'name email phone')
      .populate('assignedDoctor');
    
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    // Check if this report is assigned to this doctor
    if (report.assignedDoctor?._id.toString() !== doctor._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    res.json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const markAsReviewed = async (req, res) => {
  try {
    const { notes } = req.body;
    const doctor = await DoctorProfile.findOne({ userId: req.user.id });
    
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor profile not found' });
    }
    
    const report = await PatientReport.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    if (report.assignedDoctor?.toString() !== doctor._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    report.assignmentStatus = 'REVIEWED';
    report.reviewedByDoctor = req.user.id;
    report.reviewedAt = new Date();
    report.doctorNotes = notes;
    await report.save();
    
    res.json({ success: true, report });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getDoctorStats = async (req, res) => {
  try {
    const doctor = await DoctorProfile.findOne({ userId: req.user.id });
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor profile not found' });
    }
    
    const totalAssigned = await PatientReport.countDocuments({ assignedDoctor: doctor._id });
    const pendingReview = await PatientReport.countDocuments({ 
      assignedDoctor: doctor._id,
      assignmentStatus: 'ASSIGNED'
    });
    const completed = await PatientReport.countDocuments({ 
      assignedDoctor: doctor._id,
      assignmentStatus: 'REVIEWED'
    });
    
    res.json({
      totalAssigned,
      pendingReview,
      completed,
      profile: doctor
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};