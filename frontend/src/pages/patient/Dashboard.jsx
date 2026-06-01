import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FileText, Upload, Activity, Clock, CheckCircle, AlertCircle, TrendingUp, User } from 'lucide-react';
import api from '../../services/api';

export default function PatientDashboard() {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, assigned: 0, reviewed: 0 });

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const response = await api.get('/reports/my');
      setReports(response.data);
      
      const total = response.data.length;
      const pending = response.data.filter(r => r.assignmentStatus === 'PENDING').length;
      const assigned = response.data.filter(r => r.assignmentStatus === 'ASSIGNED').length;
      const reviewed = response.data.filter(r => r.assignmentStatus === 'REVIEWED').length;
      
      setStats({ total, pending, assigned, reviewed });
    } catch (error) {
      console.error('Failed to load reports:', error);
    }
  };

  const statCards = [
    { title: 'Total Reports', value: stats.total, icon: FileText, color: 'bg-blue-500', change: '+12%' },
    { title: 'Pending', value: stats.pending, icon: Clock, color: 'bg-yellow-500', change: stats.pending > 0 ? '+3' : '0' },
    { title: 'Assigned', value: stats.assigned, icon: Activity, color: 'bg-green-500', change: stats.assigned > 0 ? '+5' : '0' },
    { title: 'Reviewed', value: stats.reviewed, icon: CheckCircle, color: 'bg-purple-500', change: stats.reviewed > 0 ? '+2' : '0' },
  ];

  const recentReports = reports.slice(0, 5);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-xl">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Patient Dashboard</h1>
                <p className="text-sm text-gray-500">Welcome back, {user?.name}</p>
              </div>
            </div>
            <button
              onClick={() => {
                localStorage.removeItem('token');
                window.location.href = '/login';
              }}
              className="text-red-600 hover:text-red-700 text-sm font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => (
            <div key={stat.title} className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  <p className="text-xs text-green-600 mt-1">{stat.change} from last month</p>
                </div>
                <div className={`${stat.color} p-3 rounded-xl`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">Recent Reports</h2>
                <Link to="/patient/reports" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                  View All →
                </Link>
              </div>
              <div className="divide-y divide-gray-100">
                {recentReports.length === 0 ? (
                  <div className="p-12 text-center">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500">No reports yet</p>
                    <Link to="/patient/upload" className="text-blue-600 hover:text-blue-700 text-sm mt-2 inline-block">
                      Upload your first report →
                    </Link>
                  </div>
                ) : (
                  recentReports.map((report) => (
                    <Link key={report._id} to={`/patient/reports/${report._id}`} className="p-4 hover:bg-gray-50 transition flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="bg-blue-100 p-2 rounded-lg">
                          <FileText className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{report.fileName || 'Medical Report'}</p>
                          <p className="text-sm text-gray-500">{new Date(report.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          report.assignmentStatus === 'ASSIGNED' ? 'bg-green-100 text-green-700' :
                          report.assignmentStatus === 'REVIEWED' ? 'bg-blue-100 text-blue-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {report.assignmentStatus}
                        </span>
                        {report.aiAnalysis && (
                          <span className="text-xs text-gray-500">{report.aiAnalysis.suggestedCategory}</span>
                        )}
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          </div>
          
          <div className="space-y-6">
            <Link to="/patient/upload" className="block bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white hover:shadow-lg transition transform hover:scale-[1.02]">
              <Upload className="h-10 w-10 mb-3" />
              <h3 className="text-lg font-semibold mb-1">Upload Report</h3>
              <p className="text-blue-100 text-sm">Upload prescription or medical report for AI analysis</p>
            </Link>
            
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center space-x-2 mb-4">
                <User className="h-5 w-5 text-gray-400" />
                <h3 className="font-semibold text-gray-900">Profile Info</h3>
              </div>
              <div className="space-y-2 text-sm">
                <p><span className="text-gray-500">Name:</span> {user?.name}</p>
                <p><span className="text-gray-500">Email:</span> {user?.email}</p>
                <p><span className="text-gray-500">Role:</span> {user?.role}</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}