// backend/src/routes/patientRoutes.js
import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  getDashboardStats,
  updatePatientProfile,
  getPatientProfile
} from '../controllers/patientController.js';

const router = express.Router();

router.use(authenticate);
router.use(authorize('PATIENT'));

router.get('/dashboard/stats', getDashboardStats);
router.get('/profile', getPatientProfile);
router.put('/profile', updatePatientProfile);
