import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, User, Calendar, Activity, AlertCircle, CheckCircle, Stethoscope } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function DoctorReportDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState('');
  const [markingReviewed, setMarkingReviewed] = useState(false);

  useEffect(() => {
    loadReport();
  }, [id]);

  const loadReport = async () => {
    try {
      const response = await api.get(`/doctor/reports/${id}`);
      setReport(response.data);
      setNotes(response.data.doctorNotes || '');
    } catch (error) {
      console.error('Failed to load report:', error);
      toast.error('Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkReviewed = async () => {
    setMarkingReviewed(true);
    try {
      await api.patch(`/doctor/reports/${id}/mark-reviewed`, { notes });
      toast.success('Report marked as reviewed');
      navigate('/doctor/reports');
    } catch (error) {
      toast.error('Failed to mark as reviewed');
    } finally {
      setMarkingReviewed(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ASSIGNED': return 'bg-yellow-100 text-yellow-700';
      case 'REVIEWED': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
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
          <button onClick={() => navigate('/doctor/reports')} className="mt-4 text-blue-600">Go back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <button onClick={() => navigate('/doctor/reports')} className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition">
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Patient Report</h1>
              <p className="text-sm text-gray-500">Review and provide feedback</p>
            </div>
          </div>
          {report.assignmentStatus === 'ASSIGNED' && (
            <button
              onClick={handleMarkReviewed}
              disabled={markingReviewed}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
            >
              <CheckCircle className="h-4 w-4" />
              <span>{markingReviewed ? 'Processing...' : 'Mark as Reviewed'}</span>
            </button>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Report Information</h2>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(report.assignmentStatus)}`}>
                {report.assignmentStatus}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <User className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Patient Name</p>
                  <p className="font-medium">{report.patientId?.name || 'Unknown'}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Report Date</p>
                  <p className="font-medium">{new Date(report.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <FileText className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">File Name</p>
                  <p className="font-medium">{report.fileName || 'Medical Report'}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Stethoscope className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">AI Category</p>
                  <p className="font-medium text-blue-600">{report.aiAnalysis?.suggestedCategory}</p>
                </div>
              </div>
            </div>
          </div>

          {report.symptoms && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Patient Symptoms</h2>
              <p className="text-gray-700">{report.symptoms}</p>
            </div>
          )}

          {report.aiAnalysis && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">AI Analysis</h2>
              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-2">Reason for Assignment</p>
                <p className="text-gray-700">{report.aiAnalysis.reason}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Confidence</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: `${report.aiAnalysis.confidence * 100}%` }} />
                    </div>
                    <span className="text-sm font-semibold">{(report.aiAnalysis.confidence * 100).toFixed(0)}%</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Urgency</p>
                  <p className={`font-semibold ${
                    report.aiAnalysis.urgency === 'CRITICAL' ? 'text-red-600' :
                    report.aiAnalysis.urgency === 'HIGH' ? 'text-orange-600' :
                    report.aiAnalysis.urgency === 'MEDIUM' ? 'text-yellow-600' : 'text-green-600'
                  }`}>{report.aiAnalysis.urgency}</p>
                </div>
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
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Extracted Report Text</h2>
              <div className="bg-gray-50 p-4 rounded-lg max-h-64 overflow-y-auto">
                <p className="text-gray-700 whitespace-pre-wrap">{report.transcript}</p>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Doctor's Notes</h2>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows="4"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Add your observations and recommendations here..."
              disabled={report.assignmentStatus === 'REVIEWED'}
            />
            {report.assignmentStatus === 'REVIEWED' && report.reviewedAt && (
              <p className="text-sm text-gray-500 mt-2">Reviewed on {new Date(report.reviewedAt).toLocaleString()}</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}