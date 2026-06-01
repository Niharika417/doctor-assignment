// backend/src/controllers/patientController.js
import PatientReport from '../models/PatientReport.js';
import PatientProfile from '../models/PatientProfile.js';

export const getDashboardStats = async (req, res) => {
  try {
    const totalReports = await PatientReport.countDocuments({ patientId: req.user.id });
    const pendingReports = await PatientReport.countDocuments({ 
      patientId: req.user.id,
      assignmentStatus: 'PENDING'
    });
    const assignedReports = await PatientReport.countDocuments({ 
      patientId: req.user.id,
      assignmentStatus: 'ASSIGNED'
    });
    const reviewedReports = await PatientReport.countDocuments({ 
      patientId: req.user.id,
      assignmentStatus: 'REVIEWED'
    });
    
    const recentReports = await PatientReport.find({ patientId: req.user.id })
      .sort('-createdAt')
      .limit(5);
    
    res.json({
      totalReports,
      pendingReports,
      assignedReports,
      reviewedReports,
      recentReports
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updatePatientProfile = async (req, res) => {
  try {
    const { age, gender, phone, address, bloodGroup, allergies, medicalHistory } = req.body;
    
    let profile = await PatientProfile.findOne({ userId: req.user.id });
    if (!profile) {
      profile = new PatientProfile({ userId: req.user.id });
    }
    
    if (age) profile.age = age;
    if (gender) profile.gender = gender;
    if (phone) profile.phone = phone;
    if (address) profile.address = address;
    if (bloodGroup) profile.bloodGroup = bloodGroup;
    if (allergies) profile.allergies = allergies;
    if (medicalHistory) profile.medicalHistory = medicalHistory;
    
    await profile.save();
    res.json({ success: true, profile });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getPatientProfile = async (req, res) => {
  try {
    const profile = await PatientProfile.findOne({ userId: req.user.id });
    res.json(profile || {});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};