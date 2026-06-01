import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FileText, ArrowLeft, Download, Calendar, User, Phone, Activity, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import api from '../../services/api';

export default function PatientReportDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReport();
  }, [id]);

  const loadReport = async () => {
    try {
      const response = await api.get(`/reports/${id}`);
      setReport(response.data);
    } catch (error) {
      console.error('Failed to load report:', error);
    } finally {
      setLoading(false);
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
          <button onClick={() => navigate('/patient/reports')} className="mt-4 text-blue-600">Go back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center">
          <button onClick={() => navigate('/patient/reports')} className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition">
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Report Details</h1>
            <p className="text-sm text-gray-500">{report.fileName || 'Medical Report'}</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Report Information</h2>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                report.assignmentStatus === 'ASSIGNED' ? 'bg-green-100 text-green-700' :
                report.assignmentStatus === 'REVIEWED' ? 'bg-blue-100 text-blue-700' :
                'bg-yellow-100 text-yellow-700'
              }`}>
                {report.assignmentStatus}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Upload Date</p>
                  <p className="font-medium">{new Date(report.createdAt).toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <FileText className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">File Name</p>
                  <p className="font-medium">{report.fileName}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <User className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Patient Name</p>
                  <p className="font-medium">{report.patientName || report.patientId?.name}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Contact</p>
                  <p className="font-medium">{report.patientPhone || 'Not provided'}</p>
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
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-xl">
                  <p className="text-sm text-gray-500 mb-1">Suggested Category</p>
                  <p className="text-2xl font-bold text-blue-600">{report.aiAnalysis.suggestedCategory}</p>
                </div>
                <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-xl">
                  <p className="text-sm text-gray-500 mb-1">Confidence</p>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: `${report.aiAnalysis.confidence * 100}%` }} />
                    </div>
                    <span className="font-bold">{(report.aiAnalysis.confidence * 100).toFixed(0)}%</span>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-xl">
                  <p className="text-sm text-gray-500 mb-1">Urgency Level</p>
                  <p className="text-xl font-bold text-orange-600">{report.aiAnalysis.urgency}</p>
                </div>
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-xl">
                  <p className="text-sm text-gray-500 mb-1">Analysis Source</p>
                  <p className="text-sm font-semibold text-purple-600">{report.analysisSource}</p>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm text-gray-500 mb-2">Reason for Assignment</p>
                <p className="text-gray-700">{report.aiAnalysis.reason}</p>
              </div>
              {report.aiAnalysis.keywords && report.aiAnalysis.keywords.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-gray-500 mb-2">Detected Keywords</p>
                  <div className="flex flex-wrap gap-2">
                    {report.aiAnalysis.keywords.map((keyword, i) => (
                      <span key={i} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">{keyword}</span>
                    ))}
                  </div>
                </div>
              )}
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
                  {report.assignedDoctor.specialization && (
                    <p className="text-sm text-blue-600 mt-1">{report.assignedDoctor.specialization}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {report.doctorNotes && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Doctor's Notes</h2>
              <p className="text-gray-700">{report.doctorNotes}</p>
              {report.reviewedAt && (
                <p className="text-sm text-gray-500 mt-2">Reviewed on {new Date(report.reviewedAt).toLocaleString()}</p>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}