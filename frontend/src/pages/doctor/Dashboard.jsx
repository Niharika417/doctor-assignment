import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FileText, Clock, CheckCircle, Users, Star, Activity } from 'lucide-react';
import api from '../../services/api';

export default function DoctorDashboard() {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState({ totalAssigned: 0, pendingReview: 0, completed: 0 });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const response = await api.get('/doctor/reports');
      setReports(response.data);
      
      const totalAssigned = response.data.length;
      const pendingReview = response.data.filter(r => r.assignmentStatus === 'ASSIGNED').length;
      const completed = response.data.filter(r => r.assignmentStatus === 'REVIEWED').length;
      
      setStats({ totalAssigned, pendingReview, completed });
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const statCards = [
    { title: 'Total Assigned', value: stats.totalAssigned, icon: Users, color: 'bg-blue-500' },
    { title: 'Pending Review', value: stats.pendingReview, icon: Clock, color: 'bg-yellow-500' },
    { title: 'Completed', value: stats.completed, icon: CheckCircle, color: 'bg-green-500' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Doctor Dashboard</h1>
            <p className="text-sm text-gray-500">Welcome back, Dr. {user?.name}</p>
          </div>
          <button onClick={() => { localStorage.removeItem('token'); window.location.href = '/login'; }} className="text-red-600">
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {statCards.map((stat, index) => (
            <div key={stat.title} className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-xl`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Assigned Reports</h2>
            <Link to="/doctor/reports" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              View All
            </Link>
          </div>
            <div className="p-6">
                {reports.length === 0 ? (
                    <p className="text-gray-500 text-center">No reports assigned yet.</p>
                ) : (
                    <ul className="divide-y divide-gray-100">
                        {reports.slice(0, 5).map(report => (
                            <li key={report._id} className="py-4 flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-900">{report.fileName || 'Medical Report'}</p>
                                    <p className="text-sm text-gray-500">Patient: {report.patientId.name}</p>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                    report.assignmentStatus === 'ASSIGNED' ? 'bg-yellow-100 text-yellow-700' :
                                    report.assignmentStatus === 'REVIEWED' ? 'bg-green-100 text-green-700' :
                                    'bg-gray-100 text-gray-700'
                                }`}>
                                    {report.assignmentStatus}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
        </main>
    </div>
    );
}
    