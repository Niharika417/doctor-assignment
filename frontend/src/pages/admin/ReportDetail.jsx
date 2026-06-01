import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, User, Calendar, Activity, AlertCircle, CheckCircle, Clock, Stethoscope } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function AdminReportDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [doctors, setDoctors] = useState([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');

  useEffect(() => {
    loadReport();
    loadDoctors();
  }, [id]);

  const loadReport = async () => {
    try {
      const response = await api.get(`/admin/reports/${id}`);
      setReport(response.data);
    } catch (error) {
      console.error('Failed to load report:', error);
      toast.error('Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  const loadDoctors = async () => {
    try {
      const response = await api.get('/admin/doctors');
      setDoctors(response.data);
    } catch (error) {
      console.error('Failed to load doctors:', error);
    }
  };

  const handleAssignDoctor = async () => {
    if (!selectedDoctorId) {
      toast.error('Please select a doctor');
      return;
    }
    
    try {
      await api.patch(`/admin/reports/${id}/assign-doctor`, { doctorId: selectedDoctorId });
      toast.success('Doctor assigned successfully');
      setShowAssignModal(false);
      loadReport();
    } catch (error) {
      toast.error('Failed to assign doctor');
    }
  };

  const handleReanalyze = async () => {
    try {
      toast.loading('Re-analyzing report...', { id: 'reanalyze' });
      await api.post(`/admin/reports/${id}/reanalyze`);
      toast.success('Report re-analyzed successfully', { id: 'reanalyze' });
      loadReport();
    } catch (error) {
      toast.error('Failed to re-analyze', { id: 'reanalyze' });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ASSIGNED': return 'bg-green-100 text-green-700';
      case 'REVIEWED': return 'bg-blue-100 text-blue-700';
      case 'COMPLETED': return 'bg-purple-100 text-purple-700';
      default: return 'bg-yellow-100 text-yellow-700';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="loader"></div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900">Report not found</h2>
          <button onClick={() => navigate('/admin/reports')} className="mt-4 text-blue-600">Go back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <button onClick={() => navigate('/admin/reports')} className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition">
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Report Details</h1>
              <p className="text-sm text-gray-500">Admin View</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleReanalyze}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
            >
              Re-analyze
            </button>
            <button
              onClick={() => setShowAssignModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
            >
              Assign Doctor
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Report Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <FileText className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">File Name</p>
                  <p className="font-medium">{report.fileName || 'Medical Report'}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Upload Date</p>
                  <p className="font-medium">{new Date(report.createdAt).toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <User className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Patient</p>
                  <p className="font-medium">{report.patientId?.name || 'Unknown'}</p>
                  <p className="text-xs text-gray-500">{report.patientId?.email}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Activity className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(report.assignmentStatus)}`}>
                    {report.assignmentStatus}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {report.symptoms && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Symptoms</h2>
              <p className="text-gray-700">{report.symptoms}</p>
            </div>
          )}

          {report.aiAnalysis && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">AI Analysis Results</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="bg-blue-50 p-4 rounded-xl">
                  <p className="text-sm text-gray-500 mb-1">Suggested Category</p>
                  <p className="text-2xl font-bold text-blue-600">{report.aiAnalysis.suggestedCategory}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-xl">
                  <p className="text-sm text-gray-500 mb-1">Confidence</p>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: `${report.aiAnalysis.confidence * 100}%` }} />
                    </div>
                    <span className="font-bold">{(report.aiAnalysis.confidence * 100).toFixed(0)}%</span>
                  </div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-xl">
                  <p className="text-sm text-gray-500 mb-1">Urgency Level</p>
                  <p className="text-xl font-bold text-orange-600">{report.aiAnalysis.urgency}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-xl">
                  <p className="text-sm text-gray-500 mb-1">Analysis Source</p>
                  <p className="text-sm font-semibold text-purple-600">{report.analysisSource}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-2">Reason for Assignment</p>
                <p className="text-gray-700">{report.aiAnalysis.reason}</p>
              </div>
            </div>
          )}

          {report.assignedDoctor && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Assigned Doctor</h2>
              <div className="flex items-center space-x-4">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold">
                  {report.assignedDoctor.name?.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{report.assignedDoctor.name}</p>
                  <p className="text-sm text-gray-500">{report.assignedDoctor.email}</p>
                </div>
              </div>
            </div>
          )}

          {report.transcript && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Extracted Transcript</h2>
              <div className="bg-gray-50 p-4 rounded-lg max-h-64 overflow-y-auto">
                <p className="text-gray-700 whitespace-pre-wrap">{report.transcript}</p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Assign Doctor Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Assign Doctor</h2>
              <p className="text-sm text-gray-600 mt-1">Select a doctor to assign this report</p>
            </div>
            <div className="p-6">
              <select
                value={selectedDoctorId}
                onChange={(e) => setSelectedDoctorId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a doctor...</option>
                {doctors.map(doctor => (
                  <option key={doctor._id} value={doctor._id}>
                    {doctor.name} - {doctor.specialization || 'Doctor'}
                  </option>
                ))}
              </select>
            </div>
            <div className="p-6 border-t border-gray-100 flex space-x-3">
              <button
                onClick={() => setShowAssignModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignDoctor}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Assign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}