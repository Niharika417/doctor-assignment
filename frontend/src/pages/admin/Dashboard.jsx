import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Stethoscope, FileText, Clock, TrendingUp, Activity } from 'lucide-react';
import api from '../../services/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ totalPatients: 0, totalDoctors: 0, totalReports: 0, pendingReports: 0 });
  const [recentReports, setRecentReports] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, reportsRes, doctorsRes, patientsRes] = await Promise.all([
        api.get('/admin/dashboard/stats'),
        api.get('/admin/reports'),
        api.get('/admin/doctors'),
        api.get('/admin/patients')
      ]);
      
      setStats(statsRes.data);
      setRecentReports(reportsRes.data.slice(0, 5));
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const statCards = [
    { title: 'Total Patients', value: stats.totalPatients, icon: Users, color: 'bg-blue-500', change: '+12%' },
    { title: 'Total Doctors', value: stats.totalDoctors, icon: Stethoscope, color: 'bg-purple-500', change: '+5%' },
    { title: 'Total Reports', value: stats.totalReports, icon: FileText, color: 'bg-green-500', change: '+23%' },
    { title: 'Pending Assignments', value: stats.pendingReports, icon: Clock, color: 'bg-yellow-500', change: '-8%' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-sm text-gray-500">System overview and management</p>
          </div>
          <button onClick={() => { localStorage.removeItem('token'); window.location.href = '/login'; }} className="text-red-600">
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => (
            <div key={stat.title} className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
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

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Recent Reports</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {recentReports.map(report => (
                <Link key={report._id} to={`/admin/reports/${report._id}`} className="p-4 hover:bg-gray-50 transition flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-900">{report.patientId?.name || 'Unknown'}</p>
                    <p className="text-sm text-gray-500">{report.fileName || 'Medical Report'}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${report.assignmentStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                    {report.assignmentStatus}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <Link to="/admin/doctors" className="block bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white hover:shadow-lg transition">
              <Stethoscope className="h-10 w-10 mb-3" />
              <h3 className="text-lg font-semibold mb-1">Manage Doctors</h3>
              <p className="text-blue-100 text-sm">Add, edit, or remove doctor profiles</p>
            </Link>
            <Link to="/admin/reports" className="block bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl p-6 text-white hover:shadow-lg transition">
              <FileText className="h-10 w-10 mb-3" />
              <h3 className="text-lg font-semibold mb-1">Review All Reports</h3>
              <p className="text-green-100 text-sm">View and manually assign reports</p>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}