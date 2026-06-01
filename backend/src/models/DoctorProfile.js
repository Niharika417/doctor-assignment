import mongoose from 'mongoose';

const doctorProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  specialization: { type: String, required: true },
  experience: Number,
  qualification: String,
  consultationFee: Number,
  isAvailable: { type: Boolean, default: true },
  rating: { type: Number, default: 4.5 },
  totalPatients: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model('DoctorProfile', doctorProfileSchema);