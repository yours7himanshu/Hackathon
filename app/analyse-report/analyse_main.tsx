"use client";

import React, { useState } from 'react';
import { ThemeToggle } from '../../components/theme-toggle';
import { DownloadIcon } from '@/components/icons';

interface FileItem {
  id: string;
  name: string;
  size: number;
}

interface AnalysisResults {
  riskScore: number;
  keyFindings: string[];
  recommendations: string[];
  summary: string;
}

export default function AnalysisPage() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isAnalysing, setIsAnalysing] = useState<boolean>(false);
  const [results, setResults] = useState<AnalysisResults | null>(null);
  const [showResults, setShowResults] = useState<boolean>(false);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    
    const newFiles: FileItem[] = Array.from(e.target.files).map(file => ({
      id: Math.random().toString(36).substring(2, 9),
      name: file.name,
      size: file.size
    }));
    
    setFiles([...files, ...newFiles]);
  };
  
  const handleRemoveFile = (id: string) => {
    setFiles(files.filter(file => file.id !== id));
  };
  
  const handleAnalyse = async () => {
    if (files.length === 0) return;
    
    setIsAnalysing(true);
    
    // Simulating API call for analysis
    setTimeout(() => {
      const mockResults: AnalysisResults = {
        riskScore: Math.floor(Math.random() * 100),
        keyFindings: [
          'Elevated cholesterol levels detected',
          'Blood pressure readings within normal range',
          'Potential vitamin D deficiency indicated',
          'Glucose levels slightly elevated but within acceptable range'
        ],
        recommendations: [
          'Schedule follow-up with cardiologist within 3 months',
          'Increase dietary intake of vitamin D or consider supplements',
          'Monitor glucose levels monthly',
          'Continue current medication regimen'
        ],
        summary: 'The analysis indicates generally good health with a few areas requiring monitoring. The slightly elevated cholesterol and glucose levels suggest lifestyle adjustments may be beneficial. Overall risk assessment is moderate, with specific attention recommended for cardiovascular health markers.'
      };
      
      setResults(mockResults);
      setIsAnalysing(false);
      setShowResults(true);
    }, 3000);
  };
  
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };
  
  return (
    <div className="analysis-container">
      <div className="theme-toggle-container">
        <ThemeToggle />
      </div>
      
      <header className="analysis-header">
        <h1>Medical Report Analysis</h1>
        <p>Upload your medical reports for AI-powered analysis and insights</p>
      </header>
      
      <section className="upload-section">
        <h2 className="upload-title">Upload Medical Reports</h2>
        <p className="upload-description">
          Upload your medical reports, lab test results, or health records. Our AI will analyze them
          and provide you with valuable insights and recommendations.
        </p>
        
        <div className="upload-area">
          <input 
            type="file" 
            onChange={handleFileChange} 
            multiple 
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" 
          />
          <svg
            className="upload-icon"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          <h3 className="upload-text">Drag and drop files here or click to browse</h3>
          <p className="upload-subtext">Supported formats: PDF, JPG, PNG, DOC, DOCX</p>
        </div>
        
        {files.length > 0 && (
          <div className="file-list">
            <h3>Selected Files:</h3>
            {files.map((file) => (
              <div key={file.id} className="file-item">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                </svg>
                <span className="file-name">{file.name} ({formatFileSize(file.size)})</span>
                <button
                  className="file-remove"
                  onClick={() => handleRemoveFile(file.id)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        
        <div className="button-container">
          <button 
            className="analyse-button" 
            onClick={handleAnalyse} 
            disabled={files.length === 0 || isAnalysing}
          >
            {isAnalysing ? (
              <>
                <svg
                  className="animate-spin"
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="12" y1="2" x2="12" y2="6" />
                  <line x1="12" y1="18" x2="12" y2="22" />
                  <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
                  <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
                  <line x1="2" y1="12" x2="6" y2="12" />
                  <line x1="18" y1="12" x2="22" y2="12" />
                  <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
                  <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
                </svg>
                Analyzing...
              </>
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="3" />
                  <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                </svg>
                Analyze Reports
              </>
            )}
          </button>
        </div>
      </section>
      
      {results && (
        <section className={`results-section ${showResults ? 'results-visible' : ''}`}>
          <h2 className="results-title">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
            </svg>
            Analysis Results
          </h2>
          
          <div className="results-grid">
            <div className="metric-card">
              <div className="metric-title">Overall Risk Score</div>
              <div className="metric-value">{results.riskScore}</div>
              <div className={`metric-change ${results.riskScore < 50 ? 'metric-increase' : 'metric-decrease'}`}>
                {results.riskScore < 50 ? (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{ marginRight: '4px' }}
                    >
                      <polyline points="18 15 12 9 6 15"></polyline>
                    </svg>
                    Low Risk
                  </>
                ) : (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{ marginRight: '4px' }}
                    >
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                    Elevated Risk
                  </>
                )}
              </div>
            </div>
            
            <div className="metric-card">
              <div className="metric-title">Key Findings</div>
              <div className="metric-value">{results.keyFindings.length}</div>
              <div className="metric-change">Items identified</div>
            </div>
            
            <div className="metric-card">
              <div className="metric-title">Recommendations</div>
              <div className="metric-value">{results.recommendations.length}</div>
              <div className="metric-change">Action items</div>
            </div>
          </div>
          
          <div className="analysis-summary">
            <h3>AI Analysis Summary</h3>
            <p className="summary-text">{results.summary}</p>
          </div>
          
          <div style={{ marginTop: '2rem' }}>
            <h3>Key Findings</h3>
            <ul>
              {results.keyFindings.map((finding, index) => (
                <li key={index} style={{ margin: '0.5rem 0' }}>{finding}</li>
              ))}
            </ul>
          </div>
          
          <div style={{ marginTop: '2rem' }}>
            <h3>Recommendations</h3>
            <ul>
              {results.recommendations.map((recommendation, index) => (
                <li key={index} style={{ margin: '0.5rem 0' }}>{recommendation}</li>
              ))}
            </ul>
          </div>
          
          <div className="chart-container">
            [Chart visualization would appear here in a complete implementation]
          </div>
          
          <div className="button-container">
            <button className="analyse-button">
              <DownloadIcon size={20} />
              Download Full Report
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
