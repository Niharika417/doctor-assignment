import mongoose from 'mongoose';

const patientReportSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  patientName: String,
  patientAge: Number,
  patientGender: String,
  patientPhone: String,
  symptoms: String,
  fileName: String,
  filePath: String,
  fileType: String,
  transcript: String,
  manualTranscript: String,
  aiAnalysis: {
    suggestedCategory: String,
    confidence: Number,
    urgency: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
    reason: String,
    keywords: [String],
    manualReviewRequired: Boolean
  },
  assignedDoctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignmentStatus: { type: String, enum: ['PENDING', 'ASSIGNED', 'REVIEWED', 'COMPLETED'], default: 'PENDING' },
  analysisSource: { type: String, enum: ['GEMINI_AI', 'FALLBACK_RULE_ENGINE', 'MANUAL'], default: 'PENDING' },
  doctorNotes: String,
  reviewedByDoctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: Date,
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('PatientReport', patientReportSchema);