// backend/src/controllers/reportController.js
import PatientReport from '../models/PatientReport.js';
import PatientProfile from '../models/PatientProfile.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import OCRService from '../services/ocrService.js';
import ClassificationService from '../services/classificationService.js';
import AssignmentService from '../services/assignmentService.js';

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
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

export const upload = multer({ 
  storage, 
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

export const uploadReport = async (req, res) => {
  try {
    const { patientName, patientAge, patientGender, patientPhone, symptoms } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const report = new PatientReport({
      patientId: req.user.id,
      patientName,
      patientAge: parseInt(patientAge),
      patientGender,
      patientPhone,
      symptoms,
      fileName: file.originalname,
      filePath: file.path,
      fileType: file.mimetype,
      assignmentStatus: 'PENDING'
    });

    await report.save();
    res.status(201).json({ success: true, reportId: report._id, message: 'Report uploaded successfully' });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const extractText = async (req, res) => {
  try {
    const report = await PatientReport.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // Check authorization
    if (req.user.role === 'PATIENT' && report.patientId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const transcript = await OCRService.extractText(report.filePath, report.fileType);
    report.transcript = transcript;
    await report.save();

    res.json({ success: true, transcript });
  } catch (error) {
    console.error('Extraction error:', error);
    res.status(500).json({ error: 'Text extraction failed. Please enter transcript manually.' });
  }
};

export const updateManualTranscript = async (req, res) => {
  try {
    const { transcript } = req.body;
    const report = await PatientReport.findById(req.params.id);
    
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    report.manualTranscript = transcript;
    report.transcript = transcript;
    await report.save();

    res.json({ success: true, transcript });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const analyzeReport = async (req, res) => {
  try {
    const report = await PatientReport.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    const textToAnalyze = report.transcript || report.manualTranscript || report.symptoms || '';
    
    if (!textToAnalyze) {
      return res.status(400).json({ error: 'No text available for analysis' });
    }

    const analysis = await ClassificationService.classifyReport(textToAnalyze, report.symptoms);
    
    report.aiAnalysis = analysis;
    report.analysisSource = process.env.USE_GEMINI === 'true' ? 'GEMINI_AI' : 'FALLBACK_RULE_ENGINE';
    await report.save();

    // Auto-assign doctor if confidence is high
    if (analysis.confidence > 0.7 && !analysis.manualReviewRequired) {
      await AssignmentService.assignDoctor(report._id, analysis.suggestedCategory);
    }

    res.json({ success: true, analysis });
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getMyReports = async (req, res) => {
  try {
    const reports = await PatientReport.find({ patientId: req.user.id })
      .populate('assignedDoctor')
      .sort('-createdAt');
    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getReportById = async (req, res) => {
  try {
    const report = await PatientReport.findById(req.params.id)
      .populate('patientId', 'name email')
      .populate('assignedDoctor')
      .populate('reviewedByDoctor', 'name');

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // Check authorization
    if (req.user.role === 'PATIENT' && report.patientId._id.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    res.json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};