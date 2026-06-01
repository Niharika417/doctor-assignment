import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';

import Login from './pages/Login';
import Register from './pages/Register';

import PatientDashboard from './pages/patient/Dashboard';
import PatientUploadReport from './pages/patient/UploadReport';
import PatientReports from './pages/patient/Reports';
import PatientReportDetail from './pages/patient/ReportDetail';

import AdminDashboard from './pages/admin/Dashboard';
import AdminReports from './pages/admin/Reports';
import AdminReportDetail from './pages/admin/ReportDetail';
import AdminDoctors from './pages/admin/Doctors';
import AdminPatients from './pages/admin/Patients';

import DoctorDashboard from './pages/doctor/Dashboard';
import DoctorReports from './pages/doctor/Reports';
import DoctorReportDetail from './pages/doctor/ReportDetail';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Patient Routes */}
          <Route element={<PrivateRoute allowedRoles={['PATIENT']} />}>
            <Route path="/patient/dashboard" element={<PatientDashboard />} />
            <Route path="/patient/upload" element={<PatientUploadReport />} />
            <Route path="/patient/reports" element={<PatientReports />} />
            <Route path="/patient/reports/:id" element={<PatientReportDetail />} />
          </Route>
          
          {/* Admin Routes */}
          <Route element={<PrivateRoute allowedRoles={['ADMIN']} />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/reports" element={<AdminReports />} />
            <Route path="/admin/reports/:id" element={<AdminReportDetail />} />
            <Route path="/admin/doctors" element={<AdminDoctors />} />
            <Route path="/admin/patients" element={<AdminPatients />} />
          </Route>
          
          {/* Doctor Routes */}
          <Route element={<PrivateRoute allowedRoles={['DOCTOR']} />}>
            <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
            <Route path="/doctor/reports" element={<DoctorReports />} />
            <Route path="/doctor/reports/:id" element={<DoctorReportDetail />} />
          </Route>
          
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;