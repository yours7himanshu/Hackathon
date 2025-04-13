'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  FileUp,
  FileCheck2,
  FileText,
  X,
  ArrowRight
} from 'lucide-react';

export default function PdfUploadCard() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const resultRef = useRef<HTMLDivElement>(null);

  // Simulate progress for better user experience
  useEffect(() => {
    if (isUploading) {
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + 5;
        });
      }, 300);
      
      return () => clearInterval(interval);
    } else if (uploadProgress > 0) {
      setUploadProgress(0);
    }
  }, [isUploading]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file && file.type === 'application/pdf') {
      if (file.size > 10 * 1024 * 1024) {
        setError('PDF exceeds 10MB limit.');
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
      setError(null);
      setAnalysisResult(null);
    } else {
      setSelectedFile(null);
      setError('Please upload a valid PDF file.');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: false
  });

  const handleAnalyse = async () => {
    if (!selectedFile) {
      setError('Please select a PDF file first.');
      return;
    }

    setIsUploading(true);
    setError(null);
    setAnalysisResult(null);
    setUploadProgress(10);

    const formData = new FormData();
    formData.append('pdfFile', selectedFile);

    try {
      const response = await fetch('/api/analyse-pdf', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `Analysis failed: ${response.statusText}`);
      }

      setUploadProgress(100);
      setAnalysisResult(result.analysis);
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred during analysis.');
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setError(null);
    setAnalysisResult(null);
  };

  return (
    <>
      <Card className="w-full mb-8 shadow-xl bg-white/80 dark:bg-slate-900/90 backdrop-blur-sm border-0 overflow-hidden rounded-xl transition-all hover:shadow-blue-100 dark:hover:shadow-blue-900/30">
        <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-t-xl" />
        <CardHeader className="pt-6">
          <CardTitle className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">PDF Analysis</CardTitle>
          <CardDescription className="text-zinc-500 dark:text-zinc-400">
            Upload your document to get AI-powered insights
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div
            {...getRootProps()}
            className={`relative group border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 ease-in-out 
              ${isDragActive 
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                : 'border-zinc-200 dark:border-zinc-700 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-zinc-50 dark:hover:bg-slate-800/50'}
              ${selectedFile ? 'border-green-500 bg-green-50 dark:bg-green-900/20 dark:border-green-700' : ''}
              ${error ? 'border-red-500 bg-red-50 dark:bg-red-900/20 dark:border-red-700' : ''}`}
          >
            <input {...getInputProps()} />
            {selectedFile ? (
              <div className="flex flex-col items-center justify-center space-y-3">
                <div className="relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full opacity-75 blur-sm"></div>
                  <div className="relative bg-white dark:bg-slate-800 rounded-full p-3">
                    <FileCheck2 className="w-8 h-8 text-green-500" />
                  </div>
                </div>
                <p className="text-base font-medium text-zinc-800 dark:text-zinc-200">{selectedFile.name}</p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile();
                  }}
                  className="mt-2 rounded-full bg-white dark:bg-slate-800 border-zinc-200 dark:border-zinc-700 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-all"
                >
                  <X className="w-4 h-4 mr-1" /> Remove
                </Button>
              </div>
            ) : isDragActive ? (
              <div className="flex flex-col items-center justify-center space-y-3 animate-pulse">
                <div className="relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full opacity-75 blur-sm"></div>
                  <div className="relative bg-white dark:bg-slate-800 rounded-full p-3">
                    <FileUp className="w-8 h-8 text-blue-500" />
                  </div>
                </div>
                <p className="text-base font-medium text-blue-600 dark:text-blue-400">Drop your PDF here</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center space-y-3">
                <div className="relative group-hover:scale-110 transition-transform duration-300">
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full opacity-0 group-hover:opacity-75 blur-sm transition-opacity"></div>
                  <div className="relative bg-white dark:bg-slate-800 rounded-full p-3">
                    <FileUp className="w-8 h-8 text-zinc-400 group-hover:text-blue-500 transition-colors" />
                  </div>
                </div>
                <p className="text-base font-medium text-zinc-800 dark:text-zinc-200">
                  Drag & drop a PDF or click to browse
                </p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Maximum file size: 10MB
                </p>
              </div>
            )}
          </div>

          {error && (
            <div className="px-4 py-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-600 dark:text-red-400 flex items-center">
                <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </p>
            </div>
          )}

          {isUploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-zinc-500 dark:text-zinc-400">Analyzing document...</span>
                <span className="text-zinc-700 dark:text-zinc-300">{uploadProgress}%</span>
              </div>
              <div className="w-full h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-300" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          <div className="flex justify-center">
            <Button
              onClick={handleAnalyse}
              disabled={!selectedFile || isUploading}
              size="lg"
              className={`w-full max-w-xs rounded-full relative overflow-hidden group transition-all duration-300
                ${!selectedFile ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400' :
                  'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg'}`}
            >
              {isUploading ? (
                <span className="flex items-center justify-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  Analyze PDF
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                </span>
              )}
            </Button>
          </div>

          <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center">
            Powered by <span className="font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Gemini Flash 1.5</span> via OpenRouter
          </p>
        </CardContent>
      </Card>

      {isUploading && !analysisResult && (
        <Card className="w-full mt-4 p-4 text-center text-zinc-500 dark:text-zinc-400 shadow border-0 bg-white/80 dark:bg-slate-900/90 backdrop-blur-sm rounded-xl animate-pulse">
          <Loader2 className="inline-block h-4 w-4 animate-spin mr-2" />
          Processing your document...
        </Card>
      )}

      {analysisResult && (
        <div ref={resultRef} className="transition-all duration-500">
          <Card className="w-full shadow-xl bg-white/80 dark:bg-slate-900/90 backdrop-blur-sm border-0 rounded-xl overflow-hidden">
            <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-green-500 rounded-t-xl" />
            <CardHeader className="pt-6 border-b border-zinc-100 dark:border-zinc-800">
              <CardTitle className="flex items-center text-xl font-bold text-zinc-800 dark:text-zinc-100">
                <div className="relative mr-3">
                  <div className="absolute -inset-1 bg-gradient-to-r from-emerald-400 to-green-500 rounded-full opacity-75 blur-sm"></div>
                  <div className="relative bg-white dark:bg-slate-800 rounded-full p-1.5">
                    <FileText className="h-5 w-5 text-emerald-600 dark:text-emerald-500" />
                  </div>
                </div>
                Analysis Results
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="prose prose-zinc dark:prose-invert max-w-none">
                <p className="text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed">
                  {analysisResult}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
