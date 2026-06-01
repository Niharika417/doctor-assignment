// backend/src/controllers/adminController.js
import PatientReport from '../models/PatientReport.js';
import DoctorProfile from '../models/DoctorProfile.js';
import User from '../models/User.js';
import PatientProfile from '../models/PatientProfile.js';
import bcrypt from 'bcryptjs';

export const getAllReports = async (req, res) => {
  try {
    const reports = await PatientReport.find()
      .populate('patientId', 'name email')
      .populate('assignedDoctor')
      .populate('reviewedByDoctor', 'name')
      .sort('-createdAt');
    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getReportById = async (req, res) => {
  try {
    const report = await PatientReport.findById(req.params.id)
      .populate('patientId', 'name email phone')
      .populate('assignedDoctor')
      .populate('reviewedByDoctor', 'name');
    
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    res.json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const assignDoctorToReport = async (req, res) => {
  try {
    const { doctorId } = req.body;
    const report = await PatientReport.findById(req.params.id);
    
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    report.assignedDoctor = doctorId;
    report.assignmentStatus = 'ASSIGNED';
    await report.save();
    
    res.json({ success: true, report });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllPatients = async (req, res) => {
  try {
    const patients = await User.find({ role: 'PATIENT' })
      .select('-password')
      .lean();
    
    const patientsWithProfiles = await Promise.all(
      patients.map(async (patient) => {
        const profile = await PatientProfile.findOne({ userId: patient._id });
        return { ...patient, profile };
      })
    );
    
    res.json(patientsWithProfiles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllDoctors = async (req, res) => {
  try {
    const doctors = await DoctorProfile.find()
      .populate('userId', 'name email')
      .sort('specialization');
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createDoctor = async (req, res) => {
  try {
    const { email, password, name, specialization, experience, qualification, consultationFee } = req.body;
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      email,
      password: hashedPassword,
      name,
      role: 'DOCTOR'
    });
    await user.save();
    
    const doctor = new DoctorProfile({
      userId: user._id,
      specialization,
      experience: parseInt(experience),
      qualification,
      consultationFee: consultationFee ? parseInt(consultationFee) : 0,
      isAvailable: true
    });
    await doctor.save();
    
    res.status(201).json({ success: true, doctor });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateDoctor = async (req, res) => {
  try {
    const { isAvailable, specialization, experience, qualification } = req.body;
    const doctor = await DoctorProfile.findById(req.params.id);
    
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }
    
    if (isAvailable !== undefined) doctor.isAvailable = isAvailable;
    if (specialization) doctor.specialization = specialization;
    if (experience) doctor.experience = experience;
    if (qualification) doctor.qualification = qualification;
    
    await doctor.save();
    res.json({ success: true, doctor });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteDoctor = async (req, res) => {
  try {
    const doctor = await DoctorProfile.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }
    
    await User.findByIdAndDelete(doctor.userId);
    await DoctorProfile.findByIdAndDelete(req.params.id);
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};