import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Search, Filter, Clock, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import api from '../../services/api';

export default function PatientReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const response = await api.get('/reports/my');
      setReports(response.data);
    } catch (error) {
      console.error('Failed to load reports:', error);
    } finally {
      setLoading(false);
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

  const getStatusIcon = (status) => {
    switch (status) {
      case 'ASSIGNED': return <CheckCircle className="h-4 w-4" />;
      case 'REVIEWED': return <Clock className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch = (report.fileName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (report.aiAnalysis?.suggestedCategory || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'ALL' || report.assignmentStatus === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="loader"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center">
          <Link to="/patient/dashboard" className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition">
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">My Reports</h1>
            <p className="text-sm text-gray-500">View all your medical reports and their status</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by file name or doctor category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="REVIEWED">Reviewed</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>

        {filteredReports.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No reports found</h3>
            <p className="text-gray-600">
              {searchTerm || filterStatus !== 'ALL' ? "No reports match your search criteria" : "You haven't uploaded any reports yet"}
            </p>
            {(!searchTerm && filterStatus === 'ALL') && (
              <Link to="/patient/upload" className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Upload Your First Report
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredReports.map((report) => (
              <Link key={report._id} to={`/patient/reports/${report._id}`}>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition hover:scale-[1.02] overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="bg-blue-100 p-3 rounded-xl">
                        <FileText className="h-6 w-6 text-blue-600" />
                      </div>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(report.assignmentStatus)}`}>
                        {getStatusIcon(report.assignmentStatus)}
                        {report.assignmentStatus}
                      </span>
                    </div>
                    
                    <h3 className="font-semibold text-gray-900 mb-1 truncate">
                      {report.fileName || 'Medical Report'}
                    </h3>
                    
                    <p className="text-sm text-gray-500 mb-3">
                      {new Date(report.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric', month: 'short', day: 'numeric'
                      })}
                    </p>
                    
                    {report.aiAnalysis && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-gray-600">Assigned to:</span>
                          <span className="font-medium text-blue-600">{report.aiAnalysis.suggestedCategory}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                          <span>Confidence</span>
                          <span>{(report.aiAnalysis.confidence * 100).toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${report.aiAnalysis.confidence * 100}%` }} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}