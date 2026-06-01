import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, AlertCircle, CheckCircle, Loader, ArrowLeft, Edit3, X } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function UploadReport() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [reportId, setReportId] = useState(null);
  const [step, setStep] = useState(1);
  const [transcript, setTranscript] = useState('');
  const [manualMode, setManualMode] = useState(false);
  const [extractionFailed, setExtractionFailed] = useState(false);
  const [formData, setFormData] = useState({
    patientName: '',
    patientAge: '',
    patientGender: 'MALE',
    patientPhone: '',
    symptoms: ''
  });

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles[0]) {
      setFile(acceptedFiles[0]);
      toast.success(`File selected: ${acceptedFiles[0].name}`);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png'],
      'application/pdf': ['.pdf']
    },
    maxSize: 5242880,
    multiple: false
  });

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file to upload');
      return;
    }

    if (!formData.patientName) {
      toast.error('Please enter patient name');
      return;
    }

    setUploading(true);
    const data = new FormData();
    data.append('file', file);
    Object.keys(formData).forEach(key => {
      data.append(key, formData[key]);
    });

    try {
      const response = await api.post('/reports/upload', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setReportId(response.data.reportId);
      toast.success('Report uploaded successfully!');
      setStep(2);
      await handleExtractText(response.data.reportId);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleExtractText = async (id) => {
    try {
      toast.loading('Extracting text from document...', { id: 'extract' });
      const response = await api.post(`/reports/${id}/extract-text`);
      setTranscript(response.data.transcript);
      toast.success('Text extracted successfully!', { id: 'extract' });
      setStep(3);
    } catch (error) {
      toast.error('OCR extraction failed. You can enter the transcript manually.', { id: 'extract' });
      setExtractionFailed(true);
      setManualMode(true);
    }
  };

  const handleManualTranscriptSubmit = async () => {
    if (!transcript.trim()) {
      toast.error('Please enter the report transcript');
      return;
    }
    
    setProcessing(true);
    try {
      await api.put(`/reports/${reportId}/manual-transcript`, { transcript });
      toast.success('Transcript saved successfully!');
      await handleAnalyze();
    } catch (error) {
      toast.error('Failed to save transcript');
      setProcessing(false);
    }
  };

  const handleAnalyze = async () => {
    setProcessing(true);
    try {
      toast.loading('AI is analyzing your report...', { id: 'analyze' });
      const response = await api.post(`/reports/${reportId}/analyze`);
      toast.success('Analysis complete! Doctor assigned successfully.', { id: 'analyze' });
      setTimeout(() => {
        navigate(`/patient/reports/${reportId}`);
      }, 1500);
    } catch (error) {
      toast.error('Analysis failed. Please try again.', { id: 'analyze' });
      setProcessing(false);
    }
  };

  const removeFile = () => {
    setFile(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center">
          <button onClick={() => navigate(-1)} className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition">
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Upload Medical Report</h1>
            <p className="text-sm text-gray-500">Upload prescription or report for AI-powered doctor assignment</p>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
            <div className="flex items-center justify-between">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center flex-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                    step >= s ? 'bg-white text-blue-600' : 'bg-white/30 text-white'
                  }`}>
                    {step > s ? <CheckCircle className="h-5 w-5" /> : s}
                  </div>
                  {s < 3 && (
                    <div className={`flex-1 h-1 mx-4 rounded-full transition-all ${
                      step > s ? 'bg-white' : 'bg-white/30'
                    }`} />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 px-2">
              <span className="text-xs text-white/80">Details & File</span>
              <span className="text-xs text-white/80">Text Extraction</span>
              <span className="text-xs text-white/80">AI Analysis</span>
            </div>
          </div>

          <div className="p-6">
            {step === 1 && (
              <div className="space-y-6 animate-fadeIn">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                    <input
                      type="text"
                      name="patientName"
                      value={formData.patientName}
                      onChange={handleFormChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter patient's full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                    <input
                      type="number"
                      name="patientAge"
                      value={formData.patientAge}
                      onChange={handleFormChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Age"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                    <select
                      name="patientGender"
                      value={formData.patientGender}
                      onChange={handleFormChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      name="patientPhone"
                      value={formData.patientPhone}
                      onChange={handleFormChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Phone Number"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Symptoms / Description</label>
                  <textarea
                    name="symptoms"
                    value={formData.symptoms}
                    onChange={handleFormChange}
                    rows="3"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="Describe symptoms or any additional information..."
                  />
                </div>

                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                    isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                  }`}
                >
                  <input {...getInputProps()} />
                  <Upload className={`h-12 w-12 mx-auto mb-3 transition-colors ${isDragActive ? 'text-blue-500' : 'text-gray-400'}`} />
                  <p className="text-gray-600 font-medium">
                    {isDragActive ? 'Drop your file here' : 'Drag & drop or click to upload'}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">JPG, PNG, PDF (max 5MB)</p>
                  {file && (
                    <div className="mt-4 inline-flex items-center space-x-2 px-4 py-2 bg-blue-50 rounded-lg">
                      <FileText className="h-4 w-4 text-blue-600" />
                      <span className="text-sm text-blue-700 font-medium">{file.name}</span>
                      <button onClick={removeFile} className="ml-2 text-red-500 hover:text-red-700">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleUpload}
                  disabled={!file || uploading}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition disabled:opacity-50"
                >
                  {uploading ? (
                    <span className="flex items-center justify-center">
                      <Loader className="animate-spin h-5 w-5 mr-2" />
                      Uploading...
                    </span>
                  ) : (
                    'Upload & Continue'
                  )}
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-4">
                  <Loader className="h-10 w-10 text-blue-600 animate-spin" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Extracting Text</h3>
                <p className="text-gray-600">Our OCR engine is processing your document...</p>
                {extractionFailed && (
                  <div className="mt-6">
                    <button
                      onClick={() => setManualMode(true)}
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Switch to manual entry →
                    </button>
                  </div>
                )}
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                {manualMode ? (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-sm font-medium text-gray-700">Report Transcript</label>
                      <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded-full">Manual Entry Mode</span>
                    </div>
                    <textarea
                      value={transcript}
                      onChange={(e) => setTranscript(e.target.value)}
                      rows="10"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                      placeholder="Paste or type the report text here..."
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      <AlertCircle className="h-3 w-3 inline mr-1" />
                      Enter all relevant medical information from the report
                    </p>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-sm font-medium text-gray-700">Extracted Text</label>
                      <button
                        onClick={() => setManualMode(true)}
                        className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
                      >
                        <Edit3 className="h-3 w-3" />
                        Edit manually
                      </button>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg max-h-80 overflow-y-auto border border-gray-200">
                      <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                        {transcript || 'No text extracted yet'}
                      </p>
                    </div>
                  </div>
                )}

                {manualMode && (
                  <button
                    onClick={handleManualTranscriptSubmit}
                    disabled={processing || !transcript.trim()}
                    className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    Save Transcript & Continue
                  </button>
                )}

                {(!manualMode || transcript) && !manualMode && (
                  <button
                    onClick={handleAnalyze}
                    disabled={processing}
                    className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition disabled:opacity-50"
                  >
                    {processing ? (
                      <span className="flex items-center justify-center">
                        <Loader className="animate-spin h-5 w-5 mr-2" />
                        Analyzing with AI...
                      </span>
                    ) : (
                      'Analyze & Assign Doctor'
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}