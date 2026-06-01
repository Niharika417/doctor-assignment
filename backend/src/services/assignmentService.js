// backend/src/services/assignmentService.js
import DoctorProfile from '../models/DoctorProfile.js';
import PatientReport from '../models/PatientReport.js';

export class AssignmentService {
  async assignDoctor(reportId, suggestedCategory = null) {
    const report = await PatientReport.findById(reportId);
    if (!report) throw new Error('Report not found');

    const category = suggestedCategory || report.aiAnalysis?.suggestedCategory;
    if (!category) throw new Error('No category specified');

    // Find available doctors in the category
    const doctors = await DoctorProfile.find({
      specialization: category,
      isAvailable: true
    }).populate('userId');

    if (doctors.length === 0) {
      // No doctor available, mark for manual assignment
      report.assignmentStatus = 'PENDING';
      await report.save();
      return { assigned: false, message: 'No doctors available in this category' };
    }

    // Simple round-robin assignment
    const doctor = doctors[0];
    
    report.assignedDoctor = doctor._id;
    report.assignmentStatus = 'ASSIGNED';
    await report.save();

    // Update doctor stats
    doctor.totalPatients += 1;
    await doctor.save();

    return {
      assigned: true,
      doctorId: doctor._id,
      doctorName: doctor.userId.name,
      specialization: doctor.specialization
    };
  }

  async getAvailableDoctorsByCategory() {
    const doctors = await DoctorProfile.find({ isAvailable: true })
      .populate('userId', 'name email');
    
    const grouped = {};
    doctors.forEach(doctor => {
      if (!grouped[doctor.specialization]) {
        grouped[doctor.specialization] = [];
      }
      grouped[doctor.specialization].push({
        id: doctor._id,
        name: doctor.userId.name,
        experience: doctor.experience,
        qualification: doctor.qualification
      });
    });
    
    return grouped;
  }
}

export default new AssignmentService();