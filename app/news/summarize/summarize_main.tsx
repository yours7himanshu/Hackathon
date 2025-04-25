"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { SidebarLeftIcon, } from '@/components/icons';
import { useSidebar } from '@/components/ui/sidebar';
import { PageHeader } from '@/components/page-header';

export default function SummarizePage() {
  const { toggleSidebar } = useSidebar();
  const searchParams = useSearchParams();
  const [url, setUrl] = useState<string>('');
  const [originalContent, setOriginalContent] = useState<string>('');
  const [summary, setSummary] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<any>(null);

  // Check for URL in query parameters when component mounts
  useEffect(() => {
    const urlParam = searchParams.get('url');
    if (urlParam) {
      setUrl(urlParam);
      // Auto-summarize if URL is provided
      handleSummarizeWithURL(urlParam);
    }
  }, [searchParams]);

  const handleSummarize = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url) {
      setError('Please enter a valid URL');
      return;
    }
    
    await handleSummarizeWithURL(url);
  };

  const handleSummarizeWithURL = async (articleUrl: string) => {
    setLoading(true);
    setError(null);
    setSuggestion(null);
    setOriginalContent('');
    setSummary('');
    setMetadata(null);
    
    try {
      // Call our API route instead of directly using the utility functions
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: articleUrl }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        setError(result.error || 'Failed to process the URL');
        setSuggestion(result.suggestion || 'Try another URL or check that the page is publicly accessible.');
        throw new Error(result.error || 'Failed to process the URL');
      }
      
      setOriginalContent(result.originalContent);
      setMetadata(result.metadata);
      setSummary(result.summary || 'No summary generated');
      
    } catch (err: any) {
      console.error('Summarization error:', err);
      // Error is already set above for API errors, this is just for other errors
      if (!error) {
        setError(`Error: ${err.message || 'Failed to process the URL'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen w-full bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950">
      {/* Header with navigation and title */}
      <header className="sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center">
            <Button
              variant="ghost"
              onClick={toggleSidebar}
              className="mr-3 p-2 h-fit hover:bg-primary/10 transition-all duration-200"
              aria-label="Toggle sidebar"
            >
              <SidebarLeftIcon size={16} />
            </Button>
            <PageHeader title="Medical News Summarizer"  />
          </div>
          
          <Link href="/news" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back to News
          </Link>
        </div>
      </header>
      
      {/* Main content */}
      <main className="flex-grow w-full">
        {/* Hero section with search form */}
        <section className="py-16 px-4 text-center bg-gradient-to-br from-blue-50 to-white dark:from-slate-900 dark:to-slate-800">
          <div className="max-w-3xl mx-auto mb-10">
            <h1 className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-3">
              Medical News Summarizer
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Enter a medical news URL to get an AI-powered summary of the article
            </p>
          </div>
          
          <form onSubmit={handleSummarize} className="flex w-full max-w-2xl mx-auto shadow-lg rounded-full overflow-hidden transition-all duration-300 hover:shadow-xl">
            <input
              type="url"
              placeholder="Enter news article URL..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="flex-grow py-4 px-6 rounded-l-full bg-white dark:bg-slate-800 border-0 text-slate-900 dark:text-white focus:outline-none focus:ring-0"
              required
            />
            <button 
              type="submit" 
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-r-full transition-colors flex items-center"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="inline-block h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></span>
                  Processing...
                </>
              ) : (
                <>
                  {/* <SearchIcon size={16} className="mr-2" /> */}
                  Summarize
                </>
              )}
            </button>
          </form>
        </section>
        
        {/* Loading state */}
        {loading && (
          <div className="container mx-auto px-4 py-16 text-center">
            <div className="inline-block h-10 w-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
            <p className="text-lg text-slate-600 dark:text-slate-400">Analyzing and summarizing content...</p>
          </div>
        )}
        
        {/* Error state */}
        {error && (
          <div className="container mx-auto max-w-3xl px-4 py-10">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-xl p-6 text-center">
              <div className="flex justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-500 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">{error}</h3>
              {suggestion && <p className="text-slate-600 dark:text-slate-400 mb-6">{suggestion}</p>}
              
              <div className="mt-6 py-5 border-t border-red-100 dark:border-red-900/30">
                <h4 className="font-semibold mb-4">Try these example medical news sources:</h4>
                <div className="flex flex-wrap justify-center gap-2">
                  <button 
                    onClick={() => {
                      setUrl('https://www.medicalnewstoday.com/articles/latest');
                      handleSummarizeWithURL('https://www.medicalnewstoday.com/articles/latest');
                    }} 
                    className="px-4 py-2 bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-full text-blue-600 dark:text-blue-400 transition-all"
                  >
                    Medical News Today
                  </button>
                  <button 
                    onClick={() => {
                      setUrl('https://www.nejm.org');
                      handleSummarizeWithURL('https://www.nejm.org');
                    }} 
                    className="px-4 py-2 bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-full text-blue-600 dark:text-blue-400 transition-all"
                  >
                    New England Journal of Medicine
                  </button>
                  <button 
                    onClick={() => {
                      setUrl('https://www.health.harvard.edu/blog');
                      handleSummarizeWithURL('https://www.health.harvard.edu/blog');
                    }} 
                    className="px-4 py-2 bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-full text-blue-600 dark:text-blue-400 transition-all"
                  >
                    Harvard Health Blog
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Summary result */}
        {summary && (
          <div className="w-full max-w-full px-4 py-12">
            <div className="container mx-auto">
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-700 transition-all">
                {/* Header section with accent color */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {/* <ClipboardTextIcon size={20} className="text-white mr-3" /> */}
                      <h2 className="text-xl font-bold text-white">AI Summary</h2>
                    </div>
                    {metadata && metadata.sourceURL && (
                      <a 
                        href={metadata.sourceURL} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-sm text-blue-100 hover:text-white transition-all px-3 py-1 rounded-full bg-white/10 hover:bg-white/20"
                      >
                        View Original
                      </a>
                    )}
                  </div>
                </div>
                
                {/* Content section */}
                <div className="p-6 lg:p-8">
                  {metadata && metadata.title && (
                    <div className="mb-6 pb-6 border-b border-slate-200 dark:border-slate-700">
                      <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-3">{metadata.title}</h3>
                      {metadata.sourceURL && (
                        <div className="flex items-center text-sm text-slate-500 dark:text-slate-400">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                          </svg>
                          <span>Source: {new URL(metadata.sourceURL).hostname}</span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="prose dark:prose-invert max-w-none lg:text-lg text-slate-700 dark:text-slate-300">
                    {summary.split('\n').map((paragraph, index) => (
                      <p key={index} className="mb-4">{paragraph}</p>
                    ))}
                  </div>
                  
                  {/* Footer section with timestamp */}
                  <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700 text-sm text-slate-500 dark:text-slate-400 flex justify-between items-center">
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Summarized by AI</span>
                    </div>
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      
      {/* Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-6 mt-auto">
        <div className="container mx-auto px-4 text-center text-sm text-slate-500 dark:text-slate-400">
          <p>© {new Date().getFullYear()} Medical News Summarizer Tool</p>
        </div>
      </footer>
    </div>
  );
}

// Basic utility function to convert markdown headings and paragraphs to HTML
function formatMarkdown(markdown: string): string {
  if (!markdown) return '';
  
  let html = markdown
    // Convert markdown headings
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/^# (.*$)/gm, '<h1>$1</h1>')
    // Convert markdown paragraphs
    .replace(/^\> (.*$)/gm, '<blockquote>$1</blockquote>')
    // Convert links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/gm, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    // Convert double line breaks to paragraph breaks
    .replace(/\n\n/gm, '</p><p>');
  
  // Wrap in paragraph tags if not already
  if (!html.startsWith('<')) {
    html = `<p>${html}</p>`;
  }
  
  return html;
}
