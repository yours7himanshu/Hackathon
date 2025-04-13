"use client";

import React from 'react';
import PdfUploadCard from '@/components/pdf-upload-card';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { SidebarLeftIcon } from '@/components/icons';
import { useSidebar } from '@/components/ui/sidebar';

export default function AnalyseReportPage() {
  const { toggleSidebar } = useSidebar();
  
  return (
    <>
      <div className="flex items-center px-4 lg:px-8">
        <Button
          variant="ghost"
          onClick={toggleSidebar}
          className="mr-2 p-1.5 h-fit hover:bg-primary/10 transition-all duration-200"
        >
          <SidebarLeftIcon size={16} />
        </Button>
        <div className="flex items-center justify-between w-full">
          <PageHeader title="Document Analysis" />
        </div>
      </div>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950 px-4 py-12 sm:py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Document Analysis
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">Upload your PDF document for AI-powered insights</p>
          </div>
          <PdfUploadCard />
        </div>
      </div>
    </>
  );
}