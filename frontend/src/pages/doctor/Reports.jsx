import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Search, User, ArrowLeft, Eye, Clock, CheckCircle } from 'lucide-react';
import api from '../../services/api';

export default function DoctorReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const response = await api.get('/doctor/reports');
      setReports(response.data);
    } catch (error) {
      console.error('Failed to load reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'REVIEWED': return 'bg-green-100 text-green-700';
      default: return 'bg-yellow-100 text-yellow-700';
    }
  };

  const getStatusIcon = (status) => {
    return status === 'REVIEWED' ? <CheckCircle className="h-4 w-4" /> : <Clock className="h-4 w-4" />;
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch = (report.patientId?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || report.assignmentStatus === statusFilter;
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
          <Link to="/doctor/dashboard" className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition">
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Assigned Reports</h1>
            <p className="text-sm text-gray-500">Review and manage patient cases</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by patient name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Status</option>
            <option value="ASSIGNED">Pending Review</option>
            <option value="REVIEWED">Reviewed</option>
          </select>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {filteredReports.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No reports assigned</h3>
              <p className="text-gray-600">You don't have any reports assigned yet</p>
            </div>
          ) : (
            filteredReports.map((report) => (
              <Link key={report._id} to={`/doctor/reports/${report._id}`}>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="bg-blue-100 p-3 rounded-xl">
                        <FileText className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <User className="h-4 w-4 text-gray-400" />
                          <h3 className="font-semibold text-gray-900">{report.patientId?.name || 'Unknown Patient'}</h3>
                        </div>
                        <p className="text-sm text-gray-500 mb-2">{new Date(report.createdAt).toLocaleDateString()}</p>
                        {report.aiAnalysis && (
                          <p className="text-sm">
                            <span className="text-gray-500">AI Category:</span>{' '}
                            <span className="font-medium text-blue-600">{report.aiAnalysis.suggestedCategory}</span>
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(report.assignmentStatus)}`}>
                        {getStatusIcon(report.assignmentStatus)}
                        {report.assignmentStatus}
                      </span>
                      <Eye className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </main>
    </div>
  );
}