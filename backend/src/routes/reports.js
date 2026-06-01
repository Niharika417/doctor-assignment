import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticate, authorize } from '../middleware/auth.js';
import PatientReport from '../models/PatientReport.js';
import User from '../models/User.js';

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = process.env.UPLOAD_DIR || './uploads';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPG, PNG, and PDF are allowed.'));
  }
};

const upload = multer({ 
  storage, 
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});

router.use(authenticate);

router.post('/upload', authorize('PATIENT'), upload.single('file'), async (req, res) => {
  try {
    const { patientName, patientAge, patientGender, patientPhone, symptoms } = req.body;
    
    const report = new PatientReport({
      patientId: req.user.id,
      patientName,
      patientAge: parseInt(patientAge),
      patientGender,
      patientPhone,
      symptoms,
      fileName: req.file.originalname,
      filePath: req.file.path,
      fileType: req.file.mimetype,
      assignmentStatus: 'PENDING'
    });
    
    await report.save();
    res.status(201).json({ success: true, reportId: report._id, message: 'Report uploaded successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/extract-text', authorize('PATIENT'), async (req, res) => {
  try {
    const report = await PatientReport.findById(req.params.id);
    if (!report) return res.status(404).json({ error: 'Report not found' });
    
    let transcript = "";
    
    if (report.fileType === 'application/pdf') {
      try {
        const pdfParse = (await import('pdf-parse')).default;
        const dataBuffer = fs.readFileSync(report.filePath);
        const data = await pdfParse(dataBuffer);
        transcript = data.text;
      } catch (pdfError) {
        transcript = "PDF text extraction failed. Please enter transcript manually.";
      }
    } else if (report.fileType.startsWith('image/')) {
      try {
        const Tesseract = (await import('tesseract.js')).default;
        const result = await Tesseract.recognize(report.filePath, 'eng');
        transcript = result.data.text;
      } catch (ocrError) {
        transcript = "OCR extraction failed. Please enter transcript manually.";
      }
    }
    
    report.transcript = transcript;
    await report.save();
    
    res.json({ success: true, transcript });
  } catch (error) {
    res.status(500).json({ error: 'Text extraction failed. Please enter transcript manually.' });
  }
});

router.put('/:id/manual-transcript', authorize('PATIENT'), async (req, res) => {
  try {
    const { transcript } = req.body;
    const report = await PatientReport.findById(req.params.id);
    if (!report) return res.status(404).json({ error: 'Report not found' });
    
    report.manualTranscript = transcript;
    report.transcript = transcript;
    report.analysisSource = 'MANUAL';
    await report.save();
    
    res.json({ success: true, transcript });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const DOCTOR_CATEGORIES = {
  'General Physician': ['fever', 'cold', 'cough', 'weakness', 'fatigue', 'headache', 'flu', 'general', 'basic'],
  'Cardiologist': ['chest pain', 'heart', 'blood pressure', 'hypertension', 'ecg', 'cardiac', 'palpitations'],
  'Dermatologist': ['skin', 'rash', 'allergy', 'hair', 'acne', 'eczema', 'dermatitis'],
  'Orthopedic': ['bone', 'joint', 'fracture', 'x-ray', 'back pain', 'knee pain', 'arthritis', 'spine'],
  'Neurologist': ['brain', 'migraine', 'seizure', 'nerve', 'dizziness', 'memory', 'stroke'],
  'Gynecologist': ['pregnancy', 'menstrual', 'womens health', 'uterus', 'ovary'],
  'Pediatrician': ['child', 'baby', 'infant', 'pediatric', 'vaccination'],
  'ENT Specialist': ['ear', 'nose', 'throat', 'hearing', 'sinus', 'tonsils'],
  'Diabetologist': ['diabetes', 'blood sugar', 'insulin', 'glucose']
};

router.post('/:id/analyze', authorize('PATIENT'), async (req, res) => {
  try {
    const report = await PatientReport.findById(req.params.id);
    if (!report) return res.status(404).json({ error: 'Report not found' });
    
    const textToAnalyze = (report.transcript + ' ' + (report.symptoms || '')).toLowerCase();
    
    let bestMatch = { category: 'General Physician', confidence: 0.5, keywords: [], reason: '' };
    
    for (const [category, keywords] of Object.entries(DOCTOR_CATEGORIES)) {
      const matchedKeywords = keywords.filter(kw => textToAnalyze.includes(kw));
      if (matchedKeywords.length > bestMatch.keywords.length) {
        bestMatch = {
          category,
          confidence: Math.min(0.9, 0.5 + (matchedKeywords.length / keywords.length) * 0.4),
          keywords: matchedKeywords,
          reason: `Matched keywords: ${matchedKeywords.join(', ')}`
        };
      }
    }
    
    let urgency = 'MEDIUM';
    if (textToAnalyze.includes('emergency') || textToAnalyze.includes('critical') || textToAnalyze.includes('severe')) {
      urgency = 'CRITICAL';
    } else if (textToAnalyze.includes('urgent') || textToAnalyze.includes('immediate')) {
      urgency = 'HIGH';
    } else if (textToAnalyze.includes('routine') || textToAnalyze.includes('checkup')) {
      urgency = 'LOW';
    }
    
    const analysis = {
      suggestedCategory: bestMatch.category,
      confidence: bestMatch.confidence,
      urgency,
      reason: bestMatch.reason || 'General symptoms detected',
      keywords: bestMatch.keywords,
      manualReviewRequired: bestMatch.confidence < 0.6
    };
    
    report.aiAnalysis = analysis;
    report.analysisSource = 'FALLBACK_RULE_ENGINE';
    
    const doctor = await User.findOne({ role: 'DOCTOR' }).limit(1);
    if (doctor) {
      report.assignedDoctor = doctor._id;
      report.assignmentStatus = 'ASSIGNED';
    }
    
    await report.save();
    res.json({ success: true, analysis });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/my', authorize('PATIENT'), async (req, res) => {
  const reports = await PatientReport.find({ patientId: req.user.id })
    .populate('assignedDoctor', 'name email')
    .sort('-createdAt');
  res.json(reports);
});

router.get('/:id', async (req, res) => {
  const report = await PatientReport.findById(req.params.id)
    .populate('patientId', 'name email')
    .populate('assignedDoctor', 'name email')
    .populate('reviewedByDoctor', 'name');
  
  if (!report) return res.status(404).json({ error: 'Report not found' });
  
  if (req.user.role === 'PATIENT' && report.patientId._id.toString() !== req.user.id) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  res.json(report);
});

export default router;