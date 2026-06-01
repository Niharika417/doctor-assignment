// backend/src/models/PatientProfile.js
import mongoose from 'mongoose';

const patientProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  age: Number,
  gender: {
    type: String,
    enum: ['MALE', 'FEMALE', 'OTHER']
  },
  phone: String,
  address: String,
  bloodGroup: String,
  allergies: [String],
  medicalHistory: String
}, { timestamps: true });

export default mongoose.model('PatientProfile', patientProfileSchema);