"use client";

import React, { useState, useEffect } from 'react';
import SearchBar from '../../components/news/search-bar';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { SidebarLeftIcon } from '@/components/icons';
import { useSidebar } from '@/components/ui/sidebar';
import { PageHeader } from '@/components/page-header';

// Types for our news data
interface Article {
  title: string;
  description: string;
  url: string;
  urlToImage: string;
  publishedAt: string;
  source: {
    name: string;
  };
  content: string;
}

interface NewsResponse {
  status: string;
  totalResults: number;
  articles: Article[];
  message?: string; // Add message for error handling
}

// Better to load from environment variable
const NEWS_API_KEY = process.env.NEXT_PUBLIC_NEWS_API_KEY || '8512c9d5e506433d9e690fbefb876f50';

// Calculate reading time based on content length
const getReadingTime = (content: string): number => {
  const wordsPerMinute = 200;
  const words = content?.split(/\s+/)?.length || 0;
  return Math.max(1, Math.ceil(words / wordsPerMinute));
};

// Get formatted date
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

export default function NewsPage() {
  const { toggleSidebar } = useSidebar();
  const [trendingArticles, setTrendingArticles] = useState<Article[]>([]);
  const [latestArticles, setLatestArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  const fetchTrendingNews = async () => {
    try {
      // Fetch trending health news sorted by popularity
      const url = `https://newsapi.org/v2/everything?q=trending+medical+breakthrough&sortBy=popularity&apiKey=${NEWS_API_KEY}&pageSize=4`;
      const response = await fetch(url);
      const data: NewsResponse = await response.json();
      
      if (data.status !== 'ok') {
        throw new Error(data.message || data.status);
      }
      
      setTrendingArticles(data.articles || []);
    } catch (err: any) {
      console.error('Error fetching trending news:', err);
      setTrendingArticles([]);
    }
  };
  
  const fetchLatestNews = async () => {
    setError(null);
    try {
      // Fetch latest health news
      const url = `https://newsapi.org/v2/top-headlines?category=health&apiKey=${NEWS_API_KEY}&pageSize=16`;
      const response = await fetch(url);
      const data: NewsResponse = await response.json();
      
      if (data.status !== 'ok') {
        throw new Error(data.message || data.status);
      }
      
      setLatestArticles(data.articles || []);
    } catch (err: any) {
      setError(`Failed to fetch news: ${err.message || 'Please try again later.'}`);
      console.error('Error fetching latest news:', err);
      setLatestArticles([]);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    if (!searchQuery.trim()) {
      // If search is empty, reset to showing trending and latest
      await fetchTrendingNews();
      await fetchLatestNews();
      return;
    }
    
    setError(null);
    try {
      const url = `https://newsapi.org/v2/everything?q=${searchQuery}+medical+health&apiKey=${NEWS_API_KEY}&pageSize=20`;
      const response = await fetch(url);
      const data: NewsResponse = await response.json();
      
      if (data.status !== 'ok') {
        throw new Error(data.message || data.status);
      }
      
      // Show search results as latest news and clear trending
      setTrendingArticles([]);
      setLatestArticles(data.articles || []);
    } catch (err: any) {
      setError(`Failed to fetch news: ${err.message || 'Please try again later.'}`);
      console.error('Error fetching news:', err);
      setLatestArticles([]);
      setTrendingArticles([]);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    setLoading(true);
    fetchTrendingNews();
    fetchLatestNews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
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
          <PageHeader title="Latest Medical News" />
        </div>
      </div>
      
      <div className="bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950 w-full px-4 py-8 sm:py-12">
        <div className="max-w-5xl mx-auto w-full">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-blue-600 dark:text-blue-400">
              Latest Medical News
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              Stay updated with the latest developments in medicine and healthcare
            </p>
          </div>
          
          <SearchBar 
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            handleSearch={handleSearch}
          />
          
          <div className="flex justify-center mt-6">
            <Link href="/news/summarize" className="summarize-link">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <line x1="10" y1="9" x2="8" y2="9"></line>
              </svg>
              Summarize Article
            </Link>
          </div>
        </div>
      </div>
      
      {/* Main content container with fixed width and height during loading */}
      <div className="min-h-[600px] px-4 md:px-8 lg:px-12 w-full">
        {loading ? (
          <div className="loading-container my-12 w-full">
            <div className="loader"></div>
            <p>Loading latest medical news...</p>
          </div>
        ) : (
          <>
            {error && (
              <div className="error-container my-12">
                <p>{error}</p>
              </div>
            )}
            
            {/* Trending News Section */}
            {!error && trendingArticles.length > 0 && !searchQuery && (
              <section className="trending-news-section">
                <h2 className="section-title">Trending in Medical Research</h2>
                <div className="trending-news-container">
                  {trendingArticles.map((article, index) => (
                    <div className="trending-news-card" key={`trending-${article.title}-${index}`}>
                      <div className="trending-image-container">
                        {article.urlToImage ? (
                          <img src={article.urlToImage} alt={article.title} className="trending-image" />
                        ) : (
                          <div className="trending-image-placeholder">
                            <span>Trending</span>
                          </div>
                        )}
                        <div className="trending-badge">Trending</div>
                      </div>
                      
                      <div className="trending-content">
                        <h3 className="trending-title">{article.title}</h3>
                        <p className="trending-source">{article.source.name} • {formatDate(article.publishedAt)}</p>
                        
                        <div className="trending-actions">
                          <Link 
                            href={`/news/summarize?url=${encodeURIComponent(article.url)}`}
                            className="summarize-button-mini trending"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"></path>
                              <polyline points="14 2 14 8 20 8"></polyline>
                              <line x1="16" y1="13" x2="8" y2="13"></line>
                              <line x1="16" y1="17" x2="8" y2="17"></line>
                              <line x1="10" y1="9" x2="8" y2="9"></line>
                            </svg>
                            Summarize
                          </Link>
                          <a href={article.url} target="_blank" rel="noopener noreferrer" className="read-trending">
                            Read Article
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                              <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8-8-8z"/>
                            </svg>
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
            
            {/* Latest News Section */}
            <section className="latest-news-section">
              <h2 className="section-title">{searchQuery ? 'Search Results' : 'Latest Medical News'}</h2>
              <div className="news-grid">
                {latestArticles.map((article, index) => (
                  <div className="news-card" key={`latest-${article.title}-${index}`}>
                    <div className="news-image-container">
                      {article.urlToImage ? (
                        <img src={article.urlToImage} alt={article.title} className="news-image" />
                      ) : (
                        <div className="news-image-placeholder">
                          <span>Medical News</span>
                        </div>
                      )}
                      <div className="news-source">{article.source.name}</div>
                      <div className="news-category">Medical</div>
                    </div>
                    
                    <div className="news-content">
                      <h3 className="news-title">{article.title}</h3>
                      
                      <div className="news-meta">
                        <span>
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-3.589 10-8-3.589-8-8-8z"/>
                            <path d="M13 7h-2v5.414l3.293 3.293 1.414-1.414L13 11.586z"/>
                          </svg>
                          {getReadingTime(article.content || article.description || '')} min read
                        </span>
                        <span className="news-date">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z"/>
                            <path d="M7 12h5v5H7z"/>
                          </svg>
                          {formatDate(article.publishedAt)}
                        </span>
                      </div>
                      
                      <p className="news-description">{article.description || 'No description available'}</p>
                      <div className="news-footer">
                        <div className="news-action-buttons">
                          <Link 
                            href={`/news/summarize?url=${encodeURIComponent(article.url)}`}
                            className="summarize-button-mini"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"></path>
                              <polyline points="14 2 14 8 20 8"></polyline>
                              <line x1="16" y1="13" x2="8" y2="13"></line>
                              <line x1="16" y1="17" x2="8" y2="17"></line>
                              <line x1="10" y1="9" x2="8" y2="9"></line>
                            </svg>
                            Summarize
                          </Link>
                          <a href={article.url} target="_blank" rel="noopener noreferrer" className="read-more">
                            Read More
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8-8-8z"/>
                            </svg>
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {latestArticles.length === 0 && !error && (
                  <div className="no-results">
                    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <path d="M16 16s-1.5-2-4-2-4 2-4 2"></path>
                      <line x1="9" y1="9" x2="9.01" y2="9"></line>
                      <line x1="15" y1="9" x2="15.01" y2="9"></line>
                    </svg>
                    <p>No news articles found. Try a different search term.</p>
                  </div>
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}