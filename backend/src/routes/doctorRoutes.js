// backend/src/routes/doctorRoutes.js
import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  getAssignedReports,
  getReportDetails,
  markAsReviewed,
  getDoctorStats
} from '../controllers/doctorController.js';

const router = express.Router();

router.use(authenticate);
router.use(authorize('DOCTOR'));

router.get('/reports', getAssignedReports);
router.get('/reports/:id', getReportDetails);
router.patch('/reports/:id/mark-reviewed', markAsReviewed);
router.get('/stats', getDoctorStats);

export default router;