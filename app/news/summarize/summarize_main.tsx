"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { SidebarLeftIcon } from '@/components/icons';
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
    <div className="news-container">
      <div className="flex items-center px-4 lg:px-8 w-full">
        <Button
          variant="ghost"
          onClick={toggleSidebar}
          className="mr-2 p-1.5 h-fit hover:bg-primary/10 transition-all duration-200"
        >
          <SidebarLeftIcon size={16} />
        </Button>
        <div className="flex items-center justify-between w-full">
          <PageHeader title="Medical News Summarizer" />
        </div>
      </div>
      
      <div className="bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950 w-full px-4 py-8 sm:py-12">
        <div className="max-w-5xl mx-auto w-full">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-blue-600 dark:text-blue-400">
              Medical News Summarizer
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              Enter a medical news URL to get an AI-powered summary
            </p>
          </div>
          
          <form onSubmit={handleSummarize} className="flex w-full max-w-4xl mx-auto">
            <input
              type="url"
              placeholder="Enter news article URL..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="flex-grow py-3 px-6 rounded-l-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <button 
              type="submit" 
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-r-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors flex items-center"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner mr-2"></span>
                  Summarizing...
                </>
              ) : (
                'Summarize'
              )}
            </button>
          </form>
          
          <div className="flex justify-center mt-6">
            <Link href="/news" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              Back to News
            </Link>
          </div>
        </div>
      </div>
      
      {loading && (
        <div className="loading-container">
          <div className="loader"></div>
          <p>Analyzing and summarizing content...</p>
        </div>
      )}
      
      {error && (
        <div className="error-container">
          <p>{error}</p>
          {suggestion && <p className="error-suggestion">{suggestion}</p>}
          <div className="example-urls">
            <p>Try these example URLs:</p>
            <ul>
              <li><button onClick={() => setUrl('https://www.medicalnewstoday.com/articles/latest')} className="example-url-btn">Medical News Today</button></li>
              <li><button onClick={() => setUrl('https://www.nejm.org')} className="example-url-btn">New England Journal of Medicine</button></li>
              <li><button onClick={() => setUrl('https://www.health.harvard.edu/blog')} className="example-url-btn">Harvard Health Blog</button></li>
            </ul>
          </div>
        </div>
      )}
      
      {summary && (
        <div className="summary-result">
          <div className="summary-section">
            <h2 className="section-title">AI Summary</h2>
            <div className="summary-content">
              {metadata && metadata.title && (
                <div className="summary-article-info">
                  <h3>{metadata.title}</h3>
                  {metadata.sourceURL && (
                    <a href={metadata.sourceURL} target="_blank" rel="noopener noreferrer" className="article-source">
                      {new URL(metadata.sourceURL).hostname}
                    </a>
                  )}
                </div>
              )}
              <div className="summary-text">{summary}</div>
            </div>
          </div>
          
          {originalContent && (
            <div className="original-section">
              <h2 className="section-title">Original Content</h2>
              <div className="original-content markdown-body">
                <div dangerouslySetInnerHTML={{ __html: formatMarkdown(originalContent) }} />
              </div>
            </div>
          )}
        </div>
      )}
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
